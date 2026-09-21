"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, BarChart2, Clock, CheckSquare } from "lucide-react";
import { pollsApi, Poll } from "@/lib/api/polls";
import { toast } from "@/components/ui/toast";

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  lobbyId: string;
  onPollCreated?: (poll: Poll) => void;
}

const DURATION_OPTIONS = [
  { label: "Süresiz", value: null },
  { label: "15 Dakika", value: 15 },
  { label: "1 Saat", value: 60 },
  { label: "24 Saat", value: 1440 },
];

export function CreatePollModal({
  isOpen,
  onClose,
  lobbyId,
  onPollCreated,
}: CreatePollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || trimmedQuestion.length < 3) {
      toast.add({
        title: "Eksik Bilgi",
        description: "Anket sorusu en az 3 karakter olmalıdır.",
        type: "error",
      });
      return;
    }

    const cleanedOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanedOptions.length < 2) {
      toast.add({
        title: "Eksik Bilgi",
        description: "En az 2 geçerli seçenek girmelisiniz.",
        type: "error",
      });
      return;
    }

    // Check duplicates
    const uniqueOptions = new Set(cleanedOptions.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== cleanedOptions.length) {
      toast.add({
        title: "Tekrarlanan Seçenek",
        description: "Seçenekler birbirinden farklı olmalıdır.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const poll = await pollsApi.createPoll(lobbyId, {
        question: trimmedQuestion,
        options: cleanedOptions,
        is_multiple_choice: isMultipleChoice,
        duration_minutes: durationMinutes,
      });

      toast.add({
        title: "Anket Başlatıldı",
        description: "Anket başarıyla oluşturuldu ve odaya duyuruldu!",
        type: "success",
      });

      // Reset form
      setQuestion("");
      setOptions(["", ""]);
      setIsMultipleChoice(false);
      setDurationMinutes(null);

      onPollCreated?.(poll);
      onClose();
    } catch (err: any) {
      toast.add({
        title: "Hata",
        description: err.response?.data?.error?.message || "Anket oluşturulamadı.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-[#FEF08A] border-4 border-black brutal-shadow p-6 text-black">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-black" />
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              YENİ ANKET OLUŞTUR
            </DialogTitle>
          </div>
          <DialogDescription className="font-bold text-black/75">
            Lobi üyelerinin anlık olarak oy verebileceği canlı bir anket başlatın.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2" autoComplete="off">
          {/* Soru */}
          <div className="space-y-1">
            <Label className="font-black text-xs uppercase tracking-wider text-black">
              Anket Sorusu
            </Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Örn: Bu akşam hangi oyunu oynuyoruz?"
              autoComplete="off"
              className="bg-white brutal-border border-2 font-bold text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-visible:ring-0"
              maxLength={255}
              required
            />
          </div>

          {/* Seçenekler */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="font-black text-xs uppercase tracking-wider text-black">
                Seçenekler ({options.length}/6)
              </Label>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-black bg-white hover:bg-[#4ADE80] border-2 border-black px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <Plus className="w-3.5 h-3.5" /> Seçenek Ekle
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center font-black text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <Input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Seçenek ${idx + 1}`}
                    autoComplete="off"
                    className="flex-1 bg-white brutal-border border-2 font-bold text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-sm h-9"
                    maxLength={200}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="w-8 h-8 bg-white hover:bg-red-200 border-2 border-black rounded-sm flex items-center justify-center text-red-600 shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer"
                      title="Seçeneği Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Çoklu Oy & Süre Ayarları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Çoklu Seçim Toggle */}
            <div
              onClick={() => setIsMultipleChoice(!isMultipleChoice)}
              className="flex items-center gap-2.5 p-2.5 bg-white border-2 border-black rounded-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer select-none hover:bg-gray-50"
            >
              <div
                className={`w-5 h-5 rounded-sm border-2 border-black flex items-center justify-center font-black text-xs ${
                  isMultipleChoice ? "bg-[#4ADE80] text-black" : "bg-white"
                }`}
              >
                {isMultipleChoice && <CheckSquare className="w-3.5 h-3.5" />}
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xs text-black">Çoklu Seçim</span>
                <span className="text-[10px] text-gray-500 font-bold">Birden fazla oy</span>
              </div>
            </div>

            {/* Süre Sınırı */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 font-black text-xs uppercase text-black">
                <Clock className="w-3.5 h-3.5" /> Süre Sınırı
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {DURATION_OPTIONS.map((dur) => (
                  <button
                    key={String(dur.value)}
                    type="button"
                    onClick={() => setDurationMinutes(dur.value)}
                    className={`py-1 px-1.5 text-xs font-black border-2 border-black rounded-sm transition-all shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer ${
                      durationMinutes === dur.value
                        ? "bg-[#FB923C] text-black font-extrabold"
                        : "bg-white hover:bg-gray-100 text-black"
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-white hover:bg-gray-100 text-black font-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#4ADE80] hover:bg-[#22C55E] text-black font-black border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
            >
              {isSubmitting ? "Oluşturuluyor..." : "Anketi Başlat 🚀"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
