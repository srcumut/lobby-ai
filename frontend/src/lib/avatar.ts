// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/avatar.ts
// PURPOSE: Utility to resolve avatar URLs correctly in dev and production
// ============================================================================

/**
 * Resolves an avatar URL to a displayable image source URL.
 * Handles:
 * - Null / empty values -> returns empty string
 * - Absolute URLs (http://, https://) -> returns as-is
 * - Data URLs (data:) and Blob URLs (blob:) -> returns as-is
 * - Relative backend paths (/api/uploads/...) -> prepends backend origin in development
 */
export function getAvatarUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  // If path starts with /api or /, prepend backend URL if running in local dev
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  const backendOrigin = apiUrl.replace(/\/api\/?$/, '');

  if (url.startsWith('/')) {
    return `${backendOrigin}${url}`;
  }

  return `${backendOrigin}/${url}`;
}
