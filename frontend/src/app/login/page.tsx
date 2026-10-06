"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/hooks/useAuth";

export function getSafeRedirectTarget(rawTarget: string | null): string {
  if (!rawTarget) return "/lobbies";

  try {
    let decoded = decodeURIComponent(rawTarget).trim();

    // Loop decode in case of multi-encoded payload e.g. %252Flogin
    let prev = "";
    while (decoded !== prev && decoded.includes("%")) {
      prev = decoded;
      try {
        decoded = decodeURIComponent(decoded).trim();
      } catch {
        break;
      }
    }

    // Must be a relative path starting with '/' and not '//' or '/\' (blocks protocol-relative open redirects)
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.startsWith("/\\")) {
      return "/lobbies";
    }

    // Parse the path portion to check against forbidden routes
    const pathOnly = decoded.split("?")[0].split("#")[0].toLowerCase();

    // Prevent redirect loops: do not redirect back to /login or /register
    if (
      pathOnly === "/login" ||
      pathOnly.startsWith("/login/") ||
      pathOnly === "/register" ||
      pathOnly.startsWith("/register/")
    ) {
      return "/lobbies";
    }

    return decoded;
  } catch {
    return "/lobbies";
  }
}

function LoginForm() {
  const searchParams = useSearchParams();
  const rawTarget =
    searchParams.get("redirect") ||
    searchParams.get("next") ||
    searchParams.get("callbackUrl") ||
    searchParams.get("from") ||
    searchParams.get("returnUrl");

  const target = getSafeRedirectTarget(rawTarget);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(target);
    }
  }, [authLoading, isAuthenticated, router, target]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await authApi.login(email, password);
      login(data.access_token, data.refresh_token, data.user);
      router.replace(target);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative py-8 animate-fade-in">
      {/* Decorative Background Shapes */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#A78BFA] brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-full animate-pop-in" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-[#FEF08A] brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-12 animate-pop-in delay-200" />

      <Card className="m-auto w-full max-w-md bg-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative z-10 animate-slide-up">
        <CardHeader className="space-y-2 bg-[#60A5FA] border-b-[3px] border-black p-6">
          <CardTitle className="text-4xl font-black uppercase tracking-tighter text-black">GİRİŞ YAP</CardTitle>
          <CardDescription className="text-black/80 font-bold text-base">
            Odalara erişmek için hesap bilgilerinizi girin.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {error && (
              <div className="bg-destructive/20 text-destructive brutal-border brutal-shadow-sm p-3 rounded-md text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-black uppercase block" htmlFor="email">
                E-Posta veya Kullanıcı Adı
              </label>
              <Input
                id="email"
                type="text"
                placeholder="kullanici_adi veya eposta@ornek.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="brutal-border brutal-shadow-sm h-12 text-lg focus-visible:ring-offset-0 focus-visible:ring-[#4ADE80] focus-visible:ring-4"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase block" htmlFor="password">
                Şifre
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                className="brutal-border brutal-shadow-sm h-12 text-lg focus-visible:ring-offset-0 focus-visible:ring-[#4ADE80] focus-visible:ring-4"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-6 h-14 text-xl font-black uppercase bg-[#4ADE80] text-black brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-[#22c55e] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Giriş yapılıyor..." : "GİRİŞ YAP"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t-[3px] border-black bg-gray-50 p-6">
          <div className="text-base font-bold">
            Hesabınız yok mu?{" "}
            <Link
              href={target !== "/lobbies" ? `/register?redirect=${encodeURIComponent(target)}` : "/register"}
              className="text-black bg-[#FEF08A] px-2 py-1 ml-1 rounded-sm brutal-border shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all inline-block uppercase cursor-pointer"
            >
              Kayıt Ol
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl font-bold animate-pulse">Yükleniyor...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
