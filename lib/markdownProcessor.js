import { convertCoolapkFeedLinks } from './linkProcessor';
import { processCoolapkEmoji } from './emojiProcessor';

export const cleanCodeContent = (str) =>
    str.replace(/<!--break-->/g, '')
        .replace(/<a class="feed-link-tag".*?>(.*?)<\/a>/g, '$1')
        .replace(/<a class="feed-link-uname".*?>(.*?)<\/a>/g, '$1');

export const transformOutsideCode = (text, transform) => {
    const blocks = [];
    const inline = [];

    const masked = text
        .replace(/```[\s\S]*?```/g, match => `___CODE_BLOCK_${blocks.push(match) - 1}___`)
        .replace(/`[^`]+`/g, match => `___INLINE_CODE_${inline.push(match) - 1}___`);

    return transform(masked)
        .replace(/___CODE_BLOCK_(\d+)___/g, (match, index) => blocks[index])
        .replace(/___INLINE_CODE_(\d+)___/g, (match, index) => inline[index]);
};

export const decodeEntities = (text, enableEmoji = true) => {
    text = text.replace(/<a class="feed-link-url" href=["']([^"']+)["'][^>]*>.*?<\/a>/g,
        (match, url) => convertCoolapkFeedLinks(url)
    );

    if (enableEmoji) {
        text = transformOutsideCode(text, processCoolapkEmoji);
    }

    if (typeof window === 'undefined') {
        return text
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
    }
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
};

const MARKDOWN_PATTERNS = [
    /\*\*[^*]+\*\*/,
    /__[^_]+__/,
    /```[\s\S]*?```/,
    /`[^`]+`/,
    /^\|.+\|$/m,
    /^---+$/m,
    /~~[^~]+~~/,
    /^#{1,6}\s+.*$/m,
];

export const detectMarkdown = (content) => {
    if (!content) return false;
    const decoded = decodeEntities(content, false);
    return MARKDOWN_PATTERNS.some(pattern => pattern.test(decoded));
};
