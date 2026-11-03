// Coolapk image URLs end with `@{width}x{height}.{ext}`.
export const getImageSize = (url) => {
    const match = url?.match(/@(\d+)x(\d+)\.[a-z]+$/i);
    return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
};

const PROXIED_HOSTS = ['image.coolapk.com', 'avatar.coolapk.com', 'static.coolapk.com'];

const proxify = (url) => {
    if (url && PROXIED_HOSTS.some(host => url.includes(host))) {
        return `https://image.coolapk1s.com/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
};

// image.coolapk.com serves JPEG variants when a suffix is appended:
// `.xs.jpg` is a 480px square crop, `.s.jpg` and `.m.jpg` keep the aspect ratio at 720px and 1080px wide.
const VARIANT_WIDTHS = { xs: 480, s: 720, m: 1080 };

const withThumbnail = (url, size) => {
    if (!size || !url?.includes('image.coolapk.com/') || url.includes('?')) return url;
    // Variants are upscaled when the original is narrower, which only adds bytes.
    if (size !== 'xs' && (getImageSize(url)?.width ?? Infinity) <= VARIANT_WIDTHS[size]) return url;
    return `${url}.${size}.jpg`;
};

const isGif = (url) => /\.gif$/i.test(url || '');

// Animated GIFs stay original because the variants are static.
export const proxyImage = (url, size) => proxify(isGif(url) ? url : withThumbnail(url, size));

// For small previews a static frame is enough, so GIFs are thumbnailed too.
export const proxyPreviewImage = (url) => proxify(withThumbnail(url, 'xs'));
