// ============================================================================
// TARGET_DESTINATION: frontend/src/components/moderation/ReportUserModal.tsx
// PURPOSE: Neo-Brutalist user reporting dialog for lobby members & profiles
// ============================================================================

"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { getAvatarUrl } from "@/lib/avatar";
import { 
  ShieldAlert, 
  X, 
  AlertTriangle, 
  Flag, 
  Send, 
  UserX,
  MessageSquareWarning,
  EyeOff,
  HelpCircle
} from "lucide-react";

interface TargetUserInfo {
  id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: TargetUserInfo | null;
  lobbyId?: string;
}

const REPORT_REASONS = [
  { id: "harassment", label: "Taciz / Hakaret / Nefret Söylemi", icon: <UserX className="w-4 h-4 text-red-600" /> },
  { id: "spam", label: "Spam / İstenmeyen Reklam / Dolandırıcılık", icon: <MessageSquareWarning className="w-4 h-4 text-amber-600" /> },
  { id: "inappropriate", label: "Uygunsuz Profil, Avatar veya Mesaj", icon: <EyeOff className="w-4 h-4 text-pink-600" /> },
  { id: "griefing", label: "Oyun / Düello Bozgunculuğu veya Hile", icon: <AlertTriangle className="w-4 h-4 text-purple-600" /> },
  { id: "other", label: "Diğer Kural İhlali", icon: <HelpCircle className="w-4 h-4 text-blue-600" /> },
];

export function ReportUserModal({
  isOpen,
  onClose,
  targetUser,
  lobbyId,
}: ReportUserModalProps) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState("harassment");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Record report in localStorage and mock server dispatch
      const reportItem = {
        id: `rep-${Date.now()}`,
        reporterId: user?.id,
        reporterUsername: user?.username,
        targetUserId: targetUser.id,
        targetUsername: targetUser.username,
        lobbyId: lobbyId || null,
        reason: selectedReason,
        description: description.trim(),
        createdAt: new Date().toISOString(),
      };

      const existing = JSON.parse(localStorage.getItem("lobby-ai:user-reports") || "[]");
      existing.push(reportItem);
      localStorage.setItem("lobby-ai:user-reports", JSON.stringify(existing));

      toast.add({
        title: "Şikayetiniz Alındı 🛡️",
        description: `@${targetUser.username} hakkındaki bildiriminiz moderasyon ekibine iletildi.`,
        type: "success",
      });

      setDescription("");
      onClose();
    } catch (err) {
      toast.add({
        title: "Hata Oluştu",
        description: "Şikayet gönderilirken bir sorun yaşandı.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#FAF8F0] border-3 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-sm overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-[#FFE4E6] border-b-3 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </span>
            <h3 className="font-black text-lg uppercase tracking-tight text-black">
              Kullanıcıyı Şikayet Et
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-white hover:bg-black hover:text-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all rounded-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target User Summary Card */}
          <div className="flex items-center gap-3 p-3 bg-white border-2 border-black rounded-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <div className="w-10 h-10 rounded-full border-2 border-black bg-[#FB923C] flex items-center justify-center overflow-hidden font-black text-xs text-white shrink-0">
              {targetUser.avatar_url ? (
                <img
                  src={getAvatarUrl(targetUser.avatar_url)}
                  alt={targetUser.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                targetUser.username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-xs text-black truncate">
                {targetUser.display_name || targetUser.username}
              </p>
              <p className="font-bold text-[10px] text-gray-500 truncate">
                @{targetUser.username}
              </p>
            </div>
            <span className="px-2 py-0.5 bg-[#FEF08A] border border-black text-[9px] font-black uppercase">
              BİLDİRİLEN
            </span>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-black uppercase text-black mb-1.5">
              Şikayet Sebebi
            </label>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReason(r.id)}
                    className={`
                      w-full flex items-center gap-2.5 p-2.5 border-2 border-black rounded-sm font-bold text-xs transition-all cursor-pointer text-left
                      ${isSelected 
                        ? "bg-[#FEF08A] text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] translate-x-0.5" 
                        : "bg-white hover:bg-gray-50 shadow-[1px_1px_0_0_rgba(0,0,0,1)]"}
                    `}
                  >
                    {r.icon}
                    <span className="flex-1 text-black truncate">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Explanation */}
          <div>
            <label className="block text-xs font-black uppercase text-black mb-1.5">
              Ek Açıklama (İsteğe Bağlı)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Olayla ilgili detayları yazabilirsiniz..."
              className="w-full p-2.5 bg-white border-2 border-black rounded-sm text-xs font-bold text-black focus:outline-hidden focus:shadow-[2px_2px_0_0_rgba(0,0,0,1)] resize-none"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t-2 border-black/20">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="font-black text-xs uppercase border-2 border-black bg-white hover:bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Flag className="w-3.5 h-3.5" />
              {isSubmitting ? "Bildiriliyor..." : "Şikayeti Bildir"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
