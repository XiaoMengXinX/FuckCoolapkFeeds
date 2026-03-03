import { useEffect, useState, useRef } from 'react';
import { proxyImage } from '../../lib/imageProxy';
import { LazyImage } from './LazyImage';
import { processCoolapkEmoji } from '../../lib/emojiProcessor';
import { timeAgo } from '../../lib/dateUtils';

// Renders relative time client-side only, using the browser's local timezone.
function ClientTimeAgo({ ts }) {
    const [text, setText] = useState('');
    useEffect(() => {
        setText(timeAgo(ts));
    }, [ts]);
    return <span suppressHydrationWarning>{text}</span>;
}

export function stripHtml(html) {
    if (!html) return '';
    // Replace <a> tags with styled spans to keep link text visible/colored
    const withLinks = html.replace(/<a\b[^>]*>(.*?)<\/a>/g, '<span style="color:var(--link)">$1</span>');
    // Strip all other HTML tags except the newly created spans
    return withLinks.replace(/<(?!\/?span\b)[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export const FeedExcerpt = ({ text, hasTitle }) => {
    const textRef = useRef(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        const checkTruncation = () => {
            const el = textRef.current;
            if (el) {
                // Determine if text overflows the line clamps
                setIsTruncated(el.scrollHeight > el.clientHeight);
            }
        };

        checkTruncation();
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [text]);

    return (
        <div className={`hl-excerpt-container ${hasTitle ? 'with-title' : 'no-title'}`}>
            <div
                ref={textRef}
                className="hl-excerpt-text"
                dangerouslySetInnerHTML={{ __html: text }}
            />
            {isTruncated && <div className="hl-excerpt-more-fade" />}
        </div>
    );
};

export const FeedCard = ({ feed }) => {
    const rawMessage = feed.message || '';
    let titleText = feed.message_title;
    let bodyText = rawMessage;

    // Extract title from 【】 if available and no message_title
    if (!titleText) {
        const titleMatch = rawMessage.match(/^(【.*?】)\s*(.*)/s);
        if (titleMatch) {
            titleText = titleMatch[1];
            bodyText = titleMatch[2];
        }
    }

    // Strip HTML and check if very long to show "查看更多"
    bodyText = stripHtml(bodyText);

    // Process Emojis
    titleText = processCoolapkEmoji(titleText);
    bodyText = processCoolapkEmoji(bodyText);

    // Photos
    const pics = feed.picArr || (feed.pic ? [feed.pic] : []);
    const displayPics = pics.slice(0, 3);
    const hasMorePics = pics.length > 3;

    return (
        <a href={`/feed/${feed.id}`} className="hl-card" target="_top" rel="noopener noreferrer">
            {/* Header */}
            <div className="hl-header">
                <div className="hl-avatar-wrap">
                    <LazyImage
                        compact
                        src={proxyImage(feed.userAvatar)}
                        alt={feed.username}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            display: 'block'
                        }}
                    />
                    {feed.userInfo?.verify_status === 1 && (
                        <svg className="hl-verified" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" fill="#ffc107" />
                            <path d="M10 15.5l-3.5-3.5 1.5-1.5 2 2 5-5 1.5 1.5z" fill="#fff" />
                        </svg>
                    )}
                </div>
                <div className="hl-user-info">
                    <div className="hl-username-wrap">
                        <span className="hl-username">{feed.username}</span>
                    </div>
                    <div className="hl-sub-info">
                        <span className="hl-time"><ClientTimeAgo ts={feed.dateline} /></span>
                        {feed.device_title && (
                            <>
                                <span className="hl-dot">·</span>
                                <span className="hl-device">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px' }}>
                                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                        <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                    </svg>
                                    {feed.device_title}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="hl-body">
                {titleText && (
                    <div
                        className="hl-title"
                        dangerouslySetInnerHTML={{ __html: titleText }}
                    />
                )}
                {bodyText && <FeedExcerpt text={bodyText} hasTitle={!!titleText} />}
            </div>

            {/* Images Grid */}
            {displayPics.length > 0 && (
                <div className={`hl-pic-grid hl-pic-count-${displayPics.length}`}>
                    {displayPics.map((pic, idx) => (
                        <div className="hl-pic-item" key={idx}>
                            <LazyImage
                                src={proxyImage(pic)}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block'
                                }}
                            />
                            {idx === 2 && hasMorePics && (
                                <div className="hl-pic-count-badge">{pics.length}图</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="hl-footer">
                {feed.ttitle ? (
                    <span
                        className="hl-topic-tag"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const cleanTag = (feed.ttitle || '').replace(/\s+/g, '');
                            window.top.location.href = `/t/${encodeURIComponent(cleanTag)}`;
                        }}
                    >
                        <span className="hl-topic-icon">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                        </span>
                        {feed.ttitle}
                    </span>
                ) : <span />}

                <div className="hl-stats">
                    <span className="hl-stat">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        {feed.likenum}
                    </span>
                    <span className="hl-stat">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        {feed.replynum}
                    </span>
                    <span className="hl-stat">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                        {feed.share_num || feed.forwardnum || 0}
                    </span>
                </div>
            </div>
        </a>
    );
};

export const FeedCardStyles = `
    html {
        scrollbar-gutter: auto !important;
    }

    :root {
        --hl-bg: #fff;
        --hl-card-border: #f0f2f5;
        --hl-card-hover-bg: #fafafa;
        --hl-title-color: #111;
        --hl-excerpt-color: #444;
        --hl-meta-color: #999;
        --link: #28a745;
    }

    @media (prefers-color-scheme: dark) {
        :root {
            --hl-bg: #1a1a1a;
            --hl-card-border: #222;
            --hl-card-hover-bg: #222;
            --hl-title-color: #e8e8e8;
            --hl-excerpt-color: #a0a0a0;
            --hl-meta-color: #888;
            --link: #3dd56d;
        }
    }

    body {
        background: var(--hl-bg);
        margin: 0;
        padding: 0;
    }

    .hl-card {
        display: flex;
        flex-direction: column;
        padding: 16px;
        background: var(--hl-bg);
        border: 1px solid var(--hl-card-border);
        border-radius: 12px;
        margin: 0 12px;
        text-decoration: none;
        color: inherit;
        -webkit-tap-highlight-color: transparent;
        transition: all 0.15s ease;
    }

    .hl-card:hover {
        background: var(--hl-card-hover-bg);
        text-decoration: none;
    }

    .hl-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
    }

    .hl-avatar-wrap {
        position: relative;
        flex-shrink: 0;
        margin-right: 12px;
        width: 40px;
        height: 40px;
    }

    .hl-verified {
        position: absolute;
        bottom: 0px;
        right: 0px;
        width: 14px;
        height: 14px;
        background: var(--hl-bg);
        border-radius: 50%;
    }

    .hl-user-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .hl-username-wrap {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 2px;
    }

    .hl-username {
        font-size: 15px;
        color: var(--hl-title-color);
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .hl-sub-info {
        display: flex;
        align-items: center;
        font-size: 12px;
        color: var(--hl-meta-color);
    }

    .hl-dot {
        margin: 0 4px;
        display: inline-block;
        color: var(--hl-meta-color);
    }

    .hl-device {
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--hl-meta-color);
    }

    .hl-body {
        margin-bottom: 12px;
    }

    .hl-title {
        font-size: 17px;
        font-weight: 600;
        color: var(--hl-title-color);
        line-height: 1.5;
        margin-bottom: 6px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    /* Elegant CSS Fade-out Truncation */
    .hl-excerpt-container {
        font-size: 15px;
        color: var(--hl-excerpt-color);
        line-height: 1.6;
        position: relative;
    }

    .hl-excerpt-text {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
    }

    .hl-excerpt-container.with-title .hl-excerpt-text {
        -webkit-line-clamp: 3;
    }

    .hl-excerpt-container.no-title .hl-excerpt-text {
        -webkit-line-clamp: 5;
    }

    .hl-excerpt-more-fade {
        position: absolute;
        bottom: 0;
        right: 0;
        display: flex;
        align-items: center;
        background: var(--hl-bg); /* Solid background to completely mask the characters underneath */
        padding-left: 4px;
        transition: background 0.15s ease;
    }
    
    /* Before element creates a very soft but quick gradient leading into the solid block */
    .hl-excerpt-more-fade::before {
        content: "";
        position: absolute;
        left: -24px;
        top: 0;
        width: 24px;
        height: 100%;
        background: linear-gradient(to right, transparent, var(--hl-bg));
        pointer-events: none;
    }

    /* Provide a subtle text hint on top of the solid block */
    .hl-excerpt-more-fade::after {
        content: "...查看更多";
        position: relative;
        color: #059669;
        font-weight: 500;
        line-height: inherit;
    }

    /* Hover backgrounds */
    .hl-card:hover .hl-excerpt-more-fade {
        background: var(--hl-card-hover-bg);
    }
    
    .hl-card:hover .hl-excerpt-more-fade::before {
        background: linear-gradient(to right, transparent, var(--hl-card-hover-bg));
    }

    .hl-pic-grid {
        display: grid;
        gap: 6px;
        margin-bottom: 12px;
        max-width: 100%;
    }
    
    .hl-pic-count-1 { grid-template-columns: repeat(2, 1fr); }
    .hl-pic-count-2 { grid-template-columns: repeat(2, 1fr); }
    .hl-pic-count-3 { grid-template-columns: repeat(3, 1fr); }

    @media (min-width: 600px) {
        .hl-pic-grid {
            max-width: 480px; /* Constrain grid width on desktop */
        }
    }

    .hl-pic-item {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 6px;
        overflow: hidden;
        background: rgba(0,0,0,0.03);
    }

    .hl-pic-count-badge {
        position: absolute;
        top: 6px;
        right: 6px;
        background: rgba(0, 0, 0, 0.5);
        color: #fff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.5px;
        z-index: 2;
    }

    .hl-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 4px;
    }

    .hl-topic-tag {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        background: #f0f2f5;
        color: #666;
        border-radius: 14px;
        font-size: 13px;
        font-weight: 500;
        min-height: 24px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .hl-topic-tag:hover {
        background: #e4e6e9;
        color: var(--link);
    }

    .hl-topic-icon {
        margin-right: 4px;
        display: flex;
        align-items: center;
    }

    .hl-stats {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .hl-stat {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: var(--hl-meta-color);
        font-weight: 500;
    }

    @media (prefers-color-scheme: dark) {
        .hl-topic-tag {
            background: rgba(255, 255, 255, 0.03);
            color: #888;
        }
        .hl-topic-tag:hover {
            background: rgba(255, 255, 255, 0.08);
            color: var(--link);
        }
    }

    .coolapk-emoji {
        width: 20px !important;
        height: 20px !important;
        margin: -2px 1px 0 1px !important;
        vertical-align: middle;
    }

    .hl-title .coolapk-emoji {
        width: 22px !important;
        height: 22px !important;
    }
`;
