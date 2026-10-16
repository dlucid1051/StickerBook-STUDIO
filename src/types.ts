export type ThemeMode = 'system' | 'light' | 'dark';

export interface StudySettings {
  soundEnabled: boolean;
  themeMode?: ThemeMode;
  logoGraphicId?: string; // e.g. 'peel-badge' | 'holo-prism' | 'stamp-craft' | 'album-studio' | 'classic-emoji'
}

export const DEFAULT_SETTINGS: StudySettings = {
  soundEnabled: true,
  themeMode: 'system',
  logoGraphicId: 'peel-badge',
};

export type StickerRarity = 'Common' | 'Rare' | 'Legendary' | 'Mythic';

export interface CustomBackgroundConfig {
  type?: 'image';
  // For image wallpaper:
  imageUrl?: string;
  backgroundImageUrl?: string;
  opacity?: number; // 0 to 100
  dimming?: number; // 0 to 100 (darkness overlay)
  overlayColor?: string; // hex
  blur?: number; // 0 to 16
  fitMode?: 'cover' | 'contain' | 'center';
  gridOverlay?: 'none' | 'dots' | 'lines' | 'isometric';
}

export interface Sticker {
  id: string;
  name: string;
  packId: string;
  rarity: StickerRarity;
  svgIcon: string; // SVG or inline icon markup or image data URL
  color: string;
  description: string;
  isCustomImage?: boolean;
  isUnlocked?: boolean;
  tags?: string[];
}

export interface StickerPack {
  id: string;
  name: string;
  theme: string;
  description: string;
  icon: string;
  stickers: Sticker[];
  isUnlocked: boolean;
  isCustom?: boolean;
  author?: string;
  themeSceneId?: string; // Links to a companion canvas scene for combo packs
}

export interface PlacedSticker {
  id: string;
  stickerId: string;
  x: number; // percentage (0 - 100) or pixels
  y: number;
  rotation: number; // -180 to 180 degrees
  scale: number; // 0.6 to 2.0
  isFlipped?: boolean; // Horizontal mirror (flip)
  sceneId?: string; // which canvas scene / page this sticker belongs to
  packId?: string; // Companion pack ID linkage for resilient theme persistence
  stickerSnapshot?: {
    name: string;
    svgIcon: string;
    rarity?: StickerRarity;
  };
}

export interface CanvasScene {
  id: string;
  name: string;
  theme: string;
  bgGradient: string;
  decorClass?: string;
  pattern: 'dots' | 'grid' | 'stars' | 'notebook' | 'arcade' | 'ocean' | 'custom-image';
  isCustom?: boolean;
  author?: string;
  customConfig?: CustomBackgroundConfig;
  packId?: string; // If linked with a combo pack
}

export interface ExportedSticker {
  id?: string;
  name: string;
  rarity: StickerRarity;
  svgIcon: string;
  color: string;
  description: string;
  isCustomImage?: boolean;
  isUnlocked?: boolean;
  tags?: string[];
}

export interface VaultPackFile {
  version: 1;
  format: 'stickerbook-vault-pack' | 'braingrid-vault-pack';
  packType: 'combo' | 'stickers-only' | 'background-only';
  name: string;
  author?: string;
  theme?: string;
  description: string;
  icon?: string;
  stickers?: ExportedSticker[];
  themeScene?: Omit<CanvasScene, 'id' | 'packId'>;
  createdAt: number;
}
