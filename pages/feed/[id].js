import { useEffect, useState } from 'react';
import { processHtmlLinks, convertCoolapkFeedLinks } from '../../lib/linkProcessor';
import MarkdownIt from 'markdown-it';
import markdownItMultimdTable from 'markdown-it-multimd-table';
import markdownItTaskLists from 'markdown-it-task-lists';
import hljs from 'highlight.js';

import MetaTags from '../../components/feed/MetaTags';
import FeedContent from '../../components/feed/FeedContent';
import { fetchFeedData } from '../../lib/feedLoader';
import { styles } from '../../styles/feedStyles';

const proxyImage = (url) => {
    if (url && (url.includes('image.coolapk.com') || url.includes('avatar.coolapk.com'))) {
        return `https://image.coolapk1s.com/?url=${encodeURIComponent(url)}`;
    }
    return url;
};

const FeedPage = ({ feed, error, id }) => {
    const [isBarVisible, setIsBarVisible] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isPC, setIsPC] = useState(false);
    const [formattedDate, setFormattedDate] = useState('');
    const [isMarkdownEnabled, setIsMarkdownEnabled] = useState(false);

    const detectMarkdown = (content) => {
        if (!content) return false;
        const decodeEntities = (text) => {
            if (typeof window === 'undefined') return text.replace(/</g, '<').replace(/>/g, '>').replace(/&/g, '&');
            const textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            return textarea.value;
        };
        const decoded = decodeEntities(content);
        const markdownPatterns = [/\*\*[^*]+\*\*/, /__[^_]+__/, /```[\s\S]*?```/, /`[^`]+`/, /^\|.+\|$/m, /^---+$/m, /~~[^~]+~~/];
        return markdownPatterns.some(pattern => pattern.test(decoded));
    };

    const cleanCodeContent = (str) => str.replace(/<!--break-->/g, '').replace(/<a class="feed-link-url".*?>(.*?)<\/a>/g, '$1').replace(/<a class="feed-link-tag".*?>(.*?)<\/a>/g, '$1').replace(/<a class="feed-link-uname".*?>(.*?)<\/a>/g, '$1');

    const md = (() => {
        const mdInstance = new MarkdownIt({
            html: true, linkify: true, typographer: true,
            highlight: function (str, lang) {
                const cleanedStr = cleanCodeContent(str);
                if (lang && hljs.getLanguage(lang)) {
                    try { return '<pre><code class="hljs">' + hljs.highlight(cleanedStr, { language: lang, ignoreIllegals: true }).value + '</code></pre>'; } catch (__) { }
                }
                return '<pre><code class="hljs">' + mdInstance.utils.escapeHtml(cleanedStr) + '</code></pre>';
            }
        }).use(markdownItMultimdTable, { multiline: true, rowspan: true, headerless: true, multibody: true }).use(markdownItTaskLists, { enabled: true, label: true, labelAfter: true });
        const defaultCodeInline = mdInstance.renderer.rules.code_inline;
        mdInstance.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
            tokens[idx].content = cleanCodeContent(tokens[idx].content);
            return defaultCodeInline(tokens, idx, options, env, self);
        };
        const originalRender = mdInstance.render.bind(mdInstance);
        mdInstance.render = function (src, env) {
            const codeBlocks = [], inlineCodeBlocks = [];
            let processedSrc = src.replace(/```[\s\S]*?```/g, match => { codeBlocks.push(match); return `___CODE_BLOCK_${codeBlocks.length - 1}___`; });
            processedSrc = processedSrc.replace(/`[^`]+`/g, match => { inlineCodeBlocks.push(match); return `___INLINE_CODE_${inlineCodeBlocks.length - 1}___`; });
            processedSrc = processedSrc.replace(/\[([^\]]+)\]\(<a class="feed-link-url"[^>]*?href="([^"]*)"[^>]*?>.*?<\/a>\)/g, '[$1]($2)');
            processedSrc = processedSrc.replace(/<a class="feed-link-url"[^>]*?href="([^"]*)"[^>]*?>.*?<\/a>/g, (match, url) => convertCoolapkFeedLinks(url))
                .replace(/<a class="feed-link-tag"[^>]*?href="([^"]*)"[^>]*?>#(.*?)#<\/a>/g, '[#$2#](https://www.coolapk.com$1)')
                .replace(/<a class="feed-link-uname"[^>]*?href="([^"]*)"[^>]*?>(.*?)<\/a>/g, '[$2](https://www.coolapk.com$1)');
            processedSrc = processedSrc.replace(/___CODE_BLOCK_(\d+)___/g, (match, index) => codeBlocks[parseInt(index)]);
            processedSrc = processedSrc.replace(/___INLINE_CODE_(\d+)___/g, (match, index) => inlineCodeBlocks[parseInt(index)]);
            return originalRender(processedSrc, env);
        };
        return mdInstance;
    })();

    useEffect(() => {
        if (typeof window !== "undefined" && window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        const checkIsPC = () => setIsPC(typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
        checkIsPC();
        window.addEventListener('resize', checkIsPC);
        if (feed) {
            setFormattedDate(new Date(feed.dateline * 1000).toLocaleString());
            let contentToCheck = (feed.feedType === 'feedArticle' && feed.message_raw_output) ? JSON.parse(feed.message_raw_output).filter(p => p.type === 'text').map(p => p.message).join('\n') : feed.message || '';
            if (detectMarkdown(contentToCheck)) setIsMarkdownEnabled(true);
        }
        return () => window.removeEventListener('resize', checkIsPC);
    }, [feed]);

    if (error) return <div style={styles.centered}>Error: {error}</div>;

    return (
        <div style={styles.container}>
            <MetaTags feed={feed} isTelegram={false} />
            {feed && (
                <div style={styles.header}>
                    <h1 style={styles.title}>{feed.message_title || feed.title}</h1>
                    <div style={styles.userInfo}>
                        <img src={proxyImage(feed.userAvatar)} alt={feed.username} style={styles.avatar} />
                        <div>
                            <strong style={styles.username}>{feed.username}</strong>
                            <div style={styles.dateline}>{formattedDate}</div>
                        </div>
                        <div style={styles.controlsContainer}>
                            <span style={styles.switchLabel}>Markdown</span>
                            <label className="switch">
                                <input type="checkbox" checked={isMarkdownEnabled} onChange={() => setIsMarkdownEnabled(!isMarkdownEnabled)} />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            )}
            <div style={styles.content}>
                <FeedContent
                    feed={feed}
                    isTelegram={false}
                    isPC={() => isPC}
                    onImageClick={setSelectedImage}
                    md={md}
                    processHtmlLinks={processHtmlLinks}
                    styles={styles}
                    isMarkdownEnabled={isMarkdownEnabled}
                />
            </div>
            {isBarVisible && id && (
                <div style={styles.floatingBarContainer}>
                    <div style={styles.floatingBar}>
                        <a href={`https://www.coolapk.com/${feed && feed.feedType === 'picture' ? 'picture' : 'feed'}/${id}`} target="_blank" rel="noopener noreferrer" style={styles.originalLinkButton}>
                            打开原链接
                        </a>
                        <button onClick={() => setIsBarVisible(false)} style={styles.closeButton}>&times;</button>
                    </div>
                </div>
            )}
            {selectedImage && (
                <div style={styles.lightbox} onClick={() => setSelectedImage(null)}>
                    <img src={selectedImage} alt="Enlarged view" style={styles.lightboxImage} />
                </div>
            )}
        </div>
    );
};

export async function getServerSideProps(context) {
    const { res, params, req } = context;
    const { id } = params;

    const data = await fetchFeedData(id, req);

    if (data.props.feed) {
        res.setHeader(
            'Cache-Control',
            'public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400');
    } else {
        res.setHeader(
            'Cache-Control',
            'public, max-age=60, s-maxage=60, stale-while-revalidate=0'
        );
        
    }

    return { ...data, props: { ...data.props, id } };
}

export default FeedPage;