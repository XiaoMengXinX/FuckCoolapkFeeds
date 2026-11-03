import { optimizeFeedListData } from './feedOptimizer';

async function fetchInternalApi(req, path) {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const token = process.env.INTERNAL_AUTH_TOKEN;

    const response = await fetch(`${protocol}://${host}/api/${path}`, {
        headers: token ? { 'X-Internal-Auth': token } : {},
    });
    if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
    }
    return response.json();
}

export async function fetchFeedData(id, req) {
    try {
        const data = await fetchInternalApi(req, `feed?id=${encodeURIComponent(id)}`);
        return { feed: data.data || null, error: null };
    } catch (error) {
        return { feed: null, error: error.message };
    }
}

// Resolves to null on failure so callers can distinguish errors from an empty list.
export async function fetchHotReplies(id, req) {
    try {
        const data = await fetchInternalApi(req, `hot_reply?id=${encodeURIComponent(id)}`);
        return data?.data ?? [];
    } catch (error) {
        console.error(`fetchHotReplies failed for id ${id}:`, error);
        return null;
    }
}

export async function fetchFeedList(req, path) {
    const data = await fetchInternalApi(req, path);
    return (data.data || [])
        .filter(f => f.entityType === 'feed')
        .map(optimizeFeedListData);
}
