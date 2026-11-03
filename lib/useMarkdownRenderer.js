import { useEffect, useState } from 'react';

let rendererPromise = null;

// markdown-it and highlight.js are only downloaded once a post actually needs markdown rendering.
export function useMarkdownRenderer(enabled) {
    const [md, setMd] = useState(null);

    useEffect(() => {
        if (!enabled || md) return;

        let cancelled = false;
        rendererPromise ||= import('./markdownRenderer').then(m => m.getMarkdownRenderer());
        rendererPromise.then(renderer => {
            if (!cancelled) setMd(renderer);
        });
        return () => { cancelled = true; };
    }, [enabled, md]);

    return md;
}
