import { Router } from 'express';
import { existsSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from '../config/paths.js';
import { MEDIA_PHOTOS, MEDIA_WIDTHS, unsplashSource } from '../../../shared/images.js';

// Self-hosted WebP copies of the site's hero photos. The first request for a size downloads it
// from Unsplash and stores it on disk; after that it is served straight from our own server.
const mediaDir = process.env.MEDIA_CACHE_DIR
  ? path.resolve(projectRoot, process.env.MEDIA_CACHE_DIR)
  : path.join(projectRoot, 'storage', 'media');
const FILE_PATTERN = /^(photo-[0-9a-f]+-[0-9a-f]+)-(\d+)\.webp$/;
const MAX_BYTES = 5 * 1024 * 1024;
const inFlight = new Map();

async function download(photoId, width, target) {
  const response = await fetch(unsplashSource(photoId, width), { signal: AbortSignal.timeout(15000) });
  const type = response.headers.get('content-type') || '';
  if (!response.ok || !type.startsWith('image/webp')) throw new Error(`Image download failed (${response.status} ${type})`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_BYTES) throw new Error('Image download had an unexpected size');
  await mkdir(mediaDir, { recursive: true });
  const temp = `${target}.${process.pid}.tmp`;
  await writeFile(temp, buffer);
  await rename(temp, target);
}

export const mediaRouter = Router();

mediaRouter.get('/:file', async (req, res, next) => {
  const match = String(req.params.file).match(FILE_PATTERN);
  const photoId = match?.[1];
  const width = Number(match?.[2]);
  if (!match || !MEDIA_PHOTOS.has(photoId) || !MEDIA_WIDTHS.includes(width)) return res.status(404).end();

  const target = path.join(mediaDir, `${photoId}-${width}.webp`);
  try {
    if (!existsSync(target)) {
      const key = `${photoId}-${width}`;
      if (!inFlight.has(key)) inFlight.set(key, download(photoId, width, target).finally(() => inFlight.delete(key)));
      await inFlight.get(key);
    }
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.type('image/webp').sendFile(target, (error) => error && !res.headersSent && next(error));
  } catch (error) {
    // Never show a broken image: fall back to the original Unsplash URL until the copy is cached.
    console.error('Media cache failed', photoId, width, error.message);
    res.set('Cache-Control', 'no-store').redirect(302, unsplashSource(photoId, width));
  }
});

/** Downloads the hero sizes in the background at startup so the first visitor gets a cached copy. */
export async function warmMediaCache(images) {
  for (const { photoId, width: maxWidth } of images) {
    for (const width of MEDIA_WIDTHS.filter((size) => size <= maxWidth)) {
      const target = path.join(mediaDir, `${photoId}-${width}.webp`);
      if (existsSync(target)) continue;
      try {
        await download(photoId, width, target);
      } catch (error) {
        console.error('Media warm-up failed', photoId, width, error.message);
        return;
      }
    }
  }
}
