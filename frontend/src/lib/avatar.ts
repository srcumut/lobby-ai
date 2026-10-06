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

  // Ready avatars stored in Next.js public/avatars directory are served directly by frontend
  if (url.startsWith('/avatars/') || url.startsWith('avatars/')) {
    return url.startsWith('/') ? url : `/${url}`;
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
    return { className: "bg-gradient-to-r from-[#06B6D4] via-[#FEF08A] to-[#8B5CF6]" };
  }
  if (bannerUrl.startsWith("theme:")) {
    const themeId = bannerUrl.replace("theme:", "");
    switch (themeId) {
      case "cyan":
      case "cyber-cyan":
        return {
          className: "bg-[#06B6D4]",
          style: { backgroundImage: "radial-gradient(#000000 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" },
        };
      case "purple":
      case "electric-violet":
        return {
          className: "bg-[#8B5CF6]",
          style: { backgroundImage: "radial-gradient(#000000 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" },
        };
      case "emerald":
      case "lime":
        return {
          className: "bg-[#10B981]",
          style: { backgroundImage: "radial-gradient(#000000 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" },
        };
      case "yellow":
        return {
          className: "bg-[#FEF08A]",
          style: { backgroundImage: "radial-gradient(#000000 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" },
        };
      case "pink":
        return {
          className: "bg-[#F472B6]",
          style: { backgroundImage: "radial-gradient(#000000 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" },
        };
      case "sunset":
        return {
          className: "bg-gradient-to-r from-[#F472B6] via-[#FB923C] to-[#8B5CF6]",
        };
      case "dark":
      case "midnight":
        return {
          className: "bg-[#18181B] text-white",
          style: { backgroundImage: "radial-gradient(#3F3F46 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" },
        };
      default:
        return { className: "bg-gradient-to-r from-[#06B6D4] via-[#FEF08A] to-[#8B5CF6]" };
    }
  }

  // It's a custom uploaded image or external URL
  const resolvedUrl = getAvatarUrl(bannerUrl);
  return {
    className: "bg-cover bg-center bg-no-repeat",
    style: { backgroundImage: `url(${resolvedUrl})` },
  };
}
