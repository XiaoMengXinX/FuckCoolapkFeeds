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

const HTML_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

// Drops the markup in Coolapk's message HTML and keeps what readers see, such as link and topic labels.
// Coolapk escapes literal angle brackets, so every raw "<" starts a tag; entities are decoded only afterwards
// so escaped code like &lt;adaptive-icon&gt; survives as text.
export function htmlToText(html) {
    return html
        .replace(/<!--[\s\S]*?-->|<[^>]*>/g, '')
        .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
            if (code[0] !== '#') return HTML_ENTITIES[code.toLowerCase()] ?? entity;
            return String.fromCodePoint(code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1)));
        });
}
