// ============================================================================
// TARGET_DESTINATION: frontend/src/components/avatar/AvatarFrame.tsx
// PURPOSE: High-End Neo-Brutalist decorative avatar frames with 100% HOLLOW centers
//          Proportionally scaled via percentage insets for perfect fit across all sizes
// ============================================================================

"use client";

import React, { useMemo, useId } from "react";
import { getAvatarAnimationClass } from "@/lib/cosmetics";

export interface AvatarFrameProps {
  borderId?: string | null;
  animationId?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children: React.ReactNode;
}

// Generate precision annular (hollow donut) sawtooth zigzag SVG path
// Uses dual-loop with fillRule="evenodd" so the center circle (r <= innerR) is 100% HOLLOW.
function generateHollowZigzagPath(points = 44, innerR = 39.5, outerR = 47.0): string {
  const cx = 50;
  const cy = 50;
  const outer: string[] = [];
  const total = points * 2;

  // 1. Clockwise outer sawtooth zigzag (radii alternating between outerR and innerR + 0.8)
  for (let i = 0; i < total; i++) {
    const angle = (i * 2 * Math.PI) / total - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR + 0.8;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    outer.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  outer.push("Z");

  // 2. Counter-clockwise inner circle boundary to punch out the center
  const inner: string[] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const angle = -(i * 2 * Math.PI) / steps - Math.PI / 2;
    const x = cx + innerR * Math.cos(angle);
    const y = cy + innerR * Math.sin(angle);
    inner.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  inner.push("Z");

  return `${outer.join(" ")} ${inner.join(" ")}`;
}

export function AvatarFrame({
  borderId,
  animationId,
  size = "md",
  className = "",
  children,
}: AvatarFrameProps) {
  const maskId = useId().replace(/:/g, "_");
  const zigzagPath = useMemo(() => generateHollowZigzagPath(44, 39.5, 47.2), []);
  const animClass = getAvatarAnimationClass(animationId);

  return (
    <div
      data-testid="avatar-frame-root"
      data-border-id={borderId || "none"}
      data-animation-id={animationId || "none"}
      className={`relative inline-flex items-center justify-center shrink-0 ${animClass} ${className}`}
    >
      {/* Base Avatar Child */}
      {children}

      {/* ====================================================================
          1. DECORATIVE FRAMES OVERLAY (Proportionally Scaled with 100% Hollow Center)
          ==================================================================== */}
      {borderId && (
        <div className="absolute -inset-[13%] pointer-events-none z-10 select-none overflow-visible">
          <svg
            viewBox="0 0 100 100"
            className="avatar-frame-svg w-full h-full overflow-visible"
          >
            <defs>
              {/* Universal Cutout Mask: ensures NO shape can ever penetrate inside r=39.2 */}
              <mask id={`mask_${maskId}`}>
                <rect x="-30" y="-30" width="160" height="160" fill="white" />
                <circle cx="50" cy="50" r="39.2" fill="black" />
              </mask>

              {/* Gold gradient for refined brutal zigzag */}
              <linearGradient id={`gold_grad_${maskId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="35%" stopColor="#FACC15" />
                <stop offset="70%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#CA8A04" />
              </linearGradient>

              {/* Crimson flame gradient */}
              <linearGradient id={`flame_grad_${maskId}`} x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>

              {/* Amethyst gradient */}
              <linearGradient id={`amethyst_grad_${maskId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#7E22CE" />
              </linearGradient>
            </defs>

            {/* A. ALTIN ZİGZAG BRUTAL ÇERÇEVE (İnce & Zarif Neo-Brutalist Tasarım) */}
            {borderId === "border_gold_brutal" && (
              <g mask={`url(#mask_${maskId})`} className="filter drop-shadow-[2px_2px_0px_#000000]">
                {/* 44-Tooth Precision Fine Sawtooth Annular Ring */}
                <path
                  data-type="zigzag"
                  d={zigzagPath}
                  fill={`url(#gold_grad_${maskId})`}
                  fillRule="evenodd"
                  stroke="#000000"
                  strokeWidth="1.6"
                  strokeLinejoin="miter"
                  strokeMiterlimit="4"
                />

                {/* Concentric Technical Orbit Lines */}
                <circle cx="50" cy="50" r="48.5" fill="none" stroke="#000000" strokeWidth="1.2" strokeDasharray="3 2" />
                <circle cx="50" cy="50" r="50.0" fill="none" stroke="#FDE047" strokeWidth="0.8" opacity="0.85" />

                {/* 4 Cardinal Neo-Brutalist Micro-Diamonds at 0, 90, 180, 270 degrees */}
                <polygon points="50,1 52.5,4 50,7 47.5,4" fill="#FDE047" stroke="#000000" strokeWidth="1" />
                <polygon points="50,99 52.5,96 50,93 47.5,96" fill="#FDE047" stroke="#000000" strokeWidth="1" />
                <polygon points="1,50 4,52.5 7,50 4,47.5" fill="#FDE047" stroke="#000000" strokeWidth="1" />
                <polygon points="99,50 96,52.5 93,50 96,47.5" fill="#FDE047" stroke="#000000" strokeWidth="1" />

                {/* 4 Diagonal Technical Ticks at 45, 135, 225, 315 degrees */}
                <line x1="16" y1="16" x2="19" y2="19" stroke="#000000" strokeWidth="1.5" />
                <line x1="84" y1="16" x2="81" y2="19" stroke="#000000" strokeWidth="1.5" />
                <line x1="16" y1="84" x2="19" y2="81" stroke="#000000" strokeWidth="1.5" />
                <line x1="84" y1="84" x2="81" y2="81" stroke="#000000" strokeWidth="1.5" />
              </g>
            )}

            {/* B. SİBER HUD NİŞANGAH ÇERÇEVESİ */}
            {borderId === "border_cyber_neon" && (
              <g className="filter drop-shadow-[0_0_4px_#06B6D4]">
                {/* Outer Brackets (outside the avatar circle) */}
                <path d="M 12 24 L 12 12 L 24 12" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="square" />
                <path d="M 88 24 L 88 12 L 76 12" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="square" />
                <path d="M 12 76 L 12 88 L 24 88" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="square" />
                <path d="M 88 76 L 88 88 L 76 88" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="square" />

                {/* Crosshair Targeting Ticks */}
                <line x1="50" y1="5" x2="50" y2="11" stroke="#38BDF8" strokeWidth="2" />
                <line x1="50" y1="89" x2="50" y2="95" stroke="#38BDF8" strokeWidth="2" />
                <line x1="5" y1="50" x2="11" y2="50" stroke="#38BDF8" strokeWidth="2" />
                <line x1="89" y1="50" x2="95" y2="50" stroke="#38BDF8" strokeWidth="2" />

                {/* Outer Circular Visor Ring */}
                <circle cx="50" cy="50" r="45.5" fill="none" stroke="#06B6D4" strokeWidth="1.8" strokeDasharray="14 7" />
              </g>
            )}

            {/* C. MATRIX DEVRE ÇERÇEVESİ */}
            {borderId === "border_matrix_green" && (
              <g className="filter drop-shadow-[0_0_5px_#22C55E]">
                {/* Outer Circuit Notched Ring */}
                <circle cx="50" cy="50" r="45.5" fill="none" stroke="#22C55E" strokeWidth="2" strokeDasharray="8 4 3 4" />
                {/* Microchip Solder Pads on 4 corners */}
                <rect x="47" y="4" width="6" height="5" fill="#22C55E" stroke="#000" strokeWidth="1" />
                <rect x="47" y="91" width="6" height="5" fill="#22C55E" stroke="#000" strokeWidth="1" />
                <rect x="4" y="47" width="5" height="6" fill="#22C55E" stroke="#000" strokeWidth="1" />
                <rect x="91" y="47" width="5" height="6" fill="#22C55E" stroke="#000" strokeWidth="1" />
              </g>
            )}

            {/* D. KIZIL ALEV DİŞLERİ */}
            {borderId === "border_crimson_flame" && (
              <g mask={`url(#mask_${maskId})`} className="filter drop-shadow-[2px_2px_0px_#000]">
                {/* Dynamic Flame Crowns leaping outward */}
                <polygon
                  points="50,4 53,16 64,10 62,21 75,18 70,29 84,32 75,43 88,49 75,55 84,63 71,66 76,77 65,75 64,88 53,81 50,91 47,81 36,88 35,75 24,77 29,66 16,63 25,55 12,49 25,43 16,32 30,29 25,18 38,21 36,10 47,16"
                  fill={`url(#flame_grad_${maskId})`}
                  stroke="#000000"
                  strokeWidth="1.6"
                />
              </g>
            )}

            {/* E. AMETİST EJDERHA KRİSTALLERİ */}
            {borderId === "border_amethyst_dragon" && (
              <g className="filter drop-shadow-[0_0_6px_#A855F7]">
                {/* Outer Diamond Crystal Spurs */}
                <polygon points="50,3 55,13 50,17 45,13" fill={`url(#amethyst_grad_${maskId})`} stroke="#000" strokeWidth="1.2" />
                <polygon points="50,97 55,87 50,83 45,87" fill={`url(#amethyst_grad_${maskId})`} stroke="#000" strokeWidth="1.2" />
                <polygon points="3,50 13,55 17,50 13,45" fill={`url(#amethyst_grad_${maskId})`} stroke="#000" strokeWidth="1.2" />
                <polygon points="97,50 87,55 83,50 87,45" fill={`url(#amethyst_grad_${maskId})`} stroke="#000" strokeWidth="1.2" />
                <circle cx="50" cy="50" r="45.5" fill="none" stroke="#C084FC" strokeWidth="2.2" strokeDasharray="14 6" />
              </g>
            )}

            {/* F. HOLOGRAFİK PRİZMA YILDIZLARI */}
            {borderId === "border_holo_rainbow" && (
              <g className="filter drop-shadow-[1.5px_1.5px_0_#FBBF24]">
                <polygon
                  points="50,4 60,8 69,15 79,26 86,36 91,48 86,60 79,70 69,81 60,88 50,92 40,88 31,81 21,70 14,60 9,48 14,36 21,26 31,15 40,8"
                  fill="none"
                  stroke="#EC4899"
                  strokeWidth="2.2"
                />
                <circle cx="50" cy="50" r="45.5" fill="none" stroke="#38BDF8" strokeWidth="1.8" strokeDasharray="6 6" />
              </g>
            )}
          </svg>
        </div>
      )}

      {/* ====================================================================
          2. PURCHASABLE LOOP ANIMATIONS OVERLAYS
          ==================================================================== */}
      {/* Orbital Spin: neon satellites rotating around the avatar boundary */}
      {animationId === "anim_orbital_spin" && (
        <div className="absolute -inset-[13%] pointer-events-none z-20 animate-spin [animation-duration:4s]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#38BDF8] rounded-full border border-black shadow-[0_0_8px_#38BDF8]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#A855F7] rounded-full border border-black shadow-[0_0_6px_#A855F7]" />
        </div>
      )}

      {/* Flame Pulse: radiant flame aura pulsing around the perimeter */}
      {animationId === "anim_flame_pulse" && (
        <div className="absolute -inset-[10%] rounded-full pointer-events-none z-0 bg-gradient-to-t from-[#EF4444]/40 via-[#F97316]/30 to-transparent animate-pulse [animation-duration:1.6s] blur-xs" />
      )}
    </div>
  );
}
