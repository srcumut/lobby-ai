// ============================================================================
// TARGET_DESTINATION: frontend/src/components/avatar/AvatarPicker.tsx
// PURPOSE: Reusable Neo-Brutalist Avatar Picker & Preview Component for Users & Agents
// ============================================================================

"use client";

import React, { useState } from "react";
import { Camera, Trash2, Bot, User, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarCropperModal } from "./AvatarCropperModal";
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
}

export function AvatarPicker({
  currentAvatarUrl,
  fallbackText = "U",
  isBot = false,
  onAvatarChanged,
  onAvatarRemoved,
  size = "lg",
  label = "Profile Avatar",
  modalTitle = "Set Avatar",
  disabled = false,
}: AvatarPickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const displaySrc = previewUrl || (currentAvatarUrl ? getAvatarUrl(currentAvatarUrl) : null);

  const sizeClasses = {
    sm: "w-16 h-16 text-xl",
    md: "w-24 h-24 text-3xl",
    lg: "w-32 h-32 text-5xl",
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

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {label && (
        <span className="text-xs font-black uppercase tracking-wider text-gray-700">
          {label}
        </span>
      )}

      <div className="relative group">
        {/* Avatar Circle Container */}
        <div
          onClick={() => !disabled && setIsModalOpen(true)}
          className={`${sizeClasses} rounded-full brutal-border border-4 overflow-hidden bg-[#FEF08A] flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] cursor-pointer relative transition-transform group-hover:scale-105`}
          title="Click to change avatar"
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
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
              <Camera className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tight">Upload</span>
            </div>
          )}
        </div>

        {/* Quick Upload Floating Badge */}
        {!disabled && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#60A5FA] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-[#3b82f6] cursor-pointer"
            title="Upload image from computer"
          >
            <Upload className="w-3.5 h-3.5 text-black" />
          </button>
        )}
      </div>

      {/* Buttons: Change & Remove */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer"
        >
          <Camera className="w-3 h-3 mr-1" />
          {displaySrc ? "Change Photo" : "Upload Photo"}
        </Button>

        {displaySrc && onAvatarRemoved && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={handleRemove}
            className="bg-[#FEE2E2] text-red-900 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-red-200 cursor-pointer"
            title="Remove avatar"
          >
            <Trash2 className="w-3 h-3 text-red-600" />
          </Button>
        )}
      </div>

      {/* Cropper Modal */}
      <AvatarCropperModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCropComplete={handleCropComplete}
        title={modalTitle}
        initialImageUrl={displaySrc}
      />
    </div>
  );
}
