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

const getFeedTitle = (feed) => feed.feedType === 'feedArticle' ? feed.message_title : feed.title;

const OgTags = ({ feed }) => {
    const title = getFeedTitle(feed);
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

const TelegramInstantViewTags = ({ feed }) => {
    const publishedTime = new Date(feed.dateline * 1000).toISOString();

    return (
        <>
            <meta property="al:android:app_name" content="Medium" />
            <meta property="article:published_time" content={publishedTime} />
            <meta name="author" content={feed.username} />
        </>
    );
};

const MetaTags = ({ feed, isTelegram }) => (
    <Head>
        {!isTelegram && (
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        )}
        {feed ? (
            <>
                <title>{`${getFeedTitle(feed)} - Coolapk1s`}</title>
                <OgTags feed={feed} />
                {isTelegram && <TelegramInstantViewTags feed={feed} />}
            </>
        ) : (
            <title>出错了 - Coolapk1s</title>
        )}
    </Head>
);

export default MetaTags;
