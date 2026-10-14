import JSZip from 'jszip';
import { Sticker, StickerPack, CanvasScene } from '../types';

/**
 * Converts any sticker icon (WebP/PNG image URL, Data URL, raw SVG string, or emoji)
 * into a PNG Blob using an in-memory HTML5 Canvas with transparent background.
 */
export async function stickerIconToPngBlob(
  icon: string,
  targetSize = 256
): Promise<Blob> {
  const trimmed = (icon || '').trim();

  // 1. Raw SVG markup
  if (trimmed.startsWith('<svg')) {
    const svgBlob = new Blob([trimmed], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    try {
      return await renderUrlToPngBlob(url, targetSize, targetSize);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // 2. Image URL or Data URL (including /stickers/*.webp, /backdrops/*.webp, data:image/...)
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/') ||
    trimmed.endsWith('.webp') ||
    trimmed.endsWith('.png') ||
    trimmed.endsWith('.jpg') ||
    trimmed.endsWith('.jpeg')
  ) {
    try {
      // First try fetching as blob to bypass any cross-origin taint or decoder quirks
      const response = await fetch(trimmed);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      try {
        return await renderUrlToPngBlob(objectUrl, targetSize);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      // Fallback direct URL render
      return await renderUrlToPngBlob(trimmed, targetSize);
    }
  }

  // 3. Emoji or Unicode symbol
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.clearRect(0, 0, targetSize, targetSize);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(targetSize * 0.72)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;
  ctx.fillText(trimmed, targetSize / 2, targetSize / 2 + targetSize * 0.05);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate PNG blob from emoji'));
    }, 'image/png');
  });
}

/**
 * Loads an image from a URL and renders it onto a canvas to export as a transparent PNG Blob.
 */
function renderUrlToPngBlob(
  src: string,
  preferredSize = 256,
  explicitHeight?: number
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const naturalW = img.naturalWidth || img.width || preferredSize;
      const naturalH = img.naturalHeight || img.height || (explicitHeight || preferredSize);

      // Use native dimensions if available for 1:1 pixel perfection, or scale to preferredSize
      const w = naturalW > 0 ? naturalW : preferredSize;
      const h = naturalH > 0 ? naturalH : (explicitHeight || preferredSize);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Could not get 2D canvas context'));
        return;
      }

      // Ensure transparent background
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed for PNG'));
      }, 'image/png');
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image from ${src}`));
    };

    img.src = src;
  });
}

/**
 * Helper to download any generated Blob as a file in the browser.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

/**
 * Sanitize a string into a clean lowercase filename slug.
 */
function toSlug(str: string): string {
  return (str || 'item')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Exports a single StickerPack as a .zip file containing high-resolution .png images for all stickers.
 */
export async function exportPackAsPngZip(
  pack: StickerPack,
  companionScene?: CanvasScene,
  onProgress?: (current: number, total: number, itemName: string) => void
): Promise<void> {
  const zip = new JSZip();
  const packSlug = toSlug(pack.name || 'sticker-pack');
  const stickersFolder = zip.folder('stickers');

  const totalItems = pack.stickers.length + (companionScene?.customConfig?.imageUrl ? 1 : 0);
  let processed = 0;

  // 1. Process all stickers in parallel or sequential
  for (let i = 0; i < pack.stickers.length; i++) {
    const sticker = pack.stickers[i];
    const indexStr = String(i + 1).padStart(2, '0');
    const stickerSlug = toSlug(sticker.name || `sticker-${i + 1}`);
    const filename = `${indexStr}-${stickerSlug}.png`;

    if (onProgress) {
      onProgress(processed + 1, totalItems, sticker.name);
    }

    try {
      const pngBlob = await stickerIconToPngBlob(sticker.svgIcon, 256);
      stickersFolder?.file(filename, pngBlob);
    } catch (err) {
      console.warn(`[exportPackAsPngZip] Failed to convert ${sticker.name} to PNG:`, err);
    }
    processed++;
  }

  // 2. Include Companion Backdrop image if present
  let backdropFilename: string | undefined = undefined;
  if (companionScene?.customConfig?.imageUrl) {
    if (onProgress) {
      onProgress(processed + 1, totalItems, 'Backdrop Scene');
    }
    try {
      const bgBlob = await stickerIconToPngBlob(companionScene.customConfig.imageUrl, 1920);
      backdropFilename = `backdrop-${toSlug(companionScene.name || 'theme')}.png`;
      zip.file(backdropFilename, bgBlob);
    } catch (err) {
      console.warn('[exportPackAsPngZip] Failed to export backdrop image:', err);
    }
    processed++;
  }

  // 3. Manifest metadata JSON
  const manifest = {
    format: 'stickerbook-png-pack-export',
    version: 1,
    packId: pack.id,
    name: pack.name,
    theme: pack.theme,
    description: pack.description,
    author: pack.author || 'StickerBook STUDIO',
    icon: pack.icon,
    stickersCount: pack.stickers.length,
    stickers: pack.stickers.map((s, idx) => ({
      index: idx + 1,
      id: s.id,
      name: s.name,
      rarity: s.rarity,
      description: s.description,
      filename: `stickers/${String(idx + 1).padStart(2, '0')}-${toSlug(s.name || `sticker-${idx + 1}`)}.png`,
    })),
    backdrop: backdropFilename ? { filename: backdropFilename, theme: companionScene?.theme } : undefined,
    exportedAt: new Date().toISOString(),
    exportedBy: 'ThemePack STUDIO (StickerBook STUDIO)',
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 4. Human-readable README.txt
  const readmeContent = [
    `StickerBook ThemePack STUDIO - PNG Pack Export`,
    `============================================`,
    `Pack Name:    ${pack.name}`,
    `Theme:        ${pack.theme || 'Standard'}`,
    `Author:       ${pack.author || 'StickerBook STUDIO'}`,
    `Description:  ${pack.description || 'Collectible sticker pack'}`,
    `Stickers:     ${pack.stickers.length} PNG images with transparent backgrounds`,
    ``,
    `Sticker Manifest:`,
    ...pack.stickers.map(
      (s, idx) =>
        `  ${String(idx + 1).padStart(2, '0')}. ${s.name} [${s.rarity}] -> stickers/${String(idx + 1).padStart(2, '0')}-${toSlug(s.name || `sticker-${idx + 1}`)}.png`
    ),
    ``,
    backdropFilename ? `Companion Backdrop: ${backdropFilename}` : '',
    ``,
    `Exported: ${new Date().toLocaleString()}`,
  ]
    .filter(Boolean)
    .join('\n');

  zip.file('README.txt', readmeContent);

  // 5. Generate ZIP Blob and trigger download
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const downloadFilename = `${packSlug}-stickers-png.zip`;
  downloadBlob(zipBlob, downloadFilename);
}

/**
 * Exports all Core Theme Packs together in a structured master .zip file.
 * Each core pack receives its own dedicated folder containing its transparent .png stickers,
 * companion backdrop (if present), and pack manifest.
 */
export async function exportAllCorePacksAsZip(
  corePacks: StickerPack[],
  scenes: CanvasScene[],
  onProgress?: (packIndex: number, totalPacks: number, currentPackName: string) => void
): Promise<void> {
  const masterZip = new JSZip();

  for (let pIdx = 0; pIdx < corePacks.length; pIdx++) {
    const pack = corePacks[pIdx];
    if (onProgress) {
      onProgress(pIdx + 1, corePacks.length, pack.name);
    }

    const companionScene =
      (pack.themeSceneId ? scenes.find((s) => s.id === pack.themeSceneId) : undefined) ||
      scenes.find((s) => s.packId === pack.id);

    const packFolder = masterZip.folder(toSlug(pack.name || `pack-${pIdx + 1}`));
    const stickersFolder = packFolder?.folder('stickers');

    // Convert each sticker
    for (let sIdx = 0; sIdx < pack.stickers.length; sIdx++) {
      const sticker = pack.stickers[sIdx];
      const indexStr = String(sIdx + 1).padStart(2, '0');
      const stickerSlug = toSlug(sticker.name || `sticker-${sIdx + 1}`);
      const filename = `${indexStr}-${stickerSlug}.png`;

      try {
        const pngBlob = await stickerIconToPngBlob(sticker.svgIcon, 256);
        stickersFolder?.file(filename, pngBlob);
      } catch (err) {
        console.warn(`[exportAllCorePacksAsZip] Failed for ${sticker.name}:`, err);
      }
    }

    // Companion backdrop
    let bgFilename: string | undefined = undefined;
    if (companionScene?.customConfig?.imageUrl) {
      try {
        const bgBlob = await stickerIconToPngBlob(companionScene.customConfig.imageUrl, 1920);
        bgFilename = `backdrop-${toSlug(companionScene.name || 'theme')}.png`;
        packFolder?.file(bgFilename, bgBlob);
      } catch (err) {
        console.warn('[exportAllCorePacksAsZip] Failed backdrop:', err);
      }
    }

    // Pack Manifest
    const packManifest = {
      packId: pack.id,
      name: pack.name,
      theme: pack.theme,
      description: pack.description,
      stickersCount: pack.stickers.length,
      stickers: pack.stickers.map((s, idx) => ({
        index: idx + 1,
        id: s.id,
        name: s.name,
        rarity: s.rarity,
        filename: `stickers/${String(idx + 1).padStart(2, '0')}-${toSlug(s.name || `sticker-${idx + 1}`)}.png`,
      })),
      backdrop: bgFilename,
    };
    packFolder?.file('manifest.json', JSON.stringify(packManifest, null, 2));
  }

  // Master Manifest
  const masterManifest = {
    bundle: 'stickerbook-core-theme-packs-png-bundle',
    version: 1,
    exportedAt: new Date().toISOString(),
    packsCount: corePacks.length,
    packs: corePacks.map((p) => ({
      id: p.id,
      name: p.name,
      theme: p.theme,
      stickersCount: p.stickers.length,
      folder: toSlug(p.name || 'pack'),
    })),
  };
  masterZip.file('master-manifest.json', JSON.stringify(masterManifest, null, 2));

  // Master README.txt
  const masterReadme = [
    `StickerBook Core Theme Packs - PNG Master Archive`,
    `==============================================`,
    `Included Core Packs: ${corePacks.length}`,
    ``,
    ...corePacks.map(
      (p, i) =>
        `${i + 1}. ${p.name} (${p.stickers.length} stickers) -> /${toSlug(p.name || 'pack')}/`
    ),
    ``,
    `Each pack folder contains:`,
    `- stickers/ directory with clean transparent .png images (256x256)`,
    `- backdrop image (if applicable)`,
    `- manifest.json`,
    ``,
    `Generated by ThemePack STUDIO.`,
  ].join('\n');
  masterZip.file('README.txt', masterReadme);

  // Generate & download
  const zipBlob = await masterZip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  downloadBlob(zipBlob, 'stickerbook-core-theme-packs-png.zip');
}
