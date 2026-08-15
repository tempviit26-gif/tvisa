const imageBaseUrl = 'https://d2se6r6dnwrhhc.cloudfront.net';

export function normalizeImageUrl(src) {
    if (!src || typeof src !== 'string') return '';
    if (!src.includes('res.cloudinary.com')) return src;

    try {
        const url = new URL(src);
        let parts = url.pathname.split('/').filter(Boolean);
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex >= 0) {
            parts = parts.slice(uploadIndex + 1);
        }
        if (parts[0] && /^v\d+$/.test(parts[0])) {
            parts = parts.slice(1);
        }
        if (parts[0] === 'media') {
            parts = parts.slice(1);
        }

        let key = parts.join('/');
        if (key && !/\.[a-z0-9]{2,5}$/i.test(key)) {
            key = `${key}.jpg`;
        }

        return key ? `${imageBaseUrl}/${key}` : src;
    } catch (e) {
        return src;
    }
}

export function getImageUrl(image) {
    if (!image) return '';
    if (typeof image === 'string') return normalizeImageUrl(image);
    return normalizeImageUrl(image.image_url || image.cloudinary_url || '');
}
