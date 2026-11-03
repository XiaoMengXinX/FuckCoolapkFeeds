import { LazyImage } from './LazyImage';
import { ImageGrid } from './ImageGrid';
import { decodeEntities } from '../../lib/markdownProcessor';
import { useMarkdownRenderer } from '../../lib/useMarkdownRenderer';
import { processHtmlLinks } from '../../lib/linkProcessor';
import { proxyImage, getImageSize } from '../../lib/imageProxy';
import { parseArticleParts } from '../../lib/feedText';
import { styles } from '../../styles/feedStyles';
import ProductAlbumCard from './ProductAlbumCard';

const STANDARD_FEED_TYPES = ['feed', 'comment', 'picture', 'question', 'answer', 'rating'];

const FeedContent = ({ feed, isPC, onImageClick, isMarkdownEnabled }) => {
    const md = useMarkdownRenderer(isMarkdownEnabled);

    if (!feed) {
        return <div style={styles.centered}>你查看的内容不存在或已被删除</div>;
    }

    const renderText = (text, key) => isMarkdownEnabled && md ? (
        <div
            key={key}
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: md.render(decodeEntities(text).replace(/\n/g, '  \n')) }}
        />
    ) : (
        <div
            key={key}
            style={styles.textBlock}
            dangerouslySetInnerHTML={{ __html: processHtmlLinks(text.replace(/\n/g, '<br />')) }}
        />
    );

    const renderArticleContent = () => {
        const parts = parseArticleParts(feed);
        if (!parts) {
            return <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: (feed.message || '').replace(/\\n/g, '<br />') }} />;
        }

        const articleImages = parts.filter(p => p.type === 'image').map(p => proxyImage(p.url));
        const imageStyle = {
            ...(isPC ? { ...styles.image, maxWidth: '70%', maxHeight: '800px' } : styles.image),
            cursor: 'pointer',
        };
        let imageIndex = 0;

        return parts.map((part, index) => {
            if (part.type === 'text') {
                return renderText(part.message.replace(/\\n/g, '\n'), index);
            }
            if (part.type === 'image') {
                const currentIndex = imageIndex++;
                return (
                    <div key={index} style={styles.imageContainer}>
                        <LazyImage
                            src={proxyImage(part.url, 'm')}
                            size={getImageSize(part.url)}
                            alt={part.description || `feed-image-${index}`}
                            style={imageStyle}
                            onClick={() => onImageClick(articleImages, currentIndex)}
                            enableLongImageCollapse
                        />
                        {part.description && <div style={styles.imageDescription}>{part.description}</div>}
                    </div>
                );
            }
            return null;
        });
    };

    const renderStandardFeed = () => (
        <div>
            {renderText(feed.message || '')}
            <ImageGrid images={feed.picArr || []} onImageClick={onImageClick} />
        </div>
    );

    const productAlbum = <ProductAlbumCard goods={feed.productAlbumDetailInfo} onImageClick={onImageClick} />;

    if (feed.feedType === 'feedArticle') {
        return <>{renderArticleContent()}{productAlbum}</>;
    }
    if (feed.feedType === 'productAlbum') {
        return <>{renderStandardFeed()}{productAlbum}</>;
    }
    if (STANDARD_FEED_TYPES.includes(feed.feedType)) {
        return renderStandardFeed();
    }
    return <div style={styles.centered}>Unsupported feed type: {feed.feedType}</div>;
};

export default FeedContent;
