import { useEffect, useState } from 'react';
import { processHtmlLinks } from '../../lib/linkProcessor';
import { getMarkdownRenderer, detectMarkdown } from '../../lib/markdownProcessor';
import { proxyImage } from '../../lib/imageProxy';

import MetaTags from '../../components/feed/MetaTags';
import FeedContent from '../../components/feed/FeedContent';
import { fetchFeedData } from '../../lib/feedLoader';
import { styles } from '../../styles/feedStyles';

const FeedPage = ({ feed, error, id }) => {
    const [isBarVisible, setIsBarVisible] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isPC, setIsPC] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const [formattedDate, setFormattedDate] = useState('');
    const [isMarkdownEnabled, setIsMarkdownEnabled] = useState(false);
    const md = getMarkdownRenderer();

    useEffect(() => {
        if (typeof window !== "undefined" && window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        const checkIsPC = () => setIsPC(typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
        const checkIsAndroid = () => setIsAndroid(typeof window !== "undefined" && /Android/i.test(navigator.userAgent));
        checkIsPC();
        checkIsAndroid();
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
                        <a
                            href={isAndroid
                                ? `intent://www.coolapk.com/feed/${id}#Intent;scheme=https;package=com.coolapk.market;end`
                                : `https://www.coolapk.com/${feed && feed.feedType === 'picture' ? 'picture' : 'feed'}/${id}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.originalLinkButton}
                        >
                            {isAndroid ? 'APP 内打开' : '打开原链接'}
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