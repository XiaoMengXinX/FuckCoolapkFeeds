import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';

const LazyImage = ({ src, alt, style, onClick }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const imageRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setImageSrc(src);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: '200px', // Preload images 200px before they enter the viewport
            }
        );

        if (imageRef.current) {
            observer.observe(imageRef.current);
        }

        return () => {
            if (imageRef.current) {
                observer.unobserve(imageRef.current);
            }
        };
    }, [src]);

    const handleImageLoad = () => {
        setLoaded(true);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {!loaded && imageSrc && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    color: '#aaa',
                }}>
                    Loading...
                </div>
            )}
            <img
                ref={imageRef}
                src={imageSrc}
                alt={alt}
                style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
                onClick={onClick}
                onLoad={handleImageLoad}
            />
        </div>
    );
};

const ImageCarousel = ({ images, onImageClick }) => {
    const scrollContainer = useRef(null);

    const scroll = (direction) => {
        if (scrollContainer.current) {
            const scrollAmount = scrollContainer.current.offsetWidth;
            scrollContainer.current.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
        }
    };

    return (
        <div style={styles.carouselContainer}>
            <button onClick={() => scroll(-1)} style={{...styles.carouselButton, left: '10px'}}>{'<'}</button>
            <div ref={scrollContainer} style={styles.carousel}>
                {images.map((img, index) => (
                    <div key={index} style={styles.carouselImageContainer}>
                        <LazyImage
                            src={img}
                            alt={`carousel-image-${index}`}
                            style={styles.carouselImage}
                            onClick={() => onImageClick(img)}
                        />
                    </div>
                ))}
            </div>
            <button onClick={() => scroll(1)} style={{...styles.carouselButton, right: '10px'}}>{'>'}</button>
        </div>
    );
};

const FeedPage = ({ feed, error }) => {
    const router = useRouter();
    const { id } = router.query;
    const [isBarVisible, setIsBarVisible] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isPC, setIsPC] = useState(false);
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        const checkIsPC = () => {
            if (typeof window !== "undefined") {
                setIsPC(window.matchMedia("(min-width: 768px)").matches);
            }
        };
        checkIsPC();
        window.addEventListener('resize', checkIsPC);

        if (feed) {
            setFormattedDate(new Date(feed.dateline * 1000).toLocaleString());
        }

        return () => window.removeEventListener('resize', checkIsPC);
    }, [feed]);
    
    const proxyImage = (url) => {
        if (url && (url.includes('image.coolapk.com') || url.includes('avatar.coolapk.com'))) {
             return `https://image.coolapk1s.com/?url=${encodeURIComponent(url)}`;
        }
        return url;
    };

    const renderFeedContent = () => {
        if (error) {
            return <div style={styles.centered}>Error: {error}</div>;
        }

        if (!feed) {
            return <div style={styles.centered}>No feed data found.</div>;
        }

        if (feed.feedType === 'feedArticle') {
            return renderArticleContent(feed.message_raw_output);
        } else if (feed.feedType === 'feed') {
            return renderStandardFeed();
        } else {
            return <div style={styles.centered}>不支持的动态类型: {feed.feedType}</div>;
        }
    };

    const renderArticleContent = (messageRaw) => {
        try {
            const messageParts = JSON.parse(messageRaw);
            return messageParts.map((part, index) => {
                if (part.type === 'text') {
                    const formattedMessage = part.message
                        .replace(/\\u0022/g, '"')
                        .replace(/<!--break-->/g, '')
                        .replace(/\\n/g, '\n');
                    
                    let htmlMessage = formattedMessage.replace(/\n/g, '<br />');
                    htmlMessage = htmlMessage.replace(/href="\/t\//g, 'href="https://www.coolapk.com/t/');

                    return (
                        <div
                            key={index}
                            style={styles.textBlock}
                            dangerouslySetInnerHTML={{ __html: htmlMessage }}
                        />
                    );
                } else if (part.type === 'image') {
                    const imageUrl = proxyImage(part.url);
                    return (
                        <div key={index} style={styles.imageContainer}>
                            <LazyImage
                                src={imageUrl}
                                alt={part.description || `feed-image-${index}`}
                                style={{...(isPC ? {...styles.image, maxWidth: '80%'} : styles.image), cursor: 'pointer'}}
                                onClick={() => setSelectedImage(imageUrl)}
                            />
                            {part.description && <div style={styles.imageDescription}>{part.description}</div>}
                        </div>
                    );
                }
                return null;
            });
        } catch (e) {
            let fallbackHtml = feed.message.replace(/\\n/g, '<br />');
            fallbackHtml = fallbackHtml.replace(/href="\/t\//g, 'href="https://www.coolapk.com/t/');
            return <div style={{whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{ __html: fallbackHtml }} />;
        }
    };

    const renderStandardFeed = () => {
        let htmlMessage = feed.message.replace(/href="\/t\//g, 'href="https://www.coolapk.com/t/');
        return (
            <div>
                <div style={styles.textBlock} dangerouslySetInnerHTML={{ __html: htmlMessage.replace(/\n/g, '<br />') }} />
                {feed.picArr && feed.picArr.length > 0 && (
                    <ImageCarousel 
                        images={feed.picArr.map(proxyImage)} 
                        onImageClick={setSelectedImage}
                    />
                )}
            </div>
        );
    };

    return (
        <div style={styles.container}>
            <Head>
                <title>{feed ? (feed.feedType === 'feedArticle' ? feed.message_title : feed.title) : 'Loading...'}</title>
                {feed && (
                    <>
                        <meta property="og:title" content={feed.feedType === 'feedArticle' ? feed.message_title : feed.title} />
                        <meta property="og:description" content={feed.message} />
                        <meta name="twitter:card" content="summary_large_image" />
                        {feed.picArr && feed.picArr.length > 0 && (
                            <meta property="og:image" content={proxyImage(feed.picArr[0])} />
                        )}
                         {feed.picArr && feed.picArr.length > 0 && (
                            <meta property="twitter:image" content={proxyImage(feed.picArr[0])} />
                        )}
                    </>
                )}
            </Head>
            {feed && (
                <div style={styles.header}>
                    <h1 style={styles.title}>{feed.message_title || feed.title}</h1>
                    <div style={styles.userInfo}>
                        <img src={proxyImage(feed.userAvatar)} alt={feed.username} style={styles.avatar} />
                        <div>
                            <strong style={styles.username}>{feed.username}</strong>
                            <div style={styles.dateline}>
                                {formattedDate}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div style={styles.content}>{renderFeedContent()}</div>

            {isBarVisible && id && (
                <div style={styles.floatingBarContainer}>
                    <div style={styles.floatingBar}>
                        <a href={`https://www.coolapk.com/feed/${id}`} target="_blank" rel="noopener noreferrer" style={styles.originalLinkButton}>
                            打开原链接
                        </a>
                        <button onClick={() => setIsBarVisible(false)} style={styles.closeButton}>
                            &times;
                        </button>
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
    const { id } = context.params;
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers['x-forwarded-host'] || context.req.headers.host;
    const apiUrl = `${protocol}://${host}/api/feed?id=${id}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return {
            props: {
                feed: data.data,
                error: null,
            },
        };
    } catch (error) {
        return {
            props: {
                feed: null,
                error: error.message,
            },
        };
    }
}

const styles = {
    carouselContainer: {
        position: 'relative',
        margin: '20px 0',
    },
    carousel: {
        display: 'flex',
        overflowX: 'scroll',
        scrollSnapType: 'x mandatory',
        gap: '10px',
        padding: '10px 0',
        scrollbarWidth: 'none', // for Firefox
        msOverflowStyle: 'none',  // for Internet Explorer 10+
    },
    carouselImageContainer: {
        width: '100%',
        flexShrink: 0,
        scrollSnapAlign: 'center',
        aspectRatio: '3/4',
        maxHeight: '600px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        overflow: 'hidden',
    },
    carouselImage: {
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
        borderRadius: '8px',
        cursor: 'pointer',
        margin: '0 auto',
        display: 'block',
    },
    carouselButton: {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        fontSize: '20px',
        cursor: 'pointer',
        zIndex: 1,
    },
    container: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        color: '#333',
        backgroundColor: 'transparent', // Inherit global background color
        paddingBottom: '100px', // Add padding to prevent content from being hidden by the floating bar
    },
    centered: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 'calc(100vh - 200px)', // Adjust height to keep it centered
        fontSize: '1.2em',
    },
    header: {
        borderBottom: '1px solid #eee',
        paddingBottom: '20px',
        marginBottom: '20px',
    },
    title: {
        fontSize: '2em',
        fontWeight: 'bold',
        marginBottom: '10px',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
    },
    avatar: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        marginRight: '15px',
    },
    username: {
        fontWeight: 'bold',
    },
    dateline: {
        fontSize: '0.9em',
        color: '#888',
    },
    content: {
        lineHeight: '1.8',
        fontSize: '1.1em',
    },
    textBlock: {
        marginBottom: '20px',
        wordWrap: 'break-word',
    },
    imageContainer: {
        margin: '20px 0',
        textAlign: 'center',
    },
    image: {
        maxWidth: '100%',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    imageDescription: {
        marginTop: '8px',
        color: '#666',
        fontSize: '0.9em',
    },
    floatingBarContainer: {
        position: 'fixed',
        bottom: '20px',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 1000,
    },
    floatingBar: {
        height: '50px',
        backgroundColor: '#28a745',
        borderRadius: '25px', // Makes it an oval
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 40px 0 20px', // Right padding to make space for the close button
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        position: 'relative',
    },
    originalLinkButton: {
        color: 'white',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '16px',
        lineHeight: '50px', // Center text vertically
    },
    closeButton: {
        position: 'absolute',
        top: '50%',
        right: '15px', // Adjusted position
        transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.2)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        fontSize: '14px',
        lineHeight: '20px',
        textAlign: 'center',
        cursor: 'pointer',
    },
    lightbox: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        cursor: 'pointer',
    },
    lightboxImage: {
        maxWidth: '90%',
        maxHeight: '90%',
        boxShadow: '0 0 25px rgba(0,0,0,0.5)',
    },
};

export default FeedPage;