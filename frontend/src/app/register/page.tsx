"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/hooks/useAuth";
import { getSafeRedirectTarget } from "@/app/login/page";

function RegisterForm() {
  const searchParams = useSearchParams();
  const rawTarget =
    searchParams.get("redirect") ||
    searchParams.get("next") ||
    searchParams.get("callbackUrl") ||
    searchParams.get("from") ||
    searchParams.get("returnUrl");

  const target = getSafeRedirectTarget(rawTarget);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // If already authenticated, redirect to target
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
      const data = await authApi.register(username, email, password, displayName || undefined);
      login(data.access_token, data.refresh_token, data.user);
      router.replace(target);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Kayıt oluşturulamadı. Lütfen girdiğiniz bilgileri kontrol edin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative py-8 animate-fade-in">
      {/* Decorative Background Shapes */}
      <div className="absolute top-10 right-1/4 w-32 h-32 bg-[#F472B6] brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-full animate-pop-in" />
      <div className="absolute bottom-10 left-1/4 w-24 h-24 bg-[#4ADE80] brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-12 animate-pop-in delay-200" />

      <Card className="m-auto w-full max-w-md bg-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative z-10 animate-slide-up">
        <CardHeader className="space-y-2 bg-[#FEF08A] border-b-[3px] border-black p-6">
          <CardTitle className="text-4xl font-black uppercase tracking-tighter text-black">KAYIT OL</CardTitle>
          <CardDescription className="text-black/80 font-bold text-base">
            Topluluğa katılmak için bir hesap oluşturun.
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
              <label className="text-sm font-black uppercase block" htmlFor="username">
                Kullanıcı Adı
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Benzersiz kullanıcı adı"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                className="brutal-border brutal-shadow-sm h-12 text-lg focus-visible:ring-offset-0 focus-visible:ring-[#A78BFA] focus-visible:ring-4"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase block" htmlFor="email">
                E-Posta
              </label>
              <Input
                id="email"
                type="email"
                placeholder="eposta@ornek.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="brutal-border brutal-shadow-sm h-12 text-lg focus-visible:ring-offset-0 focus-visible:ring-[#A78BFA] focus-visible:ring-4"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase block" htmlFor="display_name">
                Görünen İsim (İsteğe Bağlı)
              </label>
              <Input
                id="display_name"
                type="text"
                placeholder="Diğer kullanıcıların sizi göreceği isim"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="off"
                className="brutal-border brutal-shadow-sm h-12 text-lg focus-visible:ring-offset-0 focus-visible:ring-[#A78BFA] focus-visible:ring-4"
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
                className="brutal-border brutal-shadow-sm h-12 text-lg focus-visible:ring-offset-0 focus-visible:ring-[#A78BFA] focus-visible:ring-4"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-6 h-14 text-xl font-black uppercase bg-[#A78BFA] text-black brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-[#8b5cf6] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Hesap oluşturuluyor..." : "HESAP OLUŞTUR"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t-[3px] border-black bg-gray-50 p-6">
          <div className="text-base font-bold">
            Zaten bir hesabınız var mı?{" "}
            <Link
              href={target !== "/lobbies" ? `/login?redirect=${encodeURIComponent(target)}` : "/login"}
              className="text-black bg-[#60A5FA] px-2 py-1 ml-1 rounded-sm brutal-border shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all inline-block uppercase cursor-pointer"
            >
              Giriş Yap
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl font-bold animate-pulse">Yükleniyor...</div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
