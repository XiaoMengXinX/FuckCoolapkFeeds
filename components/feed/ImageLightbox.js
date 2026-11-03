import { useEffect, useState, useRef } from 'react';
import { styles } from '../../styles/feedStyles';

const zoomButtonStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

export const ImageLightbox = ({ images, currentIndex, onClose, onImageChange }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);
    const [translateX, setTranslateX] = useState(-(currentIndex + 1) * 100);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isPinching, setIsPinching] = useState(false);
    const [scale, setScale] = useState(1);
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [isWheelScrolling, setIsWheelScrolling] = useState(false);
    const [actualImageSize, setActualImageSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef(null);
    const imageRefs = useRef({});
    const lastWheelTimeRef = useRef(0);
    const initialPinchDistanceRef = useRef(0);
    const lastPinchScaleRef = useRef(1);
    const initialPinchCenterRef = useRef({ x: 0, y: 0 });
    const initialImagePositionRef = useRef({ x: 0, y: 0 });
    const wheelRAFRef = useRef(null);
    const wheelScrollTimeoutRef = useRef(null);
    const lastTapTimeRef = useRef(0);
    const lastDragTimeRef = useRef(0);
    const lastTapPosRef = useRef({ x: 0, y: 0 });

    const [imageErrors, setImageErrors] = useState({});
    const [retryCounts, setRetryCounts] = useState({});
    const [finishedLoadingIndices, setFinishedLoadingIndices] = useState(new Set());

    // The track has a clone of the last image in front and of the first image at the end,
    // so wrapping around can animate before snapping back to the real slide.
    const infiniteImages = [images[images.length - 1], ...images, images[0]];

    const prevIndex = currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
    const nextIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
    const shouldLoadIndex = (index) => index === currentImageIndex || index === prevIndex || index === nextIndex;

    useEffect(() => {
        setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

        const scrollY = window.scrollY;
        const style = document.createElement('style');
        style.id = 'lightbox-scroll-lock';
        style.textContent = `
            body {
                overflow: hidden !important;
                position: fixed !important;
                top: -${scrollY}px !important;
                left: 0 !important;
                right: 0 !important;
            }
        `;
        document.head.appendChild(style);

        return () => {
            style.remove();
            window.scrollTo(0, scrollY);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        const handleWheel = (e) => {
            if (isMobile) return;
            e.preventDefault();

            if (scale > 1) {
                setIsWheelScrolling(true);
                cancelAnimationFrame(wheelRAFRef.current);
                clearTimeout(wheelScrollTimeoutRef.current);

                wheelRAFRef.current = requestAnimationFrame(() => {
                    setImagePosition(constrainPosition(imagePosition.x - e.deltaX, imagePosition.y - e.deltaY, scale));
                });

                wheelScrollTimeoutRef.current = setTimeout(() => {
                    setIsWheelScrolling(false);
                }, 150);
                return;
            }

            const now = Date.now();
            if (now - lastWheelTimeRef.current < 1000) return;

            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (delta === 0) return;

            lastWheelTimeRef.current = now;
            if (delta > 0) {
                goToNext();
            } else {
                goToPrevious();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('wheel', handleWheel);
        };
    }, [currentImageIndex, isMobile, scale, imagePosition]);

    const resetZoom = () => {
        setScale(1);
        setImagePosition({ x: 0, y: 0 });
    };

    const getCurrentImageSize = () => {
        const currentImage = imageRefs.current[currentImageIndex + 1];
        const width = currentImage?.offsetWidth || actualImageSize.width;
        const height = currentImage?.offsetHeight || actualImageSize.height;
        if (width && height) return { width, height };
        return { width: window.innerWidth * 0.95, height: window.innerHeight * 0.8 };
    };

    const constrainPosition = (x, y, currentScale) => {
        if (currentScale <= 1) {
            return { x: 0, y: 0 };
        }

        const { width, height } = getCurrentImageSize();
        const maxOffsetX = Math.max(0, (width * currentScale - window.innerWidth) / 2);
        const maxOffsetY = Math.max(0, (height * currentScale - window.innerHeight) / 2);

        return {
            x: Math.max(-maxOffsetX, Math.min(maxOffsetX, x)),
            y: Math.max(-maxOffsetY, Math.min(maxOffsetY, y)),
        };
    };

    const goToPrevious = () => {
        resetZoom();
        setDragOffset(0);
        setIsTransitioning(true);
        setTranslateX(-currentImageIndex * 100);

        setTimeout(() => {
            setCurrentImageIndex(prevIndex);
            onImageChange(prevIndex);
            setIsTransitioning(false);
            if (currentImageIndex === 0) {
                setTranslateX(-images.length * 100);
            }
        }, 300);
    };

    const goToNext = () => {
        resetZoom();
        setDragOffset(0);
        setIsTransitioning(true);
        setTranslateX(-(currentImageIndex + 2) * 100);

        setTimeout(() => {
            setCurrentImageIndex(nextIndex);
            onImageChange(nextIndex);
            setIsTransitioning(false);
            if (currentImageIndex === images.length - 1) {
                setTranslateX(-100);
            }
        }, 300);
    };

    const zoomTo = (newScale) => {
        setScale(newScale);
        setImagePosition(constrainPosition(imagePosition.x, imagePosition.y, newScale));
    };

    const handleZoomIn = () => zoomTo(Math.min(scale + 1, 15));
    const handleZoomOut = () => zoomTo(Math.max(scale - 1, 1));

    const getCoords = (e) => {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e.changedTouches && e.changedTouches.length > 0) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const getContainerWidth = () => containerRef.current?.offsetWidth || window.innerWidth;

    const startImagePan = (x, y) => {
        setIsDraggingImage(true);
        setDragStartPos({ x: x - imagePosition.x, y: y - imagePosition.y });
    };

    const startSwipe = (x) => {
        setIsDragging(true);
        setStartX(x);
        setDragOffset(0);
        setIsTransitioning(false);
    };

    const updateSwipe = (x) => {
        setDragOffset(((x - startX) / getContainerWidth()) * 100);
    };

    const finishSwipe = () => {
        setIsDragging(false);

        const containerWidth = getContainerWidth();
        const dragDistance = (dragOffset / 100) * containerWidth;

        // The click that follows a drag must not close the lightbox.
        if (Math.abs(dragDistance) > 5) {
            lastDragTimeRef.current = Date.now();
        }

        if (Math.abs(dragDistance) > containerWidth * 0.15) {
            if (dragDistance < 0) {
                goToNext();
            } else {
                goToPrevious();
            }
        } else if (dragOffset !== 0) {
            setIsTransitioning(true);
            setDragOffset(0);
            setTimeout(() => {
                setIsTransitioning(false);
            }, 300);
        }
    };

    const handleMouseDown = (e) => {
        const { x, y } = getCoords(e);

        if (e.target.closest('img') && scale > 1) {
            startImagePan(x, y);
            e.preventDefault();
            return;
        }

        startSwipe(x);
        if (!isMobile && e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    };

    const handleMouseMove = (e) => {
        const { x, y } = getCoords(e);

        if (isDraggingImage && scale > 1) {
            setImagePosition(constrainPosition(x - dragStartPos.x, y - dragStartPos.y, scale));
        } else if (isDragging) {
            updateSwipe(x);
        }
    };

    const handleMouseUp = () => {
        if (isDraggingImage) {
            setIsDraggingImage(false);
        } else if (isDragging) {
            finishSwipe();
        }
    };

    const handleDoubleTap = (tapX, tapY) => {
        if (scale > 1) {
            resetZoom();
            return;
        }
        const newScale = 2;
        const tapOffsetX = tapX - window.innerWidth / 2;
        const tapOffsetY = tapY - window.innerHeight / 2;
        setScale(newScale);
        setImagePosition(constrainPosition(tapOffsetX * (1 - newScale), tapOffsetY * (1 - newScale), newScale));
    };

    const handleTouchStart = (e) => {
        if (!isMobile) return;

        if (e.touches.length === 1 && !isPinching) {
            if (e.target.closest('button')) return;

            const now = Date.now();
            const tapX = e.touches[0].clientX;
            const tapY = e.touches[0].clientY;
            const isDoubleTap = now - lastTapTimeRef.current < 300 &&
                Math.hypot(tapX - lastTapPosRef.current.x, tapY - lastTapPosRef.current.y) < 50;

            if (isDoubleTap) {
                e.preventDefault();
                handleDoubleTap(tapX, tapY);
                lastTapTimeRef.current = 0;
                return;
            }

            lastTapTimeRef.current = now;
            lastTapPosRef.current = { x: tapX, y: tapY };

            if (e.target.closest('img') && scale > 1) {
                startImagePan(tapX, tapY);
            } else {
                startSwipe(tapX);
            }
            return;
        }

        if (e.touches.length === 2) {
            setIsPinching(true);
            setIsDragging(false);

            const [touch1, touch2] = e.touches;
            initialPinchDistanceRef.current = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            lastPinchScaleRef.current = scale;
            initialImagePositionRef.current = { ...imagePosition };
            initialPinchCenterRef.current = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2,
            };
        }
    };

    const handleTouchMove = (e) => {
        if (!isMobile) return;

        if (e.touches.length === 2) {
            setIsPinching(true);
            setIsDragging(false);

            const [touch1, touch2] = e.touches;
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;

            const startScale = lastPinchScaleRef.current;
            const newScale = Math.max(1, Math.min(15, startScale * distance / initialPinchDistanceRef.current));

            const initialOffsetX = initialPinchCenterRef.current.x - window.innerWidth / 2;
            const initialOffsetY = initialPinchCenterRef.current.y - window.innerHeight / 2;
            const pointInImageX = (initialOffsetX - initialImagePositionRef.current.x) / startScale;
            const pointInImageY = (initialOffsetY - initialImagePositionRef.current.y) / startScale;
            const newX = initialOffsetX - pointInImageX * newScale + (centerX - initialPinchCenterRef.current.x);
            const newY = initialOffsetY - pointInImageY * newScale + (centerY - initialPinchCenterRef.current.y);

            setScale(newScale);
            setImagePosition(constrainPosition(newX, newY, newScale));
            return;
        }

        if (e.touches.length !== 1) return;

        if (isDraggingImage && scale > 1) {
            setImagePosition(constrainPosition(
                e.touches[0].clientX - dragStartPos.x,
                e.touches[0].clientY - dragStartPos.y,
                scale
            ));
        } else if (isDragging && !isPinching) {
            updateSwipe(e.touches[0].clientX);
        }
    };

    const handleTouchEnd = (e) => {
        if (!isMobile) return;

        if (e.touches.length > 0) {
            if (isPinching && e.touches.length === 1) {
                setIsPinching(false);
                if (scale > 1) {
                    startImagePan(e.touches[0].clientX, e.touches[0].clientY);
                } else {
                    resetZoom();
                }
            }
            return;
        }

        if (isPinching) {
            setIsPinching(false);
            setIsDragging(false);
            setDragOffset(0);
            if (scale <= 1) {
                resetZoom();
            }
            return;
        }

        if (isDraggingImage) {
            setIsDraggingImage(false);
            return;
        }

        finishSwipe();
    };

    const handleBackgroundClick = (e) => {
        if (Date.now() - lastDragTimeRef.current < 100) return;
        if (e.target.closest('img') || e.target.closest('button') || e.target.closest('svg')) return;

        if (e.target.tagName === 'DIV' || e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            style={{
                ...styles.lightbox,
                touchAction: 'pan-x pan-y',
            }}
            onClick={handleBackgroundClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <button
                style={{...styles.lightboxCloseButton, top: '20px', right: '20px'}}
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            >
                ×
            </button>

            {images.length > 1 && (
                <>
                    <button
                        style={{...styles.lightboxNavButton, left: '20px'}}
                        onClick={(e) => {
                            e.stopPropagation();
                            goToPrevious();
                        }}
                    >
                        ‹
                    </button>
                    <button
                        style={{...styles.lightboxNavButton, right: '20px'}}
                        onClick={(e) => {
                            e.stopPropagation();
                            goToNext();
                        }}
                    >
                        ›
                    </button>
                </>
            )}

            <div
                ref={containerRef}
                style={{
                    ...styles.lightboxSliderContainer,
                    transform: `translateX(${translateX + dragOffset}%)`,
                    transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
                }}
            >
                {infiniteImages.map((img, index) => {
                    const isCurrentImage = index === currentImageIndex + 1;
                    const actualIndex = (index - 1 + images.length) % images.length;
                    const shouldLoad = shouldLoadIndex(actualIndex);
                    const hasError = imageErrors[actualIndex];
                    const isFinished = finishedLoadingIndices.has(actualIndex);
                    const retryCount = retryCounts[actualIndex] || 0;

                    return (
                        <div
                            key={index}
                            style={styles.lightboxSlide}
                            onClick={(e) => {
                                handleBackgroundClick(e);
                                e.stopPropagation();
                            }}
                        >
                            {shouldLoad ? (
                                hasError ? (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setImageErrors(prev => ({
                                                ...prev,
                                                [actualIndex]: false
                                            }));
                                            setFinishedLoadingIndices(prev => {
                                                const next = new Set(prev);
                                                next.delete(actualIndex);
                                                return next;
                                            });
                                            setRetryCounts(prev => ({
                                                ...prev,
                                                [actualIndex]: (prev[actualIndex] || 0) + 1
                                            }));
                                        }}
                                        style={{
                                            ...styles.lightboxImage,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--icon-color)' }}>
                                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                                        </svg>
                                    </div>
                                ) : (
                                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {!isFinished && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                zIndex: 1
                                            }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '3px solid rgba(255,255,255,0.3)',
                                                    borderTop: '3px solid white',
                                                    borderRadius: '50%',
                                                    animation: 'spin 1s linear infinite',
                                                }} />
                                            </div>
                                        )}
                                        <img
                                            key={retryCount}
                                            ref={(el) => {
                                                if (el) {
                                                    imageRefs.current[index] = el;
                                                }
                                            }}
                                            src={img}
                                            alt={`Image ${index}`}
                                            style={{
                                                ...styles.lightboxImage,
                                                display: hasError ? 'none' : 'block',
                                                opacity: isFinished ? 1 : 0,
                                                transform: isCurrentImage
                                                    ? `scale(${scale}) translate(${imagePosition.x / scale}px, ${imagePosition.y / scale}px)`
                                                    : 'scale(1)',
                                                transition: isPinching || isDraggingImage || isWheelScrolling ? 'none' : (isFinished ? 'transform 0.3s ease, opacity 0.3s ease' : 'none'),
                                                cursor: scale > 1 ? 'move' : 'pointer',
                                            }}
                                            onLoad={(e) => {
                                                setFinishedLoadingIndices(prev => {
                                                    const next = new Set(prev);
                                                    next.add(actualIndex);
                                                    return next;
                                                });
                                                if (isCurrentImage && e.target.offsetWidth > 0) {
                                                    const newWidth = e.target.offsetWidth;
                                                    const newHeight = e.target.offsetHeight;
                                                    if (newWidth !== actualImageSize.width || newHeight !== actualImageSize.height) {
                                                        setActualImageSize({
                                                            width: newWidth,
                                                            height: newHeight
                                                        });
                                                    }
                                                }
                                            }}
                                            onError={() => {
                                                setFinishedLoadingIndices(prev => {
                                                    const next = new Set(prev);
                                                    next.add(actualIndex);
                                                    return next;
                                                });
                                                setImageErrors(prev => ({
                                                    ...prev,
                                                    [actualIndex]: true
                                                }));
                                            }}
                                        />
                                    </div>
                                )
                            ) : (
                                <div style={{
                                    ...styles.lightboxImage,
                                    backgroundColor: '#1a1a1a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        border: '3px solid rgba(255,255,255,0.3)',
                                        borderTop: '3px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                    }} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{
                position: 'absolute',
                bottom: '70px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '10px',
                zIndex: 2001,
            }}>
                <button
                    onClick={handleZoomOut}
                    style={zoomButtonStyle}
                >
                    −
                </button>
                <button
                    onClick={resetZoom}
                    style={{ ...zoomButtonStyle, borderRadius: '20px', width: 'auto', padding: '0 15px', fontSize: '14px' }}
                >
                    {Math.round(scale * 100)}%
                </button>
                <button
                    onClick={handleZoomIn}
                    style={zoomButtonStyle}
                >
                    +
                </button>
            </div>

            {images.length > 1 && (
                <div style={styles.lightboxIndicator}>
                    {currentImageIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
};