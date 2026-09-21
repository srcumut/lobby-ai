// ============================================================================
// TARGET_DESTINATION: frontend/src/components/home/FeatureSlider.tsx
// PURPOSE: Neo-Brutalist interactive feature showcase carousel for the homepage
// ============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Swords, 
  Bot, 
  Sparkles, 
  User, 
  ArrowRight,
  Flame,
  Radio,
  Trophy,
  Zap,
  Play
} from "lucide-react";

interface SlideItem {
  id: string;
  badge: string;
  badgeBg: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  imageSrc?: string;
  accentBg: string;
  mockupContent: React.ReactNode;
}

const SLIDES: SlideItem[] = [
  {
    id: "slide-lobbies",
    badge: "01 // GERÇEK ZAMANLI SOHBET",
    badgeBg: "bg-[#FEF08A]",
    title: "Odalar & Anlık Sosyal Lobi Sohbeti",
    subtitle: "Kendi odanı kur veya herkese açık lobilerde anında sohbete katıl.",
    description: "Arkadaşlarınızı ve topluluk üyelerini bir araya getirin; zengin mesaj kartları, tepkiler ve canlı bildirimlerle kesintisiz iletişim kurun.",
    ctaText: "Odaları Keşfet",
    ctaHref: "/lobbies",
    accentBg: "bg-[#FEF08A]",
    mockupContent: (
      <div className="w-full h-full bg-[#FAF8F0] p-4 flex flex-col justify-between rounded-sm border-2 border-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-black text-xs uppercase text-black">Lobi: #Gece-Sohbetleri</span>
          </div>
          <span className="text-[10px] font-black uppercase bg-[#FEF08A] px-2 py-0.5 border border-black">
            18 Üye Canlı
          </span>
        </div>
        <div className="space-y-2 py-2">
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-[#FB923C] border border-black flex items-center justify-center text-xs font-black text-white">A</div>
            <div className="bg-white p-2 border-2 border-black rounded-sm text-xs font-bold text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              Selam herkese! Yeni lobi özelliklerini denediniz mi? 🔥
            </div>
          </div>
          <div className="flex items-start gap-2 justify-end">
            <div className="bg-[#FEF08A] p-2 border-2 border-black rounded-sm text-xs font-bold text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-right">
              Evet, Taş-Kağıt-Makas düelloları ve görevler mükemmel olmuş! 🚀
            </div>
            <div className="w-7 h-7 rounded-full bg-[#F472B6] border border-black flex items-center justify-center text-xs font-black text-white">B</div>
          </div>
        </div>
        <div className="pt-2 border-t-2 border-black flex items-center gap-2 text-[10px] font-bold text-gray-600">
          <MessageSquare className="w-3.5 h-3.5 text-black" />
          <span>Şifreli & Parametrik Gerçek Zamanlı WebSocket İletişimi</span>
        </div>
      </div>
    ),
  },
  {
    id: "slide-duels",
    badge: "02 // LOBİ İÇİ DÜELLOLAR",
    badgeBg: "bg-[#FB923C]",
    title: "Taş-Kağıt-Makas, Zar & Canlı Trivia",
    subtitle: "Lobi sohbetinde anlık meydan oku ve Lobby Coin kazan!",
    description: "Sohbetin kalbinden doğrudan 1v1 Taş-Kağıt-Makas meydan okuması başlatın. İlk kabul eden kullanıcıyla anlık düelloya girin ve zafer rozetleri toplayın.",
    ctaText: "Meydan Oku",
    ctaHref: "/lobbies",
    accentBg: "bg-[#FB923C]",
    mockupContent: (
      <div className="w-full h-full bg-[#FFF7ED] p-4 flex flex-col justify-between rounded-sm border-2 border-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <span className="font-black text-xs uppercase text-black flex items-center gap-1.5">
            <Swords className="w-4 h-4 text-[#FB923C]" /> Canlı TKM Düellosu
          </span>
          <span className="text-[10px] font-black uppercase bg-[#4ADE80] text-black px-2 py-0.5 border border-black">
            DÜELLO TAMAMLANDI
          </span>
        </div>
        <div className="flex items-center justify-around py-2">
          <div className="text-center">
            <div className="w-12 h-12 rounded-sm bg-[#FEF08A] border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0_0_#000]">
              ✊
            </div>
            <p className="text-[10px] font-black mt-1 text-black">@alperen_k</p>
          </div>
          <div className="font-black text-sm text-gray-400">VS</div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-sm bg-[#F472B6] border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0_0_#000]">
              ✌️
            </div>
            <p className="text-[10px] font-black mt-1 text-black">@zeynep_s</p>
          </div>
        </div>
        <div className="p-1.5 bg-black text-white text-center text-[10px] font-black uppercase rounded-xs">
          🏆 Zafer: @alperen_k kazandı! (+25 Coin & ⚔️ Düello Rozeti)
        </div>
      </div>
    ),
  },
  {
    id: "slide-agents",
    badge: "03 // OTONOM YAPAY ZEKA",
    badgeBg: "bg-[#F472B6]",
    title: "Kişiselleştirilebilir AI Ajanları",
    subtitle: "Kendi yapay zeka yoldaşlarını tasarla, lobilerde sohbet et.",
    description: "Gemini 2.5 Flash veya OpenAI anahtarınızla özel personası, tonu ve uzmanlığı olan ajanlar yaratın. Ajanlar lobilerde insanlarla birlikte sohbet eder.",
    ctaText: "Ajanları Yönet",
    ctaHref: "/agents",
    accentBg: "bg-[#F472B6]",
    mockupContent: (
      <div className="w-full h-full bg-[#FDF2F8] p-4 flex flex-col justify-between rounded-sm border-2 border-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <span className="font-black text-xs uppercase text-black flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-purple-600" /> Ajan Stüdyosu
          </span>
          <span className="text-[10px] font-black uppercase bg-[#4ADE80] text-black px-2 py-0.5 border border-black">
            AKTİF AJAN
          </span>
        </div>
        <div className="space-y-2 p-2 bg-white border-2 border-black rounded-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#C4B5FD] border border-black flex items-center justify-center text-sm">🤖</div>
            <div>
              <p className="font-black text-xs text-black">NexusAI (Teknoloji Rehberi)</p>
              <p className="text-[10px] font-bold text-gray-500">Gemini 2.5 Flash • Yaratıcı Ton</p>
            </div>
          </div>
          <p className="text-[11px] font-medium text-gray-800 italic bg-gray-50 p-1.5 border border-gray-200">
            "Merhaba! Bugün hangi kodlama projesi üzerinde tartışmak istersiniz?"
          </p>
        </div>
        <div className="flex items-center justify-between text-[10px] font-black uppercase text-black">
          <span>AES-256 Şifreli API Anahtarı</span>
          <span className="text-purple-700">@NexusAI</span>
        </div>
      </div>
    ),
  },
  {
    id: "slide-community",
    badge: "04 // TOPLULUK & GÖREVLER",
    badgeBg: "bg-[#4ADE80]",
    title: "Topluluk Meydanı, Günlük Görevler & 50 Anket",
    subtitle: "Günün anketini oyla, günlük hedefleri tamamla ve coin kazan.",
    description: "Platformun ortak nabzını tutun; 50 farklı topluluk anketine katılın, günlük görevleri tamamlayarak Lobby Coin biriktirin ve modunuza uygun odalara ışınlanın.",
    ctaText: "Topluluk Meydanı",
    ctaHref: "/community",
    accentBg: "bg-[#4ADE80]",
    mockupContent: (
      <div className="w-full h-full bg-[#F0FDF4] p-4 flex flex-col justify-between rounded-sm border-2 border-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <span className="font-black text-xs uppercase text-black flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-600" /> Günün Anketi
          </span>
          <span className="text-[10px] font-black uppercase bg-[#FEF08A] px-2 py-0.5 border border-black">
            180+ OY
          </span>
        </div>
        <div className="space-y-1.5 py-1">
          <div className="p-1.5 bg-white border border-black rounded-xs text-[11px] font-bold flex justify-between">
            <span>🤖 AI Oyun Moderatörlüğü</span>
            <span className="font-mono font-black">42%</span>
          </div>
          <div className="p-1.5 bg-[#4ADE80]/40 border border-black rounded-xs text-[11px] font-black flex justify-between">
            <span>💬 Sürekli Canlı Sohbet</span>
            <span className="font-mono font-black">58%</span>
          </div>
        </div>
        <div className="p-2 bg-[#FEF08A] border-2 border-black text-[10px] font-black uppercase text-center">
          ⚡ Hızlı Işınlayıcı: Tek Tıkla Lobiye Katıl
        </div>
      </div>
    ),
  },
  {
    id: "slide-shop",
    badge: "05 // MAĞAZA & ROZETLER",
    badgeBg: "bg-[#A78BFA]",
    title: "Lobby Coin Mağazası & Rozet Koleksiyonu",
    subtitle: "Görevlerden coin topla; özel çerçeve, unvan ve rozetler satın al.",
    description: "9 özgün hazır avatar, 12 başarım rozeti ve neon çerçeveler! Görev ve düellolardan kazandığınız Lobby Coin'ler ile mağazadan profilinizi özelleştirin.",
    ctaText: "Mağazaya Git",
    ctaHref: "/shop",
    accentBg: "bg-[#A78BFA]",
    mockupContent: (
      <div className="w-full h-full bg-[#FAF5FF] p-4 flex flex-col justify-between rounded-sm border-2 border-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <span className="font-black text-xs uppercase text-black flex items-center gap-1.5">
            <User className="w-4 h-4 text-purple-600" /> Kimlik & Mağaza
          </span>
          <span className="text-[10px] font-black uppercase bg-[#FEF08A] px-2 py-0.5 border border-black">
            🪙 350 LC Bakiye
          </span>
        </div>
        <div className="flex items-center gap-3 py-1">
          <div className="w-12 h-12 rounded-sm border-2 border-black bg-[#FEF08A] flex items-center justify-center text-2xl shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            🐱
          </div>
          <div>
            <p className="font-black text-xs text-black">@GezginKedi</p>
            <p className="text-[10px] font-black uppercase bg-[#4ADE80] px-1.5 py-0.2 border border-black inline-block mt-0.5">
              DURUM: 🚀 Kod yazıyor
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 pt-2 border-t border-black/20 text-[9px] font-black uppercase">
          <span className="px-2 py-0.5 bg-[#FB923C] border border-black">⚔️ DÜELLO USTASI</span>
          <span className="px-2 py-0.5 bg-[#FEF08A] border border-black">👑 LOBİ LİDERİ</span>
        </div>
      </div>
    ),
  },
];

export function FeatureSlider() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  // Autoplay effect (5 seconds, pauses on hover)
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentIdx]);

  return (
    <div 
      className="w-full bg-[#FFFDF5] border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-sm overflow-hidden relative select-none animate-slide-up"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Neo-brutalist top indicator bar with tricolor gradient accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FEF08A] via-[#FB923C] to-[#F472B6]" />

      {/* Slider Viewport with fixed min-height to avoid any layout jump */}
      <div className="w-full overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIdx * 100}%)` }}
        >
          {SLIDES.map((s, idx) => (
            <div 
              key={s.id}
              className="w-full shrink-0 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 p-6 sm:p-8 min-h-[340px] md:min-h-[300px]"
            >
              {/* Left Side: Slide Details */}
              <div className="flex-1 space-y-4 max-w-xl w-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2.5 py-1 text-[11px] font-black uppercase border-2 border-black ${s.badgeBg} text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]`}>
                      {s.badge}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-gray-500">
                      {idx + 1} / {SLIDES.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-black leading-tight">
                      {s.title}
                    </h3>
                    <p className="font-black text-sm text-[#FB923C] uppercase tracking-wide">
                      {s.subtitle}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-gray-700 leading-relaxed line-clamp-3">
                      {s.description}
                    </p>
                  </div>
                </div>

                {/* Action CTA & Navigation buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <Link href={s.ctaHref}>
                    <Button 
                      size="default" 
                      className="bg-black hover:bg-zinc-800 text-white font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_rgba(255,255,255,1)] hover:-translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {s.ctaText} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>

                  {/* Manual Controls (Prev / Next) */}
                  <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                    <button
                      onClick={prevSlide}
                      className="p-2 bg-white hover:bg-[#FEF08A] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer rounded-xs"
                      title="Önceki"
                    >
                      <ChevronLeft className="w-4 h-4 text-black stroke-[3]" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="p-2 bg-white hover:bg-[#FEF08A] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer rounded-xs"
                      title="Sonraki"
                    >
                      <ChevronRight className="w-4 h-4 text-black stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side: Visual Mockup / Visual Container with constant aspect ratio */}
              <div className="w-full md:w-[360px] lg:w-[420px] h-[230px] shrink-0 relative">
                {s.imageSrc ? (
                  <div className="w-full h-full border-3 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] overflow-hidden rounded-sm bg-white">
                    <img 
                      src={s.imageSrc} 
                      alt={s.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    {s.mockupContent}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Dot Indicators */}
      <div className="p-2.5 bg-[#FAF8F0] border-t-2 border-black flex items-center justify-center gap-2">
        {SLIDES.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrentIdx(idx)}
            className={`
              h-2.5 transition-all cursor-pointer border border-black rounded-xs
              ${currentIdx === idx ? "w-8 bg-black shadow-[1px_1px_0_0_rgba(0,0,0,1)]" : "w-2.5 bg-gray-300 hover:bg-gray-400"}
            `}
            title={s.title}
          />
        ))}
      </div>
    </div>
  );
}
