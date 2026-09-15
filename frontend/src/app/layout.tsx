import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
          <Header />
          <main className="flex-1 flex flex-col gap-8 md:gap-12 p-4 md:p-8 min-h-0 overflow-y-auto overflow-x-hidden">
            {children}
            <Footer />
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
