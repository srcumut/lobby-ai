"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { lobbiesApi, CreateLobbyRequest } from "@/lib/api/lobbies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Globe, Plus, Loader2 } from "lucide-react";

interface CreateLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateLobbyModal({ isOpen, onClose }: CreateLobbyModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      const request: CreateLobbyRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        is_private: isPrivate,
        password: isPrivate ? password : undefined,
      };

      const created = await lobbiesApi.createLobby(request);
      setName("");
      setDescription("");
      setIsPrivate(false);
      setPassword("");
      onClose();
      router.push(`/lobby/${created.id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.message ||
        "Lobi oluşturulamadı. Lütfen tekrar deneyin."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-sm p-6">
        <DialogHeader className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-[#4ADE80] border-2 border-black px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider w-fit shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <Plus className="w-3.5 h-3.5 stroke-[3]" /> YENİ ODA
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            Lobi Oluştur
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm font-bold text-gray-600">
            Gerçek zamanlı sohbetler, arkadaşlarınız ve otonom yapay zeka ajanları için yeni bir alan başlatın.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-[#FFE4E6] text-black border-2 border-black p-3 rounded-sm text-xs font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2" autoComplete="off">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-black block">
              Lobi Adı *
            </label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ör. Yapay Zeka Sohbet Odası"
              maxLength={64}
              autoComplete="off"
              className="border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_rgba(0,0,0,1)] font-bold text-sm bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-black block">
              Açıklama (İsteğe Bağlı)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bu lobi ne hakkında?"
              maxLength={255}
              autoComplete="off"
              className="border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_rgba(0,0,0,1)] font-bold text-sm bg-white"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="text-xs font-black uppercase tracking-wider text-black block">
              Oda Gizliliği
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex items-center gap-2 p-2.5 border-2 border-black rounded-sm font-black text-xs uppercase transition-all cursor-pointer ${
                  !isPrivate
                    ? "bg-[#FEF08A] shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-y-0.5"
                    : "bg-gray-50 hover:bg-gray-100 shadow-[1px_1px_0_0_rgba(0,0,0,1)] opacity-70"
                }`}
              >
                <Globe className="w-4 h-4 text-black shrink-0" />
                <span>Herkese Açık</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-center gap-2 p-2.5 border-2 border-black rounded-sm font-black text-xs uppercase transition-all cursor-pointer ${
                  isPrivate
                    ? "bg-[#FEF08A] shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-y-0.5"
                    : "bg-gray-50 hover:bg-gray-100 shadow-[1px_1px_0_0_rgba(0,0,0,1)] opacity-70"
                }`}
              >
                <Lock className="w-4 h-4 text-black shrink-0" />
                <span>Özel (Şifreli)</span>
              </button>
            </div>
          </div>

          {isPrivate && (
            <div className="space-y-1.5 pt-1 animate-slide-down">
              <label className="text-xs font-black uppercase tracking-wider text-black block">
                Giriş Şifresi *
              </label>
              <Input
                type="password"
                required={isPrivate}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Giriş için şifre belirleyin"
                autoComplete="off"
                className="border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_rgba(0,0,0,1)] font-bold text-sm bg-white"
              />
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t-2 border-dashed border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-2 border-black font-black text-xs uppercase h-10 px-4 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="bg-[#4ADE80] hover:bg-[#22c55e] text-black border-2 border-black font-black text-xs uppercase tracking-wider h-10 px-6 shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Oluşturuluyor...
                </>
              ) : (
                "+ Lobi Oluştur"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
