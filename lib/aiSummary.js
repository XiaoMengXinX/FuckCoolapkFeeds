// Unified system prompt for all AI models
const SYSTEM_PROMPT = '请将以下文本浓缩为一条极简概括（50字以内）。要求：采用"一句话新闻"的形式，去掉所有废话；严禁换行，不使用markdown等特殊格式；避免生僻术语；使用中文回复。';

// API timeout in milliseconds
const API_TIMEOUT = 5000;

/**
 * Call SiliconFlow's Ling-mini-2.0 model
 * @param {string} content - Text content to summarize
 * @param {string} apiKey - SiliconFlow API key
 * @returns {Promise<{result: string|null, isTimeout: boolean}>}
 */
async function callSiliconFlowAPI(content, apiKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'inclusionAI/Ling-mini-2.0',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content }
                ],
                max_tokens: 128,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            return { result: null, isTimeout: false };
        }

        const data = await response.json();
        const result = data.choices?.[0]?.message?.content;
        return { result: typeof result === 'string' ? result.trim() || null : null, isTimeout: false };
    } catch (error) {
        return { result: null, isTimeout: error.name === 'AbortError' };
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Call Cloudflare AI API
 * @param {string} content - Text content to summarize
 * @param {string} accountId - Cloudflare account ID
 * @param {string} apiToken - Cloudflare API token
 * @returns {Promise<{result: string|null, isTimeout: boolean}>} - Summary result and timeout flag
 */
async function callCloudflareAPI(content, accountId, apiToken) {
    try {
        const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: content
                    }
                ]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return { result: null, isTimeout: false };
        }

        const data = await response.json();

        // Extract summary from response
        if (data.result && data.result.response) {
            return { result: data.result.response.trim(), isTimeout: false };
        }

        return { result: null, isTimeout: false };

    } catch (error) {
        // Check if error is due to timeout (AbortError)
        const isTimeout = error.name === 'AbortError';
        return { result: null, isTimeout };
    }
}

/**
 * Generate AI summary using Cloudflare with SiliconFlow as fallback
 * @param {Object} feed - Feed data object
 * @returns {Promise<{text: string, model: string}|null>} - Summary and model or null if failed/skipped
 */
export async function generateAISummary(feed) {
    const siliconFlowApiKey = process.env.SILICONFLOW_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    // Return early if no API is configured
    if (!siliconFlowApiKey && (!accountId || !apiToken)) {
        return null;
    }

    if (!feed) {
        return null;
    }

    // Extract text content from feed
    let content = '';

    if (feed.feedType === 'feedArticle' && feed.message_raw_output) {
        // For articles, extract text from message_raw_output
        try {
            const rawOutput = JSON.parse(feed.message_raw_output);
            content = rawOutput
                .filter(p => p.type === 'text')
                .map(p => p.message)
                .join('\n');
        } catch (e) {
            content = feed.message || '';
        }
    } else {
        // For regular feeds, use message
        content = feed.message || '';
    }

    // Check if content length meets threshold
    const MIN_LENGTH = 800;
    if (content.length < MIN_LENGTH) {
        return null;
    }

    // Try Cloudflare first
    if (accountId && apiToken) {
        const { result } = await callCloudflareAPI(content, accountId, apiToken);
        if (result) {
            return { text: result, model: 'Llama 4 Scout' };
        }
    }

    // Fall back to SiliconFlow when Cloudflare fails or times out
    if (siliconFlowApiKey) {
        const { result } = await callSiliconFlowAPI(content, siliconFlowApiKey);
        return result ? { text: result, model: 'Ling-mini-2.0' } : null;
    }

    return null;
}
