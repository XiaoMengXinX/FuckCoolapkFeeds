import { useEffect, useState, useRef } from 'react';

export const LazyImage = ({ src, alt, style, onClick, enableLongImageCollapse = false }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [isLongImage, setIsLongImage] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [dimensionsKnown, setDimensionsKnown] = useState(false);
    const [imageDisplayWidth, setImageDisplayWidth] = useState('100%');
    const imageRef = useRef(null);
    const containerRef = useRef(null);

    // 长图阈值：高度/宽度 > 3
    const LONG_IMAGE_RATIO = 3;
    const COLLAPSED_HEIGHT = 400; // 折叠时显示的高度

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

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, [src]);

    // 使用轮询来尽早检测图片尺寸
    useEffect(() => {
        if (!imageRef.current || !imageSrc) return;

        const img = imageRef.current;
        let pollInterval;

        const checkDimensions = () => {
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                const width = img.naturalWidth;
                const height = img.naturalHeight;
                
                setImageSize({ width, height });
                setDimensionsKnown(true);
                
                // 判断是否为长图（仅在启用长图折叠时）
                if (enableLongImageCollapse && height / width > LONG_IMAGE_RATIO) {
                    setIsLongImage(true);
                    
                    // 立即获取图片显示宽度
                    if (img.offsetWidth > 0) {
                        setImageDisplayWidth(`${img.offsetWidth}px`);
                    }
                }
                
                // 清除轮询
                if (pollInterval) {
                    clearInterval(pollInterval);
                }
                
                return true;
            }
            return false;
        };

        // 立即检查（可能图片已经从缓存加载）
        if (!checkDimensions()) {
            // 如果立即检查失败，开始轮询（每10ms检查一次）
            pollInterval = setInterval(() => {
                checkDimensions();
            }, 10);
        }

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [imageSrc, enableLongImageCollapse]);

    const handleImageLoad = () => {
        setLoaded(true);
        
        // 确保在图片加载完成后立即检查并设置尺寸和长图状态
        if (imageRef.current) {
            const img = imageRef.current;
            const width = img.naturalWidth;
            const height = img.naturalHeight;

            if (width > 0 && height > 0) {
                setImageSize({ width, height });
                setDimensionsKnown(true);

                if (enableLongImageCollapse && height / width > LONG_IMAGE_RATIO) {
                    setIsLongImage(true);
                }
                setImageDisplayWidth(`${img.offsetWidth}px`);
            }
        }
    };

    const handleToggleExpand = (e) => {
        e.stopPropagation(); // 防止触发图片点击事件
        setIsExpanded(!isExpanded);
    };

    const handleImageClick = (e) => {
        // 点击图片直接打开灯箱
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: isLongImage && !isExpanded ? `${COLLAPSED_HEIGHT}px` : '100%',
                maxHeight: isLongImage && !isExpanded ? `${COLLAPSED_HEIGHT}px` : 'none',
            }}
        >
            {!loaded && imageSrc && (
                <div
                    className="lazy-image-loading"
                    style={{
                        height: isLongImage && !isExpanded ? `${COLLAPSED_HEIGHT}px` : 'auto',
                    }}
                >
                    <div className="lazy-image-spinner"></div>
                </div>
            )}
            <div
                style={{
                    position: 'relative',
                    maxHeight: isLongImage && !isExpanded ? `${COLLAPSED_HEIGHT}px` : 'none',
                    overflow: 'hidden',
                }}
            >
                <img
                    ref={imageRef}
                    src={imageSrc}
                    alt={alt}
                    style={{
                        ...style,
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.3s',
                        display: 'block',
                    }}
                    onClick={handleImageClick}
                    onLoad={handleImageLoad}
                />
                {isLongImage && !isExpanded && dimensionsKnown && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: loaded ? imageDisplayWidth : '100%',
                            height: '50px',
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.8) 100%)',
                            pointerEvents: 'none',
                            transition: 'width 0.3s ease',
                        }}
                    />
                )}
                {isLongImage && dimensionsKnown && (
                    <button
                        onClick={handleToggleExpand}
                        style={{
                            position: 'absolute',
                            bottom: '15px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '8px 20px',
                            backgroundColor: 'rgba(40, 167, 69, 0.9)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            transition: 'all 0.3s ease',
                            zIndex: 10,
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        {isExpanded ? '收起长图 ▲' : '展开长图 ▼'}
                    </button>
                )}
            </div>
        </div>
    );
};