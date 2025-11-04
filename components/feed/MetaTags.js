import Head from 'next/head';
import { proxyImage } from '../../lib/imageProxy';

const generateOgDescription = (message) => {
    if (!message) return '';
    let cleanMessage = message
        .replace(/<!--break-->/g, '')
        .replace(/<[^>]+>/g, '')
        .trim();

    if (cleanMessage.length > 200) {
        cleanMessage = cleanMessage.substring(0, 200) + '...';
    }
    return cleanMessage;
};

export const OgTags = ({ feed }) => {
    if (!feed) return null;

    const title = feed.feedType === 'feedArticle' ? feed.message_title : feed.title;
    const description = generateOgDescription(feed.message);
    const coverImage = feed.message_cover || (feed.picArr && feed.picArr.length > 0 ? feed.picArr[0] : null);

    return (
        <>
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:site_name" content="Coolapk1s" />
            <meta name="twitter:card" content="summary_large_image" />
            {coverImage && (
                <>
                    <meta property="og:image" content={proxyImage(coverImage)} />
                    <meta property="twitter:image" content={proxyImage(coverImage)} />
                </>
            )}
        </>
    );
};

export const TelegramInstantViewTags = ({ feed }) => {
    if (!feed) return null;

    const publishedTime = new Date(feed.dateline * 1000).toISOString();

    return (
        <>
            <meta property="al:android:app_name" content="Medium" />
            <meta property="article:published_time" content={publishedTime} />
            <meta name="author" content={feed.username} />
        </>
    );
};

// A component that combines all meta tags for simplicity
const MetaTags = ({ feed, isTelegram }) => {
    return (
        <Head>
            <title>{feed ? (feed.feedType === 'feedArticle' ? feed.message_title : feed.title) : 'Loading...'}</title>
            <OgTags feed={feed} />
            {isTelegram && <TelegramInstantViewTags feed={feed} />}
        </Head>
    );
};

export default MetaTags;