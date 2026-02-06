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
    // Render product album as simplified list
    const renderProductAlbum = () => {
        if (!feed.productAlbumDetailInfo || feed.productAlbumDetailInfo.length === 0) return null;

        // Group by level
        const groupedByLevel = feed.productAlbumDetailInfo.reduce((acc, item) => {
            if (!acc[item.level]) {
                acc[item.level] = [];
            }
            acc[item.level].push(item);
            return acc;
        }, {});

        // Level labels
        const levelLabels = {
            1: '🏆夯',
            2: '🆙顶级',
            3: '👑人上人',
            4: '🚶🏻‍➡️NPC',
            5: '💩拉'
        };

        // Sort levels
        const sortedLevels = Object.keys(groupedByLevel).sort((a, b) => Number(a) - Number(b));

        return (
            <div>
                {sortedLevels.map((level) => {
                    const items = groupedByLevel[level];
                    const label = levelLabels[level];
                    
                    return (
                        <div key={level}>
                            {/* Only show heading if label exists */}
                            {label && <h3>【{label}】</h3>}
                            <ul>
                                {items.map((item) => (
                                    <li key={item.id}>{item.item_name}</li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        );
    };

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
        
        return (
            <>
                {messageContent}
                {renderProductAlbum()}
            </>
        );
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
                    /* Highlight.js Light Theme */
                    @media (prefers-color-scheme: light) {
                        pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}.hljs{color:#383a42;background:#fafafa}.hljs-comment,.hljs-quote{color:#a0a1a7;font-style:italic}.hljs-doctag,.hljs-formula,.hljs-keyword{color:#a626a4}.hljs-deletion,.hljs-name,.hljs-section,.hljs-selector-tag,.hljs-subst{color:#e45649}.hljs-literal{color:#0184bb}.hljs-addition,.hljs-attribute,.hljs-meta .hljs-string,.hljs-regexp,.hljs-string{color:#50a14f}.hljs-attr,.hljs-number,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-pseudo,.hljs-template-variable,.hljs-type,.hljs-variable{color:#986801}.hljs-bullet,.hljs-link,.hljs-meta,.hljs-selector-id,.hljs-symbol,.hljs-title{color:#4078f2}.hljs-built_in,.hljs-class .hljs-title,.hljs-title.class_{color:#c18401}.hljs-emphasis{font-style:italic}.hljs-strong{font-weight:700}.hljs-link{text-decoration:underline}
                    }
                    /* Highlight.js Dark Theme */
                    @media (prefers-color-scheme: dark) {
                        pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}.hljs{color:#abb2bf;background:#282c34}.hljs-comment,.hljs-quote{color:#5c6370;font-style:italic}.hljs-doctag,.hljs-formula,.hljs-keyword{color:#c678dd}.hljs-deletion,.hljs-name,.hljs-section,.hljs-selector-tag,.hljs-subst{color:#e06c75}.hljs-literal{color:#56b6c2}.hljs-addition,.hljs-attribute,.hljs-meta .hljs-string,.hljs-regexp,.hljs-string{color:#98c379}.hljs-attr,.hljs-number,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-pseudo,.hljs-template-variable,.hljs-type,.hljs-variable{color:#d19a66}.hljs-bullet,.hljs-link,.hljs-meta,.hljs-selector-id,.hljs-symbol,.hljs-title{color:#61aeee}.hljs-built_in,.hljs-class .hljs-title,.hljs-title.class_{color:#e6c07b}.hljs-emphasis{font-style:italic}.hljs-strong{font-weight:700}.hljs-link{text-decoration:underline}
                    }
                    body{margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;transition:background-color .3s ease,color .3s ease}
                    .iv-container{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;max-width:680px;margin:0 auto;padding:0;background-color:#fff;color:#222;line-height:1.6}
                    .iv-centered{display:flex;justify-content:center;align-items:center;height:calc(100vh - 200px);font-size:1.2em}
                    .iv-page-header{display:none}
                    .iv-cover-section,.iv-cover-figure{margin:0;padding:0;width:100%}
                    .iv-cover-image{width:100%;height:auto;display:block}
                    .iv-title{font-size:1.5em;font-weight:bold;margin:0 20px 15px;padding-top:30px;line-height:1.3;color:#000}
                    .iv-content-section{font-size:1.05em;line-height:1.7;padding:0 20px;margin-bottom:30px}
                    .iv-source-link{margin:0;font-size:.9em}
                    .iv-footer{padding:20px;border-top:1px solid #e5e5e5;text-align:center;color:#999;font-size:.9em}
                    .iv-image-container{margin:20px 0;text-align:center}
                    .iv-image{max-width:100%;border-radius:4px;box-shadow:0 4px 8px rgba(0,0,0,.1);display:block;margin:0 auto}
                    .iv-image-description{margin-top:8px;color:#666;font-size:.9em;text-align:center}
                    .iv-pre-wrap{white-space:pre-wrap}
                    a{word-break:break-all;overflow-wrap:break-word;color:#0366d6;text-decoration:none;transition:color .2s ease}
                    a:hover{color:#0056b3;text-decoration:underline}
                    a:visited{color:#6f42c1}
                    a:active{color:#d73a49}
                    .markdown-content{max-width:100%;overflow-wrap:break-word;word-wrap:break-word}
                    .markdown-content h1{font-size:1.4em}
                    .markdown-content h2{font-size:1.3em}
                    .markdown-content h3{font-size:1.2em}
                    .markdown-content h4,.markdown-content h5,.markdown-content h6{font-size:1.1em}
                    .markdown-content ul,.markdown-content ol{padding-left:2em;margin:16px 0}
                    .markdown-content li {margin: 4px 0;line-height: 1.6}
                    .markdown-content a{color:#0366d6}
                    .markdown-content a:hover{text-decoration:underline}
                    .markdown-content pre{white-space:pre;overflow-x:auto;background-color:#f6f8fa;padding:16px;border-radius:6px;color:#24292e;max-width:100%;box-sizing:border-box;margin:16px 0}
                    .markdown-content code{white-space:normal;word-wrap:break-word;padding:.2em .4em;margin:0;font-size:85%;background-color:rgba(27,31,35,.05);border-radius:3px;color:#24292e}
                    .markdown-content pre code{white-space:inherit;word-wrap:normal;padding:0;margin:0;font-size:inherit;background-color:transparent!important;border-radius:0;color:inherit}
                    .markdown-content pre code.hljs{background-color:transparent!important;padding:0;display:block;overflow-x:auto}
                    @media (prefers-color-scheme:dark){
                        .iv-container{background-color:#1a1a1a;color:#e0e0e0}
                        .iv-title{color:#fff}
                        .iv-footer{border-top:1px solid #444;color:#888}
                        .iv-image-description{color:#999}
                        a{color:#58a6ff}
                        a:hover{color:#79c0ff}
                        a:visited{color:#bc8cff}
                        a:active{color:#ff7b72}
                        .markdown-content a{color:#58a6ff}
                        .markdown-content pre{background-color:#2d2d2d;color:#e6edf3}
                        .markdown-content code{background-color:rgba(255,255,255,.1);color:#e6edf3}
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