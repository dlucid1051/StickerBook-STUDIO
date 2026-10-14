import peelBadgeImg from '../assets/images/sticker_peel_badge.webp';
import holoPrismImg from '../assets/images/sticker_holo_prism.webp';
import stampCraftImg from '../assets/images/sticker_stamp_craft.webp';
import albumStudioImg from '../assets/images/sticker_album_studio.webp';

export interface LogoOption {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  imageSrc?: string;
  emoji?: string;
}

export const LOGO_OPTIONS: LogoOption[] = [
  {
    id: 'peel-badge',
    name: 'Peel & Place',
    subtitle: 'Vinyl Die-Cut Badge',
    description: 'Playful celestial smiling star and rainbow badge with thick glossy vinyl border peeling off smooth backing.',
    imageSrc: peelBadgeImg,
  },
  {
    id: 'holo-prism',
    name: 'Prismatic Foil',
    subtitle: 'Holographic Crystal Sheen',
    description: 'Dazzling geometric crystal gem layered with radiant rainbow foil reflections, metallic foil, and whimsical sparkle.',
    imageSrc: holoPrismImg,
  },
  {
    id: 'stamp-craft',
    name: 'Craft Studio',
    subtitle: 'Artisan Rubber Stamp',
    description: 'Charming wooden craft stamp pressing vibrant colorful star and heart sticker imprints onto textured paper.',
    imageSrc: stampCraftImg,
  },
  {
    id: 'album-studio',
    name: 'Sticker Studio',
    subtitle: 'Open Album & Gridded Canvas',
    description: 'Enchanting miniature open sticker book filled with colorful placed stickers, themes, and whimsical creative joy.',
    imageSrc: albumStudioImg,
  },
  {
    id: 'classic-emoji',
    name: 'Sparkle Star',
    subtitle: 'Classic Whimsical Star',
    description: 'Clean radiant golden sparkle star framed in vibrant multi-hue studio gradient ring.',
    emoji: '✨',
  },
];

export const DEFAULT_LOGO_ID = 'peel-badge';
