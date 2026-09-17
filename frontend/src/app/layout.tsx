import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/toast";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lobby AI",
  description: "Real-time lobby chat platform with AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col font-sans overflow-hidden">
        <AuthProvider>
          <div className="flex h-screen w-full bg-white text-black overflow-hidden relative">
            <AppShell>{children}</AppShell>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
