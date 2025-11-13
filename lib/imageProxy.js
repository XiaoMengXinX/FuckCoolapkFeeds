export const proxyImage = (url) => {
    if (url && (url.includes('image.coolapk.com') || url.includes('avatar.coolapk.com') || url.includes('static.coolapk.com'))) {
        return `https://image.coolapk1s.com/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
};