import { useEffect, useState } from 'react';
import { proxyImage } from '../../lib/imageProxy';
import { processCoolapkEmoji } from '../../lib/emojiProcessor';
import { formatDate } from '../../lib/dateUtils';
import { LazyImage } from './LazyImage';

// Renders a date client-side only, using the browser's local timezone.
// On the server, renders empty to avoid SSR/client timezone mismatch.
function ClientDate({ ts }) {
    const [text, setText] = useState('');
    useEffect(() => {
        setText(formatDate(ts));
    }, [ts]);
    return <span suppressHydrationWarning>{text}</span>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function processContent(text) {
    let html = processCoolapkEmoji(text);
    if (!html) return html || '';

    const viewMorePattern = /<a\s+href="\/feed\/replyList\?id=\d+">查看更多<\/a>/g;
    html = html.replace(viewMorePattern, '<span class="reply-truncated">（完整评论请到客户端查看）</span>');

    // Replace <a> tags with styled <span> to keep the link color but remove clickability
    html = html.replace(/<a\b[^>]*>(.*?)<\/a>/g, '<span class="reply-link">$1</span>');

    return html
        .replace(/width:\s*24px/g, 'width:1.2em')
        .replace(/height:\s*24px/g, 'height:1.2em')
        .replace(/vertical-align:\s*middle/g, 'vertical-align:-0.22em');
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ReplyRowImage({ pic, picArr, idx }) {
    const proxied = proxyImage(pic);
    const proxiedArr = picArr ? picArr.map(p => proxyImage(p)) : [proxied];

    const handleClick = () => {
        if (typeof window !== 'undefined' && window.parent !== window) {
            window.parent.postMessage({ type: 'image-click', images: proxiedArr, index: idx }, '*');
        }
    };

    return (
        <div className="reply-img-wrap">
            <LazyImage
                compact
                src={proxied}
                alt="comment pic"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', display: 'block', cursor: 'pointer' }}
                onClick={handleClick}
            />
        </div>
    );
}

function ReplyRow({ r, authorUid }) {
    const isImgOnly = r.message === '[图片]' && (r.picArr?.length || r.pic);
    const msgHtml = isImgOnly ? '' : processContent(r.message);
    const isTargetAuthor = authorUid && r.ruid === authorUid;
    const pics = r.picArr?.length ? r.picArr : (r.pic ? [r.pic] : []);

    return (
        <div className="reply-row">
            <div className="reply-row-body">
                <div className="reply-row-meta">
                    <span className="reply-row-username">{r.username}</span>
                    {r.isFeedAuthor === 1 && <span className="reply-badge">楼主</span>}
                    {r.rusername && (
                        <span className="reply-row-to">
                            {' 回复 '}
                            <span className="reply-row-rusername">{r.rusername}</span>
                            {isTargetAuthor && <span className="reply-badge">楼主</span>}
                        </span>
                    )}
                    <span className="reply-row-colon">：</span>
                    {msgHtml && (
                        <span
                            className="reply-row-msg"
                            dangerouslySetInnerHTML={{ __html: msgHtml }}
                        />
                    )}
                </div>
                {pics.length > 0 && (
                    <div className="reply-row-pics">
                        {pics.map((pic, idx) => (
                            <ReplyRowImage key={idx} pic={pic} picArr={pics} idx={idx} />
                        ))}
                    </div>
                )}
                <div className="reply-row-date"><ClientDate ts={r.dateline} /></div>
            </div>
        </div>
    );
}

function ReplyCard({ reply, isLast }) {
    const isImgOnly = reply.message === '[图片]' && (reply.picArr?.length || reply.pic);
    const msgHtml = isImgOnly ? '' : processContent(reply.message);
    const authorUid = reply.feedUid;
    const pics = reply.picArr?.length ? reply.picArr : (reply.pic ? [reply.pic] : []);
    const proxiedPics = pics.map(p => proxyImage(p));

    const handleImgClick = (index) => {
        if (typeof window !== 'undefined' && window.parent !== window) {
            window.parent.postMessage({ type: 'image-click', images: proxiedPics, index }, '*');
        }
    };

    return (
        <div className={`reply-card${isLast ? ' reply-card-last' : ''}`}>
            {/* Header */}
            <div className="reply-card-header">
                <LazyImage
                    compact
                    src={proxyImage(reply.userAvatar)}
                    alt={reply.username}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0 }}
                />
                <div className="reply-card-meta">
                    <span className="reply-username">
                        {reply.username}
                        {reply.isFeedAuthor === 1 && <span className="reply-badge">楼主</span>}
                    </span>
                    <span className="reply-date"><ClientDate ts={reply.dateline} /></span>
                </div>
                <div className="reply-card-stats">
                    {reply.likenum > 0 && (
                        <div className="reply-stat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M7 10v12" />
                                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                            </svg>
                            {reply.likenum}
                        </div>
                    )}
                    {reply.replynum > 0 && (
                        <div className="reply-stat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            {reply.replynum}
                        </div>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="reply-card-body">
                {msgHtml && (
                    <div
                        className="reply-content"
                        dangerouslySetInnerHTML={{ __html: msgHtml }}
                    />
                )}
                {pics.length > 0 && (
                    <div className="reply-pics">
                        {pics.map((pic, idx) => (
                            <div key={idx} className="reply-img-wrap">
                                <LazyImage
                                    compact
                                    src={proxyImage(pic)}
                                    alt="comment pic"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', display: 'block', cursor: 'pointer' }}
                                    onClick={() => handleImgClick(idx)}
                                />
                            </div>
                        ))}
                    </div>
                )}
                {reply.replyRows?.length > 0 && (
                    <div className="reply-nested">
                        {reply.replyRows.map((r, i) => (
                            <ReplyRow key={i} r={r} authorUid={authorUid} />
                        ))}
                        {reply.replyRowsMore > 0 && (
                            <div className="reply-more">还有 {reply.replyRowsMore} 条回复…</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export const ReplyListStyles = `
.reply-list-root {
    padding: 0 0 32px;
    color: var(--c1);
    background: var(--bg);
}
.reply-empty {
    padding: 16px 0;
    color: var(--c2);
    font-size: 0.9em;
    text-align: center;
}
.reply-card {
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
}
.reply-card-last {
    border-bottom: none;
}
.reply-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}
.reply-card-meta {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 2px;
}
.reply-username {
    font-weight: 600;
    font-size: 0.96em;
    display: flex;
    align-items: center;
    gap: 6px;
}
.reply-badge {
    font-size: 0.68em;
    padding: 1px 6px;
    border-radius: 10px;
    background: var(--link);
    color: #fff;
}
.reply-date {
    font-size: 0.82em;
    color: var(--c2);
}
.reply-card-stats {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    color: var(--c2);
    font-size: 0.82em;
}
.reply-stat {
    display: flex;
    align-items: center;
    gap: 3px;
}
.reply-card-body {
    margin-left: 46px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.reply-content {
    line-height: 1.65;
    font-size: 1em;
    word-break: break-word;
}
.reply-pics {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(80px, 30%), 1fr));
    gap: 8px;
}
.reply-img-wrap {
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    background-color: #f5f5f5;
}
@media (prefers-color-scheme: dark) {
    .reply-img-wrap { background-color: #222; }
}
.reply-img-wrap > div {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
}
.reply-nested {
    background: var(--nestbg);
    border-radius: 6px;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.reply-more {
    font-size: 0.86em;
    color: var(--link);
    padding-top: 2px;
}
.reply-row {
    display: flex;
    gap: 8px;
    align-items: flex-start;
}
.reply-row-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.92em;
    line-height: 1.6;
    word-break: break-word;
    color: var(--c1);
}
.reply-row-meta {
    display: inline;
}
.reply-row-username {
    font-weight: 600;
    color: var(--link);
}
.reply-row-to {
    color: var(--c3);
}
.reply-row-rusername {
    color: var(--link);
}
.reply-row-colon {
    color: var(--rowmsg);
}
.reply-row-msg {
    color: var(--rowmsg);
}
.reply-row-pics {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(60px, 30%), 1fr));
    gap: 8px;
}
.reply-row-date {
    font-size: 0.82em;
    color: var(--c3);
    line-height: 1.2;
}
.reply-link {
    color: var(--link);
}
.reply-truncated {
    color: var(--c2);
    font-style: italic;
    font-size: 0.9em;
}
.coolapk-emoji {
    display: inline-block;
    vertical-align: -0.22em;
    margin: 0 2px;
}
`;

export default function ReplyList({ replies }) {
    // Report height changes to parent frame
    useEffect(() => {
        function reportHeight() {
            if (typeof window !== 'undefined' && window.parent !== window) {
                const h = document.body.offsetHeight;
                window.parent.postMessage({ type: 'reply-height', height: h }, '*');
            }
        }

        reportHeight();
        window.addEventListener('load', reportHeight);

        const ro = new ResizeObserver(reportHeight);
        ro.observe(document.body);

        return () => {
            window.removeEventListener('load', reportHeight);
            ro.disconnect();
        };
    }, [replies]);

    if (!replies) return null;

    if (replies.length === 0) {
        return (
            <div className="reply-list-root">
                <div className="reply-empty">暂无热门评论</div>
            </div>
        );
    }

    return (
        <div className="reply-list-root">
            {replies.map((reply, i) => (
                <ReplyCard key={reply.id ?? i} reply={reply} isLast={i === replies.length - 1} />
            ))}
        </div>
    );
}
