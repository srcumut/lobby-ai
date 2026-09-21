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

export interface BannerStyle {
  className: string;
  style?: React.CSSProperties;
}

/**
 * Resolves a banner_url (which can be a theme:id or an image path)
 * into appropriate Tailwind classes and CSS styles.
 */
export function getBannerStyle(bannerUrl: string | null | undefined): BannerStyle {
  if (!bannerUrl) {
    return { className: "bg-gradient-to-r from-[#FEF08A] via-[#FB923C] to-[#F472B6]" };
  }
  if (bannerUrl.startsWith("theme:")) {
    const themeId = bannerUrl.replace("theme:", "");
    switch (themeId) {
      case "purple":
        return {
          className: "bg-[#A78BFA]",
          style: { backgroundImage: "radial-gradient(#000000 1px, transparent 1px)", backgroundSize: "16px 16px" },
        };
      case "yellow":
        return {
          className: "bg-[#FEF08A]",
          style: { backgroundImage: "radial-gradient(#000000 1px, transparent 1px)", backgroundSize: "16px 16px" },
        };
      case "cyan":
        return {
          className: "bg-[#67e8f9]",
          style: { backgroundImage: "radial-gradient(#000000 1px, transparent 1px)", backgroundSize: "16px 16px" },
        };
      case "pink":
        return {
          className: "bg-[#f472b6]",
          style: { backgroundImage: "radial-gradient(#000000 1px, transparent 1px)", backgroundSize: "16px 16px" },
        };
      case "lime":
        return {
          className: "bg-[#4ADE80]",
          style: { backgroundImage: "radial-gradient(#000000 1px, transparent 1px)", backgroundSize: "16px 16px" },
        };
      default:
        return { className: "bg-gradient-to-r from-[#FEF08A] via-[#FB923C] to-[#F472B6]" };
    }
  }

  // It's a custom uploaded image or external URL
  const resolvedUrl = getAvatarUrl(bannerUrl);
  return {
    className: "bg-cover bg-center bg-no-repeat",
    style: { backgroundImage: `url(${resolvedUrl})` },
  };
}
