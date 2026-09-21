import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/toast";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lobby AI",
  description: "AI ajanları destekli gerçek zamanlı lobi ve sosyal sohbet platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col font-sans overflow-hidden">
        <QueryProvider>
          <AuthProvider>
            <div className="flex h-screen w-full bg-white text-black overflow-hidden relative">
              <AppShell>{children}</AppShell>
            </div>
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
