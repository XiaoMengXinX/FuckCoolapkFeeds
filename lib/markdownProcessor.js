import MarkdownIt from 'markdown-it';
import markdownItMultimdTable from 'markdown-it-multimd-table';
import markdownItTaskLists from 'markdown-it-task-lists';
import hljs from 'highlight.js';
import { convertCoolapkFeedLinks } from './linkProcessor';

/**
 * 清理代码内容中的HTML标签
 */
export const cleanCodeContent = (str) => 
    str.replace(/<!--break-->/g, '')
       .replace(/<a class="feed-link-url".*?>(.*?)<\/a>/g, '$1')
       .replace(/<a class="feed-link-tag".*?>(.*?)<\/a>/g, '$1')
       .replace(/<a class="feed-link-uname".*?>(.*?)<\/a>/g, '$1');

/**
 * HTML实体解码
 * 支持服务端和客户端环境
 */
export const decodeEntities = (text) => {
    if (typeof window === 'undefined') {
        // 服务端环境：手动解码常见的HTML实体
        return text
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
    }
    // 客户端环境：使用DOM API解码
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
};

/**
 * 检测内容是否包含markdown语法
 */
export const detectMarkdown = (content) => {
    if (!content) return false;
    const decoded = decodeEntities(content);
    const markdownPatterns = [
        /\*\*[^*]+\*\*/,
        /__[^_]+__/,
        /```[\s\S]*?```/,
        /`[^`]+`/,
        /^\|.+\|$/m,
        /^---+$/m,
        /~~[^~]+~~/
    ];
    return markdownPatterns.some(pattern => pattern.test(decoded));
};

/**
 * 创建并配置markdown渲染器
 */
export const createMarkdownRenderer = () => {
    const mdInstance = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        highlight: function (str, lang) {
            const cleanedStr = cleanCodeContent(str);
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return '<pre><code class="hljs">' + 
                           hljs.highlight(cleanedStr, { language: lang, ignoreIllegals: true }).value + 
                           '</code></pre>';
                } catch (__) { }
            }
            return '<pre><code class="hljs">' + mdInstance.utils.escapeHtml(cleanedStr) + '</code></pre>';
        }
    })
    .use(markdownItMultimdTable, {
        multiline: true,
        rowspan: true,
        headerless: true,
        multibody: true
    })
    .use(markdownItTaskLists, {
        enabled: true,
        label: true,
        labelAfter: true
    });

    // 自定义内联代码渲染
    const defaultCodeInline = mdInstance.renderer.rules.code_inline;
    mdInstance.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
        tokens[idx].content = cleanCodeContent(tokens[idx].content);
        return defaultCodeInline(tokens, idx, options, env, self);
    };

    // 自定义render方法以处理Coolapk特有链接
    const originalRender = mdInstance.render.bind(mdInstance);
    mdInstance.render = function (src, env) {
        const codeBlocks = [];
        const inlineCodeBlocks = [];
        
        // 保护代码块
        let processedSrc = src.replace(/```[\s\S]*?```/g, match => {
            codeBlocks.push(match);
            return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
        });
        
        // 保护内联代码
        processedSrc = processedSrc.replace(/`[^`]+`/g, match => {
            inlineCodeBlocks.push(match);
            return `___INLINE_CODE_${inlineCodeBlocks.length - 1}___`;
        });
        
        // 处理Coolapk链接
        processedSrc = processedSrc
            .replace(/\[([^\]]+)\]\(<a class="feed-link-url"[^>]*?href="([^"]*)"[^>]*?>.*?<\/a>\)/g, '[$1]($2)')
            .replace(/<a class="feed-link-url"[^>]*?href="([^"]*)"[^>]*?>.*?<\/a>/g, (match, url) => convertCoolapkFeedLinks(url))
            .replace(/<a class="feed-link-tag"[^>]*?href="([^"]*)"[^>]*?>#(.*?)#<\/a>/g, '[#$2#](https://www.coolapk.com$1)')
            .replace(/<a class="feed-link-uname"[^>]*?href="([^"]*)"[^>]*?>(.*?)<\/a>/g, '[$2](https://www.coolapk.com$1)');
        
        // 恢复代码块
        processedSrc = processedSrc.replace(/___CODE_BLOCK_(\d+)___/g, (match, index) => codeBlocks[parseInt(index)]);
        processedSrc = processedSrc.replace(/___INLINE_CODE_(\d+)___/g, (match, index) => inlineCodeBlocks[parseInt(index)]);
        
        return originalRender(processedSrc, env);
    };

    return mdInstance;
};

// 创建单例markdown渲染器
let markdownInstance = null;

/**
 * 获取markdown渲染器实例（单例模式）
 */
export const getMarkdownRenderer = () => {
    if (!markdownInstance) {
        markdownInstance = createMarkdownRenderer();
    }
    return markdownInstance;
};