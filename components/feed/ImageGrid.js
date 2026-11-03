import { LazyImage } from './LazyImage';
import { styles } from '../../styles/feedStyles';
import { proxyImage, getImageSize } from '../../lib/imageProxy';

const singleImageStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'block',
    margin: '0 auto',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
};

// A single image keeps its own ratio but is never taller than 4:3 portrait or 600px.
const getSingleImageAspectRatio = (url) => {
    const size = getImageSize(url);
    if (!size) return '3 / 4';
    return `${size.width} / ${Math.min(size.height, size.width * 4 / 3)}`;
};

export const ImageGrid = ({ images, onImageClick }) => {
    const imageCount = images.length;
    if (imageCount === 0) return null;

    const openLightbox = (index) => onImageClick(images.map(url => proxyImage(url)), index);

    if (imageCount === 1) {
        return (
            <div style={styles.imageGridContainer}>
                <div className="feed-single-image" style={{
                    position: 'relative',
                    margin: '20px auto',
                    width: '100%',
                    aspectRatio: getSingleImageAspectRatio(images[0]),
                    maxHeight: '600px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <LazyImage
                        src={proxyImage(images[0], 'm')}
                        alt="single-image"
                        style={singleImageStyle}
                        onClick={() => openLightbox(0)}
                    />
                </div>
            </div>
        );
    }

    const columns = imageCount <= 4 ? 2 : 3;
    const rows = Math.ceil(imageCount / columns);
    const gridStyle = {
        ...styles.imageGrid,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        '--grid-cols': columns,
        '--grid-rows': rows,
    };

    return (
        <div style={styles.imageGridContainer}>
            <div className="feed-image-grid" style={gridStyle}>
                {images.map((url, index) => (
                    <div key={index} style={styles.imageGridItem}>
                        <LazyImage
                            src={proxyImage(url, 's')}
                            alt={`grid-image-${index}`}
                            style={styles.gridImage}
                            onClick={() => openLightbox(index)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
