import { useEffect, useState, useRef } from 'react';
import { detectMarkdown } from '../../lib/markdownProcessor';
import { proxyImage } from '../../lib/imageProxy';
import { getFeedPlainText } from '../../lib/feedText';

import MetaTags from '../../components/feed/MetaTags';
import FeedContent from '../../components/feed/FeedContent';
import { ImageLightbox } from '../../components/feed/ImageLightbox';
import AISummary from '../../components/feed/AISummary';
import AdBanner from '../../components/feed/AdBanner';
import { fetchFeedData } from '../../lib/internalApi';
import { generateAISummary } from '../../lib/aiSummary';
import { optimizeFeedData } from '../../lib/feedOptimizer';
import { styles } from '../../styles/feedStyles';

const FeedPage = ({ feed, error, id, aiSummary, adClient, adSlot }) => {
    const [isBarVisible, setIsBarVisible] = useState(true);
    const [replyVisible, setReplyVisible] = useState(false);
    const replyRef = useRef(null);
    const iframeRef = useRef(null);
    const [lightboxImages, setLightboxImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [isPC, setIsPC] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const [formattedDate, setFormattedDate] = useState('');
    const [isMarkdownEnabled, setIsMarkdownEnabled] = useState(false);
    const [isReplyLoading, setIsReplyLoading] = useState(true);

    useEffect(() => {
        const checkIsPC = () => setIsPC(window.matchMedia("(min-width: 768px)").matches);
        checkIsPC();
        setIsAndroid(/Android/i.test(navigator.userAgent));
        window.addEventListener('resize', checkIsPC);
        if (feed) {
            setFormattedDate(new Date(feed.dateline * 1000).toLocaleString());
            setIsMarkdownEnabled(detectMarkdown(getFeedPlainText(feed)));
        }
        return () => window.removeEventListener('resize', checkIsPC);
    }, [feed]);

    useEffect(() => {
        if (!replyRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setReplyVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '100px' }
        );
        observer.observe(replyRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const onMessage = (e) => {
            if (e.origin !== window.location.origin) return;
            if (e.data?.type === 'reply-height' && iframeRef.current) {
                iframeRef.current.style.height = e.data.height + 'px';
                setIsReplyLoading(false);
            } else if (e.data?.type === 'image-click' && Array.isArray(e.data.images) && e.data.images.length > 0) {
                handleImageClick(e.data.images, e.data.index);
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    const handleImageClick = (images, index) => {
        setLightboxImages(images);
        setCurrentImageIndex(index);
        setShowLightbox(true);
    };

    const handleImageChange = (index) => {
        setCurrentImageIndex(index);
    };

    const handleCloseLightbox = () => {
        setShowLightbox(false);
        setLightboxImages([]);
        setCurrentImageIndex(0);
    };

    if (error) return <div style={styles.centered}>Error: {error}</div>;

    return (
        <div style={styles.container}>
            <MetaTags feed={feed} isTelegram={false} />
            {feed && (
                <div style={styles.header}>
                    <h1 style={styles.title}>{feed.message_title || feed.title}</h1>
                    <div style={styles.userInfo}>
                        <img src={proxyImage(feed.userAvatar)} alt={feed.username} style={styles.avatar} />
                        <div style={styles.userMeta}>
                            <strong style={styles.username}>{feed.username}</strong>
                            <div style={styles.dateline}>{formattedDate}</div>
                        </div>
                        <div style={styles.controlsContainer}>
                            <label className="switch">
                                <input type="checkbox" checked={isMarkdownEnabled} onChange={() => setIsMarkdownEnabled(!isMarkdownEnabled)} />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            )}
            <AISummary summary={aiSummary?.text} model={aiSummary?.model} />
            <div style={styles.content}>
                <FeedContent
                    feed={feed}
                    isPC={isPC}
                    onImageClick={handleImageClick}
                    isMarkdownEnabled={isMarkdownEnabled}
                />
            </div>
            {feed && (
                <>
                    <div className="section-divider-wrapper">
                        <div className="section-divider-line"></div>
                        <div className="section-divider-badge">
                            <span className="divider-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </span>
                            热门评论
                        </div>
                        <div className="section-divider-line-right"></div>
                    </div>

                    <div ref={replyRef} style={replyContainerStyle}>
                        {replyVisible && (
                            <>
                                {isReplyLoading && (
                                    <div className="comment-loader-container">
                                        <div className="comment-loader"></div>
                                        <span>加载热门评论中...</span>
                                    </div>
                                )}
                                <iframe
                                    ref={iframeRef}
                                    src={`/reply/${id}`}
                                    style={{ ...replyIframeStyle, display: isReplyLoading ? 'none' : 'block' }}
                                    scrolling="no"
                                    frameBorder="0"
                                    title="热门评论"
                                />
                            </>
                        )}
                    </div>

                    <AdBanner adClient={adClient} adSlot={adSlot} />
                </>
            )}
            {isBarVisible && (
                <div style={styles.floatingBarContainer}>
                    <div style={styles.floatingBar}>
                        <a
                            href={isAndroid
                                ? `coolmarket://www.coolapk.com/feed/${id}`
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
            {showLightbox && (
                <ImageLightbox
                    images={lightboxImages}
                    currentIndex={currentImageIndex}
                    onClose={handleCloseLightbox}
                    onImageChange={handleImageChange}
                />
            )}
        </div>
    );
};

const replyContainerStyle = {
    marginTop: '0px',
    paddingTop: '0',
    minHeight: '80px',
};

const replyIframeStyle = {
    width: '100%',
    border: 'none',
    display: 'block',
    minHeight: '200px',
    overflow: 'hidden',
};

export async function getServerSideProps(context) {
    const { res, params, req } = context;
    const { id } = params;

    const { feed, error } = await fetchFeedData(id, req);
    let aiSummary = null;

    if (feed) {
        aiSummary = await generateAISummary(feed);
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600');
    } else {
        res.statusCode = 404;
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=0');
    }

    return {
        props: {
            feed: optimizeFeedData(feed),
            error,
            id,
            aiSummary,
            adClient: process.env.ADSENSE_PUBLISHER_ID ?? null,
            adSlot: process.env.ADSENSE_AD_SLOT ?? null,
        }
    };
}

export default FeedPage;
