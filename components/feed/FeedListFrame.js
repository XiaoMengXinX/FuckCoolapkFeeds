import Head from 'next/head';
import { useEffect } from 'react';
import { FeedCard, FeedCardStyles } from './FeedCard';

export default function FeedListFrame({ feeds, error, page, messageType }) {
    useEffect(() => {
        if (window.parent === window) return;

        const reportHeight = () => window.parent.postMessage({
            type: messageType,
            height: document.documentElement.scrollHeight,
            page,
            isEmpty: feeds.length === 0,
        }, window.location.origin);

        reportHeight();
        const ro = new ResizeObserver(reportHeight);
        ro.observe(document.body);
        return () => ro.disconnect();
    }, [feeds, page, messageType]);

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <p style={styles.errorText}>加载失败: {error}</p>
                <style jsx global>{FeedCardStyles}</style>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <div style={styles.list}>
                {feeds.map((feed) => (
                    <FeedCard key={feed.id} feed={feed} />
                ))}
            </div>

            <style jsx global>{FeedCardStyles}</style>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '12px 0 0 0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    errorContainer: {
        padding: '32px 16px',
        textAlign: 'center',
    },
    errorText: {
        color: '#999',
        fontSize: '14px',
    },
};
