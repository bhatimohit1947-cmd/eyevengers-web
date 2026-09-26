"use client";

import React, { useRef, useState, useEffect } from 'react';
import { GameReward } from '@/types/gamification';
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
  const numSlices = rewards.length || 6;
  const sliceAngle = (2 * Math.PI) / numSlices;

  // Draw the Wheel Canvas (High-DPI Razor Sharp)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 16;

    ctx.clearRect(0, 0, size, size);

    // Outer Golden Ring Shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a1128';
    ctx.shadowColor = 'rgba(212, 175, 55, 0.6)';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();

    // Outer Golden Metallic Rim
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#D4AF37';
    ctx.fill();

    // Draw Slices
    rewards.forEach((reward, i) => {
      const angle = i * sliceAngle;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + sliceAngle);
      ctx.closePath();

      // Custom or alternating stylish slice colors
      ctx.fillStyle = reward.color || (i % 2 === 0 ? '#004777' : '#D4AF37');
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw Slice Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = reward.textColor || '#ffffff';
      ctx.font = 'bold 15px sans-serif';

      // Trim label if long
      const text = reward.label.length > 18 ? reward.label.slice(0, 16) + '..' : reward.label;
      ctx.fillText(text, radius - 24, 0);
      ctx.restore();
    });

    // Outer Rim Golden Bulbs / Studs
    const numStuds = numSlices * 3;
    for (let s = 0; s < numStuds; s++) {
      const studAngle = (s * 2 * Math.PI) / numStuds;
      const studX = center + (radius + 4) * Math.cos(studAngle);
      const studY = center + (radius + 4) * Math.sin(studAngle);

      ctx.beginPath();
      ctx.arc(studX, studY, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = s % 2 === 0 ? '#ffffff' : '#fef08a';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 5;
      ctx.fill();
    }

    // Center Hub Cap Background Ring
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a1128';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#D4AF37';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#D4AF37';
    ctx.fill();

  }, [rewards, numSlices, sliceAngle]);

  // Fast, Responsive Spin Physics
  useEffect(() => {
    if (isSpinning && targetIndex !== null && targetIndex >= 0) {
      const sliceDeg = 360 / numSlices;
      const targetMiddleDeg = (targetIndex * sliceDeg) + (sliceDeg / 2);

      // Top pointer is at 270 deg
      // Always spin forward by at least 6 full rounds (2160 deg)
      const currentNorm = rotation % 360;
      let extra = (270 - targetMiddleDeg) - currentNorm;
      while (extra < 0) extra += 360;
      
      const fullRotations = 6 * 360; // 6 fast rotations
      const targetRotation = rotation + fullRotations + extra;

      setRotation(targetRotation);
      setPointerActive(true);

      // Audio ticks simulation (fast then slowing down)
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
    <div className="flex flex-col items-center justify-center p-2 relative select-none">
      
      {/* Top Pointer Indicator with dynamic tick bounce */}
      <div 
        className={`absolute top-[-4px] z-30 transform -translate-y-1 drop-shadow-2xl flex flex-col items-center transition-transform ${
          pointerActive ? 'animate-pulse scale-105' : ''
        }`}
      >
        <div className="w-8 h-10 bg-gradient-to-b from-red-500 via-rose-600 to-red-700 rounded-t-sm shadow-md clip-pointer flex items-center justify-center border-t border-red-300">
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-inner" />
        </div>
        <div className="w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[15px] border-t-red-700 -mt-1 drop-shadow-sm" />
      </div>

      {/* Wheel Canvas Container (Clickable) */}
      <div 
        onClick={!disabled && !isSpinning ? onSpinStart : undefined}
        className={`relative w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] rounded-full flex items-center justify-center ${
          !disabled && !isSpinning ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'
        } transition-transform`}
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
            width={400}
            height={400}
            className="w-full h-full block"
          />
        </div>

        {/* Center Spin Action Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled && !isSpinning) onSpinStart();
          }}
          disabled={disabled || isSpinning}
          className="absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#fef08a] via-[#D4AF37] to-[#996515] text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(212,175,55,0.7)] flex flex-col items-center justify-center border-2 border-white hover:scale-105 active:scale-95 transition-all disabled:opacity-90 disabled:cursor-not-allowed cursor-pointer"
        >
          <Sparkles size={16} className={`text-slate-950 mb-0.5 ${isSpinning ? 'animate-spin' : 'animate-bounce'}`} />
          <span className="font-black text-slate-950">{isSpinning ? '...' : 'SPIN'}</span>
        </button>
      </div>

      {/* Helper Click Hint */}
      {!isSpinning && (
        <p className="text-[11px] text-amber-400/80 font-semibold mt-3 animate-pulse">
          👉 Tap wheel or press SPIN to play
        </p>
      )}

    </div>
  );
}
