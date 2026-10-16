import React, { useState, useEffect } from 'react';
import { sounds } from '../lib/sound';
import {
  X,
  Sparkles,
  LayoutGrid,
  Package,
  Palette,
  Upload,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  Camera,
  Layers,
  Lightbulb,
  FileArchive,
  FileJson,
  Sliders,
  RotateCw,
  FlipHorizontal,
  Stamp,
  FileCode2,
  Info
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenThemeStudio?: () => void;
}

type TabType = 'stickerbook' | 'themepack';

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenThemeStudio,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('stickerbook');

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sounds.playPop();
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-100 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100">
                StickerBook STUDIO Guide
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Master canvas creativity, sticker transforms, and ThemePack STUDIO
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveTab('stickerbook');
            }}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'stickerbook'
                ? 'border-pink-600 text-pink-700 dark:text-pink-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            <span>Canvas Studio Guide</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveTab('themepack');
            }}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'themepack'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <div className="flex items-center gap-1.5">
              <span>ThemePack STUDIO</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/60 leading-none">
                Creator
              </span>
            </div>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
          {/* TAB 1: STICKERBOOK CANVAS */}
          {activeTab === 'stickerbook' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent p-4 rounded-2xl border border-pink-200 dark:border-pink-900/60 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-pink-600 text-white shrink-0 shadow-xs">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">
                    Welcome to StickerBook STUDIO
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    StickerBook STUDIO is your creative digital canvas and tactile design playground. Decorate custom wallpapers, organize themed scenes, and place unlimited collectible stickers.
                  </p>
                </div>
              </div>

              {/* Core Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold mb-2.5">
                    ✨
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">
                    Freeform Sticker Manipulation
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Click any sticker on the canvas to select it. Drag smoothly to position, use the scale slider (0.6x to 2.0x), rotate in 15° steps or continuous angles, and mirror horizontally with the flip button.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold mb-2.5">
                    🎴
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">
                    Stamp Mode for Rapid Placement
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Turn on <strong>Stamp Mode</strong> in the bottom drawer to repeatedly place copies of any selected sticker anywhere you tap on the canvas.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-2.5">
                    📚
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">
                    Themed Canvas Scenes
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Switch between built-in scene backdrops (Pastel 3×5 Note Card, Cosmic Voyagers, Prehistoric Titans, Pixel Math Arcade, Ocean Explorers) or custom wallpaper backdrops forged in ThemePack STUDIO.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-2.5">
                    📸
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">
                    High-Resolution Snapshot Export
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Click the camera icon on the canvas toolbar to instantly render and export your finished sticker art as a crisp, full-fidelity PNG image.
                  </p>
                </div>
              </div>

              {/* Rarity Tier Guide */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <h4 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span>Sticker Rarity Tiers</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">Common</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Foundational icons</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Rare</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Silver foil shine</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900 text-center">
                    <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Epic</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Amethyst glow</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Legendary</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Gold prismatic aura</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THEMEPACK STUDIO CREATOR */}
          {activeTab === 'themepack' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-900/60 flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100 mb-1">
                    ThemePack STUDIO: The Creator Suite
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Create custom sticker packs, design backdrops, upload transparent die-cut artwork, and export portable bundles.
                  </p>
                </div>
                {onOpenThemeStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      onClose();
                      onOpenThemeStudio();
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    Open Studio
                  </button>
                )}
              </div>

              {/* Step-by-Step Creator Guide */}
              <div className="space-y-3.5">
                {/* 1. Pack Content Types & Editor */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-2xs">
                    1
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                        Pack Types: Combo, Backdrop, or Stickers
                      </h5>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                        Dynamic Badges
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Every pack in your collection displays a content badge in its upper-right corner: <strong>Combo</strong> (both backdrop & stickers), <strong>Backdrop</strong> (wallpaper-only), or <strong>Stickers</strong> (stickers-only). In the pack editor, tools for both backdrops and stickers are always accessible, allowing you to add or remove components at any time.
                    </p>
                  </div>
                </div>

                {/* 2. Backdrop Studio */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-2xs">
                    2
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-purple-500" />
                        <span>Backdrop Studio: Wallpaper & Live Controls</span>
                      </h5>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Upload high-resolution wallpaper images (PNG, JPG, WebP) with an interactive mini-canvas preview. Fine-tune your backdrop using live adjustments:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <strong>• Image Adjusters:</strong> Opacity (0–100%), Dimming (0–100%), and Hardware-accelerated Blur (0–20px) to enhance sticker contrast.
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <strong>• Fit Scaling:</strong> Choose between Cover, Contain, or Stretch to adapt any image aspect ratio.
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 sm:col-span-2">
                        <strong>• Grid Overlay Textures:</strong> Overlay customizable Dots, Ruled Notebook Lines, or Isometric Grids with configurable color tint.
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/60 text-[11px] text-purple-800 dark:text-purple-300 mt-2">
                      <Info className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
                      <span>
                        <strong>Note on SVG Backdrops:</strong> The previous experimental raw SVG code editor has been retired in favor of high-fidelity image backdrops with real-time hardware-accelerated shaders and textures.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Minting Stickers */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-2xs">
                    3
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                        Mint Custom Stickers (PNG, SVG Vectors & Emojis)
                      </h5>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Mint custom stickers from emojis or upload your own transparent artwork. The sticker pipeline supports:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-400 pl-1">
                      <li><strong>Transparent PNG & WebP:</strong> High-resolution raster graphics, die-cut photos, and illustrations.</li>
                      <li><strong>Vector SVG Files:</strong> Scalable vector graphics that render sharply at any scale from 0.6x to 2.0x.</li>
                      <li><strong>Auto-Trimming:</strong> Uploaded images are automatically trimmed of excess whitespace for snug, authentic borders.</li>
                      <li><strong>Rarity Tiers:</strong> Assign Common, Rare, Epic, or Legendary tiers with distinctive foil shine finishes.</li>
                    </ul>
                  </div>
                </div>

                {/* 4. Import & Export Formats (.ZIP & Legacy JSON) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-2xs">
                    4
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <FileArchive className="w-4 h-4 text-emerald-500" />
                        <span>Export & Import (.ZIP Packages & Legacy JSON)</span>
                      </h5>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      ThemePack STUDIO utilizes a high-performance archive format alongside backward-compatible import tools:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px]">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                          <FileArchive className="w-3.5 h-3.5" />
                          <span>Primary Format: .ZIP Packages</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          <strong>Export:</strong> One-click export generates a clean <code className="bg-emerald-50 dark:bg-emerald-950/80 px-1 py-0.5 rounded text-[10px] font-mono text-emerald-700 dark:text-emerald-300">.zip</code> archive containing transparent PNG sticker graphics, background wallpaper, and a structured <code className="font-mono text-[10px]">manifest.json</code>.
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          <strong>Import:</strong> Drag & drop or select any <code className="font-mono text-[10px]">.zip</code> bundle to import custom stickers and backdrops instantly into your vault.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                          <FileJson className="w-3.5 h-3.5 text-amber-500" />
                          <span>Legacy JSON Support (Read-Only)</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          Full backward compatibility for importing previous v1 single-pack <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">.vaultpack.json</code> or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">.json</code> files.
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          You can also paste raw JSON text directly into the Import tab's "Legacy JSON Support" section to restore historical backups.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
