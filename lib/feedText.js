export function parseArticleParts(feed) {
    if (feed.feedType !== 'feedArticle' || !feed.message_raw_output) return null;
    try {
        const parts = JSON.parse(feed.message_raw_output);
        return Array.isArray(parts) ? parts : null;
    } catch {
        return null;
    }
}

export function getFeedPlainText(feed) {
    const parts = parseArticleParts(feed);
    if (parts) {
        return parts.filter(p => p.type === 'text').map(p => p.message).join('\n');
    }
    return feed.message || '';
}
