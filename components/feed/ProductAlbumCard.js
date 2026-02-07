import { LazyImage } from './LazyImage';
import { proxyImage } from '../../lib/imageProxy';

/**
 * ProductAlbumCard component for displaying product goods information
 * Renders product cards with ranking badge, thumbnail, title, specs, and preview images
 */
const ProductAlbumCard = ({ goods, rankIndex, styles, onImageClick }) => {
    if (!goods || goods.length === 0) return null;

    // Ranking badge colors based on tier (level field)
    // Using CSS variables to support dark mode
    const getRankColor = (level) => {
        if (level === 1) return 'var(--rank-color-1)'; // 夯 - Red
        if (level === 2) return 'var(--rank-color-2)'; // 顶级 - Orange
        if (level === 3) return 'var(--rank-color-3)'; // 人上人 - Yellow
        if (level === 4) return 'var(--rank-color-4)'; // NPC - Green
        return 'var(--rank-color-5)'; // 拉 - Gray
    };

    // Ranking labels based on level
    const getRankLabel = (level) => {
        const labels = {
            1: '夯',
            2: '顶级',
            3: '人上人',
            4: 'NPC',
            5: '拉'
        };
        return labels[level] || null;
    };

    // Parse item_images string to array
    const parseImages = (imageString) => {
        if (!imageString) return [];
        return imageString.split(',').filter(url => url.trim());
    };

    // Group items by level
    const groupedByLevel = goods.reduce((acc, item) => {
        if (!acc[item.level]) {
            acc[item.level] = [];
        }
        acc[item.level].push(item);
        return acc;
    }, {});

    // Sort levels (1, 2, 3, 4, 5)
    const sortedLevels = Object.keys(groupedByLevel).sort((a, b) => Number(a) - Number(b));

    return (
        <div style={styles.goodsContainer}>
            {sortedLevels.map((level) => {
                const items = groupedByLevel[level];
                const levelColor = getRankColor(Number(level));
                const rankLabel = getRankLabel(Number(level));
                
                return (
                    <div key={level} style={{
                        ...styles.goodsLevelGroup,
                        borderColor: levelColor,
                    }}>
                        {/* Left ranking badge for entire group - only show if label exists */}
                        {rankLabel && (
                            <div 
                                className="product-rank-badge"
                                style={{
                                    ...styles.goodsRankBadge,
                                    backgroundColor: levelColor
                                }}
                            >
                                <span className="product-rank-text">
                                    {rankLabel}
                                </span>
                            </div>
                        )}

                        {/* Items container */}
                        <div style={styles.goodsItemsContainer}>
                            {items.map((item, index) => {
                                const images = parseImages(item.item_images);
                                const isFirst = index === 0;
                                
                                return (
                                    <div 
                                        key={item.id}
                                        className="product-goods-card"
                                        style={{
                                            ...styles.goodsCard,
                                            borderTop: isFirst ? 'none' : '1px solid var(--product-card-border)',
                                        }}
                                    >
                                        {/* Product thumbnail */}
                                        <div 
                                            className="product-thumbnail-container"
                                            style={{
                                                ...styles.goodsThumbnailContainer,
                                                cursor: item.item_logo ? 'pointer' : 'default',
                                            }}
                                            onClick={() => {
                                                if (onImageClick && item.item_logo) {
                                                    // Show item_logo first, then item_images
                                                    const allImages = [proxyImage(item.item_logo), ...images.map(url => proxyImage(url))];
                                                    onImageClick(allImages, 0);
                                                }
                                            }}
                                        >
                                            {item.item_logo ? (
                                                <LazyImage
                                                    src={proxyImage(item.item_logo)}
                                                    alt={item.item_name}
                                                    style={styles.goodsThumbnail}
                                                />
                                            ) : (
                                                <div 
                                                    className="product-thumbnail-placeholder"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '32px',
                                                        color: '#ccc',
                                                        backgroundColor: '#f5f5f5',
                                                    }}
                                                >
                                                    📦
                                                </div>
                                            )}
                                        </div>

                                        {/* Product info */}
                                        <div style={styles.goodsInfo}>
                                            {/* Title */}
                                            <h3 style={styles.goodsTitle}>{item.item_name}</h3>

                                            {/* Description/Specs */}
                                            {item.item_description && (
                                                <div style={styles.goodsSpecs}>
                                                    {item.item_description}
                                                </div>
                                            )}

                                            {/* Product images preview */}
                                            {images.length > 0 && (
                                                <div style={styles.goodsImagePreview}>
                                                    {images.slice(0, 3).map((img, idx) => (
                                                        <LazyImage
                                                            key={idx}
                                                            src={proxyImage(img)}
                                                            alt={`${item.item_name}-${idx}`}
                                                            compact={true}
                                                            style={{
                                                                ...styles.goodsPreviewImage,
                                                                cursor: 'pointer',
                                                            }}
                                                            onClick={() => {
                                                                if (onImageClick) {
                                                                    // Include item_logo as first image, then all item_images
                                                                    const allImages = [proxyImage(item.item_logo), ...images.map(url => proxyImage(url))];
                                                                    onImageClick(allImages, idx + 1); // +1 because item_logo is at index 0
                                                                }
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ProductAlbumCard;
