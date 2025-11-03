export async function fetchFeedData(id, req) {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const apiUrl = `${protocol}://${host}/api/feed?id=${id}`;

    try {
        const headers = {};
        const authToken = process.env.INTERNAL_AUTH_TOKEN;
        if (authToken) {
            headers['X-Internal-Auth'] = authToken;
        }
        
        const response = await fetch(apiUrl, { headers });

        if (!response.ok) {
            throw new Error(`API response error: ${response.statusText}`);
        }
        const data = await response.json();
        
        return {
            props: {
                id,
                feed: data.data || null,
                error: null,
            },
        };
    } catch (error) {
        return {
            props: {
                id,
                feed: null,
                error: error.message,
            },
        };
    }
}