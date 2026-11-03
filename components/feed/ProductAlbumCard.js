import { LazyImage } from './LazyImage';
import { proxyImage, proxyPreviewImage } from '../../lib/imageProxy';
import { styles } from '../../styles/feedStyles';

const RANK_LABELS = {
    1: '夯',
    2: '顶级',
    3: '人上人',
    4: 'NPC',
    5: '拉',
};

const getRankColor = (level) => `var(--rank-color-${level >= 1 && level <= 4 ? level : 5})`;

const parseImages = (imageString) => {
    if (!imageString) return [];
    return imageString.split(',').filter(url => url.trim());
};

const ProductAlbumCard = ({ goods, onImageClick }) => {
    if (!goods || goods.length === 0) return null;

    const groupedByLevel = goods.reduce((acc, item) => {
        (acc[item.level] ||= []).push(item);
        return acc;
    }, {});

    const sortedLevels = Object.keys(groupedByLevel).sort((a, b) => Number(a) - Number(b));

    return (
        <div style={styles.goodsContainer}>
            {sortedLevels.map((level) => {
                const items = groupedByLevel[level];
                const levelColor = getRankColor(Number(level));
                const rankLabel = RANK_LABELS[level];
                
                return (
                    <div key={level} style={{
                        ...styles.goodsLevelGroup,
                        borderColor: levelColor,
                    }}>
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

                        <div style={styles.goodsItemsContainer}>
                            {items.map((item, index) => {
                                const images = parseImages(item.item_images);
                                const isFirst = index === 0;
                                const logoImages = item.item_logo ? [proxyImage(item.item_logo)] : [];
                                const lightboxImages = [...logoImages, ...images.map(url => proxyImage(url))];
                                
                                return (
                                    <div 
                                        key={item.id}
                                        className="product-goods-card"
                                        style={{
                                            ...styles.goodsCard,
                                            borderTop: isFirst ? 'none' : '1px solid var(--product-card-border)',
                                        }}
                                    >
                                        <div 
                                            className="product-thumbnail-container"
                                            style={{
                                                ...styles.goodsThumbnailContainer,
                                                cursor: item.item_logo ? 'pointer' : 'default',
                                            }}
                                            onClick={() => {
                                                if (onImageClick && item.item_logo) {
                                                    onImageClick(lightboxImages, 0);
                                                }
                                            }}
                                        >
                                            {item.item_logo ? (
                                                <LazyImage
                                                    src={proxyImage(item.item_logo, 's')}
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

                                        <div style={styles.goodsInfo}>
                                            <h3 style={styles.goodsTitle}>{item.item_name}</h3>

                                            {item.item_description && (
                                                <div style={styles.goodsSpecs}>
                                                    {item.item_description}
                                                </div>
                                            )}

                                            {images.length > 0 && (
                                                <div style={styles.goodsImagePreview}>
                                                    {images.slice(0, 3).map((img, idx) => (
                                                        <LazyImage
                                                            key={idx}
                                                            src={proxyPreviewImage(img)}
                                                            alt={`${item.item_name}-${idx}`}
                                                            compact={true}
                                                            style={{
                                                                ...styles.goodsPreviewImage,
                                                                cursor: 'pointer',
                                                            }}
                                                            onClick={() => {
                                                                if (onImageClick) {
                                                                    onImageClick(lightboxImages, logoImages.length + idx);
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
