import React from 'react';
import { sanitizeSvgMarkup } from '../lib/sanitizeSvg';

interface StickerIconRendererProps {
  icon: string;
  className?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const StickerIconRenderer: React.FC<StickerIconRendererProps> = ({
  icon,
  className = '',
  alt = 'Sticker',
  size = 'md',
}) => {
  if (!icon || typeof icon !== 'string') return <span>✨</span>;

  const sizeClasses = {
    sm: 'w-5 h-5 text-base',
    md: 'w-7 h-7 text-2xl',
    lg: 'w-10 h-10 text-3xl',
    xl: 'w-14 h-14 text-4xl sm:text-5xl',
    '2xl': 'w-20 h-20 text-6xl',
    full: 'w-full h-full text-2xl sm:text-3xl',
  }[size];

  const trimmed = icon.trim();
  if (!trimmed) return <span>✨</span>;

  // Image Data URL or remote/local image URL
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/') ||
    trimmed.endsWith('.webp') ||
    trimmed.endsWith('.png') ||
    trimmed.endsWith('.jpg') ||
    trimmed.endsWith('.jpeg')
  ) {
    return (
      <img
        src={trimmed}
        alt={alt}
        className={`${sizeClasses} ${className} object-contain pointer-events-none select-none`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Raw SVG markup
  if (trimmed.startsWith('<svg')) {
    const cleanSvg = sanitizeSvgMarkup(trimmed);
    return (
      <span
        className={`${sizeClasses} ${className} inline-flex items-center justify-center pointer-events-none select-none [&>svg]:w-full [&>svg]:h-full`}
        dangerouslySetInnerHTML={{ __html: cleanSvg }}
      />
    );
  }

  // Emoji or textual symbol
  return (
    <span className={`inline-flex items-center justify-center pointer-events-none select-none ${sizeClasses} ${className}`}>
      {trimmed}
    </span>
  );
};
