import React, { useState, useEffect } from 'react';
import { StudySettings, ThemeMode } from '../types';
import { sounds } from '../lib/sound';
import { LOGO_OPTIONS } from '../data/logoOptions';
import { X, Volume2, Moon, Sun, Monitor, AlertTriangle, Trash2, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StudySettings;
  onUpdateSettings: (newSettings: StudySettings) => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetProgress,
}) => {
  const [showResetWarning, setShowResetWarning] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showResetWarning) {
          sounds.playPop();
          setShowResetWarning(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showResetWarning, onClose]);

  if (!isOpen) return null;

  const handleOpenResetWarning = () => {
    sounds.playPop();
    setShowResetWarning(true);
  };

  const handleCancelReset = () => {
    sounds.playPop();
    setShowResetWarning(false);
  };

  const handleConfirmReset = () => {
    sounds.playPop();
    onResetProgress();
    setShowResetWarning(false);
    onClose();
  };

  const handleThemeChange = (mode: ThemeMode) => {
    sounds.playPop();
    onUpdateSettings({
      ...settings,
      themeMode: mode,
    });
  };

  const handleLogoGraphicChange = (logoId: string) => {
    sounds.playPop();
    onUpdateSettings({
      ...settings,
      logoGraphicId: logoId,
    });
  };

  const handleSoundToggle = (enabled: boolean) => {
    sounds.setEnabled(enabled);
    if (enabled) sounds.playPop();
    onUpdateSettings({
      ...settings,
      soundEnabled: enabled,
    });
  };

  const currentTheme = settings.themeMode || 'system';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-100 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
              ⚙️
            </div>
            <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">
              StickerBook Settings
            </h3>
          </div>
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Appearance / Dark Mode */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Theme / Appearance</span>
              </label>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 capitalize">
                {currentTheme === 'system' ? 'System (Auto)' : currentTheme}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Defaults to your device's system appearance (dark or light), or lock it to your personal preference.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleThemeChange('system')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  currentTheme === 'system'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>System</span>
              </button>

              <button
                onClick={() => handleThemeChange('light')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  currentTheme === 'light'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  currentTheme === 'dark'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Brand Logo Emblem Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                <span>Brand Emblem & Logo Icon</span>
              </label>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg bg-pink-50 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border border-pink-100 dark:border-pink-800/60">
                Studio Header Logo
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Select your favorite emblem displayed on the top studio navigation bar.
            </p>

            <div className="space-y-2.5">
              {LOGO_OPTIONS.map((logo) => {
                const isSelected = (settings.logoGraphicId || 'peel-badge') === logo.id;

                return (
                  <button
                    key={logo.id}
                    type="button"
                    onClick={() => handleLogoGraphicChange(logo.id)}
                    className={`flex items-center gap-3.5 p-3 rounded-2xl border text-left transition-all cursor-pointer w-full group ${
                      isSelected
                        ? 'bg-pink-50/80 dark:bg-pink-950/40 border-pink-500/80 ring-2 ring-pink-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-pink-300 dark:hover:border-pink-600/60 hover:bg-slate-50/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-13 h-13 rounded-2xl overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform p-0.5">
                      {logo.imageSrc ? (
                        <img
                          src={logo.imageSrc}
                          alt={logo.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-[12px]"
                        />
                      ) : (
                        <div className="w-full h-full rounded-[12px] bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-2xl text-white">
                          {logo.emoji || '✨'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                          {logo.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-extrabold text-pink-600 dark:text-pink-300 bg-pink-100 dark:bg-pink-950/80 px-2 py-0.5 rounded-full border border-pink-200/60 dark:border-pink-800/60">
                            Active Emblem
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                        {logo.subtitle}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                        {logo.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound FX Setting */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  <span>Tactile Sound Effects</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Pop clicks, sticker stamp snaps, and celebration fanfares.
                </p>
              </div>

              <button
                onClick={() => handleSoundToggle(!settings.soundEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  settings.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Data Reset */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Clear local sticker canvas & records:</span>
            <button
              id="open-reset-warning-btn"
              type="button"
              onClick={handleOpenResetWarning}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline hover:text-red-700 dark:hover:text-red-300 transition-colors cursor-pointer"
            >
              Reset Data
            </button>
          </div>
        </div>
      </div>

      {/* Warning Confirmation Modal */}
      {showResetWarning && (
        <div
          id="reset-warning-modal-backdrop"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelReset();
            }
          }}
        >
          <div
            id="reset-warning-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-warning-title"
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-red-200 dark:border-red-900/60 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h4 id="reset-warning-title" className="font-display font-bold text-base sm:text-lg text-red-700 dark:text-red-400">
                  Reset All Sticker Data?
                </h4>
              </div>

              <button
                id="reset-warning-close-btn"
                type="button"
                onClick={handleCancelReset}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-red-100/70 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                title="Cancel and close"
                aria-label="Close and cancel reset"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                This will perform a complete reset of all your local application data. The following will be reset:
              </p>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-slate-800 dark:text-slate-100">Stickers & Canvas: </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Clears all placed stickers and custom arrangements from your canvas scenes.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-slate-800 dark:text-slate-100">Custom Theme Packs: </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Removes any imported custom sticker packs and custom themes you created.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-slate-800 dark:text-slate-100">Preferences: </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Restores theme, sounds, and logo emblems back to original installation defaults.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-slate-800 dark:text-slate-100">Backdrop Saturation & Lighting: </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Restores all canvas backdrops to their initial default saturation (100%), brightness (100%), and contrast (100%) states.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                  Are you sure you want to reset all data? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                id="reset-warning-cancel-btn"
                type="button"
                onClick={handleCancelReset}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 hover:dark:bg-slate-800 font-bold text-xs sm:text-sm transition-all cursor-pointer text-center"
              >
                Cancel (Keep My Data)
              </button>
              <button
                id="reset-warning-confirm-btn"
                type="button"
                onClick={handleConfirmReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Reset Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
