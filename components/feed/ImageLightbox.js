import { useEffect, useState, useRef } from 'react';
import { styles } from '../../styles/feedStyles';

export const ImageLightbox = ({ images, currentIndex, onClose, onImageChange }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
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
        
        // 禁止背景页面滚动
        const originalOverflow = document.body.style.overflow;
        const originalPosition = document.body.style.position;
        const originalWidth = document.body.style.width;
        
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        
        return () => {
            // 恢复背景页面滚动
            document.body.style.overflow = originalOverflow;
            document.body.style.position = originalPosition;
            document.body.style.width = originalWidth;
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
            const timeSinceLastWheel = now - lastWheelTimeRef.current;
            
            // 防抖：如果距离上次滚轮事件小于 150ms，则忽略
            if (timeSinceLastWheel < 150) {
                return;
            }
            
            lastWheelTimeRef.current = now;
            
            if (e.deltaY > 0) {
                // 向下滚动，切换到下一张
                goToNext();
            } else if (e.deltaY < 0) {
                // 向上滚动，切换到上一张
                goToPrevious();
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
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !isMobile) return;
        const diffX = startX - e.clientX;
        
        if (Math.abs(diffX) > 100) { // 拖拽距离阈值
            if (diffX > 0) {
                goToNext();
            } else {
                goToPrevious();
            }
            setIsDragging(false);
        }
    };

    const handleMouseUp = () => {
        if (!isMobile) return;
        setIsDragging(false);
    };

    const handleTouchStart = (e) => {
        // 触摸事件只在移动端处理
        if (!isMobile) return;
        setIsDragging(true);
        setStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
        if (!isDragging || !isMobile) return;
        const diffX = startX - e.touches[0].clientX;
        
        if (Math.abs(diffX) > 100) {
            if (diffX > 0) {
                goToNext();
            } else {
                goToPrevious();
            }
            setIsDragging(false);
        }
    };

    const handleTouchEnd = () => {
        if (!isMobile) return;
        setIsDragging(false);
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
                    transform: `translateX(${translateX}%)`,
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