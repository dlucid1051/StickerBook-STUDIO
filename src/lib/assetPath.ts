/**
 * Asset path resolution utility.
 * Resolves public assets correctly across root domains, local dev,
 * and GitHub Pages subpath deployments (e.g. https://<user>.github.io/<repo>/).
 */
export function resolvePublicAsset(path?: string | null): string {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  // Inline data URLs, object blob URLs, and external web URLs are returned directly
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }

  // Vite provides import.meta.env.BASE_URL (configured via base in vite.config.ts)
  const rawBase = import.meta.env.BASE_URL || './';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  // Absolute path from public root (e.g. "/stickers/stk-space-1.webp" or "/backdrops/...")
  if (trimmed.startsWith('/')) {
    const cleanPath = trimmed.replace(/^\/+/, '');
    return `${base}${cleanPath}`;
  }

  // Relative path with leading "./" (e.g. "./stickers/...")
  if (trimmed.startsWith('./')) {
    const cleanPath = trimmed.slice(2);
    return `${base}${cleanPath}`;
  }

  // Relative paths without leading slash/dot
  if (
    trimmed.startsWith('stickers/') ||
    trimmed.startsWith('backdrops/') ||
    trimmed.endsWith('.webp') ||
    trimmed.endsWith('.png') ||
    trimmed.endsWith('.jpg') ||
    trimmed.endsWith('.jpeg') ||
    trimmed.endsWith('.svg') ||
    trimmed.endsWith('.ico')
  ) {
    return `${base}${trimmed}`;
  }

  return trimmed;
}
