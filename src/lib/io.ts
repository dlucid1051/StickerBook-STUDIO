import { CanvasScene, DEFAULT_SETTINGS, ExportedSticker, PlacedSticker, Sticker, StickerPack, StickerRarity, StudySettings, VaultPackFile } from '../types';
import { INITIAL_STICKER_PACKS } from '../data/stickerPacks';

/**
 * Trigger file download in browser
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// LocalStorage Keys
const STORAGE_UNLOCKED_STICKERS = 'braingrid_unlocked_stickers';
const STORAGE_PLACED_STICKERS = 'braingrid_placed_stickers';
const STORAGE_SETTINGS = 'braingrid_settings';
const STORAGE_CANVAS_SCENE = 'braingrid_canvas_scene';
import {
  idbSaveScenes,
  idbSavePacks,
  idbSavePlacedStickers,
  getCachedScenes,
  setCachedScenes,
  getCachedPacks,
  setCachedPacks,
  getCachedPlacedStickers,
  setCachedPlacedStickers,
} from './indexedDBStorage';
import { optimizeImageDataUrl, trimAndMaximizeStickerImage } from './imageOptimizer';

const STORAGE_PASTEL_COLOR = 'braingrid_pastel_color_id_v1';
const STORAGE_NEON_COLOR = 'braingrid_neon_color_id_v1';
const STORAGE_CUSTOM_PACKS = 'braingrid_custom_sticker_packs_v1';
const STORAGE_CUSTOM_SCENES = 'braingrid_custom_canvas_scenes_v1';
const STORAGE_BACKDROP_ADJUSTMENTS = 'backdrop_adjustments_map';
const STORAGE_PERMANENT_OCEAN_PACK = 'braingrid_permanent_ocean_pack_v2';
const STORAGE_PERMANENT_OCEAN_SCENE = 'braingrid_permanent_ocean_scene_v1';

export const storage = {
  loadPermanentOceanPack(): StickerPack | null {
    try {
      const raw = localStorage.getItem(STORAGE_PERMANENT_OCEAN_PACK);
      if (raw) return JSON.parse(raw);
      const factory = INITIAL_STICKER_PACKS.find((p) => p.id === 'pack-ocean');
      return factory ? JSON.parse(JSON.stringify(factory)) : null;
    } catch {
      return null;
    }
  },

  savePermanentOceanPack(pack: StickerPack) {
    try {
      localStorage.setItem(STORAGE_PERMANENT_OCEAN_PACK, JSON.stringify(pack));
    } catch (err) {
      console.warn('localStorage savePermanentOceanPack quota warning:', err);
    }
  },

  loadPermanentOceanScene(): CanvasScene | null {
    try {
      const raw = localStorage.getItem(STORAGE_PERMANENT_OCEAN_SCENE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  savePermanentOceanScene(scene: CanvasScene) {
    try {
      localStorage.setItem(STORAGE_PERMANENT_OCEAN_SCENE, JSON.stringify(scene));
    } catch (err) {
      console.warn('localStorage savePermanentOceanScene quota warning:', err);
    }
  },
  loadCustomPacks(): StickerPack[] {
    const cached = getCachedPacks();
    if (cached && cached.length > 0) {
      return cached;
    }
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_PACKS);
      const parsed = raw ? JSON.parse(raw) : [];
      if (parsed.length > 0) {
        setCachedPacks(parsed);
      }
      return parsed;
    } catch {
      return [];
    }
  },

  saveCustomPacks(packs: StickerPack[]) {
    setCachedPacks(packs);
    idbSavePacks(packs).catch(() => {});
    try {
      localStorage.setItem(STORAGE_CUSTOM_PACKS, JSON.stringify(packs));
    } catch (err) {
      console.warn('localStorage saveCustomPacks quota warning:', err);
    }
  },

  loadCustomScenes(): CanvasScene[] {
    const cached = getCachedScenes();
    if (cached && cached.length > 0) {
      return cached;
    }
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_SCENES);
      const parsed = raw ? JSON.parse(raw) : [];
      if (parsed.length > 0) {
        setCachedScenes(parsed);
      }
      return parsed;
    } catch {
      return [];
    }
  },

  saveCustomScenes(scenes: CanvasScene[]) {
    setCachedScenes(scenes);
    idbSaveScenes(scenes).catch(() => {});
    try {
      localStorage.setItem(STORAGE_CUSTOM_SCENES, JSON.stringify(scenes));
    } catch (err) {
      console.warn('localStorage saveCustomScenes quota exceeded, persisted via IndexedDB & in-memory cache:', err);
    }
  },

  loadUnlockedStickers(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_UNLOCKED_STICKERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Storage error catch
    }
    return INITIAL_STICKER_PACKS.flatMap((p) => p.stickers.map((s) => s.id));
  },

  saveUnlockedStickers(ids: string[]) {
    try {
      localStorage.setItem(STORAGE_UNLOCKED_STICKERS, JSON.stringify(ids));
    } catch {
      // Storage error catch
    }
  },

  loadPlacedStickers(): PlacedSticker[] {
    const cached = getCachedPlacedStickers();
    if (cached && cached.length > 0) {
      return cached;
    }
    try {
      const raw = localStorage.getItem(STORAGE_PLACED_STICKERS);
      const parsed = raw ? JSON.parse(raw) : [];
      if (parsed.length > 0) {
        setCachedPlacedStickers(parsed);
      }
      return parsed;
    } catch {
      return [];
    }
  },

  savePlacedStickers(stickers: PlacedSticker[]) {
    setCachedPlacedStickers(stickers);
    idbSavePlacedStickers(stickers).catch(() => {});
    try {
      localStorage.setItem(STORAGE_PLACED_STICKERS, JSON.stringify(stickers));
    } catch (err) {
      console.warn('localStorage savePlacedStickers quota exceeded, persisted via IndexedDB & in-memory cache:', err);
      try {
        // Lightweight fallback for localStorage if quota exceeded
        const lightweight = stickers.map((s) => {
          if (s.stickerSnapshot && s.stickerSnapshot.svgIcon && s.stickerSnapshot.svgIcon.length > 1000) {
            return {
              ...s,
              stickerSnapshot: {
                ...s.stickerSnapshot,
                svgIcon: '✨',
              },
            };
          }
          return s;
        });
        localStorage.setItem(STORAGE_PLACED_STICKERS, JSON.stringify(lightweight));
      } catch {
        // Handled by IndexedDB
      }
    }
  },

  loadSettings(): StudySettings {
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Map legacy IDs if present
        let currentLogoId = parsed.logoGraphicId;
        if (currentLogoId === 'synapse') currentLogoId = 'peel-badge';
        else if (currentLogoId === 'isometric') currentLogoId = 'holo-prism';
        else if (currentLogoId === 'circuit') currentLogoId = 'stamp-craft';
        else if (currentLogoId === 'prism') currentLogoId = 'album-studio';

        return {
          themeMode: 'system',
          ...parsed,
          logoGraphicId: currentLogoId || 'peel-badge',
        };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_SETTINGS };
  },

  saveSettings(settings: StudySettings) {
    try {
      localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
    } catch {
      // Storage error catch
    }
  },

  loadCanvasSceneId(): string {
    try {
      return localStorage.getItem(STORAGE_CANVAS_SCENE) || 'scene-notebook';
    } catch {
      return 'scene-notebook';
    }
  },

  saveCanvasSceneId(sceneId: string) {
    try {
      localStorage.setItem(STORAGE_CANVAS_SCENE, sceneId);
    } catch {
      // Storage error catch
    }
  },

  loadPastelColorId(): string | null {
    try {
      return localStorage.getItem(STORAGE_PASTEL_COLOR);
    } catch {
      return null;
    }
  },

  savePastelColorId(colorId: string) {
    try {
      localStorage.setItem(STORAGE_PASTEL_COLOR, colorId);
    } catch {
      // Storage error catch
    }
  },

  loadNeonColorId(): string | null {
    try {
      return localStorage.getItem(STORAGE_NEON_COLOR);
    } catch {
      return null;
    }
  },

  saveNeonColorId(colorId: string) {
    try {
      localStorage.setItem(STORAGE_NEON_COLOR, colorId);
    } catch {
      // Storage error catch
    }
  },

  loadBackdropAdjustments(): Record<string, { saturation: number; lightLevel: number }> {
    try {
      const raw = localStorage.getItem(STORAGE_BACKDROP_ADJUSTMENTS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  saveBackdropAdjustments(adjustments: Record<string, { saturation: number; lightLevel: number }>) {
    try {
      localStorage.setItem(STORAGE_BACKDROP_ADJUSTMENTS, JSON.stringify(adjustments));
    } catch {
      // Storage error catch
    }
  },

  clearBackdropAdjustments() {
    try {
      localStorage.removeItem(STORAGE_BACKDROP_ADJUSTMENTS);
      localStorage.removeItem('ocean_backdrop_test_saturation');
      localStorage.removeItem('ocean_backdrop_test_light');
    } catch {
      // Storage error catch
    }
  },
};

/**
 * Export a Sticker Pack and/or Canvas Theme to a downloadable JSON file
 */
export async function exportVaultPack(pack?: StickerPack, scene?: CanvasScene, customFilename?: string) {
  if (!pack && !scene) return;

  const hasStickers = !!(pack && pack.stickers && pack.stickers.length > 0);
  const hasTheme = !!scene;

  let packType: 'combo' | 'stickers-only' | 'background-only' = 'combo';
  if (hasStickers && hasTheme) {
    packType = 'combo';
  } else if (hasStickers) {
    packType = 'stickers-only';
  } else {
    packType = 'background-only';
  }

  const name = pack?.name || scene?.name || 'Vault Pack';
  const description = pack?.description || scene?.theme || 'StickerBook Custom Vault Pack';
  const author = pack?.author || scene?.author || 'StickerBook Creator';
  const icon = pack?.icon || '🎨';

  // Compact backdrop image on export if present
  let exportedCustomConfig = scene?.customConfig;
  if (exportedCustomConfig?.type === 'image' && exportedCustomConfig.imageUrl) {
    try {
      const optimizedBg = await optimizeImageDataUrl(
        exportedCustomConfig.imageUrl,
        1920,
        1080,
        0.82,
        'image/jpeg'
      );
      exportedCustomConfig = {
        ...exportedCustomConfig,
        imageUrl: optimizedBg,
      };
    } catch {
      // Keep existing if optimize fails
    }
  }

  // Compact any sticker images on export if present
  let exportedStickers: ExportedSticker[] | undefined = undefined;
  if (pack && pack.stickers) {
    exportedStickers = await Promise.all(
      pack.stickers.map(async ({ id: _id, packId: _pid, ...rest }) => {
        let svgIcon = rest.svgIcon;
        if (svgIcon && (svgIcon.startsWith('data:image/') || svgIcon.startsWith('http://') || svgIcon.startsWith('https://') || svgIcon.startsWith('blob:'))) {
          try {
            svgIcon = await trimAndMaximizeStickerImage(
              svgIcon,
              512,
              0.04
            );
          } catch {
            // Keep existing if optimize fails
          }
        }
        return {
          name: rest.name,
          rarity: rest.rarity,
          svgIcon,
          color: rest.color,
          description: rest.description,
          isCustomImage: rest.isCustomImage,
          isUnlocked: true,
        };
      })
    );
  }

  const packFile: VaultPackFile = {
    version: 1,
    format: 'stickerbook-vault-pack',
    packType,
    name,
    author,
    description,
    icon,
    stickers: exportedStickers,
    themeScene: scene
      ? {
          name: scene.name,
          theme: scene.theme,
          bgGradient: scene.bgGradient,
          decorClass: scene.decorClass,
          pattern: scene.pattern,
          isCustom: true,
          author: scene.author,
          customConfig: exportedCustomConfig,
        }
      : undefined,
    createdAt: Date.now(),
  };

  const jsonStr = JSON.stringify(packFile, null, 2);
  const safeBaseName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = customFilename || `stickerbook-pack-${safeBaseName}.json`;

  downloadFile(jsonStr, filename, 'application/json');
}

/**
 * Parse and validate a Vault Pack JSON file string.
 * Supports standard StickerBook and legacy BrainGrid vault pack schema, single pack exports,
 * community themes, arrays of packs/stickers, and Google Drive cloud exports.
 */
export function parseVaultPackJSON(jsonStr: string): VaultPackFile | null {
  try {
    if (!jsonStr) return null;
    const cleanedStr = typeof jsonStr === 'string' ? jsonStr.replace(/^\uFEFF/, '').trim() : '';
    if (!cleanedStr && typeof jsonStr !== 'object') return null;

    let rawData: any;
    try {
      rawData = typeof jsonStr === 'string' ? JSON.parse(cleanedStr) : jsonStr;
    } catch (parseErr) {
      console.warn('parseVaultPackJSON JSON.parse failed:', parseErr);
      return null;
    }

    if (!rawData || typeof rawData !== 'object') return null;

    // 1. Unwrap Google Drive / array / wrapper structures
    let data = rawData;
    if (Array.isArray(data)) {
      if (data.length === 0) return null;
      // Check if it's an array of packs or array of stickers
      if (data[0] && typeof data[0] === 'object') {
        if (data[0].stickers || data[0].packName || data[0].themeScene || data[0].pattern) {
          data = data[0];
        } else if (data[0].svgIcon || data[0].icon || data[0].rarity || data[0].imageUrl) {
          // Direct array of stickers
          data = {
            name: 'Imported Sticker Pack',
            stickers: data,
          };
        } else {
          data = data[0];
        }
      } else {
        return null;
      }
    } else {
      // Check if wrapped in common export envelopes
      if (data.pack && typeof data.pack === 'object' && !Array.isArray(data.pack)) {
        data = data.pack;
      } else if (Array.isArray(data.packs) && data.packs.length > 0 && typeof data.packs[0] === 'object') {
        data = data.packs[0];
      } else if (Array.isArray(data.customPacks) && data.customPacks.length > 0 && typeof data.customPacks[0] === 'object') {
        data = data.customPacks[0];
      } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        data = data.data;
      }
    }

    if (!data || typeof data !== 'object') return null;

    // Helper to safely extract non-empty trimmed strings
    const getCleanString = (val: any): string | undefined => {
      if (typeof val === 'string' && val.trim()) return val.trim();
      return undefined;
    };

    // Detect Pack Name with fallbacks
    const rawName = data.name || data.title || data.packName || (typeof data.theme === 'string' ? data.theme : undefined);
    const name = getCleanString(rawName) || 'Imported Vault Pack';

    // 1. Detect Stickers
    const rawStickers = Array.isArray(data.stickers)
      ? data.stickers
      : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.cards)
      ? data.cards
      : Array.isArray(data.elements)
      ? data.elements
      : [];

    const cleanedStickers: ExportedSticker[] = rawStickers
      .filter((s: any) => s && typeof s === 'object')
      .map((s: any, idx: number) => {
        const stkName = getCleanString(s.name) || getCleanString(s.title) || `Sticker ${idx + 1}`;
        const rawRarity = typeof s.rarity === 'string' ? s.rarity : 'Common';
        const stkRarity: StickerRarity = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'].includes(rawRarity)
          ? (rawRarity as StickerRarity)
          : 'Common';

        const svgIcon =
          getCleanString(s.svgIcon) ||
          getCleanString(s.icon) ||
          getCleanString(s.imageUrl) ||
          getCleanString(s.image) ||
          getCleanString(s.url) ||
          '✨';

        const color = getCleanString(s.color) || 'text-indigo-400';
        const description = getCleanString(s.description) || `${stkRarity} sticker`;
        const isCustomImage =
          typeof s.isCustomImage === 'boolean'
            ? s.isCustomImage
            : (svgIcon.startsWith('data:image/') || svgIcon.startsWith('http://') || svgIcon.startsWith('https://') || svgIcon.startsWith('blob:'));

        return {
          name: stkName,
          rarity: stkRarity,
          svgIcon,
          color,
          description,
          isCustomImage,
          isUnlocked: true,
        };
      });

    const hasStickers = cleanedStickers.length > 0;

    // 2. Detect Companion Theme / Backdrop Scene
    const rawSceneObj =
      (data.themeScene && typeof data.themeScene === 'object' ? data.themeScene : null) ||
      (data.scene && typeof data.scene === 'object' ? data.scene : null) ||
      (data.customScene && typeof data.customScene === 'object' ? data.customScene : null) ||
      (data.background && typeof data.background === 'object' ? data.background : null) ||
      (data.backdrop && typeof data.backdrop === 'object' ? data.backdrop : null) ||
      (data.theme && typeof data.theme === 'object' ? data.theme : null);

    // Look for image backdrop URL in all common locations
    const detectedImageUrl: string | undefined =
      getCleanString(rawSceneObj?.customConfig?.imageUrl) ||
      getCleanString(rawSceneObj?.customConfig?.backgroundImageUrl) ||
      getCleanString(rawSceneObj?.customConfig?.image) ||
      getCleanString(rawSceneObj?.customConfig?.url) ||
      getCleanString(rawSceneObj?.imageUrl) ||
      getCleanString(rawSceneObj?.backgroundImageUrl) ||
      getCleanString(rawSceneObj?.image) ||
      getCleanString(rawSceneObj?.bgImage) ||
      getCleanString(rawSceneObj?.backgroundImage) ||
      getCleanString(data.customConfig?.imageUrl) ||
      getCleanString(data.customConfig?.backgroundImageUrl) ||
      getCleanString(data.imageUrl) ||
      getCleanString(data.backgroundImageUrl) ||
      undefined;

    // Look for SVG backdrop markup
    const detectedSvgMarkup: string | undefined =
      getCleanString(rawSceneObj?.customConfig?.svgMarkup) ||
      getCleanString(rawSceneObj?.customConfig?.svg) ||
      getCleanString(rawSceneObj?.svgMarkup) ||
      getCleanString(rawSceneObj?.svg) ||
      getCleanString(data.customConfig?.svgMarkup) ||
      getCleanString(data.svgMarkup) ||
      undefined;

    let themeScene: VaultPackFile['themeScene'] = undefined;

    if (detectedImageUrl || detectedSvgMarkup || rawSceneObj) {
      const sceneName = getCleanString(rawSceneObj?.name) || name;
      const themeTag = getCleanString(rawSceneObj?.theme) || name;
      const bgGradient = getCleanString(rawSceneObj?.bgGradient) || 'bg-slate-950';

      if (detectedImageUrl) {
        themeScene = {
          name: sceneName,
          theme: themeTag,
          bgGradient,
          decorClass: getCleanString(rawSceneObj?.decorClass),
          pattern: 'custom-image',
          isCustom: true,
          author: getCleanString(rawSceneObj?.author) || getCleanString(data.author) || 'Community',
          customConfig: {
            type: 'image',
            imageUrl: detectedImageUrl,
            fitMode: ['cover', 'contain', 'stretch'].includes(rawSceneObj?.customConfig?.fitMode) ? rawSceneObj.customConfig.fitMode : 'cover',
            opacity: typeof rawSceneObj?.customConfig?.opacity === 'number' ? rawSceneObj.customConfig.opacity : 100,
            dimming: typeof rawSceneObj?.customConfig?.dimming === 'number' ? rawSceneObj.customConfig.dimming : 0,
            blur: typeof rawSceneObj?.customConfig?.blur === 'number' ? rawSceneObj.customConfig.blur : 0,
            overlayColor: getCleanString(rawSceneObj?.customConfig?.overlayColor),
            gridOverlay: (['none', 'dots', 'lines', 'isometric'].includes(rawSceneObj?.customConfig?.gridOverlay)
              ? rawSceneObj?.customConfig?.gridOverlay
              : 'none') as 'none' | 'dots' | 'lines' | 'isometric',
          },
        };
      } else if (rawSceneObj) {
        // Built-in pattern theme or generic scene
        const effectivePattern = getCleanString(rawSceneObj.pattern) || 'custom-image';
        themeScene = {
          name: sceneName,
          theme: themeTag,
          bgGradient,
          decorClass: getCleanString(rawSceneObj.decorClass),
          pattern: effectivePattern as any,
          isCustom: true,
          author: getCleanString(rawSceneObj.author) || getCleanString(data.author) || 'Community',
          customConfig: typeof rawSceneObj.customConfig === 'object' && rawSceneObj.customConfig !== null ? rawSceneObj.customConfig : undefined,
        };
      }
    }

    const hasTheme = !!themeScene;

    if (!hasStickers && !hasTheme) {
      return null;
    }

    let packType: 'combo' | 'stickers-only' | 'background-only' = 'combo';
    if (hasStickers && hasTheme) packType = 'combo';
    else if (hasStickers) packType = 'stickers-only';
    else packType = 'background-only';

    const safeIcon = getCleanString(data.icon) || (packType === 'background-only' ? '🎨' : '📦');

    return {
      version: 1,
      format: 'stickerbook-vault-pack',
      packType,
      name,
      author: getCleanString(data.author),
      description: getCleanString(data.description) || 'Custom Vault Pack',
      icon: safeIcon,
      stickers: hasStickers ? cleanedStickers : undefined,
      themeScene,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    };
  } catch (err) {
    console.error('Fatal parseVaultPackJSON error prevented:', err);
    return null;
  }
}
