import { useEffect, useState, useRef } from 'react';
import { LazyImage } from './LazyImage';
import { styles } from '../../styles/feedStyles';

export const ImageCarousel = ({ images, onImageClick }) => {
    const scrollContainer = useRef(null);
    const [carouselHeight, setCarouselHeight] = useState('600px'); // Default max height

    useEffect(() => {
        if (images && images.length > 0 && scrollContainer.current) {
            const firstImageSrc = images[0];
            const containerWidth = scrollContainer.current.offsetWidth;
            const defaultHeight = containerWidth * 4 / 3;

            const img = new Image();
            img.src = firstImageSrc;

            img.onload = () => {
                const imageAspectRatio = img.height / img.width;
                const calculatedImageHeight = containerWidth * imageAspectRatio;

                if (calculatedImageHeight < defaultHeight) {
                    setCarouselHeight(`${calculatedImageHeight}px`);
                } else {
                    setCarouselHeight(`${Math.min(defaultHeight, 600)}px`);
                }
            };
        }
    }, [images]);

    const scroll = (direction) => {
        if (scrollContainer.current) {
            const scrollAmount = scrollContainer.current.offsetWidth;
            scrollContainer.current.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
        }
    };

    const dynamicCarouselStyle = {
        ...styles.carousel,
        maxHeight: carouselHeight,
    };
    
    const dynamicImageContainerStyle = {
        ...styles.carouselImageContainer,
        height: carouselHeight,
    };

    return (
        <div style={styles.carouselContainer}>
            {images.length > 1 && (
                <>
                    <button onClick={() => scroll(-1)} style={{...styles.carouselButton, left: '10px'}}>{'<'}</button>
                    <button onClick={() => scroll(1)} style={{...styles.carouselButton, right: '10px'}}>{'>'}</button>
                </>
            )}
            <div ref={scrollContainer} style={dynamicCarouselStyle}>
                {images.map((img, index) => (
                    <div key={index} style={dynamicImageContainerStyle}>
                        <LazyImage
                            src={img}
                            alt={`carousel-image-${index}`}
                            style={styles.carouselImage}
                            onClick={() => onImageClick(img)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};