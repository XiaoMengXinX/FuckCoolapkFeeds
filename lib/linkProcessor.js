export const convertCoolapkFeedLinks = (url) => {
    const feedMatch = url.match(/(?:https?:\/\/)?(?:www\.)?coolapk\.com\/feed\/(\d+)/);
    if (feedMatch) return `https://coolapk1s.com/feed/${feedMatch[1]}`;
    return url;
};

export const processHtmlLinks = (html) => {
    return html
        .replace(/<a class="feed-link-url".*?href="([^"]*)".*?>.*?<\/a>/g, (match, url) => `<a href="${convertCoolapkFeedLinks(url)}" target="_blank" rel="noopener noreferrer">${convertCoolapkFeedLinks(url)}</a>`)
        .replace(/<a class="feed-link-tag".*?href="([^"]*)".*?>#(.*?)#<\/a>/g, '<a href="https://www.coolapk.com$1" target="_blank" rel="noopener noreferrer">#$2#</a>')
        .replace(/<a class="feed-link-uname".*?href="([^"]*)".*?>(.*?)<\/a>/g, '<a href="https://www.coolapk.com$1" target="_blank" rel="noopener noreferrer">$2</a>');
};