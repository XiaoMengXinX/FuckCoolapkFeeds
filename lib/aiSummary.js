import { getFeedPlainText } from './feedText';

const SYSTEM_PROMPT = '请将以下文本浓缩为一条极简概括（50字以内）。要求：采用"一句话新闻"的形式，去掉所有废话；严禁换行，不使用markdown等特殊格式；避免生僻术语；使用中文回复。';
const API_TIMEOUT_MS = 5000;
const MIN_CONTENT_LENGTH = 800;

async function postChatCompletion(url, token, body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        return response.ok ? await response.json() : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

const trimmedOrNull = (value) => (typeof value === 'string' && value.trim()) || null;

async function callCloudflare(content, accountId, apiToken) {
    const data = await postChatCompletion(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct`,
        apiToken,
        {
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content },
            ],
        }
    );
    return trimmedOrNull(data?.result?.response);
}

async function callSiliconFlow(content, apiKey) {
    const data = await postChatCompletion(
        'https://api.siliconflow.cn/v1/chat/completions',
        apiKey,
        {
            model: 'inclusionAI/Ling-mini-2.0',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content },
            ],
            max_tokens: 128,
        }
    );
    return trimmedOrNull(data?.choices?.[0]?.message?.content);
}

export async function generateAISummary(feed) {
    const siliconFlowApiKey = process.env.SILICONFLOW_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const hasCloudflare = Boolean(accountId && apiToken);

    if (!hasCloudflare && !siliconFlowApiKey) return null;

    const content = getFeedPlainText(feed);
    if (content.length < MIN_CONTENT_LENGTH) return null;

    if (hasCloudflare) {
        const text = await callCloudflare(content, accountId, apiToken);
        if (text) return { text, model: 'Llama 4 Scout' };
    }

    if (siliconFlowApiKey) {
        const text = await callSiliconFlow(content, siliconFlowApiKey);
        if (text) return { text, model: 'Ling-mini-2.0' };
    }

    return null;
}
