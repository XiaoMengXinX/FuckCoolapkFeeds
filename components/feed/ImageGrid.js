import { LazyImage } from './LazyImage';
import { styles } from '../../styles/feedStyles';
import { useEffect, useState, useRef } from 'react';

export const ImageGrid = ({ images, onImageClick, isTelegram }) => {
    if (!images || images.length === 0) return null;

    // 顺序加载状态管理
    const [loadedImages, setLoadedImages] = useState([]);
    const [currentLoadingIndex, setCurrentLoadingIndex] = useState(0);
    const isLoadingRef = useRef(false);
    const [maxGridHeight, setMaxGridHeight] = useState(null);
    const [isPC, setIsPC] = useState(false);
    const gridContainerRef = useRef(null);
    const [singleImageHeight, setSingleImageHeight] = useState('600px');
    const hasCalculatedHeight = useRef(false);

    // 检测是否为 PC 端并计算最大高度
    useEffect(() => {
        const checkIsPC = () => {
            const isPCDevice = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
            setIsPC(isPCDevice);
            
            if (isPCDevice) {
                // PC 端：计算可用高度（视口高度 - 顶部内容 - 底部按钮区域 - 边距）
                const viewportHeight = window.innerHeight;
                const floatingBarHeight = 70; // 底部浮动按钮的高度 + 边距
                const headerHeight = 200; // 预估的头部高度
                const contentPadding = 100; // 内容区域的上下边距
                
                const availableHeight = viewportHeight - floatingBarHeight - headerHeight - contentPadding;
                setMaxGridHeight(Math.max(availableHeight, 300)); // 最小 300px
            } else {
                setMaxGridHeight(null); // 移动端不限制高度
            }
        };
        
        checkIsPC();
        window.addEventListener('resize', checkIsPC);
        return () => window.removeEventListener('resize', checkIsPC);
    }, []);

    useEffect(() => {
        if (images && images.length === 1 && gridContainerRef.current && !hasCalculatedHeight.current) {
            const containerWidth = gridContainerRef.current.offsetWidth;
            const defaultHeight = containerWidth * 4 / 3;

            const img = new Image();
            img.src = images[0];

            img.onload = () => {
                const imageAspectRatio = img.height / img.width;
                const calculatedImageHeight = containerWidth * imageAspectRatio;

                if (calculatedImageHeight < defaultHeight) {
                    setSingleImageHeight(`${calculatedImageHeight}px`);
                } else {
                    setSingleImageHeight(`${Math.min(defaultHeight, 600)}px`);
                }
                hasCalculatedHeight.current = true;
            };
        }
    }, [images]);

    // 开始按顺序加载图片
    useEffect(() => {
        if (images.length === 0) return;
        
        const loadNextImage = async () => {
            if (isLoadingRef.current || currentLoadingIndex >= images.length) {
                return;
            }

            isLoadingRef.current = true;
            const indexToLoad = currentLoadingIndex;

            try {
                // 预加载图片
                const img = new Image();
                img.onload = () => {
                    setLoadedImages(prev => [...prev, indexToLoad]);
                    setCurrentLoadingIndex(prev => prev + 1);
                    isLoadingRef.current = false;
                };
                img.onerror = () => {
                    // 图片加载失败，也继续加载下一张
                    setLoadedImages(prev => [...prev, indexToLoad]);
                    setCurrentLoadingIndex(prev => prev + 1);
                    isLoadingRef.current = false;
                };
                img.src = images[indexToLoad];
            } catch (error) {
                // 即使出错也继续加载下一张
                setLoadedImages(prev => [...prev, indexToLoad]);
                setCurrentLoadingIndex(prev => prev + 1);
                isLoadingRef.current = false;
            }
        };

        // 只加载下一张图片
        loadNextImage();
    }, [images, currentLoadingIndex]);

    // 渲染单个图片项目
    const renderImageItem = (img, index) => {
        const isLoaded = loadedImages.includes(index);
        const isLoading = index === currentLoadingIndex && !isLoaded;
        
        if (!isLoaded && index > currentLoadingIndex) {
            // 图片还未轮到加载，显示占位符
            return (
                <div key={index} style={styles.imageGridItem}>
                    <div style={styles.imagePlaceholder}>
                        <div style={styles.placeholderLoader}>
                            <div style={styles.placeholderDot}></div>
                        </div>
                    </div>
                </div>
            );
        }

        if (isLoading) {
            // 当前正在加载的图片
            return (
                <div key={index} style={styles.imageGridItem}>
                    <LazyImage
                        src={img}
                        alt={`grid-image-${index}`}
                        style={styles.gridImage}
                        onClick={() => onImageClick(img)}
                    />
                </div>
            );
        }

        // 已加载的图片
        return (
            <div key={index} style={styles.imageGridItem}>
                <LazyImage
                    src={img}
                    alt={`grid-image-${index}`}
                    style={styles.gridImage}
                    onClick={() => onImageClick(images, index)}
                />
            </div>
        );
    };

    const renderGrid = () => {
        const imageCount = images.length;
        
        // 单张图片居中显示
        if (imageCount === 1) {
            const isLoaded = loadedImages.includes(0);
            const isLoading = currentLoadingIndex === 0 && !isLoaded;
            
            // 如果图片还未加载，使用较小的容器高度
            const containerHeight = isLoaded ? singleImageHeight : '100px';
            
            const singleImageContainerStyle = {
                position: 'relative',
                margin: '20px 0',
                maxHeight: containerHeight,
                height: containerHeight,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'transparent',
            };
            
            const singleImageStyle = {
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
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            };
            
            if (!isLoaded && !isLoading) {
                const singleImagePlaceholderStyle = {
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                };
                
                return (
                    <div style={singleImageContainerStyle}>
                        <div style={singleImagePlaceholderStyle}>
                            <div style={styles.placeholderLoader}>
                                <div style={styles.placeholderDot}></div>
                            </div>
                        </div>
                    </div>
                );
            }
            
            return (
                <div style={singleImageContainerStyle}>
                    <LazyImage
                        src={images[0]}
                        alt="single-image"
                        style={singleImageStyle}
                        onClick={() => onImageClick(images, 0)}
                    />
                </div>
            );
        }
        
        // 计算网格样式，在 PC 端添加尺寸限制以保持 1:1 比例
        const getGridStyle = (baseStyle, columns, rows) => {
            if (isPC && maxGridHeight) {
                // 计算每行的高度（减去 gap）
                const gap = 8; // 与 styles.imageGrid 中的 gap 一致
                const totalGapHeight = (rows - 1) * gap;
                const itemHeight = (maxGridHeight - totalGapHeight) / rows;
                
                // 计算总宽度以保持 1:1 比例
                const totalGapWidth = (columns - 1) * gap;
                const maxWidth = itemHeight * columns + totalGapWidth;
                
                return {
                    ...baseStyle,
                    maxHeight: `${maxGridHeight}px`,
                    maxWidth: `${maxWidth}px`,
                    margin: '20px auto', // 居中显示
                };
            }
            return baseStyle;
        };
        
        if (imageCount <= 4) {
            // 2x2 grid for 1-4 images
            const rows = Math.ceil(imageCount / 2);
            return (
                <div style={getGridStyle({
                    ...styles.imageGrid,
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                }, 2, rows)}>
                    {images.map((img, index) => renderImageItem(img, index))}
                </div>
            );
        } else {
            // 3x3 grid for 5-9 images
            const rows = Math.ceil(imageCount / 3);
            return (
                <div style={getGridStyle({
                    ...styles.imageGrid,
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                }, 3, rows)}>
                    {images.map((img, index) => renderImageItem(img, index))}
                </div>
            );
        }
    };

    return (
        <div ref={gridContainerRef} style={styles.imageGridContainer}>
            {renderGrid()}
        </div>
    );
};