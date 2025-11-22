import { useEffect, useState, useRef } from 'react';
import { styles } from '../../styles/feedStyles';

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
    const pinchCenterRef = useRef({ x: 0, y: 0 });
    const initialPinchCenterRef = useRef({ x: 0, y: 0 });
    const initialImagePositionRef = useRef({ x: 0, y: 0 });
    const wheelRAFRef = useRef(null);
    const wheelScrollTimeoutRef = useRef(null);
    
    const [loadedImageIndices, setLoadedImageIndices] = useState(new Set());
    
    // 创建无限循环的图片数组：在前后各添加一张图片
    const infiniteImages = [images[images.length - 1], ...images, images[0]];

    // 计算需要加载的图片索引（当前 + 前后各一张）
    useEffect(() => {
        const indicesToLoad = new Set();
        
        // 当前图片
        indicesToLoad.add(currentImageIndex);
        
        // 前一张
        const prevIndex = currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
        indicesToLoad.add(prevIndex);
        
        // 后一张
        const nextIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
        indicesToLoad.add(nextIndex);
        
        setLoadedImageIndices(indicesToLoad);
    }, [currentImageIndex, images.length]);

    useEffect(() => {
        // 检测是否为移动设备
        const checkIsMobile = () => {
            setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
        };
        checkIsMobile();
        
        // 保存当前滚动位置
        const scrollY = window.scrollY;
        
        // 添加样式标签来处理滚动锁定
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
            // 移除样式标签并恢复滚动位置
            const styleElement = document.getElementById('lightbox-scroll-lock');
            if (styleElement) {
                styleElement.remove();
            }
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
            // 只在 PC 端启用滚轮切换
            if (isMobile) return;
            
            // 如果图片已缩放，用滚轮滚动图片位置
            if (scale > 1) {
                e.preventDefault();
                
                // 标记正在滚动，禁用 transition
                setIsWheelScrolling(true);
                
                // 取消之前的 RAF 和超时
                if (wheelRAFRef.current) {
                    cancelAnimationFrame(wheelRAFRef.current);
                }
                if (wheelScrollTimeoutRef.current) {
                    clearTimeout(wheelScrollTimeoutRef.current);
                }
                
                // 使用 RAF 来优化滚动性能
                wheelRAFRef.current = requestAnimationFrame(() => {
                    // 计算新的位置
                    const scrollSpeed = 1; // 滚动速度系数
                    const newY = imagePosition.y - e.deltaY * scrollSpeed;
                    const newX = imagePosition.x - e.deltaX * scrollSpeed;
                    
                    // 快速边界检查（不调用完整的 constrainPosition）
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    
                    // 使用缓存的图片尺寸
                    const imageWidth = actualImageSize.width || viewportWidth * 0.95;
                    const imageHeight = actualImageSize.height || viewportHeight * 0.8;
                    
                    const scaledWidth = imageWidth * scale;
                    const scaledHeight = imageHeight * scale;
                    
                    const maxOffsetX = Math.max(0, (scaledWidth - viewportWidth) / 2);
                    const maxOffsetY = Math.max(0, (scaledHeight - viewportHeight) / 2);
                    
                    const constrainedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
                    const constrainedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newY));
                    
                    setImagePosition({ x: constrainedX, y: constrainedY });
                });
                
                // 滚动停止后 150ms 恢复 transition（用于处理 Mac 惯性滚动）
                wheelScrollTimeoutRef.current = setTimeout(() => {
                    setIsWheelScrolling(false);
                }, 150);
                
                return;
            }
            
            e.preventDefault();
            
            const now = Date.now();
            const timeSinceLastSwitch = now - lastWheelTimeRef.current;
            
            // 冷却时间：切换图片后 1000ms 内忽略滚轮事件
            if (timeSinceLastSwitch < 1000) {
                return;
            }
            
            // 判断滚动方向：优先检测横向滚动（触摸板横向滑动）
            const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY);
            
            if (isHorizontalScroll) {
                // 横向滚动
                if (e.deltaX > 0) {
                    // 向右滚动，切换到下一张
                    lastWheelTimeRef.current = now;
                    goToNext();
                } else if (e.deltaX < 0) {
                    // 向左滚动，切换到上一张
                    lastWheelTimeRef.current = now;
                    goToPrevious();
                }
            } else {
                // 纵向滚动
                if (e.deltaY > 0) {
                    // 向下滚动，切换到下一张
                    lastWheelTimeRef.current = now;
                    goToNext();
                } else if (e.deltaY < 0) {
                    // 向上滚动，切换到上一张
                    lastWheelTimeRef.current = now;
                    goToPrevious();
                }
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

    // 限制图片位置，防止移出窗口
    const constrainPosition = (x, y, currentScale) => {
        if (currentScale <= 1) {
            return { x: 0, y: 0 };
        }

        // 获取窗口尺寸
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 获取当前图片的实际渲染尺寸
        const currentImageRef = imageRefs.current[currentImageIndex + 1];
        let imageWidth = actualImageSize.width;
        let imageHeight = actualImageSize.height;

        if (currentImageRef) {
            imageWidth = currentImageRef.offsetWidth || imageWidth;
            imageHeight = currentImageRef.offsetHeight || imageHeight;
        }

        // 如果没有获取到尺寸，使用默认值
        if (!imageWidth || !imageHeight) {
            imageWidth = viewportWidth * 0.95;
            imageHeight = viewportHeight * 0.8;
        }
        
        // 缩放后的图片尺寸
        const scaledWidth = imageWidth * currentScale;
        const scaledHeight = imageHeight * currentScale;

        // 计算允许的最大偏移量（图片边缘不能超出视口）
        const maxOffsetX = Math.max(0, (scaledWidth - viewportWidth) / 2);
        const maxOffsetY = Math.max(0, (scaledHeight - viewportHeight) / 2);

        // 限制位置
        const constrainedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, x));
        const constrainedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, y));

        return { x: constrainedX, y: constrainedY };
    };

    const goToPrevious = () => {
        resetZoom();
        setDragOffset(0);
        setIsTransitioning(true);
        const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
        
        // 移动到前一张（实际位置 + 1，因为有克隆图片）
        setTranslateX(-(currentImageIndex) * 100);
        
        setTimeout(() => {
            setCurrentImageIndex(newIndex);
            onImageChange(newIndex);
            
            // 如果到达了克隆的最后一张，立即跳转到真实的最后一张
            if (currentImageIndex === 0) {
                setIsTransitioning(false);
                setTranslateX(-(images.length) * 100);
            } else {
                setIsTransitioning(false);
            }
        }, 300);
    };

    const goToNext = () => {
        resetZoom();
        setDragOffset(0);
        setIsTransitioning(true);
        const newIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
        
        // 移动到下一张（实际位置 + 1，因为有克隆图片）
        setTranslateX(-(currentImageIndex + 2) * 100);
        
        setTimeout(() => {
            setCurrentImageIndex(newIndex);
            onImageChange(newIndex);
            
            // 如果到达了克隆的第一张，立即跳转到真实的第一张
            if (currentImageIndex === images.length - 1) {
                setIsTransitioning(false);
                setTranslateX(-1 * 100);
            } else {
                setIsTransitioning(false);
            }
        }, 300);
    };

    const handleZoomIn = () => {
        setScale(prev => {
            const newScale = Math.min(prev + 1, 15);
            // 缩放时重新约束位置
            const constrained = constrainPosition(imagePosition.x, imagePosition.y, newScale);
            setImagePosition(constrained);
            return newScale;
        });
    };

    const handleZoomOut = () => {
        if (scale <= 1) {
            setScale(1);
            setImagePosition({ x: 0, y: 0 });
        } else {
            setScale(prev => {
                const newScale = Math.max(prev - 1, 1);
                // 缩放时重新约束位置
                const constrained = constrainPosition(imagePosition.x, imagePosition.y, newScale);
                setImagePosition(constrained);
                return newScale;
            });
        }
    };

    const handleResetZoom = () => {
        resetZoom();
    };

    const handleMouseDown = (e) => {
        // PC端：如果图片已缩放，拖动图片
        if (!isMobile && scale > 1) {
            setIsDraggingImage(true);
            setDragStartPos({
                x: e.clientX - imagePosition.x,
                y: e.clientY - imagePosition.y
            });
            e.preventDefault();
            return;
        }
        
        // 移动端：拖拽切换图片
        if (isMobile) {
            setIsDragging(true);
            setStartX(e.clientX);
            setDragOffset(0);
            setIsTransitioning(false);
        }
    };

    const handleMouseMove = (e) => {
        // PC端：拖动缩放后的图片
        if (!isMobile && isDraggingImage && scale > 1) {
            const newX = e.clientX - dragStartPos.x;
            const newY = e.clientY - dragStartPos.y;
            
            // 应用边界限制
            const constrained = constrainPosition(newX, newY, scale);
            setImagePosition(constrained);
            return;
        }
        
        // 移动端：拖拽切换图片
        if (isDragging && isMobile) {
            const currentX = e.clientX;
            const diffX = currentX - startX;
            
            // 计算拖拽偏移量（转换为百分比）
            const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
            const offsetPercent = (diffX / containerWidth) * 100;
            
            // 实时更新位置，让图片跟随鼠标
            setDragOffset(offsetPercent);
        }
    };

    const handleMouseUp = () => {
        // PC端：停止拖动图片
        if (!isMobile && isDraggingImage) {
            setIsDraggingImage(false);
            return;
        }
        
        // 移动端：处理切换图片
        if (!isMobile) return;
        setIsDragging(false);
        
        // 计算拖拽距离
        const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
        const dragThreshold = containerWidth * 0.15; // 15% 的宽度作为切换阈值
        const dragDistance = (dragOffset / 100) * containerWidth;
        
        if (Math.abs(dragDistance) > dragThreshold) {
            // 拖拽距离超过阈值，切换图片
            if (dragDistance < 0) {
                // 向左拖拽，显示下一张
                goToNext();
            } else {
                // 向右拖拽，显示上一张
                goToPrevious();
            }
        } else {
            // 拖拽距离不够，回弹到当前图片
            setIsTransitioning(true);
            setDragOffset(0);
            setTimeout(() => {
                setIsTransitioning(false);
            }, 300);
        }
    };

    const handleTouchStart = (e) => {
        // 触摸事件只在移动端处理
        if (!isMobile) return;
        
        // 检测是否为双指触摸（缩放手势）
        if (e.touches.length === 2) {
            setIsPinching(true);
            setIsDragging(false);
            
            // 计算初始双指距离和中心点
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            // 计算初始双指中心点
            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;
            
            // 保存初始状态 - 每次新的缩放手势都重新保存
            initialPinchDistanceRef.current = distance;
            lastPinchScaleRef.current = scale;
            initialImagePositionRef.current = { ...imagePosition };
            initialPinchCenterRef.current = { x: centerX, y: centerY };
            
            return;
        }
        
        // 单指触摸
        if (e.touches.length === 1 && !isPinching) {
            // 如果图片已缩放，拖动图片而不是切换
            if (scale > 1) {
                setIsDraggingImage(true);
                setDragStartPos({
                    x: e.touches[0].clientX - imagePosition.x,
                    y: e.touches[0].clientY - imagePosition.y
                });
            } else {
                setIsDragging(true);
                setStartX(e.touches[0].clientX);
                setDragOffset(0);
                setIsTransitioning(false);
            }
        }
    };

    const handleTouchMove = (e) => {
        if (!isMobile) return;
        
        // 如果是双指触摸，处理缩放和移动
        if (e.touches.length === 2) {
            setIsPinching(true);
            setIsDragging(false);
            
            // 计算当前双指距离和中心点
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            // 计算当前双指中心点（屏幕坐标）
            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;
            
            // 计算双指中心点的移动距离
            const centerDeltaX = centerX - initialPinchCenterRef.current.x;
            const centerDeltaY = centerY - initialPinchCenterRef.current.y;
            
            // 计算缩放比例变化
            const scaleChange = distance / initialPinchDistanceRef.current;
            const newScale = Math.max(1, Math.min(15, lastPinchScaleRef.current * scaleChange));
            
            // 计算初始缩放中心点相对于视口中心的偏移
            const viewportCenterX = window.innerWidth / 2;
            const viewportCenterY = window.innerHeight / 2;
            const initialTouchOffsetX = initialPinchCenterRef.current.x - viewportCenterX;
            const initialTouchOffsetY = initialPinchCenterRef.current.y - viewportCenterY;
            
            // 计算手指在图片坐标系中的位置（基于初始位置）
            const pointInImageX = (initialTouchOffsetX - initialImagePositionRef.current.x) / lastPinchScaleRef.current;
            const pointInImageY = (initialTouchOffsetY - initialImagePositionRef.current.y) / lastPinchScaleRef.current;
            
            // 计算新的图片位置：
            // 1. 先根据缩放调整位置，使图片上的点保持在初始手指位置
            // 2. 再加上手指中心点的移动距离
            const newX = initialTouchOffsetX - pointInImageX * newScale + centerDeltaX;
            const newY = initialTouchOffsetY - pointInImageY * newScale + centerDeltaY;
            
            // 应用边界限制
            const constrained = constrainPosition(newX, newY, newScale);
            
            setScale(newScale);
            setImagePosition(constrained);
            
            return;
        }
        
        // 如果图片已缩放，拖动图片
        if (isDraggingImage && scale > 1 && e.touches.length === 1) {
            const newX = e.touches[0].clientX - dragStartPos.x;
            const newY = e.touches[0].clientY - dragStartPos.y;
            
            // 应用边界限制
            const constrained = constrainPosition(newX, newY, scale);
            setImagePosition(constrained);
            return;
        }
        
        // 单指滑动且不在缩放状态
        if (isDragging && !isPinching && e.touches.length === 1) {
            const currentX = e.touches[0].clientX;
            const diffX = currentX - startX;
            
            // 计算拖拽偏移量（转换为百分比）
            const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
            const offsetPercent = (diffX / containerWidth) * 100;
            
            // 实时更新位置，让图片跟随手指
            setDragOffset(offsetPercent);
        }
    };

    const handleTouchEnd = (e) => {
        if (!isMobile) return;
        
        // 如果还有触摸点存在，说明是多指操作中的一个手指抬起
        if (e.touches.length > 0) {
            // 如果从双指变成单指，结束缩放状态但保持当前缩放和位置
            if (isPinching && e.touches.length === 1) {
                setIsPinching(false);
                // 不重置 initialPinchDistanceRef 等，因为可能还会继续操作
                
                // 如果缩放到1以下，重置位置
                if (scale <= 1) {
                    setScale(1);
                    setImagePosition({ x: 0, y: 0 });
                }
                
                // 转换为单指拖动状态（如果图片已缩放）
                if (scale > 1) {
                    setIsDraggingImage(true);
                    setDragStartPos({
                        x: e.touches[0].clientX - imagePosition.x,
                        y: e.touches[0].clientY - imagePosition.y
                    });
                }
            }
            return;
        }
        
        // 所有手指都抬起了，完全结束触摸操作
        if (isPinching) {
            setIsPinching(false);
            setIsDragging(false);
            setDragOffset(0);
            initialPinchDistanceRef.current = 0;
            initialPinchCenterRef.current = { x: 0, y: 0 };
            initialImagePositionRef.current = { x: 0, y: 0 };
            
            // 如果缩放到1以下，重置位置
            if (scale <= 1) {
                setScale(1);
                setImagePosition({ x: 0, y: 0 });
            }
            return;
        }
        
        // 如果在拖动缩放后的图片
        if (isDraggingImage) {
            setIsDraggingImage(false);
            return;
        }
        
        setIsDragging(false);
        
        // 计算拖拽距离
        const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
        const dragThreshold = containerWidth * 0.15; // 15% 的宽度作为切换阈值
        const dragDistance = (dragOffset / 100) * containerWidth;
        
        if (Math.abs(dragDistance) > dragThreshold) {
            // 拖拽距离超过阈值，切换图片
            if (dragDistance < 0) {
                // 向左拖拽，显示下一张
                goToNext();
            } else {
                // 向右拖拽，显示上一张
                goToPrevious();
            }
        } else {
            // 拖拽距离不够，回弹到当前图片
            setIsTransitioning(true);
            setDragOffset(0);
            setTimeout(() => {
                setIsTransitioning(false);
            }, 300);
        }
    };

    const handleBackgroundClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!images || images.length === 0) return null;

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
            {/* 关闭按钮 */}
            <button 
                style={{...styles.lightboxCloseButton, top: '20px', right: '20px'}} 
                onClick={onClose}
            >
                ×
            </button>

            {/* 左右切换按钮 */}
            {images.length > 1 && (
                <>
                    <button 
                        style={{...styles.lightboxNavButton, left: '20px'}} 
                        onClick={goToPrevious}
                    >
                        ‹
                    </button>
                    <button
                        style={{...styles.lightboxNavButton, right: '20px'}}
                        onClick={goToNext}
                    >
                        ›
                    </button>
                </>
            )}

            {/* 图片轮播容器 */}
            <div
                ref={containerRef}
                style={{
                    ...styles.lightboxSliderContainer,
                    transform: `translateX(${translateX + dragOffset}%)`,
                    transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
                }}
            >
                {infiniteImages.map((img, index) => {
                    // 只对当前显示的图片应用缩放
                    const isCurrentImage = index === currentImageIndex + 1;
                    
                    // 计算实际图片索引（去掉克隆图片的偏移）
                    let actualIndex;
                    if (index === 0) {
                        actualIndex = images.length - 1; // 克隆的最后一张
                    } else if (index === infiniteImages.length - 1) {
                        actualIndex = 0; // 克隆的第一张
                    } else {
                        actualIndex = index - 1; // 正常图片
                    }
                    
                    // 判断是否应该加载这张图片
                    const shouldLoad = loadedImageIndices.has(actualIndex);
                    
                    return (
                        <div
                            key={index}
                            style={styles.lightboxSlide}
                            onClick={handleBackgroundClick}
                        >
                            {shouldLoad ? (
                                <img
                                    ref={(el) => {
                                        if (el) {
                                            imageRefs.current[index] = el;
                                        }
                                    }}
                                    src={img}
                                    alt={`Image ${index}`}
                                    style={{
                                        ...styles.lightboxImage,
                                        transform: isCurrentImage
                                            ? `scale(${scale}) translate(${imagePosition.x / scale}px, ${imagePosition.y / scale}px)`
                                            : 'scale(1)',
                                        transition: isPinching || isDraggingImage || isWheelScrolling ? 'none' : 'transform 0.3s ease',
                                        cursor: scale > 1 ? 'move' : 'pointer',
                                    }}
                                    onLoad={(e) => {
                                        if (isCurrentImage && e.target.offsetWidth > 0) {
                                            // 只在尺寸变化时更新
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
                                />
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

            {/* 缩放控制按钮 */}
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
                    style={{
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
                    }}
                >
                    −
                </button>
                <button
                    onClick={handleResetZoom}
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '0 15px',
                        height: '40px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {Math.round(scale * 100)}%
                </button>
                <button
                    onClick={handleZoomIn}
                    style={{
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
                    }}
                >
                    +
                </button>
            </div>

            {/* 图片指示器 */}
            {images.length > 1 && (
                <div style={styles.lightboxIndicator}>
                    {currentImageIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
};