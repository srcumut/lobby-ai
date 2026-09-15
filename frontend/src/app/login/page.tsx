"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await authApi.login(email, password);
      login(data.access_token, data.user);
      router.push("/lobbies");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to login. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative py-8">
      
      {/* Decorative Background Shapes */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#A78BFA] brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-full animate-pop-in" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-[#FEF08A] brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-12 animate-pop-in delay-200" />
      
      <Card className="m-auto w-full max-w-md bg-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative z-10 animate-fade-in-up">
        <CardHeader className="space-y-2 bg-[#60A5FA] border-b-[3px] border-black p-6">
          <CardTitle className="text-4xl font-black uppercase tracking-tighter text-black">Log in</CardTitle>
          <CardDescription className="text-black/80 font-bold text-base">
            Enter your credentials to access the lobbies.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/20 text-destructive brutal-border brutal-shadow-sm p-3 rounded-md text-sm font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-black uppercase block" htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="brutal-border brutal-shadow-sm h-12 text-lg focus-visible:ring-offset-0 focus-visible:ring-[#4ADE80] focus-visible:ring-4"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase block" htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="brutal-border brutal-shadow-sm h-12 text-lg focus-visible:ring-offset-0 focus-visible:ring-[#4ADE80] focus-visible:ring-4"
                required
              />
            </div>
            
            <Button type="submit" className="w-full mt-6 h-14 text-xl font-black uppercase bg-[#4ADE80] text-black brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-[#22c55e] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t-[3px] border-black bg-gray-50 p-6">
          <div className="text-base font-bold">
            Don't have an account?{" "}
            <Link href="/register" className="text-black bg-[#FEF08A] px-2 py-1 ml-1 rounded-sm brutal-border shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all inline-block uppercase">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
