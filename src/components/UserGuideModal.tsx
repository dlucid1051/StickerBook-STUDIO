import React, { useState, useEffect } from 'react';
import { sounds } from '../lib/sound';
import {
  X,
  Sparkles,
  RotateCw,
  LayoutGrid,
  Package,
  Palette,
  Upload,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  BookOpen,
  Camera,
  Layers,
  HelpCircle,
  Lightbulb
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
                    Switch between built-in scene backdrops (Notebook, Cosmos, Chalk, Ocean, Arcade) or custom wallpaper backdrops created in ThemePack STUDIO.
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

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                      Pack Types: Combo, Stickers-Only, or Wallpaper-Only
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Create complete companion sets containing both custom stickers and matching canvas wallpaper, or focused packs containing just stickers or just scenes.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                      Mint Custom Stickers (Emoji & Uploaded Images)
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Choose any emoji or upload PNG, SVG, or WebP images. Uploaded images are automatically optimized and cached in IndexedDB for fast loading.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                      Import & Export Portable .vaultpack.json Bundles
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Every theme pack can be exported to a standard single-file JSON bundle that includes all sticker artwork, metadata, and canvas wallpaper configs. Share them or back them up effortlessly.
                    </p>
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
