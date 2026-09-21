import Link from "next/link";
import { Code, Hash, MessageSquare } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#FEF08A] border-t-4 border-black p-6 md:p-10 brutal-shadow mt-auto z-10 relative -mx-4 md:-mx-8 -mb-4 md:-mb-8 flex-shrink-0">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Left Side: Brand & Copy */}
        <div className="flex-1 flex flex-col items-center md:items-start gap-2">
          <div className="flex -space-x-1 hover:-translate-y-1 transition-transform cursor-pointer">
            <div className="bg-[#4ADE80] border-2 border-black px-2 py-0.5 transform -rotate-3 z-10 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:rotate-0 transition-all">
              <span className="font-black text-xl tracking-tighter uppercase text-black">LOBBY</span>
            </div>
            <div className="bg-[#FEF08A] border-2 border-black px-2 py-0.5 transform rotate-3 z-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:rotate-0 transition-all">
              <span className="font-black text-xl tracking-tighter uppercase text-black">AI</span>
            </div>
          </div>
          <p className="font-bold text-black/70 text-sm mt-2">
            © {new Date().getFullYear()} Lobby AI. Tüm hakları saklıdır.
          </p>
        </div>

        {/* Center: Links */}
        <div className="flex flex-wrap justify-center gap-6 font-black uppercase text-sm">
          <Link href="/lobbies" className="hover:underline hover:text-[#A78BFA] transition-colors cursor-pointer">
            Odaları Keşfet
          </Link>
          <Link href="#" className="hover:underline hover:text-[#4ADE80] transition-colors cursor-pointer">
            Hakkımızda
          </Link>
          <Link href="#" className="hover:underline hover:text-[#F472B6] transition-colors cursor-pointer">
            Gizlilik Politikası
          </Link>
        </div>

        {/* Right Side: Social Icons */}
        <div className="flex-1 flex justify-center md:justify-end gap-3">
          <a href="#" className="bg-white p-2 brutal-border shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer">
            <Hash className="w-5 h-5 text-black" />
          </a>
          <a href="#" className="bg-white p-2 brutal-border shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer">
            <Code className="w-5 h-5 text-black" />
          </a>
          <a href="#" className="bg-[#4ADE80] p-2 brutal-border shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer">
            <MessageSquare className="w-5 h-5 text-black" />
          </a>
        </div>
      </div>
    </footer>
  );
}
