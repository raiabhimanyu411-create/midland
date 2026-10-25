// Responsive sizes for Unsplash images (they resize on the fly via the `w` parameter and already
// serve WebP/AVIF through `auto=format`). Other image URLs, e.g. uploads, are returned unchanged.
const WIDTHS = [480, 768, 1080, 1440, 1920];

export function responsiveImage(src, sizes = '100vw') {
  if (!src || !/^https:\/\/images\.unsplash\.com\//.test(src)) return { src };
  const url = new URL(src);
  const maxWidth = Number(url.searchParams.get('w')) || 1920;
  const srcSet = WIDTHS.filter((width) => width <= Math.max(maxWidth, WIDTHS[0]))
    .map((width) => {
      url.searchParams.set('w', String(width));
      return `${url.toString()} ${width}w`;
    })
    .join(', ');
  return { src, srcSet, sizes };
}
