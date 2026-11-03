import { useEffect, useState, useRef } from 'react';

const LONG_IMAGE_RATIO = 3;
const COLLAPSED_HEIGHT = 400;

// `size` is the intrinsic { width, height } when known; it reserves layout space before the image loads.
export const LazyImage = ({ src, alt, style, onClick, size, enableLongImageCollapse = false, compact = false }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isLongImage, setIsLongImage] = useState(
        () => Boolean(enableLongImageCollapse && size && size.height / size.width > LONG_IMAGE_RATIO)
    );
    const [isExpanded, setIsExpanded] = useState(false);
    const [imageDisplayWidth, setImageDisplayWidth] = useState('100%');
    const imageRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some(entry => entry.isIntersecting)) {
                    setImageSrc(src);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        return () => observer.disconnect();
    }, [src]);

    useEffect(() => {
        if (!isLongImage || !imageRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target.offsetWidth > 0) {
                    setImageDisplayWidth(`${entry.target.offsetWidth}px`);
                }
            }
        });

        resizeObserver.observe(imageRef.current);
        return () => resizeObserver.disconnect();
    }, [isLongImage, loaded, retryCount]);

    const handleImageLoad = (e) => {
        setLoaded(true);
        setError(false);
        const { naturalWidth, naturalHeight } = e.target;
        if (enableLongImageCollapse && !size && naturalWidth && naturalHeight / naturalWidth > LONG_IMAGE_RATIO) {
            setIsLongImage(true);
        }
    };

    // Width is capped so that the caller's maxHeight is met through the aspect ratio instead of distorting the image.
    const sizeStyle = size ? {
        aspectRatio: `${size.width} / ${size.height}`,
        height: 'auto',
        width: `min(100%, ${size.width}px${!isLongImage && style?.maxHeight ? `, calc(${style.maxHeight} * ${size.width / size.height})` : ''})`,
    } : null;

    const handleImageError = () => {
        setLoaded(false);
        setError(true);
    };

    const handleRetry = (e) => {
        e.stopPropagation();
        setError(false);
        setLoaded(false);
        setRetryCount(prev => prev + 1);
    };

    const handleToggleExpand = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleImageClick = (e) => {
        if (error) {
            handleRetry(e);
            return;
        }
        onClick?.(e);
    };

    if (compact) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: style?.width,
                    height: style?.height,
                    position: 'relative',
                    display: 'inline-block',
                }}
            >
                {!loaded && imageSrc && !error && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--image-bg)',
                            borderRadius: style?.borderRadius || '4px',
                        }}
                        className="compact-loading"
                    >
                        <div className="lazy-image-spinner" style={{ width: '20px', height: '20px' }}></div>
                    </div>
                )}
                {error ? (
                    <div
                        onClick={handleRetry}
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: 'var(--image-border)',
                            borderRadius: style?.borderRadius || '4px',
                            backgroundColor: 'var(--image-bg)',
                        }}
                        className="preview-image-error"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--icon-color)' }}>
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        </svg>
                    </div>
                ) : (
                    <img
                        key={retryCount}
                        ref={imageRef}
                        src={imageSrc}
                        alt={alt}
                        style={{
                            ...style,
                            opacity: loaded ? 1 : 0,
                            transition: 'opacity 0.3s',
                        }}
                        onClick={handleImageClick}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                    />
                )}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: isLongImage && !isExpanded ? `${COLLAPSED_HEIGHT}px` : '100%',
                maxHeight: isLongImage && !isExpanded ? `${COLLAPSED_HEIGHT}px` : 'none',
                minHeight: isLongImage && !isExpanded ? 'auto' : (style?.height || '50px'),
                borderRadius: style?.borderRadius,
                overflow: style?.borderRadius ? 'hidden' : 'visible'
            }}
        >
            {!loaded && imageSrc && !error && (
                <div
                    className="lazy-image-loading"
                    style={{
                        height: isLongImage && !isExpanded ? `${COLLAPSED_HEIGHT}px` : (style?.height || 'auto'),
                        borderRadius: style?.borderRadius
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
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: isLongImage && !isExpanded ? 'flex-start' : 'center',
                }}
            >
                <img
                    key={retryCount}
                    ref={imageRef}
                    src={imageSrc}
                    alt={alt}
                    style={{
                        ...style,
                        ...sizeStyle,
                        ...(isLongImage ? { maxHeight: 'none' } : {}),
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.3s',
                        display: error ? 'none' : 'block',
                    }}
                    onClick={handleImageClick}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />
                {error && (
                    <div
                        onClick={handleRetry}
                        style={{
                            width: '100%',
                            minHeight: '200px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--image-bg)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                        }}
                        className="image-error-container"
                    >
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--icon-color)' }}>
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        </svg>
                    </div>
                )}
                {isLongImage && !isExpanded && (
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
                {isLongImage && (
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