// Hero and page images are served from our own domain as WebP (see backend/src/routes/media.js),
// so the browser never waits on a third-party host. The server fetches each size from Unsplash
// once, stores it on disk and serves it with a long cache lifetime.

export const MEDIA_WIDTHS = [480, 768, 1080, 1440, 1920];

// Only these photos can be served through /media, so the route cannot be used as an open proxy.
export const MEDIA_PHOTOS = new Set([
  'photo-1450101499163-c8848c66ca85',
  'photo-1497366754035-f200968a6e72',
  'photo-1503376780353-7e6692767b70',
  'photo-1506306460327-3164753b74c7',
  'photo-1521791136064-7986c2920216',
  'photo-1558618666-fcd25c85cd64',
  'photo-1566576721346-d4a3b4eaeb55',
  'photo-1570125909232-eb263c188f7e',
  'photo-1581092160607-ee22621dd758',
  'photo-1592838064575-70ed626d3a0e',
  'photo-1601584115197-04ecc0da31d7',
  'photo-1619642751034-765dfdf7c58e'
]);

export function mediaPath(photoId, width) {
  return `/media/${photoId}-${width}.webp`;
}

export function unsplashSource(photoId, width) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=80&fm=webp`;
}

/** Local WebP src/srcSet for an allowed photo, or null when the photo is not in MEDIA_PHOTOS. */
export function localImageSet(photoId, maxWidth = 1920) {
  if (!MEDIA_PHOTOS.has(photoId)) return null;
  const widths = MEDIA_WIDTHS.filter((width) => width <= Math.max(maxWidth, MEDIA_WIDTHS[0]));
  const largest = widths[widths.length - 1];
  return {
    src: mediaPath(photoId, largest),
    srcSet: widths.map((width) => `${mediaPath(photoId, width)} ${width}w`).join(', ')
  };
}

/** Pulls the photo id and requested width out of an images.unsplash.com URL. */
export function parseUnsplash(src) {
  const match = String(src || '').match(/^https:\/\/images\.unsplash\.com\/(photo-[0-9a-f]+-[0-9a-f]+)(?:\?(.*))?$/);
  if (!match) return null;
  const width = Number(new URLSearchParams(match[2] || '').get('w')) || 1920;
  return { photoId: match[1], width };
}

// Hero photo per page, used by the server to preload the image the page will show first.
export const pageHeroImages = {
  home: { photoId: 'photo-1601584115197-04ecc0da31d7', width: 1800 },
  trucks: { photoId: 'photo-1506306460327-3164753b74c7', width: 1800 },
  about: { photoId: 'photo-1581092160607-ee22621dd758', width: 1800 },
  contact: { photoId: 'photo-1497366754035-f200968a6e72', width: 1800 },
  faq: { photoId: 'photo-1521791136064-7986c2920216', width: 1800 },
  partExchange: { photoId: 'photo-1592838064575-70ed626d3a0e', width: 1800 },
  privacy: { photoId: 'photo-1450101499163-c8848c66ca85', width: 1800 },
  location: { photoId: 'photo-1601584115197-04ecc0da31d7', width: 1800 }
};
