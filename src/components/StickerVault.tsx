import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CanvasScene, PlacedSticker, Sticker, StickerPack, StickerRarity } from '../types';
import { CANVAS_SCENES } from '../data/stickerPacks';
import { PASTEL_COLOR_SETS, PastelSet, getRandomPastelSet } from '../data/pastelThemes';
import { SpaceBackground } from './SpaceBackground';
import { PrehistoricBackground } from './PrehistoricBackground';
import { NeonBackground } from './NeonBackground';
import { OceanBackground } from './OceanBackground';
import { CustomCanvasBackground } from './CustomCanvasBackground';
import { ThemeAndPackManagerModal } from './ThemeAndPackManagerModal';
import { StickerIconRenderer } from './StickerIconRenderer';
import { sounds } from '../lib/sound';
import { storage } from '../lib/io';
import { trimAndMaximizeStickerImage } from '../lib/imageOptimizer';
import { resolvePublicAsset } from '../lib/assetPath';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import { 
  Sparkles, 
  RotateCw, 
  Trash2, 
  Download, 
  Check, 
  Plus, 
  Image as ImageIcon,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  X,
  Shuffle,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  LayoutGrid,
  Filter,
  Clock,
  Camera,
  FlipHorizontal,
  Save,
  CheckCircle2,
} from 'lucide-react';

const cleanPackIcon = (icon?: string): string => {
  if (!icon) return '🎨';
  if (icon === 'Gamepad2' || icon === 'gamepad2') return '🎮';
  if (icon === 'Wand2' || icon === 'wand2') return '🪄';
  if (icon === 'Flower2' || icon === 'flower2') return '🌸';
  if (icon === 'Rocket') return '🚀';
  if (icon === 'Sparkles') return '✨';
  if (icon === 'Waves') return '🌊';
  if (icon === 'Cpu') return '⚡';
  return icon.replace(/2$/, '');
};

const cleanPackName = (name: string, isCustom?: boolean): string => {
  if (!name) return '';
  if (!isCustom) {
    return name.replace(/\s*2\b/g, '').trim();
  }
  return name;
};

interface ThemeThumbnailPreviewProps {
  scene: CanvasScene;
  linkedPack?: StickerPack;
  activePastelHex?: string;
}

const ThemeThumbnailPreview: React.FC<ThemeThumbnailPreviewProps> = ({
  scene,
  linkedPack,
  activePastelHex,
}) => {
  // 1. Uploaded Image wallpaper
  const imageUrl =
    scene.customConfig?.imageUrl ||
    scene.customConfig?.backgroundImageUrl ||
    (scene as any).imageUrl ||
    (scene as any).backgroundImageUrl;

  if (imageUrl) {
    return (
      <img
        src={resolvePublicAsset(imageUrl)}
        alt={scene.name || 'Theme'}
        className="w-full h-full object-cover select-none pointer-events-none"
        loading="lazy"
        onError={(e) => {
          // If image fails to load, gracefully hide broken icon
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  // 2. Built-in atmospheric scene themes
  if (scene.pattern === 'stars') {
    return (
      <div className="w-full h-full bg-slate-950 relative overflow-hidden flex items-center justify-center select-none pointer-events-none">
        <div className="absolute inset-0 bg-radial from-indigo-900/60 via-slate-950 to-slate-950" />
        <div className="w-1 h-1 rounded-full bg-white absolute top-2 left-2.5 shadow-[0_0_3px_#fff]" />
        <div className="w-0.5 h-0.5 rounded-full bg-indigo-300 absolute bottom-2 left-4" />
        <div className="w-1.5 h-1.5 rounded-full bg-amber-200 absolute top-3 right-3 shadow-[0_0_4px_#fde047]" />
        <div className="w-1 h-1 rounded-full bg-purple-300 absolute bottom-1.5 right-3.5" />
        <span className="text-[9px] font-bold text-indigo-300/80 tracking-widest uppercase">Cosmos</span>
      </div>
    );
  }

  if (scene.pattern === 'dots') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#062c20] via-[#052118] to-[#02140f] relative overflow-hidden flex items-center justify-center select-none pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, #34d399 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        />
        <span className="text-[9px] font-bold text-emerald-300/80 tracking-widest uppercase">Chalk</span>
      </div>
    );
  }

  if (scene.pattern === 'arcade') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#18032e] via-[#0f051d] to-[#050014] relative overflow-hidden flex items-center justify-center select-none pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'linear-gradient(to right, #ec4899 1px, transparent 1px), linear-gradient(to bottom, #a855f7 1px, transparent 1px)',
            backgroundSize: '10px 10px',
          }}
        />
        <span className="text-[9px] font-bold text-pink-200 tracking-widest uppercase relative z-10 bg-slate-950/70 px-1 py-0.2 rounded-xs">Neon</span>
      </div>
    );
  }

  if (scene.pattern === 'ocean') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#021526] via-[#03223f] to-[#041e2e] relative overflow-hidden flex items-center justify-center select-none pointer-events-none">
        <div className="w-6 h-6 rounded-full bg-cyan-400/20 blur-xs absolute" />
        <span className="text-[9px] font-bold text-cyan-300/85 tracking-widest uppercase">Ocean</span>
      </div>
    );
  }

  if (scene.pattern === 'notebook') {
    return (
      <div
        className="w-full h-full relative overflow-hidden flex items-center justify-center select-none pointer-events-none transition-colors duration-300 rounded-xs"
        style={{
          backgroundColor: activePastelHex || '#faf7fe',
        }}
      >
        {/* Top red header rule */}
        <div
          className="absolute left-0 right-0 h-[1.5px]"
          style={{ top: '24%', backgroundColor: '#f43f5e' }}
        />
        {/* Left vertical red margin rule */}
        <div
          className="absolute top-0 bottom-0 w-[1px]"
          style={{ left: '20%', backgroundColor: 'rgba(244, 63, 94, 0.45)' }}
        />
        {/* Horizontal blue ruled lines (starts below red header rule) */}
        <div
          className="absolute left-0 right-0 bottom-0 opacity-40 dark:opacity-30"
          style={{
            top: '24%',
            backgroundImage: 'linear-gradient(to bottom, transparent 4px, #60a5fa 5px)',
            backgroundSize: '100% 5px',
            backgroundPosition: '0 0',
          }}
        />
        <span className="text-[8px] font-bold text-slate-700 dark:text-slate-200 tracking-wider uppercase bg-white/90 dark:bg-slate-900/80 px-1 py-0.2 rounded-xs shadow-2xs z-10 border border-slate-200/60 dark:border-slate-750/60">
          3×5
        </span>
      </div>
    );
  }

  // 4. Pack with no backdrop: USE FIRST STICKER AS THUMBNAIL (User requested!)
  const firstSticker = linkedPack?.stickers?.[0];
  if (firstSticker) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-indigo-950/70 via-slate-900 to-purple-950/70 flex items-center justify-center p-1 select-none pointer-events-none">
        <div className="transition-transform group-hover:scale-110">
          <StickerIconRenderer icon={firstSticker.svgIcon} alt={firstSticker.name} size="sm" />
        </div>
      </div>
    );
  }

  // 5. Fallback: pack icon
  return (
    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg select-none pointer-events-none">
      <span>{cleanPackIcon(linkedPack?.icon)}</span>
    </div>
  );
};

interface StickerVaultProps {
  packs: StickerPack[];
  customScenes?: CanvasScene[];
  placedStickersProp?: PlacedSticker[];
  onUpdatePlacedStickers?: (stickers: PlacedSticker[]) => void;
  onSavePack?: (pack: StickerPack, scene?: CanvasScene) => void;
  onDeletePack?: (packId: string) => void;
  isOpenPackStudio?: boolean;
  initialOpenPackStudio?: boolean;
  onClosePackStudio?: () => void;
  resetNonce?: number;
}

export const StickerVault: React.FC<StickerVaultProps> = ({
  packs,
  customScenes: customScenesProp,
  placedStickersProp,
  onUpdatePlacedStickers,
  onSavePack,
  onDeletePack,
  isOpenPackStudio,
  initialOpenPackStudio = false,
  onClosePackStudio,
  resetNonce,
}) => {
  // Pack & Theme Manager Modal State
  const [isPackManagerOpen, setIsPackManagerOpen] = useState(isOpenPackStudio ?? initialOpenPackStudio);

  useEffect(() => {
    if (isOpenPackStudio !== undefined) {
      setIsPackManagerOpen(isOpenPackStudio);
    } else if (initialOpenPackStudio) {
      setIsPackManagerOpen(true);
    }
  }, [isOpenPackStudio, initialOpenPackStudio]);

  const [customScenes, setCustomScenes] = useState<CanvasScene[]>(() => {
    const raw = storage.loadCustomScenes();
    const currentPacks = storage.loadCustomPacks();
    const seenIds = new Set<string>();
    const cleaned: CanvasScene[] = [];
    for (let i = raw.length - 1; i >= 0; i--) {
      const sc = raw[i];
      if (!sc) continue;
      if (sc.id && seenIds.has(sc.id)) continue;

      const matchingPack = currentPacks.find(
        (p) => (sc.packId && p.id === sc.packId) || (p.themeSceneId && p.themeSceneId === sc.id)
      );
      const rawThemeTag = matchingPack?.theme || sc.theme;
      const hasThemeTag =
        rawThemeTag &&
        rawThemeTag.trim() &&
        rawThemeTag.trim().toLowerCase() !== 'custom';
      const themeTagText = hasThemeTag ? rawThemeTag.trim() : '';

      const rawPackName = matchingPack?.name || sc.name;
      const packNameText = rawPackName ? rawPackName.replace(/\s+Theme$/i, '').trim() : '';
      const finalName = themeTagText || packNameText || 'Custom';

      if (sc.id) seenIds.add(sc.id);
      cleaned.unshift({
        ...sc,
        name: finalName,
        theme: themeTagText || sc.theme || packNameText,
      });
    }
    return cleaned;
  });

  // Sync with customScenes prop if provided from App.tsx
  useEffect(() => {
    if (customScenesProp) {
      setCustomScenes(customScenesProp);
    }
  }, [customScenesProp]);

  // Merge built-in scenes and user-created custom backdrop scenes (deduplicating by unique scene id and allowing core overrides)
  const scenes = useMemo(() => {
    const builtInIds = new Set(CANVAS_SCENES.map((s) => s.id));
    const customSceneMap = new Map(
      customScenes.filter((cs) => cs && cs.id && builtInIds.has(cs.id)).map((cs) => [cs.id, cs])
    );

    const result: CanvasScene[] = [];

    // Built-in scenes first (with any user-edited core scene overrides applied)
    for (const sc of CANVAS_SCENES) {
      const override = customSceneMap.get(sc.id);
      result.push(override ? { ...sc, ...override, isCustom: false } : sc);
    }

    // Custom scenes (reverse so most recent wins if any duplicates exist)
    const seenIds = new Set<string>(builtInIds);
    const customCleaned: CanvasScene[] = [];
    for (let i = customScenes.length - 1; i >= 0; i--) {
      const cs = customScenes[i];
      if (!cs || !cs.id || seenIds.has(cs.id)) continue;
      seenIds.add(cs.id);
      customCleaned.unshift(cs);
    }

    return [...result, ...customCleaned];
  }, [customScenes]);

  const handleSavePackInternal = (pack: StickerPack, scene?: CanvasScene) => {
    setCustomScenes((prev) => {
      const filtered = prev.filter(
        (s) => (!scene || s.id !== scene.id) && s.packId !== pack.id
      );
      return scene ? [...filtered, scene] : filtered;
    });
    if (scene) {
      setActiveSceneId(scene.id);
      storage.saveCanvasSceneId(scene.id);
      if (pack.stickers && pack.stickers.length > 0) {
        setDrawerPackFilter(pack.id || 'all');
      } else {
        setDrawerPackFilter('all');
      }
    }
    if (onSavePack) {
      onSavePack(pack, scene);
    }
  };

  const handleDeletePackInternal = (packId: string) => {
    setCustomScenes((prev) => prev.filter((s) => s.packId !== packId));
    // If active canvas scene was linked to this pack, reset to default scene
    const activeSceneObj = scenes.find((s) => s.id === activeSceneId);
    if (activeSceneObj && activeSceneObj.packId === packId) {
      const defaultSceneId = CANVAS_SCENES[0].id;
      setActiveSceneId(defaultSceneId);
      storage.saveCanvasSceneId(defaultSceneId);
    }
    if (onDeletePack) {
      onDeletePack(packId);
    }
  };
  
  // Canvas State & Persistent Placed Stickers
  const [activeSceneId, setActiveSceneId] = useState(storage.loadCanvasSceneId());
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>(() => {
    if (placedStickersProp && placedStickersProp.length > 0) return placedStickersProp;
    return storage.loadPlacedStickers();
  });
  const placedStickersRef = useRef<PlacedSticker[]>(placedStickers);
  placedStickersRef.current = placedStickers;

  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Sync state when root placedStickersProp updates
  useEffect(() => {
    if (placedStickersProp) {
      placedStickersRef.current = placedStickersProp;
      setPlacedStickers(placedStickersProp);
    }
  }, [placedStickersProp]);

  // Centralized update function ensuring IndexedDB, memory cache, and App.tsx are in sync safely outside render
  const updatePlacedStickers = (updater: PlacedSticker[] | ((prev: PlacedSticker[]) => PlacedSticker[])) => {
    const next = typeof updater === 'function' ? updater(placedStickersRef.current) : updater;
    placedStickersRef.current = next;
    setPlacedStickers(next);
    storage.savePlacedStickers(next);
    onUpdatePlacedStickers?.(next);
  };

  // Pastel Theme State: alternates randomly across 7 pastel color sets
  const [activePastelId, setActivePastelId] = useState<string>(() => {
    const saved = storage.loadPastelColorId();
    if (saved && PASTEL_COLOR_SETS.some((s) => s.id === saved)) {
      return saved;
    }
    return getRandomPastelSet().id;
  });

  const activePastelSet: PastelSet =
    PASTEL_COLOR_SETS.find((s) => s.id === activePastelId) || PASTEL_COLOR_SETS[0];

  const handleAlternatePastel = () => {
    sounds.playPop();
    const nextSet = getRandomPastelSet(activePastelId);
    setActivePastelId(nextSet.id);
    storage.savePastelColorId(nextSet.id);
  };

  const handleSelectPastel = (id: string) => {
    sounds.playPop();
    setActivePastelId(id);
    storage.savePastelColorId(id);
  };


  // Dragging state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Backdrop click-and-drag scroll tracking
  const isBackdropPointerDown = useRef(false);
  const hasBackdropDragged = useRef(false);
  const backdropDragStartY = useRef(0);
  const backdropDragStartX = useRef(0);
  const backdropDragLastY = useRef(0);
  const backdropDragLastX = useRef(0);

  // Theme Scroller & Filter State (Option A & B)
  const [themeFilter, setThemeFilter] = useState<'all' | 'builtin' | 'custom'>('all');
  const [isThemeBrowserOpen, setIsThemeBrowserOpen] = useState(false);
  const [themeSearchQuery, setThemeSearchQuery] = useState('');
  const themeScrollerRef = useRef<HTMLDivElement>(null);

  // Quick Sticker Drawer State (Option A & B)
  const [drawerPackFilter, setDrawerPackFilter] = useState<string>('all');
  const [drawerRarityFilter, setDrawerRarityFilter] = useState<string>('all');
  const [drawerSearchQuery, setDrawerSearchQuery] = useState<string>('');
  const [isDrawerExpanded, setIsDrawerExpanded] = useState<boolean>(false);
  const [recentStickerIds, setRecentStickerIds] = useState<string[]>([]);
  const stickerScrollerRef = useRef<HTMLDivElement>(null);

  // Per-Backdrop Saturation & Brightness/Contrast State (Universal for all built-in & imported backdrops)
  const [backdropAdjustments, setBackdropAdjustments] = useState<Record<string, { saturation: number; lightLevel: number }>>(() => {
    if (typeof window === 'undefined') return {};
    return storage.loadBackdropAdjustments();
  });

  // Reset all backdrops to default saturation (100%), brightness (100%), and contrast (100%) when settings reset occurs
  useEffect(() => {
    if (resetNonce !== undefined && resetNonce > 0) {
      setBackdropAdjustments({});
      storage.clearBackdropAdjustments();
    }
  }, [resetNonce]);

  const currentSaturation = backdropAdjustments[activeSceneId]?.saturation ?? 100;
  const currentLightLevel = backdropAdjustments[activeSceneId]?.lightLevel ?? 100;
  const currentBrightness = currentLightLevel;
  const currentContrast = currentLightLevel;

  const handleBackdropSaturationChange = (newVal: number) => {
    setBackdropAdjustments((prev) => {
      const next = {
        ...prev,
        [activeSceneId]: {
          saturation: newVal,
          lightLevel: prev[activeSceneId]?.lightLevel ?? 100,
        },
      };
      storage.saveBackdropAdjustments(next);
      return next;
    });
  };

  const handleBackdropLightLevelChange = (newVal: number) => {
    setBackdropAdjustments((prev) => {
      const next = {
        ...prev,
        [activeSceneId]: {
          saturation: prev[activeSceneId]?.saturation ?? 100,
          lightLevel: newVal,
        },
      };
      storage.saveBackdropAdjustments(next);
      return next;
    });
  };

  const backdropFilterStyle = useMemo(() => {
    const filters: string[] = [];
    if (currentSaturation !== 100) filters.push(`saturate(${currentSaturation}%)`);
    if (currentBrightness !== 100) filters.push(`brightness(${currentBrightness}%)`);
    if (currentContrast !== 100) filters.push(`contrast(${currentContrast}%)`);
    return filters.length > 0 ? filters.join(' ') : undefined;
  }, [currentSaturation, currentBrightness, currentContrast]);

  // Universal Invisible Right Edge Brightness & Contrast Gesture State
  const [isAdjustingLight, setIsAdjustingLight] = useState(false);
  const [lightTouchPos, setLightTouchPos] = useState<{ x: number; y: number } | null>(null);
  const lightFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightEdgeStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (lightFadeTimeoutRef.current) {
        clearTimeout(lightFadeTimeoutRef.current);
      }
    };
  }, []);

  const updateLightFromPointer = (clientY: number, clientX: number) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const touchY = clientY - canvasRect.top;
    const touchX = Math.max(8, Math.min(canvasRect.width - 8, clientX - canvasRect.left));

    // Right edge strip stops above snapshot button (leaves corner free)
    const effectiveHeight = Math.max(100, canvasRect.height - 48);
    const clampedY = Math.max(0, Math.min(effectiveHeight, touchY));
    const fraction = 1 - (clampedY / effectiveHeight); // 0 at bottom, 1 at top

    // Map to 50% - 170% light level (steps of 5%)
    let newLevel = Math.round((50 + fraction * 120) / 5) * 5;

    // Magnetic snap detent around 100% (default)
    if (newLevel >= 95 && newLevel <= 105) {
      newLevel = 100;
    }

    handleBackdropLightLevelChange(newLevel);
    setLightTouchPos({ x: touchX, y: clampedY });
  };

  const handleRightEdgePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}

    if (lightFadeTimeoutRef.current) {
      clearTimeout(lightFadeTimeoutRef.current);
      lightFadeTimeoutRef.current = null;
    }

    setIsAdjustingLight(true);
    updateLightFromPointer(e.clientY, e.clientX);
  };

  const handleRightEdgePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isAdjustingLight) return;
    e.stopPropagation();
    updateLightFromPointer(e.clientY, e.clientX);
  };

  const handleRightEdgePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isAdjustingLight) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    e.stopPropagation();
    updateLightFromPointer(e.clientY, e.clientX);

    if (lightFadeTimeoutRef.current) {
      clearTimeout(lightFadeTimeoutRef.current);
    }
    lightFadeTimeoutRef.current = setTimeout(() => {
      setIsAdjustingLight(false);
    }, 850);
  };

  // Window pointer tracker for right edge brightness/contrast slider
  useEffect(() => {
    if (!isAdjustingLight) return;
    const onMove = (e: PointerEvent) => {
      updateLightFromPointer(e.clientY, e.clientX);
    };
    const onUp = (e: PointerEvent) => {
      updateLightFromPointer(e.clientY, e.clientX);
      if (lightFadeTimeoutRef.current) {
        clearTimeout(lightFadeTimeoutRef.current);
      }
      lightFadeTimeoutRef.current = setTimeout(() => {
        setIsAdjustingLight(false);
      }, 850);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isAdjustingLight]);

  // Universal Invisible Left Edge Saturation Gesture State
  const [isAdjustingSat, setIsAdjustingSat] = useState(false);
  const [satTouchPos, setSatTouchPos] = useState<{ x: number; y: number } | null>(null);
  const satFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leftEdgeStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (satFadeTimeoutRef.current) {
        clearTimeout(satFadeTimeoutRef.current);
      }
    };
  }, []);

  const updateSaturationFromPointer = (clientY: number, clientX: number) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const touchY = clientY - canvasRect.top;
    const touchX = Math.max(8, Math.min(canvasRect.width - 60, clientX - canvasRect.left));

    // Clamp vertical position between top (0) and bottom (canvasRect.height)
    const clampedY = Math.max(0, Math.min(canvasRect.height, touchY));
    const fraction = 1 - (clampedY / canvasRect.height); // 0 at bottom, 1 at top
    
    // Map to 0% - 250% saturation (in increments of 5)
    let newSat = Math.round((fraction * 250) / 5) * 5;
    
    // Magnetic snap detent around 100% (default)
    if (newSat >= 90 && newSat <= 110) {
      newSat = 100;
    }

    handleBackdropSaturationChange(newSat);
    setSatTouchPos({ x: touchX, y: clampedY });
  };

  const handleLeftEdgePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}

    if (satFadeTimeoutRef.current) {
      clearTimeout(satFadeTimeoutRef.current);
      satFadeTimeoutRef.current = null;
    }

    setIsAdjustingSat(true);
    updateSaturationFromPointer(e.clientY, e.clientX);
  };

  const handleLeftEdgePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isAdjustingSat) return;
    e.stopPropagation();
    updateSaturationFromPointer(e.clientY, e.clientX);
  };

  const handleLeftEdgePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isAdjustingSat) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    e.stopPropagation();
    updateSaturationFromPointer(e.clientY, e.clientX);

    if (satFadeTimeoutRef.current) {
      clearTimeout(satFadeTimeoutRef.current);
    }
    satFadeTimeoutRef.current = setTimeout(() => {
      setIsAdjustingSat(false);
    }, 850);
  };

  // Window pointer tracker for left edge saturation slider
  useEffect(() => {
    if (!isAdjustingSat) return;
    const onMove = (e: PointerEvent) => {
      updateSaturationFromPointer(e.clientY, e.clientX);
    };
    const onUp = (e: PointerEvent) => {
      updateSaturationFromPointer(e.clientY, e.clientX);
      if (satFadeTimeoutRef.current) {
        clearTimeout(satFadeTimeoutRef.current);
      }
      satFadeTimeoutRef.current = setTimeout(() => {
        setIsAdjustingSat(false);
      }, 850);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isAdjustingSat]);

  const scrollThemes = (direction: 'left' | 'right') => {
    sounds.playPop();
    if (themeScrollerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      themeScrollerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollStickers = (direction: 'left' | 'right') => {
    sounds.playPop();
    if (stickerScrollerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      stickerScrollerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Auto-scroll active theme button into view in the horizontal scroller
  useEffect(() => {
    if (themeScrollerRef.current) {
      const activeEl = themeScrollerRef.current.querySelector<HTMLElement>(`[data-scene-id="${activeSceneId}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeSceneId]);

  useEffect(() => {
    storage.saveCanvasSceneId(activeSceneId);
  }, [activeSceneId]);

  // Auto-reset clear confirmation after 6 seconds
  useEffect(() => {
    if (isConfirmingClear) {
      const timer = setTimeout(() => {
        setIsConfirmingClear(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmingClear]);

  // Unified list of all packs
  const allVaultPacks = useMemo(() => {
    return packs;
  }, [packs]);

  // Find all stickers across packs (guarantee unique sticker instances)
  const allStickers = useMemo(() => {
    const seen = new Set<string>();
    const list: Sticker[] = [];
    for (const p of allVaultPacks) {
      for (const s of p.stickers) {
        if (s && s.id) {
          const key = `${p.id || 'pack'}-${s.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push(s);
          }
        }
      }
    }
    return list;
  }, [allVaultPacks]);

  const getStickerById = (id: string): Sticker | undefined => allStickers.find((s) => s.id === id);

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];

  const isOceanTheme =
    activeSceneId === 'scene-ocean' ||
    activeScene?.id === 'scene-ocean' ||
    activeScene?.packId === 'pack-ocean' ||
    activeScene?.pattern === 'ocean' ||
    (activeScene?.name || '').toLowerCase().includes('ocean');

  // Helper to find linked pack with stickers for a given scene
  const getThemePackWithStickers = (sceneId: string): StickerPack | undefined => {
    const targetScene = scenes.find((s) => s.id === sceneId);
    if (!targetScene) return undefined;

    const linkedPack = allVaultPacks.find(
      (p) =>
        (targetScene.packId && p.id === targetScene.packId) ||
        (p.themeSceneId && p.themeSceneId === targetScene.id) ||
        p.id === targetScene.id
    );

    if (linkedPack && linkedPack.stickers && linkedPack.stickers.length > 0) {
      return linkedPack;
    }
    return undefined;
  };

  // Helper to select and activate a theme, synchronizing the sticker tray filter
  const selectTheme = (sceneId: string) => {
    setActiveSceneId(sceneId);
    storage.saveCanvasSceneId(sceneId);
    setActiveStickerId(null);
    setIsConfirmingClear(false);

    // On initially choosing a theme: set sticker tray filter to theme pack, or 'all' if no stickers
    const linkedPack = getThemePackWithStickers(sceneId);
    if (linkedPack && linkedPack.id) {
      setDrawerPackFilter(linkedPack.id);
    } else {
      setDrawerPackFilter('all');
    }
    setDrawerRarityFilter('all');
    setDrawerSearchQuery('');
  };

  // Sync sticker tray filter on initial load for the active theme
  const isInitialThemeMount = useRef(true);
  useEffect(() => {
    if (isInitialThemeMount.current && scenes.length > 0 && allVaultPacks.length > 0) {
      isInitialThemeMount.current = false;
      const linkedPack = getThemePackWithStickers(activeSceneId);
      if (linkedPack && linkedPack.id) {
        setDrawerPackFilter(linkedPack.id);
      } else {
        setDrawerPackFilter('all');
      }
    }
  }, [scenes, allVaultPacks, activeSceneId]);

  // Scene counts & filtering for theme scroller
  const builtinScenesCount = useMemo(() => scenes.filter((s) => !s.isCustom).length, [scenes]);
  const customScenesCount = useMemo(() => scenes.filter((s) => s.isCustom).length, [scenes]);

  const filteredScenes = useMemo(() => {
    return scenes.filter((sc) => {
      if (themeFilter === 'builtin' && sc.isCustom) return false;
      if (themeFilter === 'custom' && !sc.isCustom) return false;
      if (themeSearchQuery.trim()) {
        const q = themeSearchQuery.toLowerCase();
        const nameMatch = (sc.name || '').toLowerCase().includes(q);
        const themeMatch = (sc.theme || '').toLowerCase().includes(q);
        const linkedPack = allVaultPacks.find((p) => p.id === sc.packId || p.themeSceneId === sc.id);
        const packMatch = (linkedPack?.name || '').toLowerCase().includes(q);
        return nameMatch || themeMatch || !!packMatch;
      }
      return true;
    });
  }, [scenes, themeFilter, themeSearchQuery, allVaultPacks]);

  // Available stickers and filtered drawer stickers (defensively deduplicated)
  const availableStickers = useMemo(() => {
    const seen = new Set<string>();
    const list: Sticker[] = [];
    for (const s of allStickers) {
      if (s && s.id) {
        const uniqueKey = `${s.packId || 'pack'}-${s.id}`;
        if (!seen.has(uniqueKey)) {
          seen.add(uniqueKey);
          list.push(s);
        }
      }
    }
    return list;
  }, [allStickers]);

  const filteredDrawerStickers = useMemo(() => {
    return availableStickers.filter((s) => {
      if (drawerPackFilter === 'recent') {
        if (!recentStickerIds.includes(s.id)) return false;
      } else if (drawerPackFilter !== 'all') {
        const matchesPack =
          s.packId === drawerPackFilter ||
          allVaultPacks.find((p) => p.id === drawerPackFilter)?.stickers.some((st) => st.id === s.id);
        if (!matchesPack) return false;
      }
      if (drawerRarityFilter !== 'all' && (s.rarity || '').toLowerCase() !== drawerRarityFilter.toLowerCase()) {
        return false;
      }
      if (drawerSearchQuery.trim()) {
        const q = drawerSearchQuery.toLowerCase();
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const tagMatch = s.tags?.some((t) => (t || '').toLowerCase().includes(q));
        return nameMatch || !!tagMatch;
      }
      return true;
    });
  }, [availableStickers, drawerPackFilter, drawerRarityFilter, drawerSearchQuery, recentStickerIds, allVaultPacks]);

  // Currently active/selected sticker data (with resilient snapshot fallback for custom imported stickers like 470)
  const activePlacedSticker = placedStickers.find((s) => s.id === activeStickerId);
  const activeStickerData: Sticker | undefined = activePlacedSticker
    ? (getStickerById(activePlacedSticker.stickerId) ||
       (activePlacedSticker.stickerSnapshot
         ? {
             id: activePlacedSticker.stickerId,
             name: activePlacedSticker.stickerSnapshot.name,
             svgIcon: activePlacedSticker.stickerSnapshot.svgIcon,
             rarity: activePlacedSticker.stickerSnapshot.rarity || 'Common',
             color: '#6366f1',
             description: activePlacedSticker.stickerSnapshot.name,
             packId: activePlacedSticker.packId || 'custom',
             isUnlocked: true,
           }
         : undefined))
    : undefined;

  // Check if active sticker is an image asset (allowing auto-fit & trim)
  const isImageSticker = !!(
    activeStickerData &&
    (activeStickerData.isCustomImage ||
      activeStickerData.svgIcon.startsWith('data:image/') ||
      activeStickerData.svgIcon.startsWith('http://') ||
      activeStickerData.svgIcon.startsWith('https://') ||
      activeStickerData.svgIcon.startsWith('blob:') ||
      activeStickerData.svgIcon.startsWith('/') ||
      activeStickerData.svgIcon.endsWith('.png') ||
      activeStickerData.svgIcon.endsWith('.webp'))
  );

  // Auto-fit & Trim transparent padding for the currently selected placed sticker
  const handleAutoFitTrimActiveSticker = async () => {
    if (!activeStickerData || !activeStickerId) return;
    sounds.playPop();
    try {
      const trimmed = await trimAndMaximizeStickerImage(activeStickerData.svgIcon, 512, 0.04);

      // 1. Update placed sticker snapshot on the canvas so it instantly fills the frame
      const nextPlaced = placedStickers.map((p) => {
        if (p.id === activeStickerId || p.stickerId === activeStickerData.id) {
          return {
            ...p,
            stickerSnapshot: {
              name: activeStickerData.name,
              svgIcon: trimmed,
              rarity: activeStickerData.rarity || 'Common',
            },
          };
        }
        return p;
      });
      setPlacedStickers(nextPlaced);
      storage.savePlacedStickers(nextPlaced);
      onUpdatePlacedStickers?.(nextPlaced);

      // 2. Persist update in custom sticker pack so future stamps also fill the frame
      const storedPacks = storage.loadCustomPacks();
      let updatedPack: StickerPack | undefined;
      const nextPacks = storedPacks.map((p) => {
        const idx = p.stickers.findIndex((s) => s.id === activeStickerData.id);
        if (idx !== -1) {
          const updatedStickers = [...p.stickers];
          updatedStickers[idx] = { ...updatedStickers[idx], svgIcon: trimmed };
          updatedPack = { ...p, stickers: updatedStickers };
          return updatedPack;
        }
        return p;
      });

      if (updatedPack) {
        storage.saveCustomPacks(nextPacks);
        onSavePack?.(updatedPack);
      }

      sounds.playFanfare();
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.warn('Auto fit trim failed:', err);
    }
  };

  // Stickers that belong to the currently viewed scene page (fallback unassigned to default notebook scene)
  const sceneStickers = useMemo(() => {
    return placedStickers.filter((s) => {
      if (!s.sceneId) {
        return activeSceneId === 'scene-notebook' || !activeSceneId;
      }
      return s.sceneId === activeSceneId;
    });
  }, [placedStickers, activeSceneId]);

  // Stamp sticker onto active canvas scene page
  const handleStampSticker = (stickerId: string) => {
    sounds.playStick();
    const stickerData = getStickerById(stickerId);
    const newPlaced: PlacedSticker = {
      id: `placed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stickerId,
      sceneId: activeSceneId,
      packId: activeScene?.packId || undefined,
      x: 30 + Math.random() * 40, // 30% to 70%
      y: 30 + Math.random() * 40,
      rotation: 0, // Primary direction (like in sticker drawer)
      scale: 1,
      isFlipped: false,
      stickerSnapshot: stickerData
        ? {
            name: stickerData.name,
            svgIcon: stickerData.svgIcon,
            rarity: stickerData.rarity,
          }
        : undefined,
    };

    updatePlacedStickers((prev) => [...prev, newPlaced]);
    setRecentStickerIds((prev) => [stickerId, ...prev.filter((id) => id !== stickerId)].slice(0, 12));
    setActiveStickerId(newPlaced.id);
  };

  // Sticker manipulation
  const rotateActiveSticker = (deltaDeg: number) => {
    if (!activeStickerId) return;
    sounds.playPop();
    updatePlacedStickers((prev) =>
      prev.map((s) => (s.id === activeStickerId ? { ...s, rotation: (s.rotation + deltaDeg) % 360 } : s))
    );
  };

  const flipActiveStickerHorizontal = () => {
    if (!activeStickerId) return;
    sounds.playPop();
    updatePlacedStickers((prev) =>
      prev.map((s) => (s.id === activeStickerId ? { ...s, isFlipped: !s.isFlipped } : s))
    );
  };

  const scaleActiveSticker = (factor: number) => {
    if (!activeStickerId) return;
    sounds.playPop();
    updatePlacedStickers((prev) =>
      prev.map((s) =>
        s.id === activeStickerId
          ? { ...s, scale: Math.max(0.5, Math.min(2.5, +(s.scale * factor).toFixed(2))) }
          : s
      )
    );
  };

  const removeActiveSticker = () => {
    if (!activeStickerId) return;
    sounds.playPop();
    updatePlacedStickers((prev) => prev.filter((s) => s.id !== activeStickerId));
    setActiveStickerId(null);
  };

  const handleConfirmClear = () => {
    sounds.playPop();
    // Remove all stickers placed on this specific scene page
    updatePlacedStickers((prev) =>
      prev.filter((s) => (s.sceneId ? s.sceneId !== activeSceneId : activeSceneId !== 'scene-notebook'))
    );
    setActiveStickerId(null);
    setIsConfirmingClear(false);
  };

  // Canvas Screenshot Capture State & Handler
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [showShutterFlash, setShowShutterFlash] = useState(false);

  const handleCaptureScreenshot = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canvasRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      // Temporarily deselect any active sticker so selection outline doesn't show in photo
      const previousActiveSticker = activeStickerId;
      setActiveStickerId(null);

      // Trigger shutter flash
      setShowShutterFlash(true);
      sounds.playStick();
      setTimeout(() => setShowShutterFlash(false), 260);

      // Give React a frame to deselect before snapping
      await new Promise((res) => setTimeout(res, 90));

      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: 2, // High-res retina screenshot
        skipFonts: true,
        filter: (node) => {
          if (node instanceof HTMLElement && node.getAttribute('data-capture-ignore') === 'true') {
            return false;
          }
          return true;
        },
      });

      if (previousActiveSticker) {
        setActiveStickerId(previousActiveSticker);
      }

      // Trigger fanfare audio, celebratory confetti burst, and success badge
      sounds.playFanfare();
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
      });
      setCaptureSuccess(true);
      setTimeout(() => setCaptureSuccess(false), 3500);

      // Download file automatically to Downloads folder
      const link = document.createElement('a');
      const safeName = (activeScene.name || 'StickerBook-Canvas').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `StickerBook-${safeName}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to capture canvas screenshot:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Mouse & Touch Drag Handling for Stickers on Canvas
  const handlePointerDown = (e: React.PointerEvent, placedId: string) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
    sounds.playPop();
    setActiveStickerId(placedId);
    setDraggingId(placedId);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;
      const sticker = placedStickers.find((s) => s.id === placedId);
      if (sticker) {
        const currentPxX = (sticker.x / 100) * rect.width;
        const currentPxY = (sticker.y / 100) * rect.height;
        setDragOffset({
          x: clientX - (rect.left + currentPxX),
          y: clientY - (rect.top + currentPxY),
        });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    const newPxX = e.clientX - rect.left - dragOffset.x;
    const newPxY = e.clientY - rect.top - dragOffset.y;

    const newX = Math.max(5, Math.min(95, (newPxX / rect.width) * 100));
    const newY = Math.max(5, Math.min(95, (newPxY / rect.height) * 100));

    // Smooth real-time coordinate update
    const updated = placedStickersRef.current.map((s) =>
      s.id === draggingId ? { ...s, x: newX, y: newY } : s
    );
    placedStickersRef.current = updated;
    setPlacedStickers(updated);
  };

  const handlePointerUp = () => {
    if (draggingId) {
      setDraggingId(null);
      const finalStickers = placedStickersRef.current;
      storage.savePlacedStickers(finalStickers);
      onUpdatePlacedStickers?.(finalStickers);
    }
  };

  // Global safety net for pointer release during sticker dragging
  useEffect(() => {
    if (!draggingId) return;

    const handleGlobalPointerUp = () => {
      handlePointerUp();
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [draggingId]);

  // Backdrop Drag-to-Scroll & Pointer Handlers (scrolls page like clicking & dragging on background)
  const handleBackdropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore interactive controls like the camera snapshot button or edge sliders
    if ((e.target as HTMLElement).closest('button, [data-edge-strip="true"]')) {
      return;
    }

    isBackdropPointerDown.current = true;
    hasBackdropDragged.current = false;
    backdropDragStartY.current = e.clientY;
    backdropDragStartX.current = e.clientX;
    backdropDragLastY.current = e.clientY;
    backdropDragLastX.current = e.clientX;

    // For mouse, capture pointer so smooth scrolling continues even if cursor moves fast
    if (e.pointerType === 'mouse') {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // 1. If currently dragging a sticker, reposition the sticker
    if (draggingId) {
      handlePointerMove(e);
      return;
    }

    // 2. If mouse dragging on backdrop, scroll the page
    if (isBackdropPointerDown.current && e.pointerType === 'mouse') {
      const deltaY = e.clientY - backdropDragLastY.current;
      const totalMoved = Math.hypot(
        e.clientX - backdropDragStartX.current,
        e.clientY - backdropDragStartY.current
      );

      if (totalMoved > 3) {
        hasBackdropDragged.current = true;
        window.scrollBy({
          top: -deltaY,
          left: 0,
          behavior: 'auto',
        });
        backdropDragLastY.current = e.clientY;
        backdropDragLastX.current = e.clientX;
      }
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingId) {
      handlePointerUp();
    }

    if (isBackdropPointerDown.current) {
      isBackdropPointerDown.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}

      // If user tapped/clicked without dragging, deselect active sticker
      if (!hasBackdropDragged.current) {
        setActiveStickerId(null);
        setIsConfirmingClear(false);
      }
      hasBackdropDragged.current = false;
    }
  };

  const handleCanvasPointerCancel = () => {
    if (draggingId) {
      handlePointerUp();
    }
    isBackdropPointerDown.current = false;
    hasBackdropDragged.current = false;
  };

  // Rarity color helpers
  const getRarityBadgeStyle = (rarity: StickerRarity) => {
    switch (rarity) {
      case 'Common':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rare':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Legendary':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Mythic':
        return 'bg-pink-100 text-pink-800 border-pink-300';
    }
  };

  // Scene outer container border & shadow styles (keeps outer frame crisp and independent of backdrop filters)
  const getSceneBorderClass = (pattern: string) => {
    switch (pattern) {
      case 'notebook':
        return `${activePastelSet.canvasBorder} shadow-inner`;
      case 'stars':
        return 'border-indigo-900 shadow-xl';
      case 'dots':
        return 'border-emerald-800/80 shadow-inner';
      case 'arcade':
        return 'border-fuchsia-500/30 shadow-[0_0_25px_rgba(244,63,94,0.18)] shadow-xl';
      case 'ocean':
        return 'border-cyan-700/60 shadow-[0_0_25px_rgba(6,182,212,0.18)]';
      case 'custom-image':
        return 'border-indigo-700/50 shadow-xl';
      default:
        return 'border-slate-300 dark:border-slate-700 shadow-md';
    }
  };

  // Scene inner background color/gradient styles (filtered in real-time by saturation / brightness / contrast)
  const getSceneBackgroundClass = (pattern: string) => {
    switch (pattern) {
      case 'notebook':
        return activePastelSet.canvasBg;
      case 'stars':
        return 'bg-slate-950 text-white';
      case 'dots':
        return 'bg-gradient-to-b from-[#062c20] via-[#052118] to-[#02140f] text-emerald-100';
      case 'arcade':
        return 'bg-gradient-to-b from-[#120722] via-[#0d051b] to-[#06020e] text-fuchsia-100';
      case 'ocean':
        return 'bg-gradient-to-b from-[#021526] via-[#03223f] to-[#041e2e] text-cyan-100';
      case 'custom-image':
        return 'bg-slate-950 text-slate-100';
      default:
        return 'bg-white text-slate-800';
    }
  };

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto w-full px-2 sm:px-4 py-1 sm:py-2">
      {/* ================= DIGITAL STICKER BOOK CANVAS ================= */}
      <div className="w-full flex flex-col items-center">
          {/* Canvas Toolbar: Scene Picker & Sticker Transformation Controls */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2.5 mb-3 p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Scene Picker & Scroller */}
            <div className="flex flex-wrap items-center gap-2 max-w-full">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">Theme:</span>

                {/* Source Filter Chips (visible if custom scenes exist) */}
                {customScenesCount > 0 && (
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setThemeFilter('all')}
                      className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        themeFilter === 'all'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                      title={`Show all ${scenes.length} themes`}
                    >
                      All ({scenes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemeFilter('builtin')}
                      className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        themeFilter === 'builtin'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                      title={`Show built-in default themes (${builtinScenesCount})`}
                    >
                      Built-in
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemeFilter('custom')}
                      className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        themeFilter === 'custom'
                          ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                      title={`Show custom themes created in ThemePack STUDIO (${customScenesCount})`}
                    >
                      Studio ({customScenesCount})
                    </button>
                  </div>
                )}
              </div>

              {/* Horizontal Scroller with Left & Right Chevrons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollThemes('left')}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Scroll themes left"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div
                  ref={themeScrollerRef}
                  className="overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-1.5 max-w-[220px] sm:max-w-[320px] md:max-w-[420px] lg:max-w-[540px] py-0.5 px-0.5"
                >
                  {filteredScenes.map((sc) => {
                    const isActive = activeSceneId === sc.id;
                    const isPastel = sc.id === 'scene-notebook';

                    return (
                      <button
                        key={sc.id}
                        data-scene-id={sc.id}
                        onClick={() => {
                          if (isActive) {
                            // Subsequent clicks: randomly cycle through other available color options for pastel
                            if (isPastel) {
                              handleAlternatePastel();
                            } else {
                              sounds.playPop();
                            }
                          } else {
                            // Initial click: activate the chosen theme without randomizing the color palette
                            sounds.playPop();
                            selectTheme(sc.id);
                          }
                        }}
                        title={
                          isActive
                            ? isPastel
                              ? `3×5 Note Card active (${activePastelSet.name}) — click again to shuffle colors`
                              : `${sc.name} active`
                            : `Switch to ${sc.name}`
                        }
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                        }`}
                      >
                        {isPastel && (
                          <span
                            className="w-2 h-2 rounded-full transition-colors duration-300 shadow-2xs shrink-0"
                            style={{ backgroundColor: activePastelSet.swatchHex }}
                          />
                        )}
                        <span>
                          {(() => {
                            // Find linked pack to get the user's Theme Tag and Pack Name
                            const linkedPack = packs.find(
                              (p) => p.id === sc.packId || p.themeSceneId === sc.id
                            );
                            const rawThemeTag = linkedPack?.theme || sc.theme;
                            const hasThemeTag =
                              rawThemeTag &&
                              rawThemeTag.trim() &&
                              rawThemeTag.trim().toLowerCase() !== 'custom';
                            const themeTagText = hasThemeTag ? rawThemeTag.trim() : '';

                            const rawPackName = linkedPack?.name || sc.name;
                            const packNameText = rawPackName
                              ? rawPackName.replace(/\s+Theme$/i, '').trim()
                              : '';

                            // Check if this scene or pack was customized/renamed
                            const isCoreModified = storage.loadCustomPacks().some((cp) => cp.id === sc.packId || cp.id === linkedPack?.id) ||
                              storage.loadCustomScenes().some((cs) => cs.id === sc.id);

                            if (!sc.isCustom && !isCoreModified) {
                              return sc.name.split(' ')[0];
                            }

                            // Use Theme Tag text as default; if not set or blank then Pack Name text
                            const caption = themeTagText || packNameText || sc.name || 'Custom';
                            return caption.length > 16 ? caption.slice(0, 14) + '..' : caption;
                          })()}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => scrollThemes('right')}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Scroll themes right"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Browse All Themes Button (Option B Theme Browser Drawer) */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsThemeBrowserOpen(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shrink-0 ml-0.5"
                  title="Browse all themes in visual grid (Option B)"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden md:inline">Browse</span>
                </button>
              </div>
            </div>

            {/* Selected Sticker Actions */}
            <div className="flex items-center gap-1.5 ml-auto">
              {activeStickerData && activeStickerId && (
                <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-indigo-50/90 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1 px-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 max-w-[100px] sm:max-w-[140px] truncate">
                    <StickerIconRenderer icon={activeStickerData.svgIcon} size="sm" alt={activeStickerData.name} />
                    <span className="truncate hidden sm:inline">{activeStickerData.name}</span>
                  </div>
                  <div className="w-[1px] h-4 bg-indigo-200 dark:bg-indigo-800 mx-0.5" />
                  <button
                    type="button"
                    onClick={() => rotateActiveSticker(-15)}
                    className="p-1 sm:p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Rotate Left (-15°)"
                  >
                    <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 -scale-x-100" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateActiveSticker(15)}
                    className="p-1 sm:p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Rotate Right (+15°)"
                  >
                    <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={flipActiveStickerHorizontal}
                    className={`p-1 sm:p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      activePlacedSticker?.isFlipped
                        ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-200 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title={activePlacedSticker?.isFlipped ? "Mirror Horizontal (Currently flipped - Click to revert)" : "Mirror Horizontal (Flip)"}
                    aria-label="Mirror sticker horizontally"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleActiveSticker(1.15)}
                    className="p-1 sm:p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Grow Sticker (+)"
                  >
                    <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleActiveSticker(0.85)}
                    className="p-1 sm:p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Shrink Sticker (-)"
                  >
                    <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  {isImageSticker && (
                    <button
                      type="button"
                      onClick={handleAutoFitTrimActiveSticker}
                      className="p-1 sm:p-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Trim & Maximize Frame (Auto-crop transparent padding to fill frame like built-in stickers)"
                      aria-label="Trim and maximize frame"
                    >
                      <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[10px] font-bold hidden md:inline">Fit Frame</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={removeActiveSticker}
                    className="p-1 sm:p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                    title="Peel Off / Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setActiveStickerId(null);
                    }}
                    className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Drop sticker onto scene"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Drop</span>
                  </button>
                  <div className="w-[1px] h-4 bg-indigo-200 dark:bg-indigo-800 mx-0.5" />
                </div>
              )}

              {/* Clear Page Option with In-App Confirmation */}
              {isConfirmingClear ? (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                  <span className="text-xs text-red-600 dark:text-red-400 font-bold hidden sm:inline">
                    Clear {sceneStickers.length} sticker{sceneStickers.length > 1 ? 's' : ''}?
                  </span>
                  <button
                    type="button"
                    onClick={handleConfirmClear}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    Yes, Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingClear(false)}
                    className="px-2 py-1 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (sceneStickers.length === 0) return;
                      sounds.playPop();
                      setIsConfirmingClear(true);
                    }}
                    disabled={sceneStickers.length === 0}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                      sceneStickers.length === 0
                        ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        : 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer'
                    }`}
                    title={sceneStickers.length === 0 ? 'No stickers on this page to clear' : `Clear all ${sceneStickers.length} stickers from this page`}
                  >
                    Clear Page
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* THE STICKER CANVAS */}
          <div
            ref={canvasRef}
            onPointerDown={handleBackdropPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerCancel}
            className={`relative w-full h-[400px] sm:h-[480px] rounded-3xl overflow-hidden border-4 select-none transition-all duration-500 bg-slate-950 ${getSceneBorderClass(
              activeScene.pattern
            )}`}
            style={{ touchAction: 'pan-y' }}
          >
            {/* Visual Backdrop Layers (With dynamic real-time Saturation / Brightness / Contrast filter) */}
            <div
              data-canvas-bg="true"
              className={`absolute inset-0 pointer-events-none overflow-hidden select-none transition-[filter] duration-75 ${getSceneBackgroundClass(
                activeScene.pattern
              )}`}
              style={{
                filter: backdropFilterStyle,
              }}
            >
              {activeScene.pattern === 'notebook' && (
                <div 
                  data-canvas-bg="true" 
                  className="absolute inset-0 select-none pointer-events-none transition-all duration-500 overflow-hidden"
                >
                  {/* Subtle paper grain / card texture gradient */}
                  <div
                    data-canvas-bg="true"
                    className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(0,0,0,0.02) 100%)',
                    }}
                  />

                  {/* Horizontal Blue/Indigo Ruled Lines across the note card body (strictly below the red header rule) */}
                  <div
                    data-canvas-bg="true"
                    className="absolute left-0 right-0 bottom-0 pointer-events-none transition-opacity duration-300"
                    style={{
                      top: '48px',
                      backgroundImage: `linear-gradient(to bottom, transparent calc(100% - 1.2px), ${activePastelSet.ruleColor} 1.2px)`,
                      backgroundSize: '100% 28px',
                      backgroundPosition: '0 0',
                    }}
                  />

                  {/* Classic Red / Rose Header Rule across the top */}
                  <div
                    data-canvas-bg="true"
                    className="absolute left-0 right-0 h-[2px] transition-colors duration-300 shadow-[0_1px_2px_rgba(244,63,94,0.15)] pointer-events-none"
                    style={{
                      top: '48px',
                      backgroundColor: activePastelSet.headerRuleColor,
                    }}
                  />

                  {/* Classic Red / Coral Vertical Margin Rule on the left side */}
                  <div
                    data-canvas-bg="true"
                    className="absolute top-0 bottom-0 w-[1.5px] transition-colors duration-300 pointer-events-none"
                    style={{
                      left: '52px',
                      backgroundColor: activePastelSet.marginColor,
                    }}
                  />
                </div>
              )}
              {activeScene.pattern === 'stars' && !activeScene.isCustom && (
                <SpaceBackground />
              )}
              {activeScene.pattern === 'dots' && !activeScene.isCustom && (
                <PrehistoricBackground />
              )}
              {activeScene.pattern === 'arcade' && !activeScene.isCustom && (
                <NeonBackground />
              )}
              {activeScene.pattern === 'ocean' && !activeScene.isCustom && (
                <OceanBackground />
              )}
              {(activeScene.isCustom || activeScene.pattern === 'custom-image') && activeScene.customConfig && (
                <CustomCanvasBackground config={activeScene.customConfig} />
              )}
            </div>

            {/* Left Edge Saturation Slider Strip (Universal across all backdrops) */}
            <div
              ref={leftEdgeStripRef}
              data-capture-ignore="true"
              data-edge-strip="true"
              onPointerDown={handleLeftEdgePointerDown}
              onPointerMove={handleLeftEdgePointerMove}
              onPointerUp={handleLeftEdgePointerUp}
              onPointerCancel={handleLeftEdgePointerUp}
              className="absolute left-0 top-0 bottom-0 w-10 sm:w-14 z-30 touch-none cursor-ns-resize group select-none"
              title="Slide vertically along left edge to adjust backdrop saturation"
              style={{ touchAction: 'none' }}
            >
              {/* Vertical indicator rail (subtle notch when idle, glowing cyan when scrubbing or hovering) */}
              <div
                className={`absolute left-1.5 top-6 bottom-6 w-1 rounded-full transition-all duration-200 pointer-events-none ${
                  isAdjustingSat
                    ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)] opacity-100 scale-x-125'
                    : 'bg-white/40 dark:bg-white/30 opacity-40 group-hover:opacity-85'
                }`}
              />

              {/* Vertical position indicator pip along the rail during adjustment */}
              {isAdjustingSat && satTouchPos && (
                <div
                  className="absolute left-0.5 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,1)] border-2 border-white pointer-events-none transition-transform -translate-y-1/2"
                  style={{ top: `${satTouchPos.y}px` }}
                />
              )}
            </div>

            {/* Floating Status % Tooltip (Appears to the right of touch coordinates) */}
            {isAdjustingSat && satTouchPos && (
              <div
                data-capture-ignore="true"
                className="absolute z-40 pointer-events-none transition-all duration-75 ease-out animate-in fade-in zoom-in-95"
                style={{
                  left: `${Math.max(48, satTouchPos.x + 24)}px`,
                  top: `${Math.max(24, Math.min(376, satTouchPos.y))}px`,
                  transform: 'translateY(-50%)',
                }}
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-cyan-400/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] font-mono text-xs font-bold whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-cyan-300">
                    {currentSaturation}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {currentSaturation === 100
                      ? '(Default)'
                      : currentSaturation === 0
                      ? '(Mono)'
                      : currentSaturation >= 200
                      ? '(Ultra)'
                      : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Right Edge Brightness & Contrast Slider Strip (Universal across all backdrops) */}
            <div
              ref={rightEdgeStripRef}
              data-capture-ignore="true"
              data-edge-strip="true"
              onPointerDown={handleRightEdgePointerDown}
              onPointerMove={handleRightEdgePointerMove}
              onPointerUp={handleRightEdgePointerUp}
              onPointerCancel={handleRightEdgePointerUp}
              className="absolute right-0 top-0 bottom-14 w-10 sm:w-14 z-30 touch-none cursor-ns-resize group select-none"
              title="Slide vertically along right edge to adjust brightness & contrast simultaneously"
              style={{ touchAction: 'none' }}
            >
              {/* Vertical indicator rail (subtle notch when idle, glowing amber when scrubbing or hovering) */}
              <div
                className={`absolute right-1.5 top-6 bottom-6 w-1 rounded-full transition-all duration-200 pointer-events-none ${
                  isAdjustingLight
                    ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] opacity-100 scale-x-125'
                    : 'bg-white/40 dark:bg-white/30 opacity-40 group-hover:opacity-85'
                }`}
              />

              {/* Vertical position indicator pip along the rail during adjustment */}
              {isAdjustingLight && lightTouchPos && (
                <div
                  className="absolute right-0.5 w-3 h-3 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,1)] border-2 border-white pointer-events-none transition-transform -translate-y-1/2"
                  style={{ top: `${lightTouchPos.y}px` }}
                />
              )}
            </div>

            {/* Floating Status % Tooltip (Appears to the LEFT of touch coordinates on right edge) */}
            {isAdjustingLight && lightTouchPos && (
              <div
                data-capture-ignore="true"
                className="absolute z-40 pointer-events-none transition-all duration-75 ease-out animate-in fade-in zoom-in-95"
                style={{
                  left: `${lightTouchPos.x - 24}px`,
                  top: `${Math.max(24, Math.min(376, lightTouchPos.y))}px`,
                  transform: 'translate(-100%, -50%)',
                }}
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-amber-400/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] font-mono text-xs font-bold whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-300">
                    {currentLightLevel}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {currentLightLevel === 100
                      ? '(Default)'
                      : currentLightLevel <= 65
                      ? '(Dark / Moody)'
                      : currentLightLevel >= 135
                      ? '(Bright / Punchy)'
                      : 'B&C'}
                  </span>
                </div>
              </div>
            )}

            {/* Watermark Label */}
            <div className={`absolute top-4 left-5 pointer-events-none opacity-45 text-xs font-display font-bold uppercase tracking-wider transition-colors duration-500 ${
              activeScene.pattern === 'notebook'
                ? activePastelSet.accentText
                : activeScene.pattern === 'stars'
                ? 'text-indigo-300'
                : activeScene.pattern === 'dots'
                ? 'text-emerald-300'
                : activeScene.pattern === 'arcade'
                ? 'text-fuchsia-400'
                : activeScene.pattern === 'ocean'
                ? 'text-cyan-300'
                : 'text-indigo-300'
            }`}>
              {activeScene.pattern === 'notebook' 
                ? `3×5 Card • ${activePastelSet.name}` 
                : activeScene.name} • {sceneStickers.length} Stickers Placed
            </div>

            {/* Empty Canvas Guidance */}
            {sceneStickers.length === 0 && (
              <div data-canvas-bg="true" className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 cursor-default pointer-events-none">
                <h4 className={`font-display font-bold text-base pointer-events-none ${
                  activeScene.pattern === 'stars' || activeScene.pattern === 'dots' || activeScene.pattern === 'arcade' || activeScene.pattern === 'ocean' || activeScene.isCustom
                    ? 'text-slate-200'
                    : 'text-slate-700 dark:text-slate-200'
                }`}>
                  Your Sticker Book is Ready
                </h4>
                <p className={`text-xs max-w-xs mt-1 pointer-events-none ${
                  activeScene.pattern === 'stars'
                    ? 'text-slate-400'
                    : activeScene.pattern === 'dots'
                    ? 'text-emerald-200/70'
                    : activeScene.pattern === 'arcade'
                    ? 'text-fuchsia-200/70'
                    : activeScene.pattern === 'ocean'
                    ? 'text-cyan-200/70'
                    : activeScene.isCustom
                    ? 'text-indigo-200/70'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  Click any sticker from the drawer below or unlock theme packs to design your canvas!
                </p>
              </div>
            )}

            {/* Placed Stickers on Canvas */}
            {sceneStickers.map((placed) => {
              const liveSticker = getStickerById(placed.stickerId);
              const sticker: Sticker = liveSticker || (placed.stickerSnapshot ? {
                id: placed.stickerId,
                name: placed.stickerSnapshot.name,
                svgIcon: placed.stickerSnapshot.svgIcon,
                rarity: placed.stickerSnapshot.rarity || 'Common',
                color: '#6366f1',
                description: placed.stickerSnapshot.name,
                packId: placed.packId || 'custom',
              } : {
                id: placed.stickerId,
                name: 'Placed Sticker',
                svgIcon: '✨',
                rarity: 'Common' as const,
                color: '#6366f1',
                description: 'Custom sticker',
                packId: placed.packId || 'custom',
              });
              const isSelected = activeStickerId === placed.id;

              return (
                <div
                  key={placed.id}
                  id={`placed-sticker-${placed.id}`}
                  onPointerDown={(e) => handlePointerDown(e, placed.id)}
                  onPointerMove={(e) => {
                    if (draggingId) {
                      handlePointerMove(e);
                    }
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    try {
                      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
                    } catch {}
                    handlePointerUp();
                  }}
                  onPointerCancel={(e) => {
                    e.stopPropagation();
                    try {
                      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
                    } catch {}
                    handlePointerUp();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveStickerId(placed.id);
                  }}
                  style={{
                    touchAction: 'none',
                    left: `${placed.x}%`,
                    top: `${placed.y}%`,
                    transform: `translate(-50%, -50%) rotate(${placed.rotation}deg) scale(${placed.scale})`,
                  }}
                  className={`absolute cursor-grab active:cursor-grabbing transition-transform select-none ${
                    isSelected ? 'z-30' : 'z-10'
                  }`}
                  title={`${sticker.name} (${sticker.rarity}) - Click to move or edit`}
                >
                  <div className="relative group flex items-center justify-center p-0.5">
                    {/* Die-Cut Shaped Sticker with Contour Border (Transparent background, no white card) */}
                    <div
                      style={{
                        transform: placed.isFlipped ? 'scaleX(-1)' : undefined,
                        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                      className="inline-flex items-center justify-center pointer-events-auto"
                    >
                      <div
                        className={`die-cut-sticker ${
                          isSelected ? 'die-cut-sticker-selected scale-105' : 'hover:scale-105'
                        } flex items-center justify-center transition-transform`}
                      >
                        <StickerIconRenderer icon={placed.stickerSnapshot?.svgIcon || sticker.svgIcon} alt={sticker.name} size="2xl" />
                      </div>
                    </div>

                    {/* Selected Indicator Bounding Box & Blue Selection Aura (Visible until dropped) */}
                    {isSelected && (
                      <>
                        {/* Ambient Blue Selection Aura - Snug contour */}
                        <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-sm pointer-events-none animate-pulse" />

                        {/* Dashed Bounding Frame - Snug fit */}
                        <div className="absolute -inset-1 border-2 border-dashed border-blue-500 dark:border-blue-400 rounded-xl pointer-events-none animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.4)]" />

                        {/* Floating Status Pill with Name */}
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold whitespace-nowrap shadow-md pointer-events-none flex items-center gap-1.5 z-40">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
                          <span>{sticker.name}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Shutter Flash Animation Effect */}
            {showShutterFlash && (
              <div
                data-capture-ignore="true"
                className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200 opacity-80"
              />
            )}

            {/* Backdrop Bottom-Right Corner Camera Snapshot Button */}
            <div
              data-capture-ignore="true"
              className="absolute bottom-3 right-3 z-30 flex items-center gap-2 pointer-events-auto"
            >
              {captureSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-lg animate-bounce">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved to Downloads!</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleCaptureScreenshot}
                disabled={isCapturing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/65 dark:bg-slate-900/65 hover:bg-white/85 dark:hover:bg-slate-900/85 backdrop-blur-md border border-slate-200/65 dark:border-slate-700/65 text-slate-800 dark:text-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer group"
                title="Capture screenshot of this backdrop & placed stickers to save or share"
                aria-label="Capture and save screenshot"
              >
                <Camera className={`w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform ${isCapturing ? 'animate-spin' : ''}`} />
                <span className="text-xs font-bold hidden sm:inline">
                  {isCapturing ? 'Snapping...' : 'Snapshot'}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Sticker Drawer Carousel at the Bottom */}
          <div className="w-full mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
            {/* Drawer Header with Filter & Layout Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2 px-1">
              {/* Row 1 in Portrait / Left Cluster on Desktop: Title on left, View tools on right */}
              <div className="flex items-center justify-between gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                  <span>Sticker Tray <span className="text-slate-400 dark:text-slate-500 font-normal">({filteredDrawerStickers.length})</span></span>
                </span>

                {/* Tray View Tools (Compact Strip / Expand + Chevrons) for Mobile & Portrait (< md) */}
                <div className="flex md:hidden items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setIsDrawerExpanded(!isDrawerExpanded);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isDrawerExpanded
                        ? 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                    title={isDrawerExpanded ? 'Switch to Compact 2-Row Strip' : 'Expand to Multi-Row Drawer Tray (Option B)'}
                  >
                    {isDrawerExpanded ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5 text-pink-500" />
                        <span className="text-[11px]">Strip</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Expand</span>
                      </>
                    )}
                  </button>

                  {!isDrawerExpanded && (
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => scrollStickers('left')}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Scroll stickers left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollStickers('right')}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Scroll stickers right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2 in Portrait / Center Cluster on Desktop: Filters & Search */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0 md:mx-2">
                {/* Pack Filter Dropdown */}
                <select
                  value={drawerPackFilter ?? 'all'}
                  onChange={(e) => {
                    sounds.playPop();
                    setDrawerPackFilter(e.target.value ?? 'all');
                  }}
                  className="text-xs font-semibold px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-hidden min-w-0 flex-1 sm:flex-initial max-w-[130px] sm:max-w-[155px] truncate"
                >
                  <option value="all">All Packs ({availableStickers.length})</option>
                  {recentStickerIds.length > 0 && (
                    <option value="recent">Recently Used ({recentStickerIds.length})</option>
                  )}
                  {allVaultPacks.map((p) => {
                    const count = p.stickers.length;
                    return (
                      <option key={p.id} value={p.id || 'pack'}>
                        {p.name} ({count})
                      </option>
                    );
                  })}
                </select>

                {/* Rarity Filter Dropdown */}
                <select
                  value={drawerRarityFilter ?? 'all'}
                  onChange={(e) => {
                    sounds.playPop();
                    setDrawerRarityFilter(e.target.value ?? 'all');
                  }}
                  className="text-xs font-semibold px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-hidden shrink-0"
                >
                  <option value="all">All Rarities</option>
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>

                {/* Search Input */}
                <div className="relative flex-1 min-w-[70px] sm:max-w-44">
                  <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={drawerSearchQuery ?? ''}
                    onChange={(e) => setDrawerSearchQuery(e.target.value ?? '')}
                    className="text-xs pl-6 pr-5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 w-full focus:outline-hidden focus:ring-1 focus:ring-pink-500"
                  />
                  {drawerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDrawerSearchQuery('')}
                      className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tray View Tools on Desktop (>= md) */}
              <div className="hidden md:flex items-center gap-1.5 shrink-0">
                {/* Option B: Expand Tray Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsDrawerExpanded(!isDrawerExpanded);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isDrawerExpanded
                      ? 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
                  }`}
                  title={isDrawerExpanded ? 'Switch to Compact 2-Row Strip' : 'Expand to Multi-Row Drawer Tray (Option B)'}
                >
                  {isDrawerExpanded ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-pink-500" />
                      <span>Compact Strip</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Expand Tray</span>
                    </>
                  )}
                </button>

                {/* Left & Right Chevrons (shown in Compact Strip mode) */}
                {!isDrawerExpanded && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollStickers('left')}
                      className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Scroll stickers left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollStickers('right')}
                      className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Scroll stickers right"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sticker Area */}
            {filteredDrawerStickers.length === 0 ? (
              <div className="py-5 px-4 text-center rounded-xl bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-750">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {drawerPackFilter !== 'all' && drawerPackFilter !== 'recent' && allVaultPacks.find((p) => p.id === drawerPackFilter)?.stickers.length === 0
                    ? `"${allVaultPacks.find((p) => p.id === drawerPackFilter)?.name}" is currently a backdrop theme with no stickers minted yet.`
                    : 'No stickers match your active search or filter.'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {drawerPackFilter !== 'all' && drawerPackFilter !== 'recent' && allVaultPacks.find((p) => p.id === drawerPackFilter)?.stickers.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setIsPackManagerOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 cursor-pointer transition-colors"
                    >
                      Mint Stickers in STUDIO →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerPackFilter('all');
                      setDrawerRarityFilter('all');
                      setDrawerSearchQuery('');
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100 cursor-pointer transition-colors"
                  >
                    Reset Drawer Filters
                  </button>
                </div>
              </div>
            ) : isDrawerExpanded ? (
              /* Option B: Expanded Multi-Row Tray Grid */
              <div className="max-h-72 overflow-y-auto p-2 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                {filteredDrawerStickers.map((sticker, idx) => (
                  <button
                    key={`${sticker.packId || 'pack'}-${sticker.id}-${idx}`}
                    onClick={() => handleStampSticker(sticker.id)}
                    className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all active:scale-95 group cursor-pointer shadow-2xs"
                    title={`Click to stamp ${sticker.name} (${sticker.rarity})`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform p-1">
                      <div className="w-full h-full flex items-center justify-center die-cut-sticker">
                        <StickerIconRenderer icon={sticker.svgIcon} alt={sticker.name} size="full" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 group-hover:text-pink-600 dark:group-hover:text-pink-400 w-full truncate text-center">
                      {sticker.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              /* Option A: Space-Efficient 2-Row Horizontal Scroller */
              <div
                ref={stickerScrollerRef}
                className="overflow-x-auto py-1 px-1 grid grid-rows-2 grid-flow-col auto-cols-max gap-2 scroll-smooth"
              >
                {filteredDrawerStickers.map((sticker, idx) => (
                  <button
                    key={`${sticker.packId || 'pack'}-${sticker.id}-${idx}`}
                    onClick={() => handleStampSticker(sticker.id)}
                    className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all active:scale-95 shrink-0 group cursor-pointer w-[68px] sm:w-[72px]"
                    title={`Click to stamp ${sticker.name} (${sticker.rarity})`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform p-0.5">
                      <div className="w-full h-full flex items-center justify-center die-cut-sticker">
                        <StickerIconRenderer icon={sticker.svgIcon} alt={sticker.name} size="full" />
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 group-hover:text-pink-600 dark:group-hover:text-pink-400 w-full truncate text-center leading-tight">
                      {sticker.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Option B: Canvas Theme Browser Modal */}
      {isThemeBrowserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-3xl lg:max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100">
                    Canvas Theme Browser
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Explore all {scenes.length} installed and custom-forged backdrop atmospheres
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeBrowserOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter and Search Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:px-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setThemeFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    themeFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All ({scenes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setThemeFilter('builtin')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    themeFilter === 'builtin'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Built-in ({builtinScenesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setThemeFilter('custom')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    themeFilter === 'custom'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Studio Custom ({customScenesCount})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search themes or packs..."
                  value={themeSearchQuery ?? ''}
                  onChange={(e) => setThemeSearchQuery(e.target.value ?? '')}
                  className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                {themeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setThemeSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Themes Grid - Vertical Scroller with Compact Horizontal Cards */}
            <div className="p-4 sm:p-5 overflow-y-auto max-h-[60vh] grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-950/50">
              {filteredScenes.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                  <LayoutGrid className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600 opacity-60" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No themes found</p>
                  <p className="text-xs mt-1 text-slate-500">Try changing your search term or filter.</p>
                </div>
              ) : (
                filteredScenes.map((sc) => {
                  const isActive = activeSceneId === sc.id;
                  const isPastel = sc.id === 'scene-notebook';
                  const linkedPack = packs.find((p) => p.id === sc.packId || p.themeSceneId === sc.id);
                  return (
                    <div
                      key={sc.id}
                      className={`flex flex-col p-3 rounded-2xl border text-left transition-all relative ${
                        isActive
                          ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-600/30 dark:ring-indigo-500/40 bg-indigo-50/80 dark:bg-indigo-950/70 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/80 dark:hover:bg-slate-750 hover:shadow-xs'
                      }`}
                    >
                      {/* Top Click Area to select theme */}
                      <div
                        onClick={() => {
                          sounds.playPop();
                          selectTheme(sc.id);
                          setIsThemeBrowserOpen(false);
                        }}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        {/* Visual Thumbnail */}
                        <div className="w-16 h-12 sm:w-18 sm:h-13 rounded-xl overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-700 shadow-2xs relative flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                          <ThemeThumbnailPreview
                            scene={sc}
                            linkedPack={linkedPack}
                            activePastelHex={activePastelSet.swatchHex}
                          />
                        </div>

                        {/* Metadata & Typography */}
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-display font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {sc.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-300 truncate">
                            <span className="truncate">{linkedPack ? linkedPack.name : (sc.theme || 'Atmosphere')}</span>
                            <span aria-hidden="true" className="opacity-40">·</span>
                            <span className="shrink-0">{sc.isCustom ? 'Studio' : 'Built-in'}</span>
                            {linkedPack?.stickers?.length ? (
                              <>
                                <span aria-hidden="true" className="opacity-40">·</span>
                                <span className="shrink-0">{linkedPack.stickers.length} stickers</span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        {/* Active Indicator or Hover Chevron */}
                        <div className="shrink-0 pl-1">
                          {isActive ? (
                            <div className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Active</span>
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-all">
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pastel Card Controls: Shuffle & Swatch Picker */}
                      {isPastel && (
                        <div className="mt-2.5 pt-2 border-t border-purple-100 dark:border-purple-900/50 flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAlternatePastel();
                                if (activeSceneId !== sc.id) {
                                  selectTheme(sc.id);
                                }
                              }}
                              title="Randomly shuffle through 7 pastel color sets (Amber, Lavender, Peach, Teal, Pink, Baby Blue, Matcha)"
                              className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold bg-purple-100/80 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/70 hover:bg-purple-200/80 dark:hover:bg-purple-900 transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                            >
                              <Shuffle className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span>Shuffle</span>
                            </button>

                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${activePastelSet.badgeClass}`}>
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: activePastelSet.swatchHex }}
                              />
                              <span>{activePastelSet.name}</span>
                            </span>
                          </div>

                          {/* 7 Pastel Swatch Buttons */}
                          <div className="flex items-center gap-1" title="Select a pastel set">
                            {PASTEL_COLOR_SETS.map((set) => (
                              <button
                                key={set.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectPastel(set.id);
                                  if (activeSceneId !== sc.id) {
                                    selectTheme(sc.id);
                                  }
                                }}
                                title={`${set.name}: ${set.description}`}
                                className={`w-4.5 h-4.5 rounded-full transition-all cursor-pointer ${
                                  activePastelId === set.id
                                    ? 'ring-2 ring-purple-600 dark:ring-purple-400 ring-offset-1 scale-115 shadow-xs'
                                    : 'opacity-70 hover:opacity-100 hover:scale-110'
                                }`}
                                style={{ backgroundColor: set.swatchHex }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with Forge New Theme Action */}
            <div className="flex items-center justify-between p-3.5 sm:px-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                Showing {filteredScenes.length} of {scenes.length} themes
              </span>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsThemeBrowserOpen(false);
                  setIsPackManagerOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer ml-auto"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Forge New Theme in ThemePack STUDIO →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme & Sticker Pack Manager Modal */}
      {isPackManagerOpen && (
        <ThemeAndPackManagerModal
          isOpen={isPackManagerOpen}
          onClose={() => {
            setIsPackManagerOpen(false);
            onClosePackStudio?.();
          }}
          packs={packs}
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSelectScene={(id) => {
            selectTheme(id);
          }}
          onSavePack={handleSavePackInternal}
          onDeletePack={handleDeletePackInternal}
        />
      )}
    </div>
  );
};
