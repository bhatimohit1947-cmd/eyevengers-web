"use client";

import React, { useRef, useState, useEffect } from 'react';
import { GameReward } from '@/types/gamification';
import { gameAudio } from '@/utils/gameAudio';
import { Sparkles, Trophy } from 'lucide-react';

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
  const numSlices = rewards.length || 6;
  const sliceAngle = (2 * Math.PI) / numSlices;

  // Draw the Wheel Canvas
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
    ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.restore();

    // Outer Golden Border
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
      ctx.arc(studX, studY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = s % 2 === 0 ? '#ffffff' : '#fef08a';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.fill();
    }

    // Center Golden Hub Cap
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

  // Handle Spin Animation
  useEffect(() => {
    if (isSpinning && targetIndex !== null && targetIndex >= 0) {
      const fullSpins = 6; // 6 full rotations for excitement
      const sliceDeg = 360 / numSlices;
      
      // Canvas 0 radians starts at 3 o'clock (90 deg from 12 o'clock top indicator).
      // Top pointer is at 270 degrees (or -90 deg).
      // Calculate exact angle to land slice under the top pointer
      const targetMiddleDeg = (targetIndex * sliceDeg) + (sliceDeg / 2);
      const stopAngle = 270 - targetMiddleDeg;
      const finalRotation = (fullSpins * 360) + stopAngle;

      setRotation(finalRotation);

      // Play audio ticks during the spin
      let ticks = 0;
      const tickInterval = setInterval(() => {
        ticks++;
        gameAudio.playTick();
        if (ticks > 28) clearInterval(tickInterval);
      }, 140);

      const timer = setTimeout(() => {
        clearInterval(tickInterval);
        gameAudio.playWin();
        onSpinEnd();
      }, 5000); // 5s spin duration

      return () => {
        clearTimeout(timer);
        clearInterval(tickInterval);
      };
    }
  }, [isSpinning, targetIndex, numSlices, onSpinEnd]);

  return (
    <div className="flex flex-col items-center justify-center p-2 relative select-none">
      
      {/* Top Pointer Indicator */}
      <div className="absolute top-[-2px] z-30 transform -translate-y-1 drop-shadow-xl flex flex-col items-center">
        <div className="w-8 h-10 bg-gradient-to-b from-red-500 to-red-700 rounded-t-sm shadow-md clip-pointer flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-inner"></div>
        </div>
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-red-700 -mt-1"></div>
      </div>

      {/* Wheel Canvas Container */}
      <div className="relative w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] rounded-full flex items-center justify-center">
        <div
          className="w-full h-full transition-transform ease-[cubic-bezier(0.15,0.9,0.2,1)]"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: isSpinning ? '5000ms' : '0ms'
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
          onClick={onSpinStart}
          disabled={disabled || isSpinning}
          className="absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#f7e7a9] to-[#b38f26] text-brand-navy font-black text-xs sm:text-sm tracking-wider uppercase shadow-2xl flex flex-col items-center justify-center border-2 border-white hover:scale-105 active:scale-95 transition-all disabled:opacity-80 disabled:cursor-not-allowed cursor-pointer"
        >
          <Sparkles size={16} className="text-brand-navy mb-0.5" />
          <span>{isSpinning ? '...' : 'SPIN'}</span>
        </button>
      </div>

    </div>
  );
}
