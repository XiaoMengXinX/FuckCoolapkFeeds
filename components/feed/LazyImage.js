import { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../lib/theme';

export const LazyImage = ({ src, alt, style, onClick }) => {
    const theme = useTheme();
    const [imageSrc, setImageSrc] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const imageRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setImageSrc(src);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: '200px', // Preload images 200px before they enter the viewport
            }
        );

        if (imageRef.current) {
            observer.observe(imageRef.current);
        }

        return () => {
            if (imageRef.current) {
                observer.unobserve(imageRef.current);
            }
        };
    }, [src]);

    const handleImageLoad = () => {
        setLoaded(true);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {!loaded && imageSrc && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f0f0f0',
                    color: theme === 'dark' ? '#666' : '#aaa',
                }}>
                    Loading...
                </div>
            )}
            <img
                ref={imageRef}
                src={imageSrc}
                alt={alt}
                style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
                onClick={onClick}
                onLoad={handleImageLoad}
            />
        </div>
    );
};