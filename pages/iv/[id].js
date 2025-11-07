import MetaTags from '../../components/feed/MetaTags';
import { fetchFeedData } from '../../lib/feedLoader';
import Head from 'next/head';
import { processHtmlLinks } from '../../lib/linkProcessor';
import { getMarkdownRenderer, detectMarkdown, decodeEntities } from '../../lib/markdownProcessor';
import { proxyImage } from '../../lib/imageProxy';


// 获取markdown渲染器实例
const md = getMarkdownRenderer();

// 禁用此页面的客户端 JavaScript
export const config = {
    unstable_runtimeJS: false
};

const InstantViewPage = ({ feed, error, id, isMarkdownEnabled }) => {
    const renderFeedContent = () => {
        if (!feed) {
            return <div className="iv-centered">No feed data found.</div>;
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
                                    dangerouslySetInnerHTML={{ __html: md.render(decodeEntities(formattedMessage, false).replace(/\n/g, '  \n')) }}
                                />
                            );
                        } else {
                            const htmlMessage = formattedMessage.replace(/\n/g, '<br />');
                            return <div key={index} dangerouslySetInnerHTML={{ __html: processHtmlLinks(htmlMessage, false) }} />;
                        }
                    } else if (part.type === 'image') {
                        return (
                            <figure key={index} className="iv-image-container">
                                <img src={proxyImage(part.url)} alt={part.description || `feed-image-${index}`} className="iv-image" />
                                {part.description && <figcaption className="iv-image-description">{part.description}</figcaption>}
                            </figure>
                        );
                    }
                    return null;
                });
            } catch (e) {
                const processedMessage = processHtmlLinks(feed.message.replace(/\\n/g, '\n').replace(/\n/g, '<br />'), false);
                messageContent = <div className="iv-pre-wrap" dangerouslySetInnerHTML={{ __html: processedMessage }} />;
            }
        } else {
            if (isMarkdownEnabled) {
                messageContent = (
                    <>
                        <div
                            className="markdown-content"
                            dangerouslySetInnerHTML={{ __html: md.render(decodeEntities(feed.message, false).replace(/\n/g, '  \n')) }}
                        />
                        {feed.picArr && feed.picArr.map((img, index) => (
                            <figure key={index} className="iv-image-container">
                                <img src={proxyImage(img)} alt={`image-${index}`} className="iv-image" />
                            </figure>
                        ))}
                    </>
                );
            } else {
                const processedMessage = processHtmlLinks(feed.message.replace(/\n/g, '<br />'), false);
                messageContent = (
                    <>
                        <div dangerouslySetInnerHTML={{ __html: processedMessage }} />
                        {feed.picArr && feed.picArr.map((img, index) => (
                            <figure key={index} className="iv-image-container">
                                <img src={proxyImage(img)} alt={`image-${index}`} className="iv-image" />
                            </figure>
                        ))}
                    </>
                );
            }
        }
        return messageContent;
    };

    if (error) {
        return (
            <div className="iv-centered">Error: {error}</div>
        );
    }

    if (error || !feed) {
        return (
            <div className="iv-container">
                <Head>
                    <title>{error ? 'Error' : 'Not Found'}</title>
                </Head>
                <div className="iv-centered">{error ? `Error: ${error}` : 'No feed data found.'}</div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <style dangerouslySetInnerHTML={{ __html: `
                    .iv-container {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        max-width: 680px;
                        margin: 0 auto;
                        padding: 0;
                        background-color: #fff;
                        color: #222;
                        line-height: 1.6;
                    }
                    .iv-centered {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: calc(100vh - 200px);
                        font-size: 1.2em;
                    }
                    .iv-page-header {
                        display: none;
                    }
                    .iv-cover-section {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                    }
                    .iv-cover-figure {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                    }
                    .iv-cover-image {
                        width: 100%;
                        height: auto;
                        display: block;
                    }
                    .iv-title {
                        font-size: 2em;
                        font-weight: bold;
                        margin: 30px 20px 15px;
                        line-height: 1.3;
                        color: #000;
                    }
                    .iv-content-section {
                        font-size: 1.05em;
                        line-height: 1.7;
                        padding: 0 20px;
                        margin-bottom: 30px;
                    }
                    .iv-source-link {
                        margin: 0;
                        font-size: 0.95em;
                    }
                    .iv-footer {
                        padding: 20px;
                        border-top: 1px solid #e5e5e5;
                        text-align: center;
                        color: #999;
                        font-size: 0.9em;
                    }
                    .iv-link {
                        color: #2481cc;
                        text-decoration: none;
                        font-size: 0.9em;
                        font-weight: 500;
                    }
                    .iv-image-container {
                        margin: 20px 0;
                        text-align: center;
                        display: block;
                    }
                    .iv-image {
                        max-width: 100%;
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                        display: block;
                        margin: 0 auto;
                    }
                    .iv-image-description {
                        margin-top: 8px;
                        color: #666;
                        font-size: 0.9em;
                        text-align: center;
                        display: block;
                    }
                    .iv-pre-wrap {
                        white-space: pre-wrap;
                    }
                ` }} />
            </Head>
            <div className="iv-container">
                <MetaTags feed={feed} isTelegram={true} />
                <header className="iv-page-header"></header>
                <article>
                    {feed.message_cover && (
                        <section className="is-imageBackgrounded iv-cover-section">
                            <figure className="iv-cover-figure">
                                <img src={proxyImage(feed.message_cover)} alt="cover" className="iv-cover-image" />
                            </figure>
                        </section>
                    )}
                    <h1 className="iv-title">{feed.message_title || feed.title}</h1>
                    <section className="iv-content-section">
                        <p className="iv-source-link">
                            <a href={`https://www.coolapk.com/${feed.feedType === 'picture' ? 'picture' : 'feed'}/${id}`} rel="noopener noreferrer" className="iv-link">
                                查看原文
                            </a>
                        </p>
                        <p></p>
                        {renderFeedContent()}
                    </section>
                </article>
                <footer className="iv-footer">
                    <p>From Coolapk1s</p>
                </footer>
            </div>
        </>
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