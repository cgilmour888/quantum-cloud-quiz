import { assetPath } from '../../../../utils/assetPath.js';

const ROOT = 'images/master/derived/border-frame';

export function selectBorderAtlasVariant(width, height) {
  const longest = Math.max(Number(width) || 0, Number(height) || 0);
  if (longest <= 1920) return '1080';
  if (longest <= 2560) return '1440';
  return '2160';
}

export function getBorderFrameAssetUrls(variant) {
  const normalized = ['1080', '1440', '2160'].includes(String(variant))
    ? String(variant)
    : '2160';

  return Object.freeze({
    manifest: assetPath(`${ROOT}/manifest.json`),
    emissiveAtlas: assetPath(`${ROOT}/runtime/${normalized}/border-emissive-atlas.png`),
    dataAtlas: assetPath(`${ROOT}/runtime/${normalized}/border-data-atlas.png`),
  });
}

export async function loadBorderFrameImage(url) {
  const image = new Image();
  image.decoding = 'async';
  image.loading = 'eager';
  image.src = url;
  await image.decode();
  return image;
}

export async function loadBorderFrameManifest(url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Unable to load BorderFrameEngine manifest: ${response.status}`);
  }
  return response.json();
}
