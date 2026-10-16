import React, { useState, useEffect, useMemo } from 'react';
import { StickerPack, StudySettings, ThemeMode, CanvasScene, PlacedSticker, DEFAULT_SETTINGS } from './types';
import { INITIAL_STICKER_PACKS, CANVAS_SCENES } from './data/stickerPacks';
import { storage } from './lib/io';
import { idbLoadScenes, idbLoadPacks, idbLoadPlacedStickers, idbClearAll } from './lib/indexedDBStorage';
import { sounds } from './lib/sound';
import { usePWAInstall } from './lib/pwa';
import { Header } from './components/Header';
import { StickerVault } from './components/StickerVault';
import { StickerIconRenderer } from './components/StickerIconRenderer';
import { SettingsModal } from './components/SettingsModal';
import { UserGuideModal } from './components/UserGuideModal';
import confetti from 'canvas-confetti';
import { X } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<StudySettings>(() => storage.loadSettings());

  // Removed theme packs & old core sticker ID detection
  const REMOVED_PACK_IDS = useMemo(() => new Set(['pack-mythic-beasts', 'pack-cyber', 'pack-botany']), []);
  const isOldCoreSticker = (id?: string) =>
    id &&
    (id.startsWith('stk-space-') ||
      id.startsWith('stk-dino-') ||
      id.startsWith('stk-math-') ||
      id.startsWith('stk-ocean-') ||
      id.startsWith('stk-cyber-') ||
      id.startsWith('stk-myth-') ||
      id.startsWith('stk-bot-'));

  // Sticker Packs & Custom Canvas Scenes
  const [customPacks, setCustomPacks] = useState<StickerPack[]>(() => {
    const raw = storage.loadCustomPacks();
    return raw
      .filter((p) => p && p.id && !REMOVED_PACK_IDS.has(p.id))
      .map((p) => ({
        ...p,
        stickers: (p.stickers || []).filter((s) => !isOldCoreSticker(s.id)),
      }));
  });

  const [customScenes, setCustomScenes] = useState<CanvasScene[]>(() => {
    const raw = storage.loadCustomScenes();
    return raw.filter((s) => s && s.id);
  });

  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>(() =>
    storage.loadPlacedStickers().filter((p) => !isOldCoreSticker(p.stickerId))
  );

  // All packs: Built-in packs have their official definitions; custom packs are appended
  const packs = useMemo(() => {
    const builtInIds = new Set(INITIAL_STICKER_PACKS.map((p) => p.id));

    // Core packs start with 0 core stickers (ready for the revamp), plus any custom-minted stickers from studio
    const coreOverrides = new Map(
      customPacks
        .filter((cp) => cp && cp.id && builtInIds.has(cp.id))
        .map((cp) => [cp.id, cp])
    );

    const mergedBuiltIns = INITIAL_STICKER_PACKS.map((core) => {
      const override = coreOverrides.get(core.id);
      if (!override) return core;
      return {
        ...core,
        ...override,
        stickers: (override.stickers || []).filter((s) => !isOldCoreSticker(s.id)),
        isCustom: false,
      };
    });

    const validCustom = customPacks
      .filter((cp) => cp && cp.id && !builtInIds.has(cp.id) && !REMOVED_PACK_IDS.has(cp.id))
      .map((cp) => ({
        ...cp,
        stickers: (cp.stickers || []).filter((s) => !isOldCoreSticker(s.id)),
      }));

    return [...mergedBuiltIns, ...validCustom];
  }, [customPacks]);

  // New Sticker Reward Notification Toast
  const [recentlyUnlockedSticker, setRecentlyUnlockedSticker] = useState<{
    name: string;
    icon: string;
    rarity: string;
  } | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);

  // PWA Install hook
  const { isInstallable, promptInstall } = usePWAInstall();

  // Sync settings sound toggle
  useEffect(() => {
    sounds.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // One-time self-healing synchronization on mount
  useEffect(() => {
    let isCancelled = false;

    const syncStorage = async () => {
      const [idbScenes, idbPacks, idbPlaced] = await Promise.all([
        idbLoadScenes().catch(() => [] as CanvasScene[]),
        idbLoadPacks().catch(() => [] as StickerPack[]),
        idbLoadPlacedStickers().catch(() => [] as PlacedSticker[]),
      ]);

      if (isCancelled) return;

      const localScenes = storage.loadCustomScenes();
      const localPacks = storage.loadCustomPacks();
      const localPlaced = storage.loadPlacedStickers();

      // Merge placed stickers safely across IndexedDB and LocalStorage (local storage has most immediate real-time coordinates)
      const placedMap = new Map<string, PlacedSticker>();
      for (const p of idbPlaced) {
        if (p?.id && !isOldCoreSticker(p.stickerId)) placedMap.set(p.id, p);
      }
      for (const p of localPlaced) {
        if (p?.id && !isOldCoreSticker(p.stickerId)) placedMap.set(p.id, p);
      }
      const cleanedPlaced = Array.from(placedMap.values());
      if (cleanedPlaced.length > 0 && !isCancelled) {
        setPlacedStickers(cleanedPlaced);
        storage.savePlacedStickers(cleanedPlaced);
      }

      // Merge scenes preserving user customizations and core overrides
      const sceneMap = new Map<string, CanvasScene>();
      for (const sc of [...idbScenes, ...localScenes]) {
        if (!sc?.id) continue;
        const existing = sceneMap.get(sc.id);
        if (!existing) {
          sceneMap.set(sc.id, sc);
        } else {
          const hasImage = sc.customConfig?.type === 'image' && !!sc.customConfig?.imageUrl;
          const existingHasImage = existing.customConfig?.type === 'image' && !!existing.customConfig?.imageUrl;
          if (hasImage && !existingHasImage) {
            sceneMap.set(sc.id, sc);
          } else {
            sceneMap.set(sc.id, { ...existing, ...sc });
          }
        }
      }

      const mergedScenes = Array.from(sceneMap.values());
      if (!isCancelled) {
        setCustomScenes(mergedScenes);
        storage.saveCustomScenes(mergedScenes);
      }

      // Merge custom packs and core pack overrides safely
      const packMap = new Map<string, StickerPack>();
      for (const pk of [...idbPacks, ...localPacks]) {
        if (!pk?.id || REMOVED_PACK_IDS.has(pk.id)) continue;
        const cleanedPack: StickerPack = {
          ...pk,
          stickers: (pk.stickers || []).filter((s) => !isOldCoreSticker(s.id)),
        };
        const existing = packMap.get(pk.id);
        if (!existing || cleanedPack.stickers.length >= existing.stickers.length) {
          packMap.set(pk.id, cleanedPack);
        }
      }

      const mergedPacks = Array.from(packMap.values());
      if (!isCancelled) {
        setCustomPacks(mergedPacks);
        storage.saveCustomPacks(mergedPacks);
      }
    };

    syncStorage();

    return () => {
      isCancelled = true;
    };
  }, []);

  // System Theme Preference Tracker
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const activeThemeMode: ThemeMode = settings.themeMode || 'system';
  const isDarkActive =
    activeThemeMode === 'dark' || (activeThemeMode === 'system' && systemPrefersDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkActive) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkActive]);

  const handleToggleTheme = () => {
    sounds.playPop();
    const nextMode: ThemeMode = isDarkActive ? 'light' : 'dark';
    handleUpdateSettings({
      ...settings,
      themeMode: nextMode,
    });
  };

  const handleUpdateSettings = (newSettings: StudySettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  // Add or update custom pack and custom scenes
  const handleSavePack = (pack: StickerPack, themeScene?: CanvasScene) => {
    const existingIndex = customPacks.findIndex((p) => p.id === pack.id);
    let updatedPacks: StickerPack[];

    if (existingIndex >= 0) {
      updatedPacks = customPacks.map((p) => (p.id === pack.id ? pack : p));
    } else {
      updatedPacks = [...customPacks, pack];
    }

    setCustomPacks(updatedPacks);
    storage.saveCustomPacks(updatedPacks);

    if (themeScene) {
      const existingSceneIndex = customScenes.findIndex((s) => s.id === themeScene.id);
      let updatedScenes: CanvasScene[];

      if (existingSceneIndex >= 0) {
        updatedScenes = customScenes.map((s) => (s.id === themeScene.id ? themeScene : s));
      } else {
        updatedScenes = [...customScenes, themeScene];
      }

      setCustomScenes(updatedScenes);
      storage.saveCustomScenes(updatedScenes);
    } else if (pack.themeSceneId === undefined) {
      const updatedScenes = customScenes.filter((s) => s.packId !== pack.id);
      if (updatedScenes.length !== customScenes.length) {
        setCustomScenes(updatedScenes);
        storage.saveCustomScenes(updatedScenes);
      }
    }
  };

  // Delete custom pack and its associated companion scene
  const handleDeletePack = (packId: string) => {
    const currentMemoryPacks = customPacks.length > 0 ? customPacks : storage.loadCustomPacks();
    const targetPack = currentMemoryPacks.find((p) => p.id === packId);
    const targetStickerIds = new Set(targetPack ? targetPack.stickers.map((s) => s.id) : []);

    const updatedPacks = currentMemoryPacks.filter((p) => p.id !== packId);
    setCustomPacks(updatedPacks);
    storage.saveCustomPacks(updatedPacks);

    const currentMemoryScenes = customScenes.length > 0 ? customScenes : storage.loadCustomScenes();
    const deletedSceneIds = new Set(
      currentMemoryScenes
        .filter((s) => s.packId === packId || s.id === targetPack?.themeSceneId)
        .map((s) => s.id)
    );
    const updatedScenes = currentMemoryScenes.filter(
      (s) => s.packId !== packId && s.id !== targetPack?.themeSceneId
    );
    setCustomScenes(updatedScenes);
    storage.saveCustomScenes(updatedScenes);

    // Prune placed stickers that were on the deleted scenes or used stickers from the deleted pack
    const currentPlaced = placedStickers;
    const cleanPlaced = currentPlaced.filter(
      (p) => (!p.sceneId || !deletedSceneIds.has(p.sceneId)) && !targetStickerIds.has(p.stickerId)
    );
    if (cleanPlaced.length !== currentPlaced.length) {
      setPlacedStickers(cleanPlaced);
      storage.savePlacedStickers(cleanPlaced);
    }

    // Reset active scene if it was deleted
    const currentActiveScene = storage.loadCanvasSceneId();
    if (deletedSceneIds.has(currentActiveScene)) {
      storage.saveCanvasSceneId('scene-notebook');
    }
  };

  const handleResetProgress = () => {
    // 1. Wipe IndexedDB and memory runtime caches
    idbClearAll().catch(() => {});

    // 2. Wipe LocalStorage cleanly
    try {
      localStorage.clear();
    } catch {
      // Storage clear fallback
    }

    // 3. Clear all backdrop saturation, brightness, and contrast adjustments
    storage.clearBackdropAdjustments();

    // 4. Persist pristine installation defaults
    storage.saveSettings(DEFAULT_SETTINGS);
    storage.saveCanvasSceneId('scene-notebook');
    storage.savePlacedStickers([]);
    storage.saveCustomPacks([]);
    storage.saveCustomScenes([]);

    // 5. Return app to clean installation state
    setSettings(DEFAULT_SETTINGS);
    setCustomPacks([]);
    setCustomScenes([]);
    setPlacedStickers([]);
    setResetNonce((prev) => prev + 1);

    // Close any open modals
    setIsSettingsOpen(false);
    setIsUserGuideOpen(false);
    setIsThemeStudioOpen(false);

    sounds.playPop();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col selection:bg-pink-100 dark:selection:bg-pink-900 selection:text-pink-900 dark:selection:text-pink-100 font-body transition-colors">
      {/* Top Header Navigation */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsUserGuideOpen(true)}
        onOpenThemeStudio={() => setIsThemeStudioOpen(true)}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => handleUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
        isInstallable={isInstallable}
        onInstallPWA={promptInstall}
        themeMode={activeThemeMode}
        isDark={isDarkActive}
        onToggleTheme={handleToggleTheme}
        logoGraphicId={settings.logoGraphicId}
      />

      {/* Main StickerBook Studio Canvas Arena */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 sm:py-6 flex flex-col justify-start">
        <StickerVault
          key={`vault-${resetNonce}`}
          resetNonce={resetNonce}
          packs={packs}
          customScenes={customScenes}
          placedStickersProp={placedStickers}
          onUpdatePlacedStickers={setPlacedStickers}
          onSavePack={handleSavePack}
          onDeletePack={handleDeletePack}
          isOpenPackStudio={isThemeStudioOpen}
          onClosePackStudio={() => setIsThemeStudioOpen(false)}
        />
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetProgress={handleResetProgress}
      />

      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
        onOpenThemeStudio={() => {
          setIsUserGuideOpen(false);
          setIsThemeStudioOpen(true);
        }}
      />
    </div>
  );
}
