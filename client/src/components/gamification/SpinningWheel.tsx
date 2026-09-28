"use client";

import React, { useRef, useState, useEffect } from 'react';
import { GameReward, DEFAULT_GAMIFICATION_CONFIG } from '@/types/gamification';
import { gameAudio } from '@/utils/gameAudio';
import { Sparkles } from 'lucide-react';

interface SpinningWheelProps {
  rewards: GameReward[];
  targetIndex: number | null;
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: () => void;
  disabled?: boolean;
}

export function SpinningWheel({
  rewards,
  targetIndex,
  isSpinning,
  onSpinStart,
  onSpinEnd,
  disabled = false,
}: SpinningWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [pointerActive, setPointerActive] = useState(false);

  // Guarantee wheel is ALWAYS filled with prizes (never blank/yellow)
  const activeRewards = (rewards && rewards.length > 0) ? rewards : DEFAULT_GAMIFICATION_CONFIG.rewards;
  const numSlices = activeRewards.length;
  const sliceAngle = (2 * Math.PI) / numSlices;

  // Draw the Wheel Canvas (Ultra-Crisp 800x800 High-DPI Resolution)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 800; // High-DPI canvas
    const center = size / 2;
    const radius = center - 40;

    ctx.clearRect(0, 0, size, size);

    // 1. Ambient Outer Halo Glow
    const haloGrad = ctx.createRadialGradient(center, center, radius, center, center, center);
    haloGrad.addColorStop(0, 'rgba(212, 175, 55, 0.45)');
    haloGrad.addColorStop(0.7, 'rgba(212, 175, 55, 0.15)');
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.arc(center, center, center, 0, 2 * Math.PI);
    ctx.fillStyle = haloGrad;
    ctx.fill();

    // 2. Outer Bezel Shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#060b18';
    ctx.shadowColor = 'rgba(212, 175, 55, 0.7)';
    ctx.shadowBlur = 35;
    ctx.fill();
    ctx.restore();

    // 3. 3D Metallic Gold Outer Rim
    const rimGrad = ctx.createLinearGradient(0, 0, size, size);
    rimGrad.addColorStop(0.0, '#fff4cc');
    rimGrad.addColorStop(0.2, '#eab308');
    rimGrad.addColorStop(0.4, '#a16207');
    rimGrad.addColorStop(0.6, '#ca8a04');
    rimGrad.addColorStop(0.8, '#78350f');
    rimGrad.addColorStop(1.0, '#fef08a');

    ctx.beginPath();
    ctx.arc(center, center, radius + 18, 0, 2 * Math.PI);
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // 4. Inner Dark Bezel Groove
    ctx.beginPath();
    ctx.arc(center, center, radius + 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a1024';
    ctx.fill();

    // 5. Draw Slices with Rich Depth & Colors
    // Curated luxury casino palette
    const slicePalette = [
      { bg: '#0b2149', highlight: '#1d4ed8', text: '#ffffff' }, // Royal Navy
      { bg: '#854d0e', highlight: '#eab308', text: '#000000' }, // Imperial Gold
      { bg: '#0f172a', highlight: '#334155', text: '#ffffff' }, // Midnight Onyx
      { bg: '#064e3b', highlight: '#059669', text: '#ffffff' }, // Emerald Luxe
      { bg: '#701a75', highlight: '#a21caf', text: '#ffffff' }, // Royal Violet
      { bg: '#881337', highlight: '#e11d48', text: '#ffffff' }, // Ruby Crimson
      { bg: '#0c4a6e', highlight: '#0284c7', text: '#ffffff' }, // Sapphire Ocean
      { bg: '#78350f', highlight: '#f59e0b', text: '#000000' }, // Amber Honey
    ];

    activeRewards.forEach((reward, i) => {
      const angle = i * sliceAngle;
      const palette = slicePalette[i % slicePalette.length];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + sliceAngle);
      ctx.closePath();

      // Custom reward color or luxury gradient slice
      const sliceGrad = ctx.createRadialGradient(
        center, center, 60,
        center + Math.cos(angle + sliceAngle / 2) * radius * 0.8,
        center + Math.sin(angle + sliceAngle / 2) * radius * 0.8,
        radius
      );

      if (reward.color) {
        sliceGrad.addColorStop(0, '#0a0f1d');
        sliceGrad.addColorStop(0.3, reward.color);
        sliceGrad.addColorStop(1, reward.color);
      } else {
        sliceGrad.addColorStop(0, palette.bg);
        sliceGrad.addColorStop(0.8, palette.highlight);
        sliceGrad.addColorStop(1, palette.bg);
      }

      ctx.fillStyle = sliceGrad;
      ctx.fill();

      // Golden Slice Divider Borders
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#fef08a';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.stroke();
      ctx.restore();

      // Draw Slice Text & Icons
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const isGoldSlice = (!reward.color && palette.text === '#000000') || reward.color === '#D4AF37' || reward.textColor === '#000000';
      const textColor = reward.textColor || (isGoldSlice ? '#000000' : '#ffffff');

      // Primary Title (e.g. ₹150 OFF, ₹500 Jackpot)
      ctx.font = '900 24px "Outfit", "Inter", -apple-system, sans-serif';
      ctx.fillStyle = textColor;
      if (!isGoldSlice) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 6;
      } else {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        ctx.shadowBlur = 3;
      }

      // Add prize icon/badge if applicable
      let labelText = reward.label;
      if (labelText.length > 20) labelText = labelText.slice(0, 18) + '..';

      ctx.fillText(labelText, radius - 38, -4);

      // Sub-label/tag (e.g. "OFFER" or "VOUCHER")
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = isGoldSlice ? 'rgba(0,0,0,0.7)' : 'rgba(255, 255, 255, 0.75)';
      ctx.shadowBlur = 0;
      const sub = reward.type === 'TRY_AGAIN' ? 'LUCKY DRAW' : (reward.couponCode ? 'VOUCHER' : 'SPECIAL');
      ctx.fillText(sub, radius - 40, 18);

      ctx.restore();
    });

    // 6. Outer Rim Jeweled Bulbs / LED Lights
    const numStuds = Math.max(numSlices * 4, 24);
    for (let s = 0; s < numStuds; s++) {
      const studAngle = (s * 2 * Math.PI) / numStuds;
      const studX = center + (radius + 12) * Math.cos(studAngle);
      const studY = center + (radius + 12) * Math.sin(studAngle);

      // Outer bulb glow
      ctx.save();
      ctx.beginPath();
      ctx.arc(studX, studY, 7, 0, 2 * Math.PI);
      ctx.fillStyle = s % 2 === 0 ? 'rgba(254, 240, 138, 0.8)' : 'rgba(255, 255, 255, 0.8)';
      ctx.shadowColor = s % 2 === 0 ? '#fde047' : '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fill();

      // Inner bulb dome
      ctx.beginPath();
      ctx.arc(studX, studY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = s % 2 === 0 ? '#fef08a' : '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    // 7. Center Hub Metallic Collar
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 65, 0, 2 * Math.PI);
    ctx.fillStyle = '#060a16';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 15;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, 60, 0, 2 * Math.PI);
    ctx.fillStyle = rimGrad;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fef08a';
    ctx.stroke();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, 48, 0, 2 * Math.PI);
    ctx.fillStyle = '#090e21';
    ctx.fill();
    ctx.restore();

  }, [activeRewards, numSlices, sliceAngle]);

  // Fast, Responsive Spin Physics with Ratchet Audio
  useEffect(() => {
    if (isSpinning && targetIndex !== null && targetIndex >= 0) {
      const sliceDeg = 360 / numSlices;
      const targetMiddleDeg = (targetIndex * sliceDeg) + (sliceDeg / 2);

      // Top pointer is positioned at 270 deg
      const currentNorm = rotation % 360;
      let extra = (270 - targetMiddleDeg) - currentNorm;
      while (extra < 0) extra += 360;
      
      const fullRotations = 6 * 360; // 6 fast rotations
      const targetRotation = rotation + fullRotations + extra;

      setRotation(targetRotation);
      setPointerActive(true);

      // Audio ticks simulation (fast start, natural deceleration)
      let elapsed = 0;
      let tickDelay = 70;
      let tickTimer: NodeJS.Timeout;

      const scheduleTick = () => {
        gameAudio.playTick();
        elapsed += tickDelay;
        if (elapsed < 1800) {
          tickDelay = 70;
        } else if (elapsed < 2600) {
          tickDelay += 18;
        } else if (elapsed < 3100) {
          tickDelay += 35;
        } else {
          return;
        }
        tickTimer = setTimeout(scheduleTick, tickDelay);
      };

      scheduleTick();

      // Spin completes in exactly 3.2 seconds
      const finishTimer = setTimeout(() => {
        clearTimeout(tickTimer);
        setPointerActive(false);
        gameAudio.playVictory();
        onSpinEnd();
      }, 3200);

      return () => {
        clearTimeout(tickTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [isSpinning, targetIndex, numSlices]);

  return (
    <div className="flex flex-col items-center justify-center p-1 sm:p-2 relative select-none">
      
      {/* 3D Top Arrow Pointer with Ratchet Bounce Animation */}
      <div 
        className={`absolute top-[-10px] sm:top-[-12px] z-30 transform -translate-y-1 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] flex flex-col items-center transition-transform ${
          pointerActive ? 'animate-bounce scale-110' : ''
        }`}
      >
        {/* Needle Top Cap */}
        <div className="w-9 h-11 bg-gradient-to-b from-amber-300 via-rose-600 to-red-700 rounded-t-md shadow-lg flex items-center justify-center border-t-2 border-amber-200">
          <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-200 to-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
        </div>
        {/* Sharp Arrow Point */}
        <div className="w-0 h-0 border-l-[13px] border-l-transparent border-r-[13px] border-r-transparent border-t-[18px] border-t-red-700 -mt-1 drop-shadow-md" />
      </div>

      {/* Wheel Canvas Container (Clickable) */}
      <div 
        onClick={!disabled && !isSpinning ? onSpinStart : undefined}
        className={`relative w-[320px] h-[320px] sm:w-[390px] sm:h-[390px] rounded-full flex items-center justify-center ${
          !disabled && !isSpinning ? 'cursor-pointer hover:scale-[1.015]' : 'cursor-default'
        } transition-transform drop-shadow-[0_0_40px_rgba(212,175,55,0.3)]`}
      >
        <div
          className="w-full h-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionProperty: 'transform',
            transitionDuration: isSpinning ? '3200ms' : '0ms',
            transitionTimingFunction: 'cubic-bezier(0.12, 0.8, 0.15, 1)'
          }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={800}
            className="w-full h-full block"
          />
        </div>

        {/* Center 3D Spin Action Push Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled && !isSpinning) onSpinStart();
          }}
          disabled={disabled || isSpinning}
          className="absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#fff7d6] via-[#dfb743] to-[#854d0e] text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(234,179,8,0.85)] flex flex-col items-center justify-center border-2 border-white hover:scale-105 active:scale-95 transition-all disabled:opacity-95 disabled:cursor-not-allowed cursor-pointer group"
        >
          {/* Subtle Outer Glowing Ring */}
          <span className="absolute -inset-1 rounded-full bg-amber-400/40 animate-ping opacity-40 pointer-events-none" />
          
          <Sparkles 
            size={18} 
            className={`text-slate-950 mb-0.5 drop-shadow ${
              isSpinning ? 'animate-spin text-amber-950' : 'group-hover:scale-125 transition-transform'
            }`} 
          />
          <span className="font-black text-slate-950 tracking-wider text-[11px] sm:text-[13px] drop-shadow-sm">
            {isSpinning ? '...' : 'SPIN'}
          </span>
        </button>
      </div>

      {/* Helper Click Hint */}
      {!isSpinning && (
        <p className="text-[11px] sm:text-xs text-amber-300 font-bold mt-3 animate-pulse flex items-center gap-1.5 drop-shadow">
          <span>👆</span> Tap wheel or press SPIN to play
        </p>
      )}

    </div>
  );
}
