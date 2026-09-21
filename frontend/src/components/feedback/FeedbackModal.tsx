// ============================================================================
// TARGET_DESTINATION: frontend/src/components/feedback/FeedbackModal.tsx
// PURPOSE: Neo-Brutalist interactive feedback and bug reporting modal
// ============================================================================

"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { playWinSound, playPointSound } from "@/lib/arcadeSounds";
import { 
  MessageSquarePlus, 
  X, 
  Bug, 
  Lightbulb, 
  Palette, 
  MessageCircle, 
  Send, 
  CheckCircle2,
  Sparkles
} from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = "bug" | "idea" | "design" | "other";

const FEEDBACK_TYPES: { id: FeedbackType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "idea", label: "Yeni Fikir / Öneri", icon: <Lightbulb className="w-4 h-4 text-black" />, color: "bg-[#FEF08A]" },
  { id: "bug", label: "Hata Bildirimi", icon: <Bug className="w-4 h-4 text-black" />, color: "bg-[#F87171]" },
  { id: "design", label: "Tasarım & Deneyim", icon: <Palette className="w-4 h-4 text-black" />, color: "bg-[#F472B6]" },
  { id: "other", label: "Genel Düşünce", icon: <MessageCircle className="w-4 h-4 text-black" />, color: "bg-[#4ADE80]" },
];

const MOODS = [
  { value: 5, emoji: "🔥", label: "Efsane" },
  { value: 4, emoji: "😊", label: "Çok İyi" },
  { value: 3, emoji: "😐", label: "Orta" },
  { value: 2, emoji: "🧐", label: "Eksikler Var" },
  { value: 1, emoji: "🛠️", label: "Gelişmeli" },
];

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<FeedbackType>("idea");
  const [mood, setMood] = useState<number>(5);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.add({
        title: "Eksik Mesaj",
        description: "Lütfen geri bildiriminizi açıklayan kısa bir mesaj yazın.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate submission & persist locally
      const feedbackRecord = {
        id: `fb-${Date.now()}`,
        type,
        mood,
        message: message.trim(),
        email: email.trim() || user?.email || "anonim",
        username: user?.username || "Gezgin",
        createdAt: new Date().toISOString(),
      };

      const existing = JSON.parse(localStorage.getItem("lobby-ai:feedback-log") || "[]");
      existing.push(feedbackRecord);
      localStorage.setItem("lobby-ai:feedback-log", JSON.stringify(existing));

      playWinSound();
      setIsSuccess(true);
      toast.add({
        title: "Geri Bildiriminiz Alındı! 🚀",
        description: "Değerli katkınız için çok teşekkür ederiz!",
        type: "success",
      });

      setTimeout(() => {
        setIsSuccess(false);
        setMessage("");
        onClose();
      }, 1500);
    } catch (err) {
      toast.add({
        title: "Gönderilemedi",
        description: "Bir hata oluştu, lütfen tekrar deneyin.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#FAF8F0] border-3 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-sm overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#FEF08A] border-b-3 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <MessageSquarePlus className="w-4 h-4 text-black" />
            </span>
            <h3 className="font-black text-lg uppercase tracking-tight text-black">
              Geri Bildirim & Öneri
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-white hover:bg-black hover:text-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all rounded-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-[#4ADE80] border-3 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
              <CheckCircle2 className="w-10 h-10 text-black" />
            </div>
            <h4 className="font-black text-xl uppercase text-black">Teşekkür Ederiz!</h4>
            <p className="font-bold text-xs text-gray-700 max-w-sm mx-auto">
              Geri bildiriminiz başarıyla iletildi. Lobby AI'ı sizin görüşlerinizle büyütüyoruz!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Category Selectors */}
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1.5">
                Konu Türü
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FEEDBACK_TYPES.map((t) => {
                  const isSelected = type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        playPointSound();
                        setType(t.id);
                      }}
                      className={`
                        flex items-center gap-2 p-2.5 border-2 border-black rounded-sm font-black text-xs transition-all cursor-pointer text-left
                        ${isSelected 
                          ? `${t.color} text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] translate-x-0.5 translate-y-0.5` 
                          : "bg-white text-black/80 hover:bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-px"}
                      `}
                    >
                      {t.icon}
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience Rating */}
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1.5">
                Platform Deneyimin Nasıl?
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {MOODS.map((m) => {
                  const isSelected = mood === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => {
                        playPointSound();
                        setMood(m.value);
                      }}
                      className={`
                        p-2 border-2 border-black rounded-sm flex flex-col items-center gap-0.5 transition-all cursor-pointer
                        ${isSelected 
                          ? "bg-[#FEF08A] shadow-[2px_2px_0_0_rgba(0,0,0,1)] scale-105" 
                          : "bg-white hover:bg-gray-100 shadow-[1px_1px_0_0_rgba(0,0,0,1)]"}
                      `}
                      title={m.label}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-[9px] font-black uppercase truncate text-black">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Area */}
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1.5">
                Düşüncelerin veya Karşılaştığın Sorun
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Örn: 'Lobide anket açarken şu özellik de olsa harika olurdu...' veya 'Şu butona bastığımda hata aldım...'"
                className="w-full p-3 bg-white border-2 border-black rounded-sm text-xs font-bold text-black focus:outline-hidden focus:shadow-[2px_2px_0_0_rgba(0,0,0,1)] resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t-2 border-black/20">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="font-black text-xs uppercase border-2 border-black bg-white hover:bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#FB923C] hover:bg-[#F97316] text-black font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? "Gönderiliyor..." : "Geri Bildirimi Gönder"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
