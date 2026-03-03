import Head from 'next/head';
import ReplyList, { ReplyListStyles } from '../../components/feed/ReplyList';
import { fetchHotReplies } from '../../lib/hotReplyLoader';
import { optimizeReplyData } from '../../lib/feedOptimizer';

// CSS variables and base styles for the reply iframe page.
// Mirrors the original hand-crafted HTML template exactly.
const ReplyPageStyles = `
@keyframes spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
:root {
    --bg: #f9f9f9; --c1: #333; --c2: #aaa; --c3: #bbb; --border: #f0f0f0;
    --nestbg: #f0f0f0; --link: #28a745; --heading: #333; --rowmsg: #444;
    --image-bg: #f5f5f5; --image-border: 1px solid #ddd; --icon-color: #999;
}
@media (prefers-color-scheme: dark) {
    :root {
        --bg: #1a1a1a; --c1: #e0e0e0; --c2: #888; --c3: #666; --border: #333;
        --nestbg: #252525; --link: #3dd56d; --heading: #e0e0e0; --rowmsg: #ccc;
        --image-bg: #222; --image-border: 1px solid #555; --icon-color: #666;
    }
}
html, body { overflow: hidden; }
body {
    margin: 0; padding: 0;
    background: var(--bg); color: var(--c1);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
img { max-width: 100%; border: 0; }
p { margin: 0; }
/* LazyImage component styles */
.lazy-image-loading {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    display: flex; align-items: center; justify-content: center;
    background-color: var(--image-bg); color: #aaa;
}
.lazy-image-spinner {
    width: 24px; height: 24px; border-radius: 50%;
    border: 2px solid #e9ecef; border-top: 2px solid #28a745;
    animation: spin 1s linear infinite;
}
.compact-loading {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    display: flex; align-items: center; justify-content: center;
    background-color: #f5f5f5!important;
}
@media (prefers-color-scheme: dark) {
    .compact-loading { background-color: #222!important; }
}
.preview-image-error {
    border: var(--image-border); background-color: var(--image-bg);
}
.image-error-container {
    background-color: var(--image-bg); border-radius: 4px;
}
`;


const ReplyPage = ({ replies }) => {
    return (
        <>
            <Head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                {/* Inject all styles via dangerouslySetInnerHTML to bypass styled-jsx limitations */}
                <style dangerouslySetInnerHTML={{ __html: ReplyPageStyles + ReplyListStyles }} />
            </Head>
            <ReplyList replies={replies} />
        </>
    );
};

export async function getServerSideProps({ params, req, res }) {
    const { id } = params;

    // Enforce same-origin: only allow requests from the same host.
    const host = req.headers['x-forwarded-host'] || req.headers.host || '';
    const referer = req.headers['referer'] || req.headers['referrer'] || '';
    let refererHost = '';
    try { refererHost = new URL(referer).host; } catch (_) { }

    if (refererHost !== host) {
        res.statusCode = 403;
        res.end('403 Forbidden');
        return { props: {} };
    }

    const replies = await fetchHotReplies(id, req);
    const isError = replies === null;

    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader(
        'Cache-Control',
        isError
            ? 'public, max-age=60, s-maxage=60, stale-while-revalidate=0'
            : 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=0'
    );

    return {
        props: {
            replies: (replies ?? []).map(optimizeReplyData),
        },
    };
}

export default ReplyPage;
