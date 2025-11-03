import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import MarkdownIt from 'markdown-it';
import markdownItMultimdTable from 'markdown-it-multimd-table';
import markdownItTaskLists from 'markdown-it-task-lists';
import hljs from 'highlight.js';

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
            {images.length > 1 && (
                <>
                    <button onClick={() => scroll(-1)} style={{...styles.carouselButton, left: '10px'}}>{'<'}</button>
                    <button onClick={() => scroll(1)} style={{...styles.carouselButton, right: '10px'}}>{'>'}</button>
                </>
            )}
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
        </div>
    );
};

const generateOgDescription = (message) => {
    if (!message) return '';
    let cleanMessage = message
        .replace(/<!--break-->/g, '')
        .replace(/<[^>]+>/g, '')
        .trim();

    if (cleanMessage.length > 200) {
        cleanMessage = cleanMessage.substring(0, 200) + '...';
    }
    return cleanMessage;
};

const renderOgTags = (feed, proxyImage) => {
    if (!feed) return null;
    
    return (
        <>
            <meta property="og:title" content={feed.feedType === 'feedArticle' ? feed.message_title : feed.title} />
            <meta property="og:description" content={generateOgDescription(feed.message)} />
            <meta name="twitter:card" content="summary_large_image" />
            {feed.picArr && feed.picArr.length > 0 && (
                <>
                    <meta property="og:image" content={proxyImage(feed.picArr[0])} />
                    <meta property="twitter:image" content={proxyImage(feed.picArr[0])} />
                </>
            )}
        </>
    );
};

const FeedPage = ({ feed, error, isTelegram, formattedDate: serverFormattedDate }) => {
    const router = useRouter();
    const { id } = router.query;
    const [isBarVisible, setIsBarVisible] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isPC, setIsPC] = useState(false);
    const [formattedDate, setFormattedDate] = useState(serverFormattedDate || '');
    const [isMarkdownEnabled, setIsMarkdownEnabled] = useState(false);
    
    // Function to detect if content contains Markdown syntax
    const detectMarkdown = (content) => {
        if (!content) return false;
        
        // Decode HTML entities first
        const decodeEntities = (text) => {
            if (typeof window === 'undefined') {
                return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
            }
            const textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            return textarea.value;
        };
        
        const decoded = decodeEntities(content);
        
        // Check for common Markdown patterns
        const markdownPatterns = [
            /\*\*[^*]+\*\*/,            // Bold: **text**
            /__[^_]+__/,                // Bold: __text__
            /```[\s\S]*?```/,           // Code blocks: ```
            /`[^`]+`/,                  // Inline code: `code`
            /^\|.+\|$/m,                // Tables: |col1|col2|
            /^---+$/m,                  // Horizontal rules: ---
            /~~[^~]+~~/,                // Strikethrough: ~~text~~
        ];
        
        // Return true if any pattern matches
        return markdownPatterns.some(pattern => pattern.test(decoded));
    };


    const convertCoolapkFeedLinks = (url) => {
        const feedMatch = url.match(/(?:https?:\/\/)?(?:www\.)?coolapk\.com\/feed\/(\d+)/);
        if (feedMatch) {
            const feedId = feedMatch[1];
            return `https://coolapk1s.com/feed/${feedId}`;
        }
        return url;
    };

    const processHtmlLinks = (html) => {
        return html
            .replace(/<a class="feed-link-url".*?href="([^"]*)".*?>.*?<\/a>/g, (match, url) => {
                const convertedUrl = convertCoolapkFeedLinks(url);
                return `<a href="${convertedUrl}" target="_blank" rel="noopener noreferrer">${convertedUrl}</a>`;
            })
            .replace(/<a class="feed-link-tag".*?href="([^"]*)".*?>#(.*?)#<\/a>/g, '<a href="https://www.coolapk.com$1" target="_blank" rel="noopener noreferrer">#$2#</a>')
            .replace(/<a class="feed-link-uname".*?href="([^"]*)".*?>(.*?)<\/a>/g, '<a href="https://www.coolapk.com$1" target="_blank" rel="noopener noreferrer">$2</a>');
    };

    const cleanCodeContent = (str) => {
        return str
            .replace(/<!--break-->/g, '')
            .replace(/<a class="feed-link-url".*?>(.*?)<\/a>/g, '$1')
            .replace(/<a class="feed-link-tag".*?>(.*?)<\/a>/g, '$1')
            .replace(/<a class="feed-link-uname".*?>(.*?)<\/a>/g, '$1');
    };

    // Create MarkdownIt instance with custom preprocessing
    const md = (() => {
        const mdInstance = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true,
            highlight: function (str, lang) {
                const cleanedStr = cleanCodeContent(str);
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return '<pre><code class="hljs">' +
                            hljs.highlight(cleanedStr, { language: lang, ignoreIllegals: true }).value +
                            '</code></pre>';
                    } catch (__) { }
                }
                return '<pre><code class="hljs">' + mdInstance.utils.escapeHtml(cleanedStr) + '</code></pre>';
            }
        })
        .use(markdownItMultimdTable, {
            multiline: true,
            rowspan: true,
            headerless: true,
            multibody: true,
        })
        .use(markdownItTaskLists, {
            enabled: true,
            label: true,
            labelAfter: true,
        });

        // Also clean links from inline code
        const defaultCodeInline = mdInstance.renderer.rules.code_inline;
        mdInstance.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
            const token = tokens[idx];
            token.content = cleanCodeContent(token.content);
            return defaultCodeInline(tokens, idx, options, env, self);
        };

        // Override the render method to preprocess Coolapk links (but protect code blocks)
        const originalRender = mdInstance.render.bind(mdInstance);
        mdInstance.render = function(src, env) {
            // Store code blocks temporarily
            const codeBlocks = [];
            const inlineCodeBlocks = [];
            
            // Replace code blocks with placeholders
            let processedSrc = src.replace(/```[\s\S]*?```/g, (match) => {
                const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`;
                codeBlocks.push(match);
                return placeholder;
            });
            
            // Replace inline code with placeholders
            processedSrc = processedSrc.replace(/`[^`]+`/g, (match) => {
                const placeholder = `___INLINE_CODE_${inlineCodeBlocks.length}___`;
                inlineCodeBlocks.push(match);
                return placeholder;
            });
            
            // Handle nested Markdown links with feed-link-url inside
            // Pattern: [text](<a class="feed-link-url" href="url">...</a>)
            processedSrc = processedSrc.replace(
                /\[([^\]]+)\]\(<a class="feed-link-url"[^>]*?href="([^"]*)"[^>]*?>.*?<\/a>\)/g,
                '[$1]($2)'
            );
            
            // Convert standalone Coolapk HTML links to Markdown links
            processedSrc = processedSrc
                .replace(/<a class="feed-link-url"[^>]*?href="([^"]*)"[^>]*?>.*?<\/a>/g, (match, url) => {
                    return convertCoolapkFeedLinks(url);
                })
                .replace(/<a class="feed-link-tag"[^>]*?href="([^"]*)"[^>]*?>#(.*?)#<\/a>/g, '[#$2#](https://www.coolapk.com$1)')
                .replace(/<a class="feed-link-uname"[^>]*?href="([^"]*)"[^>]*?>(.*?)<\/a>/g, '[$2](https://www.coolapk.com$1)');
            
            // Restore code blocks
            processedSrc = processedSrc.replace(/___CODE_BLOCK_(\d+)___/g, (match, index) => {
                return codeBlocks[parseInt(index)];
            });
            
            // Restore inline code
            processedSrc = processedSrc.replace(/___INLINE_CODE_(\d+)___/g, (match, index) => {
                return inlineCodeBlocks[parseInt(index)];
            });
            
            return originalRender(processedSrc, env);
        };

        return mdInstance;
    })();

    useEffect(() => {
        // 清除URL参数
        if (typeof window !== "undefined" && window.location.search) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }

        const checkIsPC = () => {
            if (typeof window !== "undefined") {
                setIsPC(window.matchMedia("(min-width: 768px)").matches);
            }
        };
        checkIsPC();
        window.addEventListener('resize', checkIsPC);

        if (feed) {
            // 只在客户端且没有服务端日期时才格式化（使用客户端本地时区）
            if (!serverFormattedDate) {
                setFormattedDate(new Date(feed.dateline * 1000).toLocaleString());
            }
            
            // Auto-detect Markdown content
            let contentToCheck = '';
            if (feed.feedType === 'feedArticle' && feed.message_raw_output) {
                try {
                    const messageParts = JSON.parse(feed.message_raw_output);
                    contentToCheck = messageParts
                        .filter(part => part.type === 'text')
                        .map(part => part.message)
                        .join('\n');
                } catch (e) {
                    contentToCheck = feed.message || '';
                }
            } else {
                contentToCheck = feed.message || '';
            }
            
            if (detectMarkdown(contentToCheck)) {
                setIsMarkdownEnabled(true);
            }
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
        } else if (feed.feedType === 'feed' || feed.feedType === 'comment') {
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

                    const decodeEntities = (text) => {
                        if (typeof window === 'undefined') {
                            // Basic decoding for server-side rendering
                            return text.replace(/</g, '<').replace(/>/g, '>').replace(/&/g, '&').replace(/"/g, '"');
                        }
                        const textarea = document.createElement('textarea');
                        textarea.innerHTML = text;
                        return textarea.value;
                    };

                    return isMarkdownEnabled ? (
                        <div
                            className="markdown-content"
                            dangerouslySetInnerHTML={{ __html: md.render(decodeEntities(formattedMessage).replace(/\n/g, '  \n')) }}
                        />
                    ) : (
                        <div
                            key={index}
                            style={styles.textBlock}
                            dangerouslySetInnerHTML={{ __html: processHtmlLinks(htmlMessage) }}
                        />
                    );
                } else if (part.type === 'image') {
                    const imageUrl = proxyImage(part.url);
                    // Telegram 使用静态图片，其他使用懒加载
                    if (isTelegram) {
                        return (
                            <div key={index} style={styles.imageContainer}>
                                <img
                                    src={imageUrl}
                                    alt={part.description || `feed-image-${index}`}
                                    style={{...(isPC ? {...styles.image, maxWidth: '80%'} : styles.image)}}
                                />
                                {part.description && <div style={styles.imageDescription}>{part.description}</div>}
                            </div>
                        );
                    }
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
            return <div style={{whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{ __html: fallbackHtml }} />;
        }
    };

    const renderStandardFeed = () => {
        let htmlMessage = feed.message;
        
        const decodeEntities = (text) => {
            if (typeof window === 'undefined') {
                return text.replace(/</g, '<').replace(/>/g, '>').replace(/&/g, '&').replace(/"/g, '"');
            }
            const textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            return textarea.value;
        };

        return (
            <div>
                {isMarkdownEnabled ? (
                    <div
                        className="markdown-content"
                        dangerouslySetInnerHTML={{ __html: md.render(decodeEntities(htmlMessage).replace(/\n/g, '  \n'))}}
                    />
                ) : (
                    <div style={styles.textBlock} dangerouslySetInnerHTML={{ __html: processHtmlLinks(htmlMessage.replace(/\n/g, '<br />')) }} />
                )}
                {feed.picArr && feed.picArr.length > 0 && (
                    isTelegram ? (
                        // Telegram 使用简单的图片列表
                        <div>
                            {feed.picArr.map((img, index) => (
                                <div key={index} style={styles.imageContainer}>
                                    <img
                                        src={proxyImage(img)}
                                        alt={`image-${index}`}
                                        style={styles.image}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ImageCarousel
                            images={feed.picArr.map(proxyImage)}
                            onImageClick={setSelectedImage}
                        />
                    )
                )}
            </div>
        );
    };

    // Telegram Instant View 简化版 - 纯静态 HTML，无 JavaScript
    if (isTelegram) {
        if (error || !feed) {
            return (
                <div style={styles.telegramContainer}>
                    <Head>
                        <title>{error ? 'Error' : 'Not Found'}</title>
                    </Head>
                    <div style={styles.centered}>{error ? `Error: ${error}` : 'No feed data found.'}</div>
                </div>
            );
        }

        return (
            <div style={styles.telegramContainer}>
                <Head>
                    <title>{feed.feedType === 'feedArticle' ? feed.message_title : feed.title}</title>
                    {renderOgTags(feed, proxyImage)}
                </Head>
                <article>
                    <header style={styles.telegramHeader}>
                        <h1 style={styles.telegramTitle}>{feed.message_title || feed.title}</h1>
                        <div style={styles.telegramSourceLink}>
                            <a href={`https://www.coolapk1s.com/feed/${id}`} rel="noopener noreferrer" style={styles.telegramLink}>
                                查看原文
                            </a>
                        </div>
                        <div style={styles.telegramMeta}>
                            <span style={styles.telegramAuthor}>{feed.username}</span>
                            <span style={styles.telegramSeparator}>·</span>
                            <time style={styles.telegramDate}>{formattedDate}</time>
                        </div>
                    </header>
                    <div style={styles.telegramContent}>{renderFeedContent()}</div>
                </article>
            </div>
        );
    }

    // 标准版页面
    return (
        <div style={styles.container}>
            <Head>
                <title>{feed ? (feed.feedType === 'feedArticle' ? feed.message_title : feed.title) : (error ? 'Error' : 'Loading...')}</title>
                {!error && renderOgTags(feed, proxyImage)}
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
    const { res, params, req } = context;
    const { id } = params;

    // 检测是否为 Telegram User-Agent
    const userAgent = req.headers['user-agent'] || '';
    const isTelegram = userAgent.includes('Telegram');

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const apiUrl = `${protocol}://${host}/api/feed?id=${id}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // 为 Telegram 禁用缓存，其他情况正常缓存
        if (isTelegram) {
            res.setHeader(
                'Cache-Control',
                'no-cache, no-store, must-revalidate'
            );
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else if (data && data.data && Object.keys(data.data).length > 0) {
            res.setHeader(
                'Cache-Control',
                'public, s-maxage=604800, stale-while-revalidate=86400'
            );
        }

        // 在服务端预先格式化日期，避免hydration不匹配
        let formattedDate = '';
        if (isTelegram && data.data && data.data.dateline) {
            formattedDate = new Date(data.data.dateline * 1000).toLocaleString('zh-CN', {
                timeZone: 'Asia/Shanghai'
            });
        }

        return {
            props: {
                feed: data.data || null,
                error: null,
                isTelegram,
                formattedDate,
            },
        };
    } catch (error) {
        return {
            props: {
                feed: null,
                error: error.message,
                isTelegram,
                formattedDate: '',
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
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
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
        fontSize: '1.8em',
        fontWeight: 'bold',
        marginBottom: '10px',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
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
    controlsContainer: {
        display: 'flex',
        alignItems: 'center',
        position: 'absolute',
        right: 0,
    },
    switchLabel: {
        fontSize: '1em',
        marginRight: '10px',
    },
    // Telegram Instant View 样式
    telegramContainer: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        maxWidth: '680px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#fff',
        color: '#222',
        lineHeight: '1.6',
    },
    telegramHeader: {
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e5e5e5',
    },
    telegramTitle: {
        fontSize: '2em',
        fontWeight: 'bold',
        marginBottom: '15px',
        lineHeight: '1.3',
        color: '#000',
    },
    telegramSourceLink: {
        marginTop: '12px',
        marginBottom: '15px',
    },
    telegramMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.85em',
        color: '#707579',
    },
    telegramAuthor: {
        fontWeight: '500',
        color: '#707579',
    },
    telegramSeparator: {
        color: '#707579',
    },
    telegramDate: {
        color: '#707579',
    },
    telegramContent: {
        fontSize: '1.05em',
        lineHeight: '1.7',
        marginBottom: '30px',
    },
    telegramLink: {
        color: '#2481cc',
        textDecoration: 'none',
        fontSize: '0.9em',
        fontWeight: '500',
    },
};

export default FeedPage;