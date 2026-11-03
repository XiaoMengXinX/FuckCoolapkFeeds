import { processCoolapkEmoji } from './emojiProcessor';

export const convertCoolapkFeedLinks = (url) => {
    const feedMatch = url.match(/(?:https?:\/\/)?(?:www\.)?coolapk\.com\/feed\/(\d+)/);
    if (feedMatch) return `https://coolapk1s.com/feed/${feedMatch[1]}`;
    return url;
};

export const processHtmlLinks = (html, enableEmoji = true) => {
    const processed = html
        .replace(/<a class="feed-link-url".*?href="([^"]*)".*?>.*?<\/a>/g, (match, url) => {
            const href = convertCoolapkFeedLinks(url);
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>`;
        })
        .replace(/<a class="feed-link-tag".*?href="\/tag\/([^"]*)".*?>(.*?)<\/a>/g, (match, tag, text) => `<a href="/t/${encodeURIComponent(tag)}" target="_top" rel="noopener noreferrer">${text}</a>`)
        .replace(/<a class="feed-link-uname".*?href="([^"]*)".*?>(.*?)<\/a>/g, '<a href="https://www.coolapk.com$1" target="_blank" rel="noopener noreferrer">$2</a>');

    return enableEmoji ? processCoolapkEmoji(processed) : processed;
};
