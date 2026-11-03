import { useEffect, useRef, useState } from 'react';

export function useIframePages(messageType, maxPages, enabled = true) {
    const [pages, setPages] = useState([1]);
    const [heights, setHeights] = useState({});
    const [loadingPages, setLoadingPages] = useState({ 1: true });
    const [isEmpty, setIsEmpty] = useState(false);
    const loaderRef = useRef(null);

    useEffect(() => {
        const onMessage = (e) => {
            if (e.origin !== window.location.origin || e.data?.type !== messageType) return;
            const page = e.data.page || 1;
            setHeights(prev => ({ ...prev, [page]: e.data.height }));
            setLoadingPages(prev => ({ ...prev, [page]: false }));
            if (page === 1 && e.data.isEmpty) setIsEmpty(true);
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [messageType]);

    const lastPage = pages[pages.length - 1];
    const canLoadMore = enabled && !isEmpty && lastPage < maxPages && !loadingPages[lastPage];

    useEffect(() => {
        if (!canLoadMore || !loaderRef.current) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            setPages(prev => [...prev, lastPage + 1]);
            setLoadingPages(prev => ({ ...prev, [lastPage + 1]: true }));
        }, { rootMargin: '100px' });

        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [canLoadMore, lastPage]);

    return {
        pages,
        getHeight: (page) => heights[page] || 100,
        isLoading: (page) => Boolean(loadingPages[page]),
        isEmpty,
        isFinished: lastPage === maxPages && !loadingPages[maxPages],
        loaderRef,
    };
}
