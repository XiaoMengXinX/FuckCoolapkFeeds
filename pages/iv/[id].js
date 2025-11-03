import MetaTags from '../../components/feed/MetaTags';
import { fetchFeedData } from '../../lib/feedLoader';
import { styles } from '../../styles/feedStyles';
import Head from 'next/head';
import { processHtmlLinks } from '../../lib/linkProcessor';
import { getMarkdownRenderer, detectMarkdown, decodeEntities } from '../../lib/markdownProcessor';

const proxyImage = (url) => {
    if (url && (url.includes('image.coolapk.com') || url.includes('avatar.coolapk.com'))) {
        return `https://image.coolapk1s.com/?url=${encodeURIComponent(url)}`;
    }
    return url;
};


// 获取markdown渲染器实例
const md = getMarkdownRenderer();

const InstantViewPage = ({ feed, error, id, isMarkdownEnabled }) => {
    const renderFeedContent = () => {
        if (!feed) {
            return <div style={styles.centered}>No feed data found.</div>;
        }

        let messageContent;
        if (feed.feedType === 'feedArticle') {
            try {
                const messageParts = JSON.parse(feed.message_raw_output);
                messageContent = messageParts.map((part, index) => {
                    if (part.type === 'text') {
                        const formattedMessage = part.message.replace(/\\n/g, '\n');
                        
                        if (isMarkdownEnabled) {
                            return (
                                <div
                                    key={index}
                                    className="markdown-content"
                                    dangerouslySetInnerHTML={{ __html: md.render(decodeEntities(formattedMessage).replace(/\n/g, '  \n')) }}
                                />
                            );
                        } else {
                            const htmlMessage = formattedMessage.replace(/\n/g, '<br />');
                            return <div key={index} dangerouslySetInnerHTML={{ __html: processHtmlLinks(htmlMessage) }} />;
                        }
                    } else if (part.type === 'image') {
                        return (
                            <div key={index} style={styles.imageContainer}>
                                <img src={proxyImage(part.url)} alt={part.description || `feed-image-${index}`} style={styles.image} />
                                {part.description && <div style={styles.imageDescription}>{part.description}</div>}
                            </div>
                        );
                    }
                    return null;
                });
            } catch (e) {
                const processedMessage = processHtmlLinks(feed.message.replace(/\\n/g, '\n').replace(/\n/g, '<br />'));
                messageContent = <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: processedMessage }} />;
            }
        } else {
            if (isMarkdownEnabled) {
                messageContent = (
                    <>
                        <div
                            className="markdown-content"
                            dangerouslySetInnerHTML={{ __html: md.render(decodeEntities(feed.message).replace(/\n/g, '  \n')) }}
                        />
                        {feed.picArr && feed.picArr.map((img, index) => (
                            <div key={index} style={styles.imageContainer}>
                                <img src={proxyImage(img)} alt={`image-${index}`} style={styles.image} />
                            </div>
                        ))}
                    </>
                );
            } else {
                const processedMessage = processHtmlLinks(feed.message.replace(/\n/g, '<br />'));
                messageContent = (
                    <>
                        <div dangerouslySetInnerHTML={{ __html: processedMessage }} />
                        {feed.picArr && feed.picArr.map((img, index) => (
                            <div key={index} style={styles.imageContainer}>
                                <img src={proxyImage(img)} alt={`image-${index}`} style={styles.image} />
                            </div>
                        ))}
                    </>
                );
            }
        }
        return messageContent;
    };

    if (error) {
        return (
            <div style={styles.centered}>Error: {error}</div>
        );
    }

    if (error || !feed) {
        return (
            <div style={styles.telegramContainer}>
                <Head>
                    <title>{error ? 'Error' : 'Not Found'}</title>
                </Head>
                <div style={styles.centered}>{error ? `Error: ${error}` : 'No feed data found.'}</div>
            </div>
        );
    }

    return (
        <div style={styles.telegramContainer}>
            <MetaTags feed={feed} isTelegram={true} />
            <header style={styles.telegramPageHeader}></header>
            <article>
                {feed.message_cover && (
                    <section className="is-imageBackgrounded" style={styles.telegramCoverSection}>
                        <figure style={styles.telegramCoverFigure}>
                            <img src={proxyImage(feed.message_cover)} alt="cover" style={styles.telegramCoverImage} />
                        </figure>
                    </section>
                )}
                <h1 style={styles.telegramTitle}>{feed.message_title || feed.title}</h1>
                <section style={styles.telegramContentSection}>
                    <p style={styles.telegramSourceLink}>
                        <a href={`https://www.coolapk.com/${feed.feedType === 'picture' ? 'picture' : 'feed'}/${id}`} rel="noopener noreferrer" style={styles.telegramLink}>
                            查看原文
                        </a>
                    </p>
                    <p></p>
                    {renderFeedContent()}
                </section>
            </article>
            <footer style={styles.telegramFooter}>
                <p>From Coolapk1s</p>
            </footer>
        </div>
    );
};


export async function getServerSideProps(context) {
    const { res, params, req } = context;
    const { id } = params;

    const data = await fetchFeedData(id, req);

    // 检测是否需要启用markdown
    let isMarkdownEnabled = false;
    if (data.props.feed) {
        let contentToCheck = '';
        if (data.props.feed.feedType === 'feedArticle' && data.props.feed.message_raw_output) {
            try {
                const messageParts = JSON.parse(data.props.feed.message_raw_output);
                contentToCheck = messageParts
                    .filter(p => p.type === 'text')
                    .map(p => p.message)
                    .join('\n');
            } catch (e) {
                contentToCheck = data.props.feed.message || '';
            }
        } else {
            contentToCheck = data.props.feed.message || '';
        }
        isMarkdownEnabled = detectMarkdown(contentToCheck);
    }

    if (data.props.feed) {
        res.setHeader(
            'Cache-Control',
            'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600');
    } else {
        res.setHeader(
            'Cache-Control',
            'public, max-age=60, s-maxage=60, stale-while-revalidate=0'
        );
    }

    return {
        props: {
            ...data.props,
            id,
            isMarkdownEnabled
        }
    };
}

export default InstantViewPage;