import JSZip from 'jszip';
import { VaultPackFile, ExportedSticker, CanvasScene, StickerRarity } from '../types';

export interface ParsedZipResult {
  mainPack: VaultPackFile;
  allPacks?: VaultPackFile[];
  isBundle?: boolean;
  bundleTitle?: string;
  sourceFilename?: string;
}

/**
 * Clean a filename slug into a human-readable title.
 * e.g. "01-cosmic-astronaut.png" -> "Cosmic Astronaut"
 */
function cleanImageTitle(filename: string): string {
  const base = filename.split('/').pop() || filename;
  const noExt = base.replace(/\.[^/.]+$/, '');
  const noPrefix = noExt.replace(/^\d+[-_]*/, '');
  const words = noPrefix.split(/[-_]+/).filter(Boolean);
  if (words.length === 0) return 'Sticker';
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Determine MIME type based on file extension.
 */
function getMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'image/png';
}

/**
 * Asynchronously extract an image file from JSZip into a Data URL.
 */
async function zipFileToDataUrl(zipFile: JSZip.JSZipObject): Promise<string> {
  const mime = getMimeType(zipFile.name);
  if (mime === 'image/svg+xml') {
    const text = await zipFile.async('text');
    if (text.trim().startsWith('<svg')) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(text.trim())}`;
    }
  }
  const base64 = await zipFile.async('base64');
  return `data:${mime};base64,${base64}`;
}

/**
 * Parse a single pack from a JSZip instance or subfolder.
 */
async function parseSinglePackFromZip(
  zip: JSZip,
  packPrefix = '',
  defaultPackName = 'Imported Pack'
): Promise<VaultPackFile> {
  // 1. Locate manifest.json in this pack's directory
  const manifestPath = packPrefix ? `${packPrefix}manifest.json` : 'manifest.json';
  let manifestFile = zip.file(manifestPath);

  // Fallback: look for any file ending with manifest.json under packPrefix
  if (!manifestFile) {
    const candidatePaths = Object.keys(zip.files).filter((k) =>
      packPrefix ? k.startsWith(packPrefix) && k.endsWith('manifest.json') : k.endsWith('manifest.json')
    );
    if (candidatePaths.length > 0) {
      manifestFile = zip.file(candidatePaths[0]);
    }
  }

  let manifestData: any = null;
  if (manifestFile) {
    try {
      const manifestText = await manifestFile.async('text');
      manifestData = JSON.parse(manifestText);
    } catch (err) {
      console.warn('[parseSinglePackFromZip] Manifest parse error:', err);
    }
  }

  const packName = manifestData?.name || defaultPackName;
  const author = manifestData?.author || 'StickerBook Creator';
  const theme = manifestData?.theme || packName;
  const description = manifestData?.description || 'Imported StickerBook pack';
  const packIcon = manifestData?.icon || '📦';

  // 2. Extract stickers
  const stickers: ExportedSticker[] = [];

  if (manifestData?.stickers && Array.isArray(manifestData.stickers) && manifestData.stickers.length > 0) {
    // Structured manifest: load files referenced by manifest
    for (let i = 0; i < manifestData.stickers.length; i++) {
      const item = manifestData.stickers[i];
      let foundFile: JSZip.JSZipObject | null = null;

      if (item.filename) {
        const fullPath = packPrefix ? `${packPrefix}${item.filename.replace(/^\/+/, '')}` : item.filename;
        foundFile = zip.file(fullPath);
        if (!foundFile) {
          const justName = item.filename.split('/').pop();
          const matches = Object.keys(zip.files).filter(
            (k) => (packPrefix ? k.startsWith(packPrefix) : true) && k.endsWith(`/${justName}`)
          );
          if (matches.length > 0) {
            foundFile = zip.file(matches[0]);
          }
        }
      }

      if (foundFile) {
        try {
          const dataUrl = await zipFileToDataUrl(foundFile);
          stickers.push({
            id: item.id || `stk-import-${Date.now()}-${i + 1}`,
            name: item.name || cleanImageTitle(foundFile.name),
            rarity: (item.rarity as StickerRarity) || 'Common',
            color: item.color || 'text-indigo-400',
            description: item.description || 'Imported sticker',
            svgIcon: dataUrl,
          });
        } catch (err) {
          console.warn(`Failed to extract sticker ${item.name}:`, err);
        }
      }
    }
  }

  // Fallback if manifest had no stickers or no manifest: scan image files in pack directory
  if (stickers.length === 0) {
    const imageExtensions = ['.png', '.webp', '.jpg', '.jpeg', '.svg'];
    const packFiles = Object.keys(zip.files).filter((k) => {
      if (packPrefix && !k.startsWith(packPrefix)) return false;
      if (k.includes('__MACOSX/') || k.endsWith('.DS_Store') || k.endsWith('/')) return false;
      const lower = k.toLowerCase();
      // Exclude backdrops from stickers
      if (lower.includes('backdrop') || lower.includes('background')) return false;
      return imageExtensions.some((ext) => lower.endsWith(ext));
    });

    for (let i = 0; i < packFiles.length; i++) {
      const filePath = packFiles[i];
      const zFile = zip.file(filePath);
      if (zFile) {
        try {
          const dataUrl = await zipFileToDataUrl(zFile);
          stickers.push({
            id: `stk-zip-${Date.now()}-${i + 1}`,
            name: cleanImageTitle(filePath),
            rarity: 'Common',
            color: 'text-indigo-400',
            description: 'Imported from .zip archive',
            svgIcon: dataUrl,
          });
        } catch (err) {
          console.warn(`Failed to read image ${filePath}:`, err);
        }
      }
    }
  }

  // 3. Extract Companion Backdrop Scene
  let themeScene: Omit<CanvasScene, 'id' | 'packId'> | undefined = undefined;
  let backdropFile: JSZip.JSZipObject | null = null;

  if (manifestData?.backdrop) {
    const bgName = typeof manifestData.backdrop === 'string'
      ? manifestData.backdrop
      : manifestData.backdrop.filename;
    if (bgName) {
      const fullBgPath = packPrefix ? `${packPrefix}${bgName.replace(/^\/+/, '')}` : bgName;
      backdropFile = zip.file(fullBgPath);
      if (!backdropFile) {
        const justBgName = bgName.split('/').pop();
        const matches = Object.keys(zip.files).filter(
          (k) => (packPrefix ? k.startsWith(packPrefix) : true) && k.endsWith(`/${justBgName}`)
        );
        if (matches.length > 0) backdropFile = zip.file(matches[0]);
      }
    }
  }

  // Fallback: look for any backdrop image
  if (!backdropFile) {
    const backdropMatches = Object.keys(zip.files).filter((k) => {
      if (packPrefix && !k.startsWith(packPrefix)) return false;
      if (k.includes('__MACOSX/') || k.endsWith('/')) return false;
      const lower = k.toLowerCase();
      return (
        (lower.includes('backdrop') || lower.includes('background')) &&
        (lower.endsWith('.png') || lower.endsWith('.webp') || lower.endsWith('.jpg') || lower.endsWith('.jpeg'))
      );
    });
    if (backdropMatches.length > 0) {
      backdropFile = zip.file(backdropMatches[0]);
    }
  }

  if (backdropFile) {
    try {
      const bgDataUrl = await zipFileToDataUrl(backdropFile);
      const sceneConfig = manifestData?.sceneConfig;
      themeScene = {
        name: manifestData?.backdrop?.theme || sceneConfig?.name || `${packName} Backdrop`,
        theme: manifestData?.backdrop?.theme || sceneConfig?.theme || theme,
        bgGradient: sceneConfig?.bgGradient || 'bg-slate-950',
        pattern: 'custom-image',
        customConfig: {
          type: 'image',
          imageUrl: bgDataUrl,
          fitMode: sceneConfig?.customConfig?.fitMode || sceneConfig?.fitMode || 'cover',
          opacity: sceneConfig?.customConfig?.opacity ?? sceneConfig?.opacity ?? 100,
          dimming: sceneConfig?.customConfig?.dimming ?? sceneConfig?.dimming ?? 0,
          blur: sceneConfig?.customConfig?.blur ?? sceneConfig?.blur ?? 0,
          gridOverlay: sceneConfig?.customConfig?.gridOverlay || sceneConfig?.gridOverlay || 'none',
        },
      };
    } catch (err) {
      console.warn('[parseSinglePackFromZip] Failed to extract backdrop image:', err);
    }
  }

  return {
    version: 1,
    format: 'stickerbook-vault-pack',
    packType: themeScene ? 'combo' : 'stickers-only',
    name: packName,
    author,
    theme,
    description,
    icon: packIcon || (stickers.length > 0 ? '📦' : '🎨'),
    stickers,
    themeScene,
    createdAt: Date.now(),
  };
}

/**
 * Main entrance: Parse a .zip file (Single Pack ZIP or Master Bundle ZIP).
 */
export async function parsePackZip(file: File | Blob): Promise<ParsedZipResult> {
  const fileName = (file as File).name || 'stickerbook-pack.zip';
  const zip = await JSZip.loadAsync(file);

  // 1. Check for Master Bundle manifest
  const masterManifestFile = zip.file('master-manifest.json');
  if (masterManifestFile) {
    try {
      const masterText = await masterManifestFile.async('text');
      const masterData = JSON.parse(masterText);
      const packs: VaultPackFile[] = [];

      if (Array.isArray(masterData.packs)) {
        for (const pInfo of masterData.packs) {
          const folderPrefix = pInfo.folder ? `${pInfo.folder.replace(/\/+$/, '')}/` : '';
          const parsed = await parseSinglePackFromZip(zip, folderPrefix, pInfo.name);
          if (parsed.stickers?.length || parsed.themeScene) {
            packs.push(parsed);
          }
        }
      }

      if (packs.length > 0) {
        return {
          mainPack: packs[0],
          allPacks: packs,
          isBundle: true,
          bundleTitle: masterData.bundle || 'StickerBook Master Theme Bundle',
          sourceFilename: fileName,
        };
      }
    } catch (err) {
      console.warn('[parsePackZip] Master manifest parse failed, falling back:', err);
    }
  }

  // 2. Detect multiple subdirectories with manifest.json (bundle without master-manifest)
  const allManifestFiles = Object.keys(zip.files).filter(
    (k) => k.endsWith('manifest.json') && !k.includes('__MACOSX')
  );

  if (allManifestFiles.length > 1) {
    const packs: VaultPackFile[] = [];
    for (const mPath of allManifestFiles) {
      const prefix = mPath.substring(0, mPath.lastIndexOf('/') + 1);
      const parsed = await parseSinglePackFromZip(zip, prefix, 'Pack');
      if (parsed.stickers?.length || parsed.themeScene) {
        packs.push(parsed);
      }
    }
    if (packs.length > 0) {
      return {
        mainPack: packs[0],
        allPacks: packs,
        isBundle: true,
        bundleTitle: 'Multi-Pack Bundle',
        sourceFilename: fileName,
      };
    }
  }

  // 3. Single Pack ZIP
  const rootPack = await parseSinglePackFromZip(
    zip,
    '',
    fileName.replace(/\.zip$/i, '').replace(/[-_]+/g, ' ')
  );

  return {
    mainPack: rootPack,
    isBundle: false,
    sourceFilename: fileName,
  };
}
