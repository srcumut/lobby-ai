// ============================================================================
// TARGET_DESTINATION: frontend/src/components/avatar/AvatarCropperModal.tsx
// PURPOSE: Interactive Neo-Brutalist Avatar Cropper with Zoom in/out, Pan & Computer File Upload
// ============================================================================

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  UploadCloud, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Check, 
  Move, 
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AvatarCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File, previewDataUrl: string) => Promise<void> | void;
  title?: string;
  initialImageUrl?: string | null;
  initialFile?: File | null;
}

const VIEWPORT_SIZE = 280; // Size of the interactive square canvas viewport (px)
const CIRCLE_DIAMETER = 220; // Diameter of the avatar circular cutout (px)
const OUTPUT_SIZE = 512; // High-resolution output canvas size (512x512)

export function AvatarCropperModal({
  isOpen,
  onClose,
  onCropComplete,
  title = "Fotoğrafı Kırp ve Hizala",
  initialImageUrl,
  initialFile,
}: AvatarCropperModalProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setImageSrc(null);
    setSelectedFile(null);
    setNaturalSize(null);
    setZoom(1.0);
    setOffset({ x: 0, y: 0 });
    setErrorMessage(null);
    setIsProcessing(false);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  }, [onClose]);

  // Handle escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const handleResetToDropzone = () => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setImageSrc(null);
    setSelectedFile(null);
    setNaturalSize(null);
    setZoom(1.0);
    setOffset({ x: 0, y: 0 });
    setErrorMessage(null);
    setIsProcessing(false);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loadFile = useCallback((file: File) => {
    setErrorMessage(null);

    // Validate type with file extension fallback for Windows
    const isImage = 
      file.type.startsWith("image/") || 
      /\.(png|jpe?g|webp|gif|bmp|avif|jfif)$/i.test(file.name);

    if (!isImage) {
      setErrorMessage("Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WebP, GIF).");
      return;
    }

    // Validate size (10 MB local file limit)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Görsel çok büyük. Lütfen 10MB altı bir dosya seçin.");
      return;
    }

    setSelectedFile(file);

    // Revoke previous blob URL if exists
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      activeBlobUrlRef.current = objectUrl;
      setImageSrc(objectUrl);
      setNaturalSize(null);
      setZoom(1.0);
      setOffset({ x: 0, y: 0 });
    } catch {
      // Fallback to FileReader if createObjectURL fails
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImageSrc(dataUrl);
        setNaturalSize(null);
        setZoom(1.0);
        setOffset({ x: 0, y: 0 });
      };
      reader.onerror = () => {
        setErrorMessage("Seçilen görsel okunamadı. Lütfen tekrar deneyin.");
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Initialize or reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1.0);
      setOffset({ x: 0, y: 0 });
      setErrorMessage(null);
      setIsProcessing(false);

      if (initialFile) {
        loadFile(initialFile);
      } else if (initialImageUrl && !imageSrc) {
        setImageSrc(initialImageUrl);
      }
    } else {
      // Reset when modal closes
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
      setImageSrc(null);
      setSelectedFile(null);
      setNaturalSize(null);
      setErrorMessage(null);
      setIsProcessing(false);
    }
  }, [isOpen, initialFile, initialImageUrl, loadFile]);

  // Handle image file selection from local disk
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadFile(file);
    }
    e.target.value = "";
  };

  // Drag and drop handlers for upload box
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  // Image load event to obtain natural dimensions
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setZoom(1.0);
    setOffset({ x: 0, y: 0 });
  };

  // Base scale calculation: image must at least cover the circular crop area
  const getBaseScale = useCallback(() => {
    const w = naturalSize?.width || imageElementRef.current?.naturalWidth || CIRCLE_DIAMETER;
    const h = naturalSize?.height || imageElementRef.current?.naturalHeight || CIRCLE_DIAMETER;
    const scaleX = CIRCLE_DIAMETER / w;
    const scaleY = CIRCLE_DIAMETER / h;
    return Math.max(scaleX, scaleY);
  }, [naturalSize]);

  // Current display dimensions (guaranteed > 0)
  const effectiveScale = getBaseScale() * zoom;
  const currentNaturalWidth = naturalSize?.width || imageElementRef.current?.naturalWidth || CIRCLE_DIAMETER;
  const currentNaturalHeight = naturalSize?.height || imageElementRef.current?.naturalHeight || CIRCLE_DIAMETER;
  const displayWidth = currentNaturalWidth * effectiveScale;
  const displayHeight = currentNaturalHeight * effectiveScale;

  // Max translation boundaries so the crop circle stays filled
  const maxOffsetX = Math.max(0, (displayWidth - CIRCLE_DIAMETER) / 2);
  const maxOffsetY = Math.max(0, (displayHeight - CIRCLE_DIAMETER) / 2);

  const clampOffset = (ox: number, oy: number) => {
    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, ox)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, oy)),
    };
  };

  // Mouse & touch panning logic
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newOx = e.clientX - dragStart.x;
    const newOy = e.clientY - dragStart.y;
    setOffset(clampOffset(newOx, newOy));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if capture was already lost
    }
  };

  // Mouse wheel zoom inside crop box
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setZoom((prev) => {
      const next = Math.max(1.0, Math.min(4.0, prev + delta));
      return Number(next.toFixed(2));
    });
  };

  // Option 1: Direct upload without cropping (fast & original)
  const handleUploadOriginal = async () => {
    if (!selectedFile && !imageSrc) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (selectedFile) {
        await onCropComplete(selectedFile, imageSrc || "");
      } else if (imageSrc) {
        const res = await fetch(imageSrc);
        const blob = await res.blob();
        const file = new File([blob], `avatar_${Date.now()}.png`, { type: blob.type || "image/png" });
        await onCropComplete(file, imageSrc);
      }
      handleClose();
    } catch (err: any) {
      console.error("Direct upload error:", err);
      setErrorMessage(err.response?.data?.error?.message || err.message || "Yükleme başarısız oldu.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Option 2: Apply crop & export canvas
  const handleApplyCrop = async () => {
    const img = imageElementRef.current;
    if (!img) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas 2D context oluşturulamadı.");
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const scaleMultiplier = OUTPUT_SIZE / CIRCLE_DIAMETER;
      const outW = displayWidth * scaleMultiplier;
      const outH = displayHeight * scaleMultiplier;
      const outX = OUTPUT_SIZE / 2 + offset.x * scaleMultiplier - outW / 2;
      const outY = OUTPUT_SIZE / 2 + offset.y * scaleMultiplier - outH / 2;

      ctx.drawImage(img, outX, outY, outW, outH);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else canvas.toBlob((pngBlob) => resolve(pngBlob), "image/png");
          },
          "image/png"
        );
      });

      if (!blob) {
        throw new Error("Kırpılan görsel işlenemedi.");
      }

      const croppedFile = new File([blob], `avatar_${Date.now()}.png`, {
        type: "image/png",
      });

      const previewDataUrl = canvas.toDataURL("image/png");

      await onCropComplete(croppedFile, previewDataUrl);
      handleClose();
    } catch (err: any) {
      console.error("Avatar crop export error:", err);
      setErrorMessage(err.response?.data?.error?.message || err.message || "Görsel işlenirken hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleClose}
    >
      {/* Hidden file input safely outside the clickable dropzone to prevent event bubbling */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.jfif,.bmp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div 
        className="w-full max-w-lg max-h-[92vh] bg-white brutal-border border-4 brutal-shadow rounded-none flex flex-col overflow-hidden text-black animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#FEF08A] border-b-4 border-black p-3.5 sm:p-4 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">{title}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black font-black hover:bg-[#F87171] hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px"
            aria-label="Kapat"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable to guarantee accessibility on all screen sizes */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="bg-[#FECACA] border-2 border-black p-3 text-xs font-bold text-red-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              {errorMessage}
            </div>
          )}

          {!imageSrc ? (
            // State A: File Upload Dropzone
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-4 border-dashed p-8 sm:p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-center group ${
                isDragOver 
                  ? "border-blue-600 bg-blue-50 scale-[0.99]" 
                  : "border-black bg-[#F3F4F6] hover:bg-[#E5E7EB]"
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-[#A78BFA] border-3 border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)] group-hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-black uppercase text-base sm:text-lg tracking-wide text-black">
                  Bilgisayardan Fotoğraf Seç
                </p>
                <p className="text-xs font-bold text-gray-600 mt-1">
                  veya görseli sürükleyip bu alana bırakın
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold bg-white px-2.5 py-1 border-2 border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] mt-2">
                PNG, JPG, WEBP, GIF (MAX 10MB)
              </span>
            </div>
          ) : (
            // State B: Interactive Crop & Framing Viewport
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                {/* Crop Viewport */}
                <div
                  ref={containerRef}
                  onWheel={handleWheel}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
                  className={`relative overflow-hidden bg-neutral-900 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] select-none touch-none ${
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  }`}
                >
                  {/* The Image Element */}
                  <img
                    ref={imageElementRef}
                    src={imageSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    onError={() => {
                      setErrorMessage("Görsel yüklenemedi. Lütfen geçerli bir görsel dosyası seçin.");
                    }}
                    draggable={false}
                    style={{
                      position: "absolute",
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`,
                      left: `${VIEWPORT_SIZE / 2 + offset.x - displayWidth / 2}px`,
                      top: `${VIEWPORT_SIZE / 2 + offset.y - displayHeight / 2}px`,
                      maxWidth: "none",
                      maxHeight: "none",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Darkened Circular Cutout Mask Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.65)`,
                      borderRadius: "50%",
                      width: `${CIRCLE_DIAMETER}px`,
                      height: `${CIRCLE_DIAMETER}px`,
                      left: `${(VIEWPORT_SIZE - CIRCLE_DIAMETER) / 2}px`,
                      top: `${(VIEWPORT_SIZE - CIRCLE_DIAMETER) / 2}px`,
                      border: "3px dashed #FFF",
                    }}
                  />

                  {/* Move indicator helper */}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1 pointer-events-none border border-white/50">
                    <Move className="w-3 h-3" /> Konumu Değiştir
                  </div>
                </div>

                {/* Helper text */}
                <span className="text-[11px] font-bold text-gray-500 mt-2 uppercase tracking-wide text-center">
                  Tekerlek veya kaydırıcı ile yakınlaştırın. Görseli sürükleyerek hizalayın.
                </span>
              </div>

              {/* Controls: Zoom slider, Zoom In/Out, Reset */}
              <div className="bg-[#F3F4F6] p-3.5 sm:p-4 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5 text-blue-600" /> Yakınlaştırma: {zoom.toFixed(1)}x
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1.0);
                      setOffset({ x: 0, y: 0 });
                    }}
                    className="text-[11px] font-black uppercase flex items-center gap-1 text-gray-700 hover:text-black hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Sıfırla
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setZoom((z: number) => Math.max(1.0, Number((z - 0.2).toFixed(1))))}
                    disabled={zoom <= 1.0}
                    className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center font-black hover:bg-gray-100 disabled:opacity-40 cursor-pointer shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
                    title="Uzaklaştır"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min="1.0"
                    max="4.0"
                    step="0.05"
                    value={zoom}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-black h-2 bg-white border border-black cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => setZoom((z: number) => Math.min(4.0, Number((z + 0.2).toFixed(1))))}
                    disabled={zoom >= 4.0}
                    className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center font-black hover:bg-gray-100 disabled:opacity-40 cursor-pointer shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
                    title="Yakınlaştır"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-black/10">
                  <button
                    type="button"
                    onClick={handleResetToDropzone}
                    className="text-xs font-black uppercase text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Farklı Görsel Seç / Geri Dön
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#E5E7EB] border-t-4 border-black p-3.5 sm:p-4 flex items-center justify-between gap-2 select-none shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="bg-white text-black border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer"
          >
            Vazgeç
          </Button>

          {imageSrc && (
            <div className="flex items-center gap-2">
              {selectedFile && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUploadOriginal}
                  disabled={isProcessing}
                  className="bg-white hover:bg-gray-100 text-black border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer hidden sm:flex items-center gap-1"
                  title="Görseli kırpmadan orijinal haliyle doğrudan yükleyin"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Orijinalini Yükle
                </Button>
              )}

              <Button
                type="button"
                onClick={handleApplyCrop}
                disabled={isProcessing}
                className="bg-[#4ADE80] text-black border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-[#22c55e] cursor-pointer flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Kırp & Kaydet
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
