import React, { useState, useRef, useEffect } from 'react';
import { 
  CanvasScene, 
  CustomBackgroundConfig, 
  Sticker, 
  StickerPack, 
  StickerRarity, 
  VaultPackFile 
} from '../types';
import { parseVaultPackJSON, storage } from '../lib/io';
import { exportPackAsPngZip } from '../lib/packZipExporter';
import { parsePackZip } from '../lib/packZipImporter';
import { optimizeImageDataUrl, trimAndMaximizeStickerImage } from '../lib/imageOptimizer';
import { sounds } from '../lib/sound';
import { StickerIconRenderer } from './StickerIconRenderer';
import { CustomCanvasBackground } from './CustomCanvasBackground';
import { 
  X, 
  Sparkles, 
  Package, 
  Layers, 
  Palette, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Copy, 
  Edit3, 
  Image as ImageIcon, 
  Code2, 
  Sliders, 
  Check, 
  AlertCircle, 
  Info, 
  ArrowRight,
  RefreshCw,
  FolderDown,
  FolderArchive,
  FileCheck,
  FileText,
  GraduationCap,
  Save,
  CheckCircle2,
  Maximize2,
  Filter,
  Pencil
} from 'lucide-react';

interface ThemeAndPackManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  packs: StickerPack[];
  scenes: CanvasScene[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onSavePack: (pack: StickerPack, scene?: CanvasScene) => void;
  onDeletePack: (packId: string) => void;
}

type ModalTab = 'installed' | 'create' | 'import';
type PackKind = 'combo' | 'stickers-only' | 'background-only';

const cleanPackIcon = (icon?: any): string => {
  if (!icon || typeof icon !== 'string') return '🌟';
  if (icon === 'Gamepad2' || icon === 'gamepad2') return '🎮';
  if (icon === 'Wand2' || icon === 'wand2') return '🪄';
  if (icon === 'Flower2' || icon === 'flower2') return '🌸';
  if (icon === 'Rocket') return '🚀';
  if (icon === 'Sparkles') return '✨';
  if (icon === 'Waves') return '🌊';
  if (icon === 'Cpu') return '⚡';
  return icon.replace(/2$/, '');
};

const cleanPackName = (name: any, isCustom?: boolean): string => {
  if (!name || typeof name !== 'string') return '';
  if (!isCustom) {
    return name.replace(/\s*2\b/g, '').trim();
  }
  return name;
};

export const ThemeAndPackManagerModal: React.FC<ThemeAndPackManagerModalProps> = ({
  isOpen,
  onClose,
  packs,
  scenes,
  onSavePack,
  onDeletePack,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('installed');
  const [packFilter, setPackFilter] = useState<'all' | 'custom' | 'built-in'>('all');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Editing Pack State
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [packKind, setPackKind] = useState<PackKind>('combo');
  const [packName, setPackName] = useState('');
  const [packAuthor, setPackAuthor] = useState('');
  const [packTheme, setPackTheme] = useState('');
  const [packDescription, setPackDescription] = useState('');
  const [packIcon, setPackIcon] = useState('🌟');
  const [packStickers, setPackStickers] = useState<Sticker[]>([]);

  // Background Studio State
  const [includeBackdrop, setIncludeBackdrop] = useState<boolean>(true);
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [bgOpacity, setBgOpacity] = useState(100);
  const [bgDimming, setBgDimming] = useState(20);
  const [bgBlur, setBgBlur] = useState(0);
  const [bgFitMode, setBgFitMode] = useState<'cover' | 'contain' | 'center'>('cover');
  const [bgGridOverlay, setBgGridOverlay] = useState<'none' | 'dots' | 'lines' | 'isometric'>('none');
  const [bgOverlayColor, setBgOverlayColor] = useState('#0f172a');

  // New Sticker Form State
  const [stickerInputType, setStickerInputType] = useState<'emoji' | 'image'>('emoji');
  const [newStickerName, setNewStickerName] = useState('');
  const [newStickerDesc, setNewStickerDesc] = useState('');
  const [newStickerRarity, setNewStickerRarity] = useState<StickerRarity>('Common');
  const [newStickerEmoji, setNewStickerEmoji] = useState('✨');
  const [newStickerColor, setNewStickerColor] = useState('#6366f1');
  const [newStickerImageData, setNewStickerImageData] = useState('');

  // Import State
  const [importPreview, setImportPreview] = useState<VaultPackFile | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [readingFileStatus, setReadingFileStatus] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [pasteJsonText, setPasteJsonText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [showLegacyImport, setShowLegacyImport] = useState(false);
  const [isImportingFormat, setIsImportingFormat] = useState<'zip' | 'legacy-json'>('zip');
  const [multiPackBundle, setMultiPackBundle] = useState<VaultPackFile[] | null>(null);
  const [selectedBundlePackIdx, setSelectedBundlePackIdx] = useState<number>(0);

  // Selected Sticker in Editor Draft
  const [selectedDraftStickerId, setSelectedDraftStickerId] = useState<string | null>(null);

  // Pack Delete Confirmation State
  const [confirmingDeletePackId, setConfirmingDeletePackId] = useState<string | null>(null);

  // PNG Zip Export State
  const [isExportingZipId, setIsExportingZipId] = useState<string | null>(null);
  const [exportProgressText, setExportProgressText] = useState<string | null>(null);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Editing Scene ID (preserves the linked scene ID when editing an existing pack)
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);

  // File Input Refs
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const legacyJsonFileInputRef = useRef<HTMLInputElement>(null);
  const imageBgFileInputRef = useRef<HTMLInputElement>(null);
  const stickerImageFileInputRef = useRef<HTMLInputElement>(null);

  // Scroll and Highlight tracking for newly added/copied/imported packs
  const [targetScrollPackId, setTargetScrollPackId] = useState<string | null>(null);
  const [highlightedPackId, setHighlightedPackId] = useState<string | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Whenever ThemePack STUDIO modal opens, reset default view to "Installed Packs" tab
  useEffect(() => {
    if (isOpen) {
      setActiveTab('installed');
      setPackFilter('all');
      setValidationError(null);
      setShowHowItWorks(false);
      setEditingPackId(null);
      setEditingSceneId(null);
      setSelectedDraftStickerId(null);
      setTargetScrollPackId(null);
      setHighlightedPackId(null);
      setShowLegacyImport(false);
      setMultiPackBundle(null);
      setIsImportingFormat('zip');
    }
  }, [isOpen]);

  // Scroll the Installed Packs list so the target new/copied/imported pack card is in view
  useEffect(() => {
    if (!targetScrollPackId || !isOpen || activeTab !== 'installed') return;

    // Check if the target pack is in packs
    const packInList = packs.some((p) => p.id === targetScrollPackId);
    if (!packInList) return;

    // If it's filtered out, switch to 'all' so it is visible in the list
    if (packFilter === 'built-in') {
      setPackFilter('all');
    }

    let cancelled = false;
    let attempts = 0;

    const tryScroll = () => {
      if (cancelled) return;
      const cardEl = document.getElementById(`pack-card-${targetScrollPackId}`);
      const container = listContainerRef.current;

      if (cardEl && container) {
        const containerRect = container.getBoundingClientRect();
        const cardRect = cardEl.getBoundingClientRect();
        const relativeTop = cardRect.top - containerRect.top + container.scrollTop;
        const targetTop = relativeTop - container.clientHeight / 2 + cardRect.height / 2;

        container.scrollTo({
          top: Math.max(0, targetTop),
          behavior: 'smooth',
        });

        try {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch {
          // Fallback if not supported
        }

        setHighlightedPackId(targetScrollPackId);
        setTargetScrollPackId(null);

        const highlightTimer = setTimeout(() => {
          setHighlightedPackId((prev) => (prev === targetScrollPackId ? null : prev));
        }, 2800);

        return () => clearTimeout(highlightTimer);
      } else if (attempts < 10) {
        attempts++;
        setTimeout(tryScroll, 60);
      }
    };

    const timer = setTimeout(tryScroll, 80);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [packs, isOpen, activeTab, targetScrollPackId, packFilter]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Helpers to start creating a new pack
  const handleStartCreateNew = () => {
    sounds.playPop();
    setEditingPackId(null);
    setEditingSceneId(null);
    setSelectedDraftStickerId(null);
    setPackKind('combo');
    setIncludeBackdrop(true);
    setPackName('');
    setPackAuthor('');
    setPackTheme('Custom World');
    setPackDescription('A custom themed sticker pack & backdrop');
    setPackIcon('🌟');
    setPackStickers([]);
    setBgImageUrl('');
    setBgOpacity(100);
    setBgDimming(20);
    setBgBlur(0);
    setBgFitMode('cover');
    setBgGridOverlay('none');
    setBgOverlayColor('#0f172a');
    setActiveTab('create');
  };

  // Helper to edit an existing pack
  const handleStartEditPack = (pack: StickerPack) => {
    sounds.playPop();
    const newPackId = pack.id;
    setEditingPackId(pack.id);
    setPackName(pack.name || '');
    setSelectedDraftStickerId(null);
    setPackAuthor(pack.author || (pack.isCustom ? 'Creator' : 'StickerBook STUDIO'));
    setPackTheme(pack.theme || '');
    setPackDescription(pack.description || '');
    setPackIcon(pack.icon || '🌟');

    // Populate each sticker
    const loadedStickers: Sticker[] = pack.stickers.map((s) => ({
      ...s,
      packId: newPackId,
      isUnlocked: true,
    }));
    setPackStickers(loadedStickers);

    // Find linked scene if combo, with strict exact ID match prioritized first
    const exactScene =
      (pack.themeSceneId ? scenes.find((s) => s.id === pack.themeSceneId) : undefined) ||
      scenes.find((s) => s.packId === pack.id) ||
      (pack.themeSceneId ? storage.loadCustomScenes().find((s) => s.id === pack.themeSceneId) : undefined) ||
      storage.loadCustomScenes().find((s) => s.packId === pack.id);

    const linkedScene =
      exactScene ||
      scenes.find(
        (s) =>
          (pack.name && s.name.toLowerCase() === pack.name.toLowerCase()) ||
          (pack.theme && s.theme && pack.theme.toLowerCase() === pack.theme.toLowerCase())
      ) ||
      storage.loadCustomScenes().find(
        (s) =>
          (pack.name && s.name.toLowerCase() === pack.name.toLowerCase()) ||
          (pack.theme && s.theme && pack.theme.toLowerCase() === pack.theme.toLowerCase())
      );
    setEditingSceneId(linkedScene ? linkedScene.id : (pack.themeSceneId || null));

    const hasBackdrop = !!linkedScene;
    setIncludeBackdrop(hasBackdrop);
    if (hasBackdrop && pack.stickers.length > 0) {
      setPackKind('combo');
    } else if (hasBackdrop && pack.stickers.length === 0) {
      setPackKind('background-only');
    } else {
      setPackKind('stickers-only');
    }

    const effectiveConfig: CustomBackgroundConfig | undefined = linkedScene?.customConfig;

    // Detect image content
    const rawImageUrl =
      effectiveConfig?.imageUrl ||
      effectiveConfig?.backgroundImageUrl ||
      (effectiveConfig as any)?.image ||
      (effectiveConfig as any)?.url ||
      (linkedScene as any)?.imageUrl ||
      '';

    setBgImageUrl(rawImageUrl || '');
    setBgOpacity(typeof effectiveConfig?.opacity === 'number' && !isNaN(effectiveConfig.opacity) ? effectiveConfig.opacity : 100);
    setBgDimming(typeof effectiveConfig?.dimming === 'number' && !isNaN(effectiveConfig.dimming) ? effectiveConfig.dimming : 20);
    setBgBlur(typeof effectiveConfig?.blur === 'number' && !isNaN(effectiveConfig.blur) ? effectiveConfig.blur : 0);
    setBgFitMode(effectiveConfig?.fitMode || 'cover');
    setBgGridOverlay(effectiveConfig?.gridOverlay || 'none');
    setBgOverlayColor(effectiveConfig?.overlayColor || '#0f172a');
    setActiveTab('create');
  };

  // Helper to clone/duplicate an existing pack
  const handleDuplicatePack = (pack: StickerPack) => {
    sounds.playPop();
    const newPackId = `custom-pack-${Date.now()}`;
    const exactScene =
      (pack.themeSceneId ? scenes.find((s) => s.id === pack.themeSceneId) : undefined) ||
      scenes.find((s) => s.packId === pack.id) ||
      (pack.themeSceneId ? storage.loadCustomScenes().find((s) => s.id === pack.themeSceneId) : undefined) ||
      storage.loadCustomScenes().find((s) => s.packId === pack.id);

    const linkedScene =
      exactScene ||
      scenes.find(
        (s) =>
          (pack.name && s.name.toLowerCase() === pack.name.toLowerCase()) ||
          (pack.theme && s.theme && pack.theme.toLowerCase() === pack.theme.toLowerCase())
      ) ||
      storage.loadCustomScenes().find(
        (s) =>
          (pack.name && s.name.toLowerCase() === pack.name.toLowerCase()) ||
          (pack.theme && s.theme && pack.theme.toLowerCase() === pack.theme.toLowerCase())
      );
    const clonedStickers: Sticker[] = pack.stickers.map((s, idx) => ({
      ...s,
      id: `stk-${Date.now()}-${idx}`,
      packId: newPackId,
      isUnlocked: true,
    }));

    let clonedScene: CanvasScene | undefined = undefined;
    if (linkedScene) {
      const customConfig: CustomBackgroundConfig | undefined = linkedScene.customConfig
        ? {
            ...linkedScene.customConfig,
            type: 'image',
          }
        : undefined;

      const sceneName = `${linkedScene.name} (Copy)`;
      const themeTag = linkedScene.theme || pack.theme || 'Custom Theme';

      clonedScene = {
        ...(linkedScene || {}),
        id: `scene-custom-${Date.now()}`,
        name: sceneName,
        theme: themeTag,
        bgGradient: linkedScene?.bgGradient || 'bg-slate-950',
        pattern: 'custom-image',
        isCustom: true,
        packId: newPackId,
        customConfig,
      };
    }

    const effectiveTheme = pack.theme || 'Custom Theme';

    const clonedPack: StickerPack = {
      ...pack,
      id: newPackId,
      name: `${pack.name} (Copy)`,
      author: 'You',
      theme: effectiveTheme,
      isCustom: true,
      stickers: clonedStickers,
      themeSceneId: clonedScene ? clonedScene.id : undefined,
    };

    onSavePack(clonedPack, clonedScene);
    if (packFilter === 'built-in') {
      setPackFilter('all');
    }
    setActiveTab('installed');
    setTargetScrollPackId(newPackId);
  };

  // Add Sticker to Current Draft (Default rule: Common is unlocked, others are locked)
  const handleAddStickerToDraft = () => {
    if (!newStickerName.trim()) return;
    sounds.playPop();

    const iconVal = stickerInputType === 'image' && newStickerImageData
      ? newStickerImageData
      : newStickerEmoji.trim() || '✨';

    const newStk: Sticker = {
      id: `draft-stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newStickerName.trim(),
      description: newStickerDesc.trim() || `${newStickerRarity} sticker`,
      packId: editingPackId || 'temp-pack',
      rarity: newStickerRarity,
      svgIcon: iconVal,
      color: newStickerColor,
      isCustomImage: stickerInputType === 'image',
      isUnlocked: true,
    };

    setPackStickers((prev) => [...prev, newStk]);
    setNewStickerName('');
    setNewStickerDesc('');
    setNewStickerImageData('');
  };

  const handleRemoveStickerFromDraft = (stkId: string) => {
    sounds.playPop();
    setPackStickers((prev) => prev.filter((s) => s.id !== stkId));
    setSelectedDraftStickerId((prev) => (prev === stkId ? null : prev));
  };

  const handleUpdateSelectedSticker = (updated: Partial<Sticker>) => {
    if (!selectedDraftStickerId) return;
    setPackStickers((prev) =>
      prev.map((s) => (s.id === selectedDraftStickerId ? { ...s, ...updated } : s))
    );
  };

  // Background Image Upload (Cloud-safe with arrayBuffer and FileReader fallbacks)
  const handleImageBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (e.target) {
      e.target.value = '';
    }

    try {
      // Check size limit (allow up to 25MB from cloud drive, downscaled to crisp 1080p JPEG)
      if (file.size > 25 * 1024 * 1024) {
        setValidationError('Background image is too large (over 25MB). Please select a smaller image.');
        setTimeout(() => setValidationError(null), 4000);
        return;
      }

      let rawDataUrl = '';

      if (typeof file.arrayBuffer === 'function') {
        try {
          const buffer = await file.arrayBuffer();
          if (buffer && buffer.byteLength > 0) {
            const mime = file.type || 'image/jpeg';
            const blob = new Blob([buffer], { type: mime });
            rawDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(reader.error || new Error('Blob read error'));
              reader.onabort = () => reject(new Error('Blob read aborted'));
              reader.readAsDataURL(blob);
            });
          }
        } catch (bufErr) {
          console.warn('arrayBuffer bg read failed, falling back:', bufErr);
        }
      }

      if (!rawDataUrl) {
        rawDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
          reader.onabort = () => reject(new Error('FileReader aborted'));
          reader.readAsDataURL(file);
        });
      }

      if (rawDataUrl) {
        try {
          const optimized = await optimizeImageDataUrl(rawDataUrl, 1920, 1080, 0.84, 'image/jpeg');
          setBgImageUrl(optimized);
        } catch {
          setBgImageUrl(rawDataUrl);
        }
        sounds.playPop();
      }
    } catch (err: any) {
      console.error('Failed to load background from cloud drive:', err);
      setValidationError(`Could not load background image: ${err?.message || 'Storage error'}`);
      setTimeout(() => setValidationError(null), 5000);
    }
  };

  // Sticker Image Upload (Robust handling for Cloud Drives: Google Drive, iCloud, OneDrive, etc.)
  const handleStickerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input immediately so user can re-pick the same file if desired
    if (e.target) {
      e.target.value = '';
    }

    try {
      if (file.size > 15 * 1024 * 1024) {
        setValidationError('Sticker image is too large (over 15MB). Please choose a smaller image.');
        setTimeout(() => setValidationError(null), 4000);
        return;
      }

      let rawDataUrl = '';

      // Tier 1: Try modern arrayBuffer read (handles Google Drive virtual files & cloud streams safely)
      if (typeof file.arrayBuffer === 'function') {
        try {
          const buffer = await file.arrayBuffer();
          if (buffer && buffer.byteLength > 0) {
            const mime = file.type || (file.name?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
            const blob = new Blob([buffer], { type: mime });
            rawDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(reader.error || new Error('Blob read error'));
              reader.onabort = () => reject(new Error('Blob read aborted'));
              reader.readAsDataURL(blob);
            });
          }
        } catch (bufErr) {
          console.warn('arrayBuffer read failed, falling back to FileReader:', bufErr);
        }
      }

      // Tier 2: FileReader fallback with explicit error & abort handlers
      if (!rawDataUrl) {
        rawDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
          reader.onabort = () => reject(new Error('FileReader aborted'));
          reader.readAsDataURL(file);
        });
      }

      if (!rawDataUrl || typeof rawDataUrl !== 'string') {
        throw new Error('Unable to read image data from selected file');
      }

      // Tier 3: Trim & maximize sticker image into a square 512x512 die-cut sticker
      let finalStickerImage = rawDataUrl;
      try {
        finalStickerImage = await trimAndMaximizeStickerImage(rawDataUrl, 512, 0.04);
      } catch (trimErr) {
        console.warn('Trim failed, optimizing image directly:', trimErr);
        try {
          finalStickerImage = await optimizeImageDataUrl(rawDataUrl, 512, 512, 0.9, 'image/png');
        } catch {
          finalStickerImage = rawDataUrl;
        }
      }

      setNewStickerImageData(finalStickerImage);

      // Safe clean name assignment
      if (!newStickerName) {
        const rawFileName = file.name ? String(file.name) : 'New Sticker';
        const cleanName = rawFileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
        setNewStickerName(cleanName || 'Custom Sticker');
      }

      sounds.playPop();
    } catch (err: any) {
      console.error('Failed to load sticker image:', err);
      setValidationError(`Could not load image: ${err?.message || 'Storage error'}. If using a cloud drive, try downloading it to your device first.`);
      setTimeout(() => setValidationError(null), 5000);
    }
  };

  // Save Pack (persists combo, stickers-only, or background-only)
  const handleSavePackSubmit = async () => {
    const effectivePackName = packName.trim() || packTheme.trim() || 'Custom Pack';
    if (!effectivePackName) {
      setValidationError('Please enter a pack or theme name.');
      setTimeout(() => setValidationError(null), 4000);
      return;
    }

    sounds.playFanfare();
    const isEditingBuiltIn = editingPackId ? packs.some((p) => p.id === editingPackId && !p.isCustom) : false;
    const packId = editingPackId ? editingPackId : `custom-pack-${Date.now()}`;
    const linkedScene =
      (editingSceneId ? scenes.find((s) => s.id === editingSceneId) : undefined) ||
      scenes.find((s) => s.packId === packId) ||
      scenes.find((s) => packId && s.id === `custom-scene-${packId}`) ||
      scenes.find(
        (s) =>
          (effectivePackName && s.name.toLowerCase() === effectivePackName.toLowerCase()) ||
          (packTheme.trim() && s.theme && s.theme.toLowerCase() === packTheme.trim().toLowerCase())
      );
    const sceneId = editingSceneId
      ? editingSceneId
      : (linkedScene ? linkedScene.id : `custom-scene-${packId}`);

    let sceneToSave: CanvasScene | undefined = undefined;

    if (includeBackdrop) {
      let finalImageUrl = bgImageUrl;
      if (bgImageUrl) {
        try {
          finalImageUrl = await optimizeImageDataUrl(bgImageUrl, 1920, 1080, 0.82, 'image/jpeg');
        } catch {
          // Keep existing
        }
      }

      const customConfig: CustomBackgroundConfig = {
        type: 'image',
        imageUrl: finalImageUrl,
        opacity: bgOpacity,
        dimming: bgDimming,
        blur: bgBlur,
        fitMode: bgFitMode,
        gridOverlay: bgGridOverlay,
        overlayColor: bgOverlayColor,
      };

      // Use Theme Tag as caption text; if not set or blank, fall back to Pack Name
      const effectiveThemeTag = packTheme.trim();
      const sceneDisplayName = effectiveThemeTag || effectivePackName;

      sceneToSave = {
        id: sceneId,
        name: sceneDisplayName,
        theme: effectiveThemeTag || effectivePackName,
        bgGradient: 'bg-slate-950',
        pattern: 'custom-image',
        isCustom: !isEditingBuiltIn,
        author: packAuthor.trim() || (isEditingBuiltIn ? 'StickerBook STUDIO' : 'You'),
        customConfig,
        packId,
      };
    } else {
      sceneToSave = undefined;
    }

    const stickersToSave: Sticker[] = packStickers.map((s, idx) => ({
      ...s,
      id: s.id || `stk-${packId}-${idx + 1}`,
      packId,
      isUnlocked: true,
    }));

    const packToSave: StickerPack = {
      id: packId,
      name: effectivePackName,
      author: packAuthor.trim() || (isEditingBuiltIn ? 'StickerBook STUDIO' : 'You'),
      theme: packTheme.trim() || effectivePackName,
      description: packDescription.trim() || `${effectivePackName} Sticker Pack`,
      icon: packIcon.trim() || '🎨',
      isUnlocked: true,
      isCustom: !isEditingBuiltIn,
      stickers: stickersToSave,
      themeSceneId: sceneToSave ? sceneId : undefined,
    };

    onSavePack(packToSave, sceneToSave);
    setEditingSceneId(null);
    if (packFilter === 'built-in') {
      setPackFilter('all');
    }
    setActiveTab('installed');
    setTargetScrollPackId(packId);
  };



  // Single Pack PNG Zip Export Handler
  const handleExportPackPngZip = async (pack: StickerPack) => {
    sounds.playPop();
    setIsExportingZipId(pack.id);
    setExportProgressText(`Preparing ${pack.name} PNG archive...`);
    setExportSuccessMsg(null);

    let companionScene =
      (pack.themeSceneId ? scenes.find((s) => s.id === pack.themeSceneId) : undefined) ||
      scenes.find((s) => s.packId === pack.id) ||
      (pack.themeSceneId ? storage.loadCustomScenes().find((s) => s.id === pack.themeSceneId) : undefined) ||
      storage.loadCustomScenes().find((s) => s.packId === pack.id);

    try {
      await exportPackAsPngZip(pack, companionScene, (cur, total, itemName) => {
        setExportProgressText(`Exporting ${itemName} (${cur}/${total})...`);
      });
      sounds.playCorrect();
      setExportSuccessMsg(`Successfully exported "${pack.name}" as .zip containing transparent .png images!`);
      setTimeout(() => setExportSuccessMsg(null), 6000);
    } catch (err) {
      console.error('Failed to export pack as PNG zip:', err);
      setValidationError(`Failed to export PNG zip for ${pack.name}. Please try again.`);
    } finally {
      setIsExportingZipId(null);
      setExportProgressText(null);
    }
  };


  // Process raw imported JSON text (used by file upload, drag-and-drop, and direct paste)
  const processImportContent = async (content: string) => {
    if (!content || !content.trim()) {
      setImportError('The selected file or content appears to be empty.');
      setImportPreview(null);
      return;
    }

    try {
      const parsed = parseVaultPackJSON(content);
      if (parsed) {
        if (parsed.themeScene?.customConfig?.imageUrl && typeof parsed.themeScene.customConfig.imageUrl === 'string') {
          try {
            parsed.themeScene.customConfig.imageUrl = await optimizeImageDataUrl(
              parsed.themeScene.customConfig.imageUrl,
              1920,
              1080,
              0.84,
              'image/jpeg'
            );
          } catch (err) {
            console.warn('Theme image optimize warning on import:', err);
          }
        }
        setImportPreview(parsed);
        setImportError(null);
        sounds.playPop();
      } else {
        setImportError('Invalid or unsupported pack file. Please make sure the JSON format contains valid stickers or themes.');
        setImportPreview(null);
      }
    } catch (err: any) {
      console.error('Import parse error:', err);
      setImportError(`Could not process this file: ${err?.message || 'Invalid format'}`);
      setImportPreview(null);
    }
  };

  // Robust file reader supporting ZIP archives (Primary branded model), as well as legacy text/JSON
  const processImportFile = async (file: File) => {
    if (!file) return;

    setIsReadingFile(true);
    setReadingFileStatus('Reading pack archive...');
    setImportError(null);
    setImportPreview(null);
    setMultiPackBundle(null);

    try {
      // Guard against giant files (> 60MB)
      if (file.size > 60 * 1024 * 1024) {
        setImportError('File size exceeds 60MB. Please choose a smaller sticker pack archive.');
        setIsReadingFile(false);
        setReadingFileStatus(null);
        return;
      }

      const lowerName = file.name.toLowerCase();
      const isZip = lowerName.endsWith('.zip') || file.type.includes('zip') || file.type === 'application/x-zip-compressed';

      if (isZip) {
        setReadingFileStatus('Extracting stickers and theme textures from .zip...');
        const zipResult = await parsePackZip(file);
        setIsImportingFormat('zip');
        if (zipResult.isBundle && zipResult.allPacks && zipResult.allPacks.length > 0) {
          setMultiPackBundle(zipResult.allPacks);
          setSelectedBundlePackIdx(0);
          setImportPreview(zipResult.allPacks[0]);
        } else {
          setImportPreview(zipResult.mainPack);
          setMultiPackBundle(null);
        }
        sounds.playPop();
        return;
      }

      // Legacy fallback: reading text / JSON
      setReadingFileStatus('Reading legacy JSON file...');
      setIsImportingFormat('legacy-json');
      let content = '';

      // Tier 1: Try modern file.text()
      try {
        if (typeof file.text === 'function') {
          content = await file.text();
        }
      } catch (err1) {
        console.warn('file.text() read attempt error:', err1);
      }

      // Tier 2: Try FileReader readAsText
      if (!content) {
        try {
          content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve((event.target?.result as string) || '');
            reader.onerror = () => reject(reader.error || new Error('FileReader error'));
            reader.onabort = () => reject(new Error('FileReader aborted'));
            reader.readAsText(file);
          });
        } catch (err2) {
          console.warn('FileReader readAsText attempt error:', err2);
        }
      }

      // Tier 3: Try file.arrayBuffer() with TextDecoder
      if (!content && typeof file.arrayBuffer === 'function') {
        try {
          const buffer = await file.arrayBuffer();
          const decoder = new TextDecoder('utf-8');
          content = decoder.decode(buffer);
        } catch (err3) {
          console.warn('TextDecoder arrayBuffer attempt error:', err3);
        }
      }

      if (!content || !content.trim()) {
        setImportError('Could not read file contents. Please verify the file is not empty.');
        return;
      }

      await processImportContent(content);
    } catch (err: any) {
      console.error('Failed to process file:', err);
      setImportError(`Unable to read pack: ${err?.message || 'File format error'}.`);
    } finally {
      setIsReadingFile(false);
      setReadingFileStatus(null);
    }
  };

  // Handle Import File Selection from file picker (Primary ZIP)
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImportFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  // Handle Legacy JSON File Selection from legacy file picker
  const handleLegacyJsonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImportFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      await processImportFile(droppedFile);
    }
  };

  // Direct JSON text paste handler
  const handleParsePastedJson = async () => {
    if (!pasteJsonText || !pasteJsonText.trim()) {
      setImportError('Please paste valid JSON text into the box.');
      return;
    }
    setIsImportingFormat('legacy-json');
    await processImportContent(pasteJsonText);
  };

  // Helper to persist a single pack data into app state
  const installSinglePackData = async (packData: VaultPackFile): Promise<string> => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const packId = `custom-pack-${uniqueSuffix}`;
    const sceneId = `custom-scene-${uniqueSuffix}`;

    let sceneToSave: CanvasScene | undefined = undefined;
    if (packData.themeScene) {
      let finalConfig = packData.themeScene.customConfig;
      if (finalConfig?.imageUrl && typeof finalConfig.imageUrl === 'string') {
        let imageUrl = finalConfig.imageUrl;
        try {
          imageUrl = await optimizeImageDataUrl(finalConfig.imageUrl, 1920, 1080, 0.84, 'image/jpeg');
        } catch {
          // Keep existing if optimize fails
        }
        finalConfig = {
          ...finalConfig,
          type: 'image',
          imageUrl,
        };
      }

      sceneToSave = {
        ...packData.themeScene,
        id: sceneId,
        isCustom: true,
        packId,
        pattern: 'custom-image',
        customConfig: finalConfig,
      };
    }

    const stickersToSave: Sticker[] = (packData.stickers || []).map((s, idx) => ({
      ...s,
      name: typeof s.name === 'string' ? s.name : `Sticker ${idx + 1}`,
      svgIcon: typeof s.svgIcon === 'string' ? s.svgIcon : '✨',
      rarity: s.rarity || 'Common',
      color: typeof s.color === 'string' ? s.color : 'text-indigo-400',
      description: typeof s.description === 'string' ? s.description : 'Custom sticker',
      id: `imported-stk-${Date.now()}-${idx}`,
      packId,
      isUnlocked: true,
    }));

    const packToSave: StickerPack = {
      id: packId,
      name: typeof packData.name === 'string' ? packData.name : 'Imported Pack',
      author: typeof packData.author === 'string' ? packData.author : 'Community',
      theme: (packData.themeScene?.theme && typeof packData.themeScene.theme === 'string')
        ? packData.themeScene.theme
        : (typeof packData.name === 'string' ? packData.name : 'Imported Pack'),
      description: typeof packData.description === 'string' ? packData.description : 'Custom Vault Pack',
      icon: typeof packData.icon === 'string' ? packData.icon : (stickersToSave.length > 0 ? '📦' : '🎨'),
      isUnlocked: true,
      isCustom: true,
      stickers: stickersToSave,
      themeSceneId: sceneToSave ? sceneId : undefined,
    };

    onSavePack(packToSave, sceneToSave);
    return packId;
  };

  // Install Imported Pack (single active preview)
  const handleInstallImportedPack = async () => {
    if (!importPreview) return;
    try {
      sounds.playFanfare();
      const newPackId = await installSinglePackData(importPreview);
      setImportPreview(null);
      setMultiPackBundle(null);
      if (packFilter === 'built-in') {
        setPackFilter('all');
      }
      setActiveTab('installed');
      setTargetScrollPackId(newPackId);
    } catch (saveErr) {
      console.error('Failed to install imported pack:', saveErr);
      setImportError('Failed to save imported pack to your vault storage.');
    }
  };

  // Install All Packs in a Master Bundle
  const handleInstallAllBundlePacks = async () => {
    if (!multiPackBundle || multiPackBundle.length === 0) return;
    try {
      sounds.playFanfare();
      let lastPackId = '';
      for (const p of multiPackBundle) {
        lastPackId = await installSinglePackData(p);
      }
      setImportPreview(null);
      setMultiPackBundle(null);
      if (packFilter === 'built-in') {
        setPackFilter('all');
      }
      setActiveTab('installed');
      if (lastPackId) setTargetScrollPackId(lastPackId);
    } catch (saveErr) {
      console.error('Failed to install all bundle packs:', saveErr);
      setImportError('Failed to save all packs from the bundle.');
    }
  };

  // Filtered list of packs
  const displayedPacks = packs.filter((p) => {
    if (packFilter === 'custom') return p.isCustom;
    if (packFilter === 'built-in') return !p.isCustom;
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden my-auto">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl tracking-tight leading-none bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  ThemePack
                </span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/60 leading-none">
                  STUDIO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Design custom backdrop themes, mint custom stickers, and export portable packs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setShowHowItWorks(!showHowItWorks);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                showHowItWorks
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/70'
              }`}
              title="How It Works & Quick Tutorial"
            >
              <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-300" />
              <span>How It Works</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* HOW IT WORKS & QUICK TUTORIAL DRAWER */}
        {showHowItWorks && (
          <div className="border-b border-purple-200/80 dark:border-purple-900/60 bg-gradient-to-b from-purple-50/70 to-indigo-50/40 dark:from-purple-950/40 dark:to-indigo-950/20 p-4 sm:p-5 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>How ThemePack STUDIO Works</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-extrabold">
                    Quick Tour
                  </span>
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHowItWorks(false)}
                className="text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline cursor-pointer"
              >
                Hide
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-purple-100 dark:border-purple-900/40 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[10px]">1</span>
                  <span>Forge Themes</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Upload 16:9 wallpaper images or customize scenes. Configure dimming, blur, opacity, fit scaling, and grid overlays.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-purple-100 dark:border-purple-900/40 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-purple-600 dark:text-purple-400">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-[10px]">2</span>
                  <span>Mint Stickers</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Add emojis or upload PNG/SVG artwork (transparent background recommended) with custom rarity tiers.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-purple-100 dark:border-purple-900/40 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-pink-600 dark:text-pink-400">
                  <span className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-950 flex items-center justify-center text-[10px]">3</span>
                  <span>Canvas & StickerBook Sync</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Backdrops automatically sync to the StickerBook STUDIO theme scroller. Deleted backdrops or packs are safely pruned from canvases.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-purple-100 dark:border-purple-900/40 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[10px]">4</span>
                  <span>Export & Import</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Export portable <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">.zip</code> bundles with transparent PNGs. Read-only import for legacy <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">.json</code> packs is also supported.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TAB NAVIGATION */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playPop();
                setActiveTab('installed');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'installed'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Installed Packs ({packs.length})</span>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                setActiveTab('create');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Add / Edit</span>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                setActiveTab('import');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'import'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Import Pack</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY CONTAINER */}
        <div ref={listContainerRef} className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {/* Export Success Notification Banner */}
          {exportSuccessMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{exportSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setExportSuccessMsg(null)}
                className="text-xs font-bold hover:underline cursor-pointer ml-3 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Validation Alert Banner */}
          {validationError && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-between">
              <span>{validationError}</span>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="text-xs font-bold hover:underline cursor-pointer ml-3 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: INSTALLED PACKS LIST */}
          {activeTab === 'installed' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    if (packFilter === 'all') {
                      setPackFilter('custom');
                    } else if (packFilter === 'custom') {
                      setPackFilter('built-in');
                    } else {
                      setPackFilter('all');
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer"
                  title="Click to toggle filter (All Packs → Custom Packs → Core Packs)"
                >
                  <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    {packFilter === 'all' && `All Packs (${packs.length})`}
                    {packFilter === 'custom' && `Custom Packs (${packs.filter((p) => p.isCustom).length})`}
                    {packFilter === 'built-in' && `Core Packs (${packs.filter((p) => !p.isCustom).length})`}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">⇄</span>
                </button>

                {exportProgressText && (
                  <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 animate-pulse flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>{exportProgressText}</span>
                  </p>
                )}
              </div>

              {displayedPacks.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    No packs found for this filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setPackFilter('all');
                    }}
                    className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Show All Packs
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedPacks.map((pack) => {
                  const linkedScene = scenes.find((s) => s.id === pack.themeSceneId || s.packId === pack.id);
                  const hasBackdrop = !!linkedScene;
                  const hasStickers = pack.stickers && pack.stickers.length > 0;
                  const isCombo = hasBackdrop && hasStickers;
                  const isBackdropOnly = hasBackdrop && !hasStickers;
                  const isHighlighted = highlightedPackId === pack.id;

                  return (
                    <div
                      key={pack.id}
                      id={`pack-card-${pack.id}`}
                      className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-500 ${
                        isHighlighted
                          ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/80 dark:ring-indigo-400/80 shadow-md bg-indigo-50/70 dark:bg-indigo-950/50'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        {/* Top Row: Title, Icon, Badges */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl select-none">{cleanPackIcon(pack.icon)}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
                                  {cleanPackName(pack.name, pack.isCustom)}
                                </h4>
                                {pack.isCustom ? (
                                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                                    Custom
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                                    Core
                                  </span>
                                )}
                                {isHighlighted && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold shadow-2xs animate-pulse">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                By {pack.author || 'StickerBook STUDIO'} • {pack.theme}
                              </p>
                            </div>
                          </div>

                          {/* Pack Type Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isCombo
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : isBackdropOnly
                                ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                                : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            }`}
                          >
                            {isCombo
                              ? 'Combo'
                              : isBackdropOnly
                              ? 'Backdrop'
                              : 'Stickers'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                          {pack.description}
                        </p>

                        {/* Stickers Preview Strip */}
                        {pack.stickers.length > 0 && (
                          <div className="flex items-center gap-1.5 overflow-x-auto py-1 mb-3 no-scrollbar">
                            {pack.stickers.slice(0, 8).map((stk) => (
                              <div
                                key={stk.id}
                                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs"
                                title={`${stk.name} (${stk.rarity})`}
                              >
                                <StickerIconRenderer icon={stk.svgIcon} size="sm" alt={stk.name} />
                              </div>
                            ))}
                            {pack.stickers.length > 8 && (
                              <span className="text-[10px] font-bold text-slate-400 pl-1">
                                +{pack.stickers.length - 8}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Action Bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/70 dark:border-slate-700/60 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60">
                            {pack.stickers.length} {pack.stickers.length === 1 ? 'Sticker' : 'Stickers'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Primary Branded Export Pack (.zip) Button */}
                          <button
                            type="button"
                            onClick={() => handleExportPackPngZip(pack)}
                            disabled={isExportingZipId === pack.id}
                            title={`Export ${pack.name} as branded .zip pack archive`}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs border ${
                              isExportingZipId === pack.id
                                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 cursor-wait'
                                : 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:border-indigo-300 cursor-pointer'
                            }`}
                          >
                            {isExportingZipId === pack.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                            ) : (
                              <FolderArchive className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            )}
                            <span className="text-[11px]">Export .zip</span>
                          </button>

                          {/* Duplicate Pack Button */}
                          <button
                            type="button"
                            onClick={() => handleDuplicatePack(pack)}
                            title="Duplicate as new custom pack"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Pack Button (Both custom and core themes) */}
                          <button
                            type="button"
                            onClick={() => handleStartEditPack(pack)}
                            title={pack.isCustom ? "Edit custom pack" : "Edit core theme"}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Pack (Custom only) */}
                          {pack.isCustom && (
                            confirmingDeletePackId === pack.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/90 px-1.5 py-0.5 rounded-lg border border-rose-300 dark:border-rose-800 shadow-xs animate-in fade-in duration-150">
                                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 whitespace-nowrap">
                                  Delete?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    sounds.playPop();
                                    onDeletePack(pack.id);
                                    setConfirmingDeletePackId(null);
                                    if (editingPackId === pack.id) {
                                      handleStartCreateNew();
                                    }
                                  }}
                                  className="px-1.5 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-xs cursor-pointer transition-colors"
                                  title="Confirm delete pack"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingDeletePackId(null)}
                                  className="px-1 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-medium border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                                  title="Cancel deletion"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playPop();
                                  setConfirmingDeletePackId(pack.id);
                                }}
                                title="Delete custom pack"
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

          {/* TAB 2: PACK CREATOR & STUDIO */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              {/* Active Editing Pack Banner */}
              {editingPackId && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      <Edit3 className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                        <span className="truncate">Editing: {packName || 'Pack'}</span>
                        {packs.some((p) => p.id === editingPackId && !p.isCustom) ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0">
                            Core Theme
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                            Custom Pack
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Make your changes below to update stickers, theme backdrop, or metadata.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartCreateNew}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    Cancel / Forge New
                  </button>
                </div>
              )}

              {/* Pack Content Dynamic Indicator (reflects what is in the pack) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/40 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    Pack Content:
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      includeBackdrop && packStickers.length > 0
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : includeBackdrop
                        ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                        : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                    }`}
                  >
                    {includeBackdrop && packStickers.length > 0
                      ? 'Combo'
                      : includeBackdrop
                      ? 'Backdrop'
                      : 'Stickers'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({includeBackdrop ? '1 Backdrop' : 'No Backdrop'} • {packStickers.length} Sticker{packStickers.length === 1 ? '' : 's'})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Use the tools below to add or remove backdrops and stickers anytime.
                </p>
              </div>

              {/* 2. General Pack Details */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-display font-bold text-xs uppercase tracking-wide text-slate-700 dark:text-slate-300">
                  Pack Metadata
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Pack Name *</label>
                    <input
                      type="text"
                      value={packName ?? ''}
                      onChange={(e) => setPackName(e.target.value ?? '')}
                      placeholder="e.g. Celestial Wanderers, Cozy Cafe Study"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Author Name</label>
                    <input
                      type="text"
                      value={packAuthor ?? ''}
                      onChange={(e) => setPackAuthor(e.target.value ?? '')}
                      placeholder="e.g. Dale, FlashyBrain"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Pack Icon</label>
                    <input
                      type="text"
                      value={packIcon ?? ''}
                      onChange={(e) => setPackIcon(e.target.value ?? '')}
                      maxLength={4}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-center text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs text-slate-500 mb-1">Theme Tag</label>
                    <input
                      type="text"
                      value={packTheme ?? ''}
                      onChange={(e) => setPackTheme(e.target.value ?? '')}
                      placeholder="e.g. Sci-Fi, Nature, Retro Arcade, Medieval"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 3. BACKGROUND STUDIO */}
              <div className="p-5 rounded-2xl border-2 border-indigo-200/70 dark:border-indigo-900/60 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-500" />
                    <h4 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
                      Canvas Theme Backdrop Studio
                    </h4>
                    {includeBackdrop ? (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold border border-cyan-200/60 dark:border-cyan-800/60">
                        Backdrop Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                        No Backdrop
                      </span>
                    )}
                  </div>

                  <div>
                    {includeBackdrop ? (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playPop();
                          setIncludeBackdrop(false);
                        }}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Remove backdrop from this pack"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Backdrop</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playPop();
                          setIncludeBackdrop(true);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Backdrop</span>
                      </button>
                    )}
                  </div>
                </div>

                {!includeBackdrop ? (
                  <div className="py-6 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 text-xs space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No companion backdrop currently attached.
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      This pack will only contain stickers unless you attach a companion backdrop scene.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setIncludeBackdrop(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Backdrop</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Live Mini Preview Canvas */}
                    <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-inner bg-slate-950 flex items-center justify-center">
                      <CustomCanvasBackground
                        config={{
                          type: 'image',
                          imageUrl: bgImageUrl,
                          opacity: bgOpacity,
                          dimming: bgDimming,
                          blur: bgBlur,
                          fitMode: bgFitMode,
                          gridOverlay: bgGridOverlay,
                          overlayColor: bgOverlayColor,
                        }}
                      />

                      {!bgImageUrl && (
                        <div className="relative z-10 text-center p-4">
                          <ImageIcon className="w-8 h-8 mx-auto text-slate-500 mb-1 opacity-60" />
                          <p className="text-xs text-slate-400 font-medium">
                            Upload a PNG, WebP, or JPEG wallpaper below to preview
                          </p>
                        </div>
                      )}

                      {/* Watermark in Preview */}
                      <div className="absolute top-2 left-3 text-[10px] font-mono uppercase tracking-wider text-white/50 pointer-events-none">
                        {packName || 'Theme Preview'} • Live Canvas
                      </div>
                    </div>

                    {/* Image Adjuster Controls */}
                    <div key="bg-image-controls" className="space-y-4 pt-1">
                      <div className="flex items-center gap-3">
                        <input
                          key="image-bg-file-input"
                          ref={imageBgFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
                          onChange={handleImageBgUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => imageBgFileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose Wallpaper Image</span>
                        </button>
                        {bgImageUrl && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Image Loaded
                          </span>
                        )}
                      </div>

                      {/* Slider Controls Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                        {/* Opacity Slider */}
                        <div>
                          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                            <span>Image Opacity</span>
                            <span className="font-mono">{typeof bgOpacity === 'number' ? bgOpacity : 100}%</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            value={typeof bgOpacity === 'number' && !isNaN(bgOpacity) ? bgOpacity : 100}
                            onChange={(e) => setBgOpacity(Number(e.target.value) || 100)}
                            className="w-full accent-indigo-600"
                          />
                        </div>

                        {/* Dimming Darkness Slider */}
                        <div>
                          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                            <span>Dimming (Darkness)</span>
                            <span className="font-mono">{typeof bgDimming === 'number' ? bgDimming : 20}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={80}
                            value={typeof bgDimming === 'number' && !isNaN(bgDimming) ? bgDimming : 20}
                            onChange={(e) => setBgDimming(Number(e.target.value) || 0)}
                            className="w-full accent-indigo-600"
                          />
                        </div>

                        {/* Blur Filter */}
                        <div>
                          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                            <span>Soft Blur</span>
                            <span className="font-mono">{typeof bgBlur === 'number' ? bgBlur : 0}px</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={16}
                            value={typeof bgBlur === 'number' && !isNaN(bgBlur) ? bgBlur : 0}
                            onChange={(e) => setBgBlur(Number(e.target.value) || 0)}
                            className="w-full accent-indigo-600"
                          />
                        </div>

                        {/* Fit Mode */}
                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                            Fit Scaling Mode
                          </label>
                          <select
                            value={bgFitMode ?? 'cover'}
                            onChange={(e) => setBgFitMode(((e.target.value as 'cover' | 'contain' | 'center') ?? 'cover'))}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 outline-hidden"
                          >
                            <option value="cover">Cover (Fill Screen)</option>
                            <option value="contain">Contain (Keep Ratio)</option>
                            <option value="center">Center / Repeat</option>
                          </select>
                        </div>

                        {/* Grid Texture Overlay */}
                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                            Grid Overlay Texture
                          </label>
                          <select
                            value={bgGridOverlay ?? 'none'}
                            onChange={(e) => setBgGridOverlay(((e.target.value as 'none' | 'dots' | 'lines' | 'isometric') ?? 'none'))}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 outline-hidden"
                          >
                            <option value="none">None (Clean)</option>
                            <option value="dots">Subtle Dots</option>
                            <option value="lines">Graph Lines</option>
                            <option value="isometric">Isometric Mesh</option>
                          </select>
                        </div>

                        {/* Tint Color */}
                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                            Overlay Tint Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={bgOverlayColor && /^#[0-9a-fA-F]{6}$/.test(bgOverlayColor) ? bgOverlayColor : '#0f172a'}
                              onChange={(e) => setBgOverlayColor(e.target.value ?? '#0f172a')}
                              className="w-8 h-8 rounded-lg border-0 cursor-pointer"
                            />
                            <span className="text-xs font-mono text-slate-500">{bgOverlayColor ?? '#0f172a'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>

              {/* 4. STICKERS ROSTER */}
              <div className="p-5 rounded-2xl border-2 border-purple-200/70 dark:border-purple-900/60 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <h4 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
                      Stickers in Pack ({packStickers.length})
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {packStickers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playPop();
                          setPackStickers([]);
                          setSelectedDraftStickerId(null);
                        }}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Remove all stickers"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove All Stickers</span>
                      </button>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                      <span>🎯 Recommended: 8–12</span>
                      <span className="font-bold">({packStickers.length} stickers)</span>
                    </div>
                  </div>
                </div>

                  {/* Existing Stickers Grid in Draft */}
                  {packStickers.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                      No stickers added yet. Use the form below to add emoji badges or custom transparent image stickers!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {packStickers.map((stk) => {
                          const isSelected = selectedDraftStickerId === stk.id;
                          return (
                            <div
                              key={stk.id}
                              onClick={() => {
                                sounds.playPop();
                                setSelectedDraftStickerId((prev) => (prev === stk.id ? null : stk.id));
                              }}
                              className={`relative group p-2.5 pb-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center select-none ${
                                isSelected
                                  ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-50/90 dark:bg-purple-950/70 shadow-md scale-[1.03]'
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-purple-400 dark:hover:border-purple-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 shadow-2xs'
                              }`}
                              title="Click to select or edit this sticker"
                            >
                              {/* Always-visible red delete button with clear trash can icon */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveStickerFromDraft(stk.id);
                                }}
                                className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/90 dark:hover:bg-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/80 shadow-xs transition-all cursor-pointer z-10"
                                title={`Delete "${stk.name}" from pack`}
                                aria-label={`Delete ${stk.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Selected Status Pill */}
                              {isSelected && (
                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-purple-600 text-white text-[9px] font-bold shadow-2xs z-10">
                                  Selected
                                </span>
                              )}

                              <div
                                className={`w-12 h-12 rounded-2xl bg-white shadow-md border-2 flex items-center justify-center mb-1.5 transition-transform p-1 ${
                                  isSelected ? 'border-purple-400 scale-105' : 'border-white'
                                }`}
                              >
                                <div className="w-full h-full flex items-center justify-center die-cut-sticker">
                                  <StickerIconRenderer icon={stk.svgIcon} size="full" alt={stk.name} />
                                </div>
                              </div>

                              <span className="font-display font-bold text-xs text-slate-800 dark:text-slate-100 truncate w-full px-1">
                                {stk.name}
                              </span>
                              <div className="flex items-center gap-1 mt-0.5 self-start pl-1">
                                <span
                                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                                    stk.rarity === 'Mythic'
                                      ? 'bg-amber-100 text-amber-800'
                                      : stk.rarity === 'Legendary'
                                      ? 'bg-purple-100 text-purple-800'
                                      : stk.rarity === 'Rare'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {stk.rarity}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* SELECTED STICKER INSPECTOR & ACTION BAR */}
                      {(() => {
                        const selectedSticker = packStickers.find((s) => s.id === selectedDraftStickerId);
                        if (!selectedSticker) return null;

                        const safeStickerColor = selectedSticker.color && /^#[0-9a-fA-F]{6}$/.test(selectedSticker.color)
                          ? selectedSticker.color
                          : '#6366f1';

                        const isSelectedStickerImage = !!(
                          selectedSticker.isCustomImage ||
                          selectedSticker.svgIcon.startsWith('data:image/') ||
                          selectedSticker.svgIcon.startsWith('http://') ||
                          selectedSticker.svgIcon.startsWith('https://') ||
                          selectedSticker.svgIcon.startsWith('blob:') ||
                          selectedSticker.svgIcon.startsWith('/') ||
                          selectedSticker.svgIcon.endsWith('.png') ||
                          selectedSticker.svgIcon.endsWith('.webp')
                        );

                        return (
                          <div key={selectedSticker.id} className="p-3.5 rounded-2xl bg-purple-50/90 dark:bg-purple-950/50 border-2 border-purple-300 dark:border-purple-800 space-y-3 mt-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200 dark:border-purple-900/60 pb-2.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-purple-200 flex items-center justify-center shrink-0 p-1">
                                  <div className="w-full h-full flex items-center justify-center die-cut-sticker">
                                    <StickerIconRenderer icon={selectedSticker.svgIcon} size="full" alt={selectedSticker.name} />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                      Selected: <span className="text-purple-600 dark:text-purple-300">{selectedSticker.name}</span>
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        selectedSticker.rarity === 'Mythic'
                                          ? 'bg-amber-100 text-amber-800'
                                          : selectedSticker.rarity === 'Legendary'
                                          ? 'bg-purple-100 text-purple-800'
                                          : selectedSticker.rarity === 'Rare'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {selectedSticker.rarity}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500">Edit details below</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isSelectedStickerImage && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      sounds.playPop();
                                      try {
                                        const trimmed = await trimAndMaximizeStickerImage(selectedSticker.svgIcon, 512, 0.04);
                                        handleUpdateSelectedSticker({ svgIcon: trimmed });
                                        sounds.playFanfare();
                                      } catch (err) {
                                        console.warn('Trim failed:', err);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                    title="Auto-crop transparent padding and maximize to 1:1 square"
                                  >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                    <span>Fit Frame</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStickerFromDraft(selectedSticker.id)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                  title="Delete selected sticker"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDraftStickerId(null)}
                                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 cursor-pointer"
                                >
                                  Deselect
                                </button>
                              </div>
                            </div>

                            {/* In-Place Edit Fields for Selected Sticker */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                  Sticker Name
                                </label>
                                <input
                                  key={`stk-name-${selectedSticker.id}`}
                                  type="text"
                                  value={selectedSticker.name ?? ''}
                                  onChange={(e) => handleUpdateSelectedSticker({ name: e.target.value ?? '' })}
                                  className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-purple-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                  Rarity Tier
                                </label>
                                <select
                                  key={`stk-rarity-${selectedSticker.id}`}
                                  value={selectedSticker.rarity ?? 'Common'}
                                  onChange={(e) => handleUpdateSelectedSticker({ rarity: (e.target.value as StickerRarity) ?? 'Common' })}
                                  className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-hidden"
                                >
                                  <option value="Common">Common (Bronze)</option>
                                  <option value="Rare">Rare (Blue)</option>
                                  <option value="Legendary">Legendary (Purple)</option>
                                  <option value="Mythic">Mythic (Gold / Hologram)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                  Accent Glow
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    key={`stk-color-${selectedSticker.id}`}
                                    type="color"
                                    value={safeStickerColor}
                                    onChange={(e) => handleUpdateSelectedSticker({ color: e.target.value ?? '#6366f1' })}
                                    className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                                  />
                                  <span className="text-xs font-mono text-slate-500">{safeStickerColor}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* ADD STICKER TO PACK SUB-FORM */}
                  <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-display font-bold text-xs uppercase tracking-wide text-purple-900 dark:text-purple-300">
                        + Add Sticker to Pack
                      </h5>

                      {/* Input Type Toggle */}
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-purple-100 dark:border-purple-900">
                        <button
                          type="button"
                          onClick={() => setStickerInputType('emoji')}
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                            stickerInputType === 'emoji'
                              ? 'bg-purple-600 text-white font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          Emoji / Icon
                        </button>
                        <button
                          type="button"
                          onClick={() => setStickerInputType('image')}
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                            stickerInputType === 'image'
                              ? 'bg-purple-600 text-white font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          Image / PNG Upload
                        </button>
                      </div>
                    </div>

                    {/* Stable Hidden Sticker Image File Input */}
                    <input
                      key="sticker-image-file-input"
                      ref={stickerImageFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/*"
                      onChange={handleStickerImageUpload}
                      className="hidden"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      {stickerInputType === 'emoji' ? (
                        <div key="input-branch-emoji">
                          <label className="block text-xs text-slate-500 mb-1">Emoji Character</label>
                          <input
                            key="new-sticker-emoji-input"
                            type="text"
                            value={newStickerEmoji || ''}
                            onChange={(e) => setNewStickerEmoji(e.target.value || '')}
                            maxLength={4}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center text-xl outline-hidden focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      ) : (
                        <div key="input-branch-image">
                          <label className="block text-xs text-slate-500 mb-1">Sticker Graphic</label>
                          <button
                            type="button"
                            onClick={() => stickerImageFileInputRef.current?.click()}
                            className="w-full py-2 px-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-xs font-bold text-purple-600 dark:text-purple-300 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{newStickerImageData ? 'Change Image' : 'Upload PNG'}</span>
                          </button>
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <label className="block text-xs text-slate-500 mb-1">Sticker Name *</label>
                        <input
                          type="text"
                          value={newStickerName || ''}
                          onChange={(e) => setNewStickerName(e.target.value || '')}
                          placeholder="e.g. Neon Dragon, Space Voyager"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-hidden focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Rarity</label>
                        <select
                          value={newStickerRarity ?? 'Common'}
                          onChange={(e) => setNewStickerRarity(((e.target.value as StickerRarity) ?? 'Common'))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-hidden"
                        >
                          <option value="Common">Common (Bronze)</option>
                          <option value="Rare">Rare (Silver / Blue)</option>
                          <option value="Legendary">Legendary (Purple)</option>
                          <option value="Mythic">Mythic (Gold)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddStickerToDraft}
                        disabled={!newStickerName.trim()}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Sticker</span>
                      </button>
                    </div>
                  </div>
                </div>

              {/* 5. BOTTOM SAVE & CANCEL BAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('installed')}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  {/* If editing an existing custom pack, allow deletion right here */}
                  {editingPackId && packs.find((p) => p.id === editingPackId)?.isCustom && (
                    confirmingDeletePackId === editingPackId ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/90 px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 animate-in fade-in duration-150">
                        <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                          Delete pack?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playPop();
                            onDeletePack(editingPackId);
                            setConfirmingDeletePackId(null);
                            handleStartCreateNew();
                            setActiveTab('installed');
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                        >
                          Yes, Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeletePackId(null)}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playPop();
                          setConfirmingDeletePackId(editingPackId);
                        }}
                        className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Delete this custom pack"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Pack</span>
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSavePackSubmit}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Pack to StickerBook</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMPORT PACK */}
          {activeTab === 'import' && (
            <div className="space-y-5 max-w-xl mx-auto py-4">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs border border-indigo-100 dark:border-indigo-900">
                  <FolderArchive className="w-7 h-7" />
                </div>
                <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100">
                  Import StickerBook Pack
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select or drop a StickerBook pack archive to install custom themes, transparent PNG stickers, and companion backdrops.
                </p>
              </div>

              {/* Primary Branded ZIP Dropzone / Upload Box */}
              <input
                key="import-zip-file-input"
                ref={importFileInputRef}
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={handleImportFileChange}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (!isReadingFile && importFileInputRef.current) {
                    importFileInputRef.current.value = '';
                    importFileInputRef.current.click();
                  }
                }}
                className={`p-7 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
                  isDraggingOver
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                {isReadingFile ? (
                  <div className="py-2 flex flex-col items-center justify-center space-y-2">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {readingFileStatus || 'Reading and extracting pack archive...'}
                    </p>
                  </div>
                ) : (
                  <>
                    <FolderArchive className="w-10 h-10 text-indigo-500 mx-auto mb-2 opacity-90" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Click to choose pack or drag and drop archive
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Accepts branded StickerBook and master bundle archives
                    </p>
                    <div className="mt-2.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        Primary Branded Format
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Small Legacy Support (Read-Only) Link / Button */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>Have an older format pack?</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLegacyImport(!showLegacyImport)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{showLegacyImport ? 'Hide Legacy Support' : 'Legacy JSON Support (Read-Only) →'}</span>
                  </button>
                </div>

                {showLegacyImport && (
                  <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        <span>Legacy JSON Pack Importer (Read-Only)</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        Legacy v1 Read-Only
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Read-only backward compatibility for importing previous v1 single-pack JSON files or pasting raw JSON text. All newly exported packs use the primary branded .zip format.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        ref={legacyJsonFileInputRef}
                        type="file"
                        accept=".json,application/json,text/plain"
                        onChange={handleLegacyJsonFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!isReadingFile && legacyJsonFileInputRef.current) {
                            legacyJsonFileInputRef.current.value = '';
                            legacyJsonFileInputRef.current.click();
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose Legacy .json File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPasteBox(!showPasteBox)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>{showPasteBox ? 'Hide Paste Box' : 'Paste JSON Text Directly'}</span>
                      </button>
                    </div>

                    {showPasteBox && (
                      <div className="mt-2 space-y-2 animate-in fade-in duration-200">
                        <textarea
                          value={pasteJsonText ?? ''}
                          onChange={(e) => setPasteJsonText(e.target.value ?? '')}
                          placeholder='{"name": "My Pack", "stickers": [...]}'
                          rows={4}
                          className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleParsePastedJson}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            Parse Legacy Pack
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {importError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Parsed Pack Preview Card */}
              {importPreview && (
                <div className="p-5 rounded-2xl border-2 border-indigo-500 bg-white dark:bg-slate-900 shadow-xl space-y-4 animate-fade-in">
                  {/* Multi-Pack Bundle Navigation (if bundle was imported) */}
                  {multiPackBundle && multiPackBundle.length > 1 && (
                    <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-1.5">
                          <FolderArchive className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Master Bundle ({multiPackBundle.length} Packs Included)</span>
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Viewing pack {selectedBundlePackIdx + 1} of {multiPackBundle.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {multiPackBundle.map((p, idx) => (
                          <button
                            key={p.name + idx}
                            type="button"
                            onClick={() => {
                              setSelectedBundlePackIdx(idx);
                              setImportPreview(p);
                              sounds.playPop();
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                              selectedBundlePackIdx === idx
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                            }`}
                          >
                            <span>{p.icon || '📦'}</span>
                            <span className="truncate max-w-[120px]">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl">{typeof importPreview.icon === 'string' ? importPreview.icon : '📦'}</span>
                      <div>
                        <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100">
                          {typeof importPreview.name === 'string' ? importPreview.name : 'Custom Pack'}
                        </h4>
                        <p className="text-xs text-slate-500">
                          By {typeof importPreview.author === 'string' ? importPreview.author : 'StickerBook Creator'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isImportingFormat === 'zip' ? (
                        <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-[10px] flex items-center gap-1">
                          <FolderArchive className="w-3 h-3" />
                          <span>BRANDED .ZIP</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[10px] flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>LEGACY JSON</span>
                        </span>
                      )}
                      {(() => {
                        const hasScene = !!(importPreview.themeScene || (importPreview as any).sceneConfig);
                        const hasStk = !!(importPreview.stickers && importPreview.stickers.length > 0);
                        const isCombo = hasScene && hasStk;
                        const isBackdrop = hasScene && !hasStk;
                        return (
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                              isCombo
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : isBackdrop
                                ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                                : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            }`}
                          >
                            {isCombo ? 'Combo' : isBackdrop ? 'Backdrop' : 'Stickers'}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {typeof importPreview.description === 'string' ? importPreview.description : 'StickerBook Pack'}
                  </p>

                  {/* Stickers Preview Gallery */}
                  {importPreview.stickers && Array.isArray(importPreview.stickers) && importPreview.stickers.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                          <span>🏷️</span>
                          <span>{importPreview.stickers.length} Stickers Included</span>
                        </span>
                        <span className="text-[11px] text-slate-400">Preview</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                        {importPreview.stickers.slice(0, 6).map((stk, sIdx) => (
                          <div
                            key={stk.id || sIdx}
                            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs aspect-square"
                            title={stk.name}
                          >
                            <div className="w-8 h-8 flex items-center justify-center">
                              <StickerIconRenderer icon={stk.svgIcon} size="md" alt={stk.name} />
                            </div>
                            <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-300 truncate w-full text-center mt-1">
                              {stk.name}
                            </span>
                          </div>
                        ))}
                        {importPreview.stickers.length > 6 && (
                          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-700/60 border border-dashed border-slate-300 dark:border-slate-600 aspect-square text-xs font-bold text-slate-500">
                            +{importPreview.stickers.length - 6} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Companion Theme Preview */}
                  {importPreview.themeScene && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                        <span>🎨</span>
                        <span>Companion Theme: {typeof importPreview.themeScene.name === 'string' ? importPreview.themeScene.name : 'Custom Theme'}</span>
                      </span>
                      {importPreview.themeScene.customConfig?.imageUrl && (
                        <div className="w-12 h-7 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                          <img
                            src={importPreview.themeScene.customConfig.imageUrl}
                            alt="Backdrop preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 space-y-2">
                    <button
                      type="button"
                      onClick={handleInstallImportedPack}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Install Pack to StickerBook</span>
                    </button>

                    {multiPackBundle && multiPackBundle.length > 1 && (
                      <button
                        type="button"
                        onClick={handleInstallAllBundlePacks}
                        className="w-full py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FolderArchive className="w-3.5 h-3.5" />
                        <span>Install All {multiPackBundle.length} Packs from Bundle</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
