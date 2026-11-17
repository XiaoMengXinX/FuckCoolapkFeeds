import { getFeedPlainText } from './feedText';

const SYSTEM_PROMPT = `你是酷安动态的摘要助手。读者会先看到帖子标题，再看到你的摘要。用一两句中文写出帖子里最有价值的信息，让读者不点开全文也能知道要点。

规则：
- 一到两句话，60到80字，不超过100字。
- 只有用户消息以“标题：”开头时才算给出了标题，正文里用『』或【】括起的小标题不算。给出标题时，不要复述或换个说法重复标题，直接写标题没有说出的内容，如具体做法、结论、关键数据或适用条件。没有标题时，必须写明主体是什么，如产品、软件或事件名称。
- 先写清核心内容，再补充两三个读者最关心的细节，如具体做法、结论、关键数据或适用条件。不逐条罗列参数、功能、步骤或更新内容，更新说明只提最重要的几项改动。
- 直接以主体开头，不用“本文”“作者”“用户”等开头。
- 只依据正文，忽略HTML标签、Markdown符号、免责声明、测试设备、署名和话题标签。
- 只输出摘要本身，纯文本，不加引号、换行或任何格式符号。

示例：
新机发布会帖子，标题为“一加Ace 6发布会汇总” → 搭载天玑9400和7000mAh电池，支持100W快充和IP68防水，标准版2499元起，比上代便宜200元。屏幕升级为1.5K直屏，但取消了红外遥控。
教程帖子，标题为“如何免Root冻结系统应用” → 借助Shizuku授权后用冰箱冻结预装应用，全程无需解锁BL。文末附可安全冻结的应用清单，误冻导致桌面异常时可通过ADB命令恢复。
没有标题的模块介绍帖子 → NoAds模块可屏蔽淘宝、京东等常用应用的开屏广告和弹窗推荐，需要Root和LSPosed。作者实测支持澎湃OS和ColorOS，鸿蒙暂不兼容。
没有标题的长篇更新说明 → 澎湃OS移植包第五版更新，修复通话无声和待机耗电问题，新增游戏模式与高刷开关。升级前需清除数据，旧版用户建议先备份。
没有标题的观点帖子 → 博主认为中端机堆电池比堆影像更实用，对比三款机型的续航和充电速度后，推荐预算有限的用户优先看电池容量。`;
// Small models forget system rules after reading a long post, so the rules that matter most are repeated after it.
const TITLED_REMINDER = '\n\n---\n标题已经显示在摘要上方，不要复述标题。用一两句话概括以上帖子，60到80字，不超过100字。';
const UNTITLED_REMINDER = '\n\n---\n这篇帖子没有标题，摘要要写明主体是什么。用一两句话概括以上帖子，60到80字，不超过100字。';
// Time allowed for a provider to start responding before falling back to the next one.
const API_TIMEOUT_MS = 5000;
// Upper bound for a whole generation so a stalled stream cannot hold the request open.
const STREAM_TIMEOUT_MS = 20000;
const MIN_CONTENT_LENGTH = 800;
// Caps the input tokens of a single request; long enough for the longest posts seen in testing.
const MAX_CONTENT_LENGTH = 8000;

function configuredProviders() {
    const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, SILICONFLOW_API_KEY, GEMINI_API_KEY } = process.env;
    const providers = [];
    if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
        providers.push({
            model: 'Gemma 4 26B',
            url: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
            token: CLOUDFLARE_API_TOKEN,
            body: {
                model: '@cf/google/gemma-4-26b-a4b-it',
                temperature: 0.3,
                // Reasoning would add latency and neuron cost without improving a short summary.
                chat_template_kwargs: { enable_thinking: false },
            },
        });
    }
    if (SILICONFLOW_API_KEY) {
        providers.push({
            model: 'Qwen3.5-9B',
            url: 'https://api.siliconflow.cn/v1/chat/completions',
            token: SILICONFLOW_API_KEY,
            body: {
                model: 'Qwen/Qwen3.5-9B',
                temperature: 0.3,
                // Thinking is on by default and spends the whole token budget, leaving content empty.
                enable_thinking: false,
            },
        });
    }
    if (GEMINI_API_KEY) {
        providers.push({
            model: 'Gemini 3.5 Flash Lite',
            url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
            token: GEMINI_API_KEY,
            body: {
                model: 'gemini-3.5-flash-lite',
                temperature: 0.3,
                // The lowest setting the endpoint accepts; the default roughly doubles latency.
                reasoning_effort: 'minimal',
            },
        });
    }
    return providers;
}

// Returns the user message for the model, or null when the feed gets no summary.
// Only articles have a real title; other feeds carry a generated "xxx的动态" title that is not passed on.
export function getSummaryInput(feed) {
    if (configuredProviders().length === 0) return null;
    const content = getFeedPlainText(feed);
    if (content.length < MIN_CONTENT_LENGTH) return null;
    const body = content.slice(0, MAX_CONTENT_LENGTH);
    return feed.message_title
        ? `标题：${feed.message_title}\n\n正文：\n${body}${TITLED_REMINDER}`
        : `${body}${UNTITLED_REMINDER}`;
}

// Yields content deltas from an OpenAI-compatible streaming chat completion.
async function* streamCompletion(provider, input) {
    const controller = new AbortController();
    let timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        const response = await fetch(provider.url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${provider.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...provider.body,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: input },
                ],
                max_tokens: 200,
                stream: true,
            }),
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
        }

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

        const decoder = new TextDecoder();
        let buffer = '';
        for await (const chunk of response.body) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                const payload = line.slice(5).trim();
                if (payload === '[DONE]') return;
                const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
                if (delta) yield delta;
            }
        }
    } finally {
        clearTimeout(timeoutId);
    }
}

// Streams the summary through onDelta(delta, model) and resolves to the final { text, model }, or null on failure.
// Falls back to the next provider only while nothing has been emitted yet.
export async function streamAISummary(input, onDelta) {
    for (const provider of configuredProviders()) {
        let text = '';
        try {
            for await (const delta of streamCompletion(provider, input)) {
                const piece = text ? delta : delta.trimStart();
                if (!piece) continue;
                text += piece;
                onDelta(piece, provider.model);
            }
        } catch (error) {
            console.error(`AI summary via ${provider.model} failed:`, error.message);
            if (text) return null;
            continue;
        }
        if (text) return { text: text.trimEnd(), model: provider.model };
    }
    return null;
}
