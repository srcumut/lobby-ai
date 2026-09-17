// ============================================================================
// TARGET_DESTINATION: frontend/src/components/avatar/AvatarCropperModal.tsx
// PURPOSE: Interactive Neo-Brutalist Avatar Cropper with Zoom in/out, Pan & Computer File Upload
// ============================================================================

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  X, 
  UploadCloud, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Check, 
  Move, 
  Image as ImageIcon,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AvatarCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File, previewDataUrl: string) => Promise<void> | void;
  title?: string;
  initialImageUrl?: string | null;
}

const VIEWPORT_SIZE = 320; // Size of the interactive square canvas viewport (px)
const CIRCLE_DIAMETER = 250; // Diameter of the avatar circular cutout (px)
const CROP_RADIUS = CIRCLE_DIAMETER / 2;
const OUTPUT_SIZE = 512; // High-resolution output canvas size (512x512)

export function AvatarCropperModal({
  isOpen,
  onClose,
  onCropComplete,
  title = "Adjust Avatar",
  initialImageUrl,
}: AvatarCropperModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize or reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1.0);
      setOffset({ x: 0, y: 0 });
      setErrorMessage(null);
      setIsProcessing(false);
      if (initialImageUrl && !imageSrc) {
        // If initial image exists, start with it
        setImageSrc(initialImageUrl);
      }
    } else {
      // Reset when modal closes
      setImageSrc(null);
      setNaturalSize(null);
      setErrorMessage(null);
    }
  }, [isOpen, initialImageUrl]);

  // Handle image file selection from local disk
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFile(file);
  };

  const loadFile = (file: File) => {
    setErrorMessage(null);

    // Validate type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, WebP, GIF).");
      return;
    }

    // Validate size (10 MB local file limit)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image file is too large. Please select an image under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageSrc(dataUrl);
      setZoom(1.0);
      setOffset({ x: 0, y: 0 });
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read the selected file from disk.");
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers for upload box
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
    if (!naturalSize) return 1;
    const scaleX = CIRCLE_DIAMETER / naturalSize.width;
    const scaleY = CIRCLE_DIAMETER / naturalSize.height;
    return Math.max(scaleX, scaleY);
  }, [naturalSize]);

  // Current display dimensions
  const effectiveScale = getBaseScale() * zoom;
  const displayWidth = naturalSize ? naturalSize.width * effectiveScale : 0;
  const displayHeight = naturalSize ? naturalSize.height * effectiveScale : 0;

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

  // Export cropped avatar to high-res canvas and blob
  const handleApplyCrop = async () => {
    if (!imageElementRef.current || !naturalSize) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Unable to create 2D canvas context.");
      }

      // Smooth image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Scale factor between the on-screen crop circle and the output canvas
      const scaleMultiplier = OUTPUT_SIZE / CIRCLE_DIAMETER;

      // Draw the image transformed to match the user's zoom and pan
      const outW = displayWidth * scaleMultiplier;
      const outH = displayHeight * scaleMultiplier;
      const outX = OUTPUT_SIZE / 2 + offset.x * scaleMultiplier - outW / 2;
      const outY = OUTPUT_SIZE / 2 + offset.y * scaleMultiplier - outH / 2;

      ctx.drawImage(imageElementRef.current, outX, outY, outW, outH);

      // Convert canvas to WebP Blob (fallback to PNG if webp unsupported)
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else canvas.toBlob((pngBlob) => resolve(pngBlob), "image/png");
          },
          "image/webp",
          0.92
        );
      });

      if (!blob) {
        throw new Error("Failed to encode cropped image to blob.");
      }

      const croppedFile = new File([blob], `avatar_${Date.now()}.webp`, {
        type: blob.type || "image/webp",
      });

      const previewDataUrl = canvas.toDataURL("image/webp", 0.85);

      await onCropComplete(croppedFile, previewDataUrl);
      onClose();
    } catch (err: any) {
      console.error("Avatar crop export error:", err);
      setErrorMessage(err.message || "Failed to process cropped avatar.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white brutal-border border-4 brutal-shadow rounded-none flex flex-col overflow-hidden text-black animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-[#FEF08A] border-b-4 border-black p-4 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black font-black hover:bg-[#F87171] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
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
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-black bg-[#F3F4F6] hover:bg-[#E5E7EB] p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-center group"
            >
              <div className="w-16 h-16 rounded-full bg-[#A78BFA] border-3 border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)] group-hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-black uppercase text-base tracking-wide">
                  Click to select from computer
                </p>
                <p className="text-xs font-bold text-gray-600 mt-1">
                  or drag and drop your image file here
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                PNG, JPG, WEBP, GIF (MAX 10MB)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
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
                    <Move className="w-3 h-3" /> Drag to move
                  </div>
                </div>

                {/* Helper text */}
                <span className="text-[11px] font-bold text-gray-500 mt-2 uppercase tracking-wide">
                  Scroll mouse or drag slider to zoom. Drag image to reposition.
                </span>
              </div>

              {/* Controls: Zoom slider, Zoom In/Out, Reset */}
              <div className="bg-[#F3F4F6] p-4 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5 text-blue-600" /> Zoom Level: {zoom.toFixed(1)}x
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1.0);
                      setOffset({ x: 0, y: 0 });
                    }}
                    className="text-[11px] font-black uppercase flex items-center gap-1 text-gray-700 hover:text-black hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setZoom((z: number) => Math.max(1.0, Number((z - 0.2).toFixed(1))))}
                    disabled={zoom <= 1.0}
                    className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center font-black hover:bg-gray-100 disabled:opacity-40 cursor-pointer shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
                    title="Zoom out"
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
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-black uppercase underline hover:text-blue-700 cursor-pointer"
                  >
                    Choose Different Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#E5E7EB] border-t-4 border-black p-4 flex items-center justify-end gap-3 select-none">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="bg-white text-black border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer"
          >
            Cancel
          </Button>

          {imageSrc && (
            <Button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing}
              className="bg-[#4ADE80] text-black border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-[#22c55e] cursor-pointer flex items-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Avatar...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Apply & Save Avatar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
