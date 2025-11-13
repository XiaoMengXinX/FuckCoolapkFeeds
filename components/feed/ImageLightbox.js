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
    const containerRef = useRef(null);
    const lastWheelTimeRef = useRef(0);
    
    // 创建无限循环的图片数组：在前后各添加一张图片
    const infiniteImages = [images[images.length - 1], ...images, images[0]];

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
    }, [currentImageIndex, isMobile]);

    const goToPrevious = () => {
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

    const handleMouseDown = (e) => {
        // 只在移动端启用鼠标拖拽
        if (!isMobile) return;
        setIsDragging(true);
        setStartX(e.clientX);
        setDragOffset(0);
        setIsTransitioning(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !isMobile) return;
        
        const currentX = e.clientX;
        const diffX = currentX - startX;
        
        // 计算拖拽偏移量（转换为百分比）
        const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
        const offsetPercent = (diffX / containerWidth) * 100;
        
        // 实时更新位置，让图片跟随鼠标
        setDragOffset(offsetPercent);
    };

    const handleMouseUp = () => {
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
        setIsDragging(true);
        setStartX(e.touches[0].clientX);
        setDragOffset(0);
        setIsTransitioning(false);
    };

    const handleTouchMove = (e) => {
        if (!isDragging || !isMobile) return;
        
        const currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        
        // 计算拖拽偏移量（转换为百分比）
        const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
        const offsetPercent = (diffX / containerWidth) * 100;
        
        // 实时更新位置，让图片跟随手指
        setDragOffset(offsetPercent);
    };

    const handleTouchEnd = () => {
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

    const handleBackgroundClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!images || images.length === 0) return null;

    return (
        <div 
            style={styles.lightbox} 
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
                {infiniteImages.map((img, index) => (
                    <div
                        key={index}
                        style={styles.lightboxSlide}
                        onClick={handleBackgroundClick}
                    >
                        <img
                            src={img}
                            alt={`Image ${index}`}
                            style={styles.lightboxImage}
                        />
                    </div>
                ))}
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