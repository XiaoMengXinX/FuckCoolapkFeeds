import { processCoolapkEmoji } from './emojiProcessor';

export const convertCoolapkFeedLinks = (url) => {
    const feedMatch = url.match(/(?:https?:\/\/)?(?:www\.)?coolapk\.com\/feed\/(\d+)/);
    if (feedMatch) return `https://coolapk1s.com/feed/${feedMatch[1]}`;
    return url;
};

export const processHtmlLinks = (html, enableEmoji = true) => {
    // 先处理链接
    let processed = html
        .replace(/<a class="feed-link-url".*?href="([^"]*)".*?>.*?<\/a>/g, (match, url) => `<a href="${convertCoolapkFeedLinks(url)}" target="_blank" rel="noopener noreferrer">${convertCoolapkFeedLinks(url)}</a>`)
        .replace(/<a class="feed-link-tag".*?href="([^"]*)".*?>#(.*?)#<\/a>/g, '<a href="https://www.coolapk.com$1" target="_blank" rel="noopener noreferrer">#$2#</a>')
        .replace(/<a class="feed-link-uname".*?href="([^"]*)".*?>(.*?)<\/a>/g, '<a href="https://www.coolapk.com$1" target="_blank" rel="noopener noreferrer">$2</a>');
    
    // 根据参数决定是否处理表情
    if (enableEmoji) {
        processed = processCoolapkEmoji(processed, false);
    }
    
    return processed;
};