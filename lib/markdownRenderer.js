import MarkdownIt from 'markdown-it';
import markdownItMultimdTable from 'markdown-it-multimd-table';
import markdownItTaskLists from 'markdown-it-task-lists';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cmake from 'highlight.js/lib/languages/cmake';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import dart from 'highlight.js/lib/languages/dart';
import diff from 'highlight.js/lib/languages/diff';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import go from 'highlight.js/lib/languages/go';
import gradle from 'highlight.js/lib/languages/gradle';
import groovy from 'highlight.js/lib/languages/groovy';
import ini from 'highlight.js/lib/languages/ini';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import kotlin from 'highlight.js/lib/languages/kotlin';
import lua from 'highlight.js/lib/languages/lua';
import makefile from 'highlight.js/lib/languages/makefile';
import markdown from 'highlight.js/lib/languages/markdown';
import nginx from 'highlight.js/lib/languages/nginx';
import objectivec from 'highlight.js/lib/languages/objectivec';
import php from 'highlight.js/lib/languages/php';
import plaintext from 'highlight.js/lib/languages/plaintext';
import powershell from 'highlight.js/lib/languages/powershell';
import properties from 'highlight.js/lib/languages/properties';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import scss from 'highlight.js/lib/languages/scss';
import shell from 'highlight.js/lib/languages/shell';
import smali from 'highlight.js/lib/languages/smali';
import sql from 'highlight.js/lib/languages/sql';
import swift from 'highlight.js/lib/languages/swift';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import { cleanCodeContent, transformOutsideCode } from './markdownProcessor';

Object.entries({ bash, c, cmake, cpp, csharp, css, dart, diff, dockerfile, go, gradle, groovy, ini, java, javascript, json, kotlin, lua, makefile, markdown, nginx, objectivec, php, plaintext, powershell, properties, python, ruby, rust, scss, shell, smali, sql, swift, typescript, xml, yaml })
    .forEach(([name, language]) => hljs.registerLanguage(name, language));

const createMarkdownRenderer = () => {
    const mdInstance = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        highlight: function (str, lang) {
            const cleanedStr = cleanCodeContent(str);
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return '<pre data-language="' + mdInstance.utils.escapeHtml(lang) + '"><code class="hljs">' +
                        hljs.highlight(cleanedStr, { language: lang, ignoreIllegals: true }).value +
                        '</code></pre>';
                } catch { }
            }
            const langAttr = lang ? ' data-language="' + mdInstance.utils.escapeHtml(lang) + '"' : '';
            return '<pre' + langAttr + '><code class="hljs">' + mdInstance.utils.escapeHtml(cleanedStr) + '</code></pre>';
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

    const defaultCodeInline = mdInstance.renderer.rules.code_inline;
    mdInstance.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
        tokens[idx].content = cleanCodeContent(tokens[idx].content);
        return defaultCodeInline(tokens, idx, options, env, self);
    };

    const originalRender = mdInstance.render.bind(mdInstance);
    mdInstance.render = (src, env) => originalRender(
        transformOutsideCode(src, text => text
            .replace(/<a class="feed-link-tag"[^>]*?href="([^"]*)"[^>]*?>#(.*?)#<\/a>/g, '[#$2#](https://www.coolapk.com$1)')
            .replace(/<a class="feed-link-uname"[^>]*?href="([^"]*)"[^>]*?>(.*?)<\/a>/g, '[$2](https://www.coolapk.com$1)')),
        env
    );

    return mdInstance;
};

let markdownInstance = null;

export const getMarkdownRenderer = () => {
    if (!markdownInstance) {
        markdownInstance = createMarkdownRenderer();
    }
    return markdownInstance;
};
