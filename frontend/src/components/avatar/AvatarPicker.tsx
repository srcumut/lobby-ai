// ============================================================================
// TARGET_DESTINATION: frontend/src/components/avatar/AvatarPicker.tsx
// PURPOSE: Reusable Neo-Brutalist Avatar Picker & Preview Component for Users & Agents
// ============================================================================

"use client";

import React, { useState } from "react";
import { Camera, Trash2, Bot, Upload } from "lucide-react";
import { AvatarCropperModal } from "./AvatarCropperModal";
import { AvatarFrame } from "./AvatarFrame";
import { getAvatarUrl } from "@/lib/avatar";

interface AvatarPickerProps {
  currentAvatarUrl?: string | null;
  fallbackText?: string;
  isBot?: boolean;
  onAvatarChanged: (file: File, previewUrl: string) => Promise<void> | void;
  onAvatarRemoved?: () => Promise<void> | void;
  size?: "sm" | "md" | "lg";
  label?: string;
  modalTitle?: string;
  disabled?: boolean;
  borderId?: string | null;
  animationId?: string | null;
}

export function AvatarPicker({
  currentAvatarUrl,
  fallbackText = "U",
  isBot = false,
  onAvatarChanged,
  onAvatarRemoved,
  size = "lg",
  label,
  modalTitle = "Fotoğrafı Belirle",
  disabled = false,
  borderId,
  animationId,
}: AvatarPickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileForModal, setSelectedFileForModal] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const directFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync with currentAvatarUrl updates from parent or backend
  React.useEffect(() => {
    setPreviewUrl(null);
    setImgError(false);
  }, [currentAvatarUrl]);

  const displaySrc = previewUrl || (currentAvatarUrl ? getAvatarUrl(currentAvatarUrl) : null);

  const sizeClasses = {
    sm: "w-16 h-16 text-xl",
    md: "w-24 h-24 text-3xl",
    lg: "w-28 h-28 sm:w-32 sm:h-32 text-4xl sm:text-5xl",
  }[size];

  const handleCropComplete = async (file: File, previewDataUrl: string) => {
    setPreviewUrl(previewDataUrl);
    setImgError(false);
    await onAvatarChanged(file, previewDataUrl);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAvatarRemoved) return;
    setPreviewUrl(null);
    setImgError(false);
    await onAvatarRemoved();
  };

  const handleDirectFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileForModal(file);
      setIsModalOpen(true);
    }
    e.target.value = "";
  };

  const openFilePicker = () => {
    if (disabled) return;
    directFileInputRef.current?.click();
  };

  const handleCloseModal = () => {
    setSelectedFileForModal(null);
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col items-start gap-2.5 select-none">
      {/* Hidden file input for direct device file selection */}
      <input
        ref={directFileInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.jfif,.bmp"
        onChange={handleDirectFileSelect}
        className="hidden"
      />

      {label && (
        <span className="text-xs font-black uppercase tracking-wider text-gray-700">
          {label}
        </span>
      )}

      {/* Avatar Container with Decorative Frame */}
      <div className="relative group">
        <AvatarFrame borderId={borderId} animationId={animationId} size={size}>
          {/* Avatar Circle Container */}
          <div
            onClick={openFilePicker}
            className={`${sizeClasses} rounded-full brutal-border border-4 overflow-hidden bg-[#FEF08A] flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] cursor-pointer relative transition-transform group-hover:scale-105`}
            title="Fotoğraf seçmek için tıklayın"
          >
            {displaySrc && !imgError ? (
              <img
                src={displaySrc}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : isBot ? (
              <Bot className="w-1/2 h-1/2 text-black" />
            ) : (
              <span className="font-black uppercase text-black">
                {fallbackText.charAt(0).toUpperCase()}
              </span>
            )}

            {/* Hover Overlay with Camera Icon */}
            {!disabled && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 z-10">
                <Camera className="w-6 h-6 text-white" />
                <span className="text-[10px] font-black uppercase tracking-tight text-white">Yükle</span>
              </div>
            )}
          </div>
        </AvatarFrame>

        {/* Quick Upload Floating Camera Badge */}
        {!disabled && (
          <button
            type="button"
            onClick={openFilePicker}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer z-20 transition-transform hover:scale-110 active:scale-95"
            title="Bilgisayardan fotoğraf yükle"
          >
            <Camera className="w-4 h-4 text-black" />
          </button>
        )}
      </div>

      {/* Buttons: High-Contrast Neo-Brutalist Change & Remove Buttons */}
      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          disabled={disabled}
          onClick={openFilePicker}
          className="avatar-picker-action-btn flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#FEF08A] hover:bg-[#FDE047] !text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-px active:translate-y-0 transition-all cursor-pointer rounded-xs shrink-0"
        >
          <Camera className="w-3.5 h-3.5 text-black shrink-0" />
          <span className="!text-black">{displaySrc ? "Fotoğrafı Değiştir" : "Fotoğraf Yükle"}</span>
        </button>

        {displaySrc && onAvatarRemoved && (
          <button
            type="button"
            disabled={disabled}
            onClick={handleRemove}
            className="avatar-picker-remove-btn flex items-center justify-center p-1.5 bg-[#FCA5A5] hover:bg-[#F87171] !text-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-px active:translate-y-0 transition-all cursor-pointer rounded-xs shrink-0"
            title="Fotoğrafı Kaldır"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-950 shrink-0" />
          </button>
        )}
      </div>

      {/* Cropper Modal */}
      <AvatarCropperModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCropComplete={handleCropComplete}
        title={modalTitle}
        initialImageUrl={null}
        initialFile={selectedFileForModal}
      />
    </div>
  );
}
