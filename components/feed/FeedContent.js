import { LazyImage } from './LazyImage';
import { ImageCarousel } from './ImageCarousel';
import { decodeEntities } from '../../lib/markdownProcessor';
import { proxyImage } from '../../lib/imageProxy';

const FeedContent = ({ feed, isTelegram, isPC, onImageClick, md, processHtmlLinks, styles, isMarkdownEnabled }) => {
    if (!feed) {
        return <div style={styles.centered}>No feed data found.</div>;
    }

    const renderArticleContent = (messageRaw) => {
        try {
            const messageParts = JSON.parse(messageRaw);
            return messageParts.map((part, index) => {
                if (part.type === 'text') {
                    const formattedMessage = part.message.replace(/\\n/g, '\n');
                    let htmlMessage = formattedMessage.replace(/\n/g, '<br />');

                    return isMarkdownEnabled ? (
                        <div
                            className="markdown-content"
                            dangerouslySetInnerHTML={{ __html: md.render(decodeEntities(formattedMessage).replace(/\n/g, '  \n')) }}
                        />
                    ) : (
                        <div
                            key={index}
                            style={styles.textBlock}
                            dangerouslySetInnerHTML={{ __html: processHtmlLinks(htmlMessage) }}
                        />
                    );
                } else if (part.type === 'image') {
                    const imageUrl = proxyImage(part.url);
                    if (isTelegram) {
                        return (
                            <div key={index} style={styles.imageContainer}>
                                <img src={imageUrl} alt={part.description || `feed-image-${index}`} style={styles.image} />
                                {part.description && <div style={styles.imageDescription}>{part.description}</div>}
                            </div>
                        );
                    }
                    return (
                        <div key={index} style={styles.imageContainer}>
                            <LazyImage
                                src={imageUrl}
                                alt={part.description || `feed-image-${index}`}
                                style={{ ...(isPC() ? { ...styles.image, maxWidth: '80%' } : styles.image), cursor: 'pointer' }}
                                onClick={() => onImageClick(imageUrl)}
                            />
                            {part.description && <div style={styles.imageDescription}>{part.description}</div>}
                        </div>
                    );
                }
                return null;
            });
        } catch (e) {
            let fallbackHtml = feed.message.replace(/\\n/g, '<br />');
            return <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: fallbackHtml }} />;
        }
    };

    const renderStandardFeed = () => {
        let htmlMessage = feed.message;

        return (
            <div>
                {isMarkdownEnabled ? (
                    <div
                        className="markdown-content"
                        dangerouslySetInnerHTML={{ __html: md.render(decodeEntities(htmlMessage).replace(/\n/g, '  \n')) }}
                    />
                ) : (
                    <div style={styles.textBlock} dangerouslySetInnerHTML={{ __html: processHtmlLinks(htmlMessage.replace(/\n/g, '<br />')) }} />
                )}
                {feed.picArr && feed.picArr.length > 0 && (
                    isTelegram ? (
                        <div>
                            {feed.picArr.map((img, index) => (
                                <div key={index} style={styles.imageContainer}>
                                    <img src={proxyImage(img)} alt={`image-${index}`} style={styles.image} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ImageCarousel
                            images={feed.picArr.map(proxyImage)}
                            onImageClick={onImageClick}
                        />
                    )
                )}
            </div>
        );
    };

    if (feed.feedType === 'feedArticle') {
        return renderArticleContent(feed.message_raw_output);
    } else if (['feed', 'comment', 'picture', 'question', 'answer'].includes(feed.feedType)) {
        return renderStandardFeed();
    } else {
        return <div style={styles.centered}>Unsupported feed type: {feed.feedType}</div>;
    }
};

export default FeedContent;