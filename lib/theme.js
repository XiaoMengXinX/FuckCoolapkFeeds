import {useEffect, useState} from 'react';

// 用于检测和跟随系统主题的自定义 hook
export const useTheme = () => {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // 检查是否支持 matchMedia
        if (typeof window === 'undefined' || !window.matchMedia) {
            return;
        }

        // 获取系统主题偏好
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // 设置初始主题
        setTheme(mediaQuery.matches ? 'dark' : 'light');
        
        // 更新 body 类名
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(mediaQuery.matches ? 'dark-mode' : 'light-mode');

        // 监听主题变化
        const handleChange = (e) => {
            const newTheme = e.matches ? 'dark' : 'light';
            setTheme(newTheme);
            
            // 更新 body 类名
            document.body.classList.remove('light-mode', 'dark-mode');
            document.body.classList.add(newTheme === 'dark' ? 'dark-mode' : 'light-mode');
        };

        // 添加事件监听器
        mediaQuery.addEventListener('change', handleChange);

        // 清理函数
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    return theme;
};

// 动态加载 highlight.js 主题
export const useHighlightTheme = () => {
    useEffect(() => {
        // 创建或获取 highlight.js 样式链接
        let link = document.querySelector('link[data-highlight-theme]');
        
        if (!link) {
            link = document.createElement('link');
            link.rel = 'stylesheet';
            link.setAttribute('data-highlight-theme', 'true');
            document.head.appendChild(link);
        }

        // 动态更新 highlight.js 主题
        const updateHighlightTheme = () => {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            link.href = isDark
                ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css'
                : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css';
        };

        // 初始加载
        updateHighlightTheme();

        // 监听主题变化
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', updateHighlightTheme);

        return () => {
            mediaQuery.removeEventListener('change', updateHighlightTheme);
        };
    }, []);
};

export const getThemeStyles = (theme) => {
    const isDark = theme === 'dark';

    return {
        container: {
            color: isDark ? '#e0e0e0' : '#333',
        },
        header: {
            borderBottom: `1px solid ${isDark ? '#444' : '#eee'}`,
        },
        dateline: {
            color: isDark ? '#999' : '#888',
        },
        imageDescription: {
            color: isDark ? '#999' : '#666',
        },
        switchLabel: {
            color: isDark ? '#e0e0e0' : '#333',
        },
    };
};