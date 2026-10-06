"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const isAuthPage =
        pathname === "/login" ||
        pathname?.startsWith("/login/") ||
        pathname === "/register" ||
        pathname?.startsWith("/register/");

      const redirectQuery =
        !isAuthPage && pathname && pathname !== "/"
          ? `?redirect=${encodeURIComponent(pathname)}`
          : "";

      router.push(`/login${redirectQuery}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl font-bold animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  return <>{children}</>;
}
