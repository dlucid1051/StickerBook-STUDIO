import React from 'react';
import { ThemeMode } from '../types';
import { sounds } from '../lib/sound';
import { LOGO_OPTIONS } from '../data/logoOptions';
import { 
  Volume2, 
  VolumeX, 
  Download, 
  Settings, 
  Moon, 
  Sun, 
  BookOpen,
  Package
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onOpenThemeStudio: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isInstallable: boolean;
  onInstallPWA: () => void;
  themeMode: ThemeMode;
  isDark: boolean;
  onToggleTheme: () => void;
  logoGraphicId?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenGuide,
  onOpenThemeStudio,
  soundEnabled,
  onToggleSound,
  isInstallable,
  onInstallPWA,
  themeMode,
  isDark,
  onToggleTheme,
  logoGraphicId,
}) => {
  const activeLogo = LOGO_OPTIONS.find((l) => l.id === logoGraphicId) || LOGO_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-indigo-100 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Title */}
          <div 
            className="flex items-center gap-2 sm:gap-2.5 select-none shrink-0"
            title="StickerBook STUDIO"
          >
            <div 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-sm shrink-0 overflow-hidden"
              title={`StickerBook STUDIO Emblem: ${activeLogo.name} (${activeLogo.subtitle})`}
            >
              {activeLogo.imageSrc ? (
                <img
                  src={activeLogo.imageSrc}
                  alt={activeLogo.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-[10px]"
                />
              ) : (
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center text-base sm:text-lg font-bold">
                  {activeLogo.emoji || '⚡'}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  StickerBook
                </span>
                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold px-1.5 py-0.2 sm:py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/60">
                  STUDIO
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block leading-tight">
                Collectible Stickers & Creative Canvas
              </p>
            </div>
          </div>

          {/* Right Action Tools Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* ThemePack STUDIO Launcher Button */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                onOpenThemeStudio();
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50/60 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-xs hover:shadow-sm transition-all cursor-pointer group shrink-0"
              title="ThemePack STUDIO — Create & Manage Theme Packs"
              aria-label="ThemePack STUDIO"
            >
              <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
              <div className="flex items-center gap-1">
                <span className="font-display font-bold text-xs sm:text-sm tracking-tight leading-none bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  ThemePack
                </span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/60 leading-none">
                  STUDIO
                </span>
              </div>
            </button>
            {/* Install PWA Button */}
            {isInstallable && (
              <button
                type="button"
                onClick={onInstallPWA}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Install PWA to Home Screen"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 sm:p-2 rounded-xl border transition-colors bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-indigo-600 dark:hover:text-amber-300 relative shrink-0 cursor-pointer"
              title={
                themeMode === 'system'
                  ? `Theme: System (${isDark ? 'Dark' : 'Light'}) - Click to toggle`
                  : isDark
                  ? 'Theme: Dark - Click to switch to Light'
                  : 'Theme: Light - Click to switch to Dark'
              }
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {themeMode === 'system' && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" title="Synced with system" />
              )}
            </button>

            {/* Sound Mute Toggle */}
            <button
              type="button"
              onClick={() => {
                onToggleSound();
                if (!soundEnabled) sounds.playPop();
              }}
              className={`p-1.5 sm:p-2 rounded-xl border transition-colors shrink-0 cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400'
              }`}
              title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
              aria-label={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Settings Modal Launcher */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                onOpenSettings();
              }}
              className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
              title="Preferences & Settings"
              aria-label="Preferences & Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Guide Launcher */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                onOpenGuide();
              }}
              className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/70 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
              title="User Guide: StickerBook & ThemePack STUDIO"
              aria-label="User Guide"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
