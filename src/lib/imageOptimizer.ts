/**
 * Image optimization utility for StickerBook ThemePack STUDIO.
 * Downscales and compresses large wallpaper/backdrop images and sticker images
 * to keep memory and storage footprint under control, preventing browser
 * localStorage QuotaExceededError while maintaining crisp HD visual quality.
 */

export async function optimizeImageDataUrl(
  dataUrl: string,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.82,
  mimeType: 'image/jpeg' | 'image/webp' | 'image/png' = 'image/jpeg'
): Promise<string> {
  // If it's not a valid string or not an image data URL, return safely
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/') || dataUrl.startsWith('data:image/svg+xml')) {
    return typeof dataUrl === 'string' ? dataUrl : '';
  }

  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = (val: string) => {
      if (!resolved) {
        resolved = true;
        resolve(val);
      }
    };

    // Timeout safety fallback: never hang longer than 3 seconds
    const timer = setTimeout(() => {
      safeResolve(dataUrl);
    }, 3000);

    try {
      const img = new Image();

      if (!dataUrl.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        clearTimeout(timer);
        try {
          let { width, height } = img;
          if (width === 0 || height === 0) {
            safeResolve(dataUrl);
            return;
          }

          // Calculate aspect ratio preserving downscale
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            safeResolve(dataUrl);
            return;
          }

          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw image onto canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Determine output mime
          const effectiveMime =
            mimeType === 'image/png' ? 'image/png' : 'image/jpeg';

          const optimizedDataUrl = canvas.toDataURL(effectiveMime, quality);

          // If optimized is smaller, use it; otherwise keep original
          if (optimizedDataUrl && optimizedDataUrl.length < dataUrl.length) {
            safeResolve(optimizedDataUrl);
          } else {
            safeResolve(dataUrl);
          }
        } catch (err) {
          console.warn('Canvas optimization error:', err);
          safeResolve(dataUrl);
        }
      };

      img.onerror = (err) => {
        clearTimeout(timer);
        console.warn('Image load error during optimization:', err);
        safeResolve(dataUrl);
      };

      img.src = dataUrl;
    } catch {
      clearTimeout(timer);
      safeResolve(dataUrl);
    }
  });
}

/**
 * Trims transparent outer padding from custom uploaded sticker images and
 * centers/maximizes the artwork on a 1:1 square canvas with a snug die-cut margin.
 * Guarantees that user-imported stickers fill the canvas selection box and drawer
 * tiles with the exact same fullness as built-in stickers.
 */
export async function trimAndMaximizeStickerImage(
  imageSource: string,
  targetSize = 512,
  paddingPercent = 0.04
): Promise<string> {
  if (!imageSource || typeof imageSource !== 'string') return imageSource;
  const trimmed = imageSource.trim();
  if (!trimmed || trimmed.startsWith('<svg')) return imageSource;

  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = (val: string) => {
      if (!resolved) {
        resolved = true;
        resolve(val);
      }
    };

    const timer = setTimeout(() => {
      safeResolve(imageSource);
    }, 4000);

    try {
      const img = new Image();
      if (!trimmed.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        clearTimeout(timer);
        try {
          const origW = img.naturalWidth || img.width;
          const origH = img.naturalHeight || img.height;
          if (!origW || !origH) {
            safeResolve(imageSource);
            return;
          }

          // Downsample offscreen analysis canvas to max 400px so high-res cloud photos (3000x4000) don't crash memory or freeze CPU
          const maxScanDim = 400;
          const scanScale = Math.min(1, maxScanDim / Math.max(origW, origH));
          const scanW = Math.max(1, Math.round(origW * scanScale));
          const scanH = Math.max(1, Math.round(origH * scanScale));

          const scanCanvas = document.createElement('canvas');
          scanCanvas.width = scanW;
          scanCanvas.height = scanH;
          const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true });
          if (!scanCtx) {
            safeResolve(imageSource);
            return;
          }

          scanCtx.drawImage(img, 0, 0, scanW, scanH);
          const imgData = scanCtx.getImageData(0, 0, scanW, scanH);
          const data = imgData.data;

          // Find alpha bounds (ignore transparent borders)
          let minX = scanW;
          let minY = scanH;
          let maxX = -1;
          let maxY = -1;

          for (let y = 0; y < scanH; y++) {
            for (let x = 0; x < scanW; x++) {
              const alpha = data[(y * scanW + x) * 4 + 3];
              if (alpha > 8) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          // If completely empty or bounding box not found (e.g. solid opaque photo from cloud drive)
          if (maxX < minX || maxY < minY) {
            minX = 0;
            minY = 0;
            maxX = scanW - 1;
            maxY = scanH - 1;
          }

          // Map scan coordinates back to original image scale
          const origCropX = Math.round(minX / scanScale);
          const origCropY = Math.round(minY / scanScale);
          const origCropW = Math.min(origW - origCropX, Math.max(1, Math.round((maxX - minX + 1) / scanScale)));
          const origCropH = Math.min(origH - origCropY, Math.max(1, Math.round((maxY - minY + 1) / scanScale)));

          // Create high-res square target canvas (1:1 aspect ratio)
          const outCanvas = document.createElement('canvas');
          outCanvas.width = targetSize;
          outCanvas.height = targetSize;
          const outCtx = outCanvas.getContext('2d');
          if (!outCtx) {
            safeResolve(imageSource);
            return;
          }

          outCtx.imageSmoothingEnabled = true;
          outCtx.imageSmoothingQuality = 'high';

          // Apply snug die-cut boundary padding
          const padPx = Math.round(targetSize * paddingPercent);
          const availSize = targetSize - padPx * 2;
          const scale = Math.min(availSize / origCropW, availSize / origCropH);
          const drawW = Math.max(1, Math.round(origCropW * scale));
          const drawH = Math.max(1, Math.round(origCropH * scale));
          const drawX = Math.round((targetSize - drawW) / 2);
          const drawY = Math.round((targetSize - drawH) / 2);

          outCtx.drawImage(
            img,
            origCropX, origCropY, origCropW, origCropH,
            drawX, drawY, drawW, drawH
          );

          // Produce a webp or png data URL (compact footprint to prevent QuotaExceededError)
          let resultDataUrl = outCanvas.toDataURL('image/webp', 0.92);
          if (!resultDataUrl.startsWith('data:image/webp') || resultDataUrl.length > 500000) {
            resultDataUrl = outCanvas.toDataURL('image/png', 0.92);
          }
          safeResolve(resultDataUrl);
        } catch (err) {
          console.warn('Sticker trim failed:', err);
          safeResolve(imageSource);
        }
      };

      img.onerror = (err) => {
        clearTimeout(timer);
        console.warn('Image load error for sticker trim:', err);
        safeResolve(imageSource);
      };

      img.src = trimmed;
    } catch {
      clearTimeout(timer);
      safeResolve(imageSource);
    }
  });
}
