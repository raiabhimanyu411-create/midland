import { localImageSet, parseUnsplash } from '../../../shared/images.js';

// Responsive sizes for Unsplash images. Known photos are served from our own domain as WebP
// (see shared/images.js); any other Unsplash URL is resized via its `w` parameter. Other image
// URLs, e.g. uploads, are returned unchanged.
const WIDTHS = [480, 768, 1080, 1440, 1920];

export function responsiveImage(src, sizes = '100vw') {
  const unsplash = parseUnsplash(src);
  if (!unsplash) return { src };

  const local = localImageSet(unsplash.photoId, unsplash.width);
  if (local) return { ...local, sizes };

  const url = new URL(src);
  const srcSet = WIDTHS.filter((width) => width <= Math.max(unsplash.width, WIDTHS[0]))
    .map((width) => {
      url.searchParams.set('w', String(width));
      return `${url.toString()} ${width}w`;
    })
    .join(', ');
  return { src, srcSet, sizes };
}
