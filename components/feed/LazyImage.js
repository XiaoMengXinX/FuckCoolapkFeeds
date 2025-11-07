import { useEffect, useState, useRef } from 'react';

export const LazyImage = ({ src, alt, style, onClick }) => {
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
                <div className="lazy-image-loading">
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