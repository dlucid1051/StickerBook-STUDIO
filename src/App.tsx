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

  // Helper to detect if a cached ocean pack is the legacy version rather than the official replacement
  const isLegacyOceanPack = (pack?: StickerPack | null) =>
    pack?.id === 'pack-ocean' &&
    pack.stickers?.some((s) => s.name === 'Cosmic Jellyfish' || s.id === 'stk-ocean-6');

  // Sticker Packs & Custom Canvas Scenes
  const [customPacks, setCustomPacks] = useState<StickerPack[]>(() => {
    const raw = storage.loadCustomPacks();
    const list = raw
      .filter((p) => p && p.id)
      .map((p) => {
        if (p.id === 'pack-ocean' && isLegacyOceanPack(p)) {
          const factory = INITIAL_STICKER_PACKS.find((f) => f.id === 'pack-ocean');
          return factory ? JSON.parse(JSON.stringify(factory)) : p;
        }
        return p;
      });
    const hasOcean = list.some((p) => p.id === 'pack-ocean');
    if (!hasOcean) {
      const permOcean = storage.loadPermanentOceanPack();
      if (permOcean && !isLegacyOceanPack(permOcean)) {
        list.push(permOcean);
      } else {
        const factory = INITIAL_STICKER_PACKS.find((f) => f.id === 'pack-ocean');
        if (factory) list.push(JSON.parse(JSON.stringify(factory)));
      }
    }
    return list;
  });

  const [customScenes, setCustomScenes] = useState<CanvasScene[]>(() => {
    const raw = storage.loadCustomScenes();
    const list = raw.filter((s) => s && s.id);
    const hasOceanScene = list.some((s) => s.id === 'scene-ocean');
    if (!hasOceanScene) {
      const permOceanScene = storage.loadPermanentOceanScene();
      if (permOceanScene) list.push(permOceanScene);
    }
    return list;
  });

  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>(() => storage.loadPlacedStickers());

  // Automatically ensure any current Ocean customization is captured as the permanent default
  useEffect(() => {
    const oceanPack = customPacks.find((p) => p.id === 'pack-ocean');
    if (oceanPack && !isLegacyOceanPack(oceanPack)) {
      storage.savePermanentOceanPack(oceanPack);
    }
    const oceanScene = customScenes.find((s) => s.id === 'scene-ocean');
    if (oceanScene) {
      storage.savePermanentOceanScene(oceanScene);
    }
  }, [customPacks, customScenes]);

  // All packs: Built-in packs are primary, merged with user-edited core overrides; custom packs are appended
  const packs = useMemo(() => {
    const builtInIds = new Set(INITIAL_STICKER_PACKS.map((p) => p.id));
    const isCoreSticker = (id?: string) =>
      id &&
      (id.startsWith('stk-space-') ||
        id.startsWith('stk-dino-') ||
        id.startsWith('stk-math-') ||
        id.startsWith('stk-ocean-'));

    // Check if any core packs have user overrides from Studio editing or permanent defaults
    const coreOverrides = new Map(
      customPacks
        .filter((cp) => cp && cp.id && builtInIds.has(cp.id))
        .map((cp) => [cp.id, cp])
    );

    const mergedBuiltIns = INITIAL_STICKER_PACKS.map((core) => {
      let override = coreOverrides.get(core.id);
      if (core.id === 'pack-ocean') {
        if (override && isLegacyOceanPack(override)) {
          override = undefined;
        }
        if (!override) {
          const perm = storage.loadPermanentOceanPack();
          if (perm && !isLegacyOceanPack(perm)) {
            override = perm;
          }
        }
      }
      return override ? { ...core, ...override, isCustom: false } : core;
    });

    const validCustom = customPacks
      .filter((cp) => cp && cp.id && !builtInIds.has(cp.id))
      .map((cp) => {
        // Self-heal any legacy custom packs that previously retained built-in sticker IDs
        const hasCoreIds = cp.stickers.some((s) => isCoreSticker(s.id));
        if (!hasCoreIds) return cp;
        return {
          ...cp,
          stickers: cp.stickers.map((s, idx) => ({
            ...s,
            id: isCoreSticker(s.id) ? `stk-${cp.id}-${idx + 1}` : s.id,
            packId: cp.id,
          })),
        };
      });

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
        if (p?.id) placedMap.set(p.id, p);
      }
      for (const p of localPlaced) {
        if (p?.id) placedMap.set(p.id, p);
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
        if (!pk?.id) continue;
        if (pk.id === 'pack-ocean' && isLegacyOceanPack(pk)) {
          continue;
        }
        const existing = packMap.get(pk.id);
        if (!existing || (pk.stickers?.length || 0) >= (existing.stickers?.length || 0)) {
          packMap.set(pk.id, pk);
        }
      }

      if (!packMap.has('pack-ocean')) {
        const factory = INITIAL_STICKER_PACKS.find((f) => f.id === 'pack-ocean');
        if (factory) packMap.set('pack-ocean', JSON.parse(JSON.stringify(factory)));
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

    if (pack.id === 'pack-ocean') {
      storage.savePermanentOceanPack(pack);
    }

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

      if (themeScene.id === 'scene-ocean') {
        storage.savePermanentOceanScene(themeScene);
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
    // 0. Safeguard current Ocean core theme pack and scene customization as permanent defaults
    const currentOceanPack =
      (!isLegacyOceanPack(customPacks.find((p) => p.id === 'pack-ocean')) ? customPacks.find((p) => p.id === 'pack-ocean') : null) ||
      (!isLegacyOceanPack(storage.loadPermanentOceanPack()) ? storage.loadPermanentOceanPack() : null) ||
      INITIAL_STICKER_PACKS.find((p) => p.id === 'pack-ocean');

    const currentOceanScene =
      customScenes.find((s) => s.id === 'scene-ocean') ||
      storage.loadPermanentOceanScene() ||
      storage.loadCustomScenes().find((s) => s.id === 'scene-ocean');

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

    // 4. Persist pristine installation defaults while preserving the permanent Ocean theme defaults
    storage.saveSettings(DEFAULT_SETTINGS);
    storage.saveCanvasSceneId('scene-notebook');
    storage.savePlacedStickers([]);

    const resetPacks = currentOceanPack ? [currentOceanPack] : [];
    const resetScenes = currentOceanScene ? [currentOceanScene] : [];

    storage.saveCustomPacks(resetPacks);
    storage.saveCustomScenes(resetScenes);
    if (currentOceanPack) storage.savePermanentOceanPack(currentOceanPack);
    if (currentOceanScene) storage.savePermanentOceanScene(currentOceanScene);

    // 5. Return app to first-open installation state with permanent Ocean defaults intact
    setSettings(DEFAULT_SETTINGS);
    setCustomPacks(resetPacks);
    setCustomScenes(resetScenes);
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
