"use client";

import React, { useState } from 'react';
import { GameReward } from '@/types/gamification';
import { gameAudio } from '@/utils/gameAudio';
import { Gift, Sparkles } from 'lucide-react';

interface MysteryBoxesProps {
  onSelectBox: (boxIndex: number) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function MysteryBoxes({
  onSelectBox,
  isLoading,
  disabled = false,
}: MysteryBoxesProps) {
  const [selectedBox, setSelectedBox] = useState<number | null>(null);

  const handleBoxClick = (index: number) => {
    if (disabled || isLoading || selectedBox !== null) return;
    setSelectedBox(index);
    gameAudio.playPop();
    onSelectBox(index);
  };

  const boxes = [
    { id: 0, label: "Box 1", color: "from-blue-700 via-indigo-800 to-navy-900", ribbon: "bg-amber-400" },
    { id: 1, label: "Box 2", color: "from-amber-600 via-yellow-700 to-amber-900", ribbon: "bg-red-500" },
    { id: 2, label: "Box 3", color: "from-purple-700 via-indigo-900 to-blue-950", ribbon: "bg-amber-400" },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-6 px-2 select-none">
      <div className="text-center mb-8">
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center justify-center gap-2">
          <Gift className="text-brand-gold animate-bounce" size={28} />
          Choose Your Mystery Box
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Pick any 1 lucky box to reveal your exclusive discount voucher
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-lg">
        {boxes.map((box, i) => {
          const isThisSelected = selectedBox === i;
          return (
            <button
              key={box.id}
              onClick={() => handleBoxClick(i)}
              disabled={disabled || isLoading || (selectedBox !== null && !isThisSelected)}
              className={`relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 group cursor-pointer ${
                isThisSelected
                  ? 'border-brand-gold scale-105 shadow-2xl ring-4 ring-amber-400/30'
                  : selectedBox !== null
                  ? 'opacity-40 grayscale cursor-not-allowed border-gray-200'
                  : 'border-gray-200 hover:border-brand-navy hover:scale-105 shadow-md hover:shadow-xl'
              }`}
            >
              {/* Box 3D Visual */}
              <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br ${box.color} flex items-center justify-center relative shadow-lg overflow-hidden group-hover:rotate-1 transition-transform`}>
                
                {/* Ribbon Vertical */}
                <div className={`absolute top-0 bottom-0 w-4 sm:w-5 ${box.ribbon} shadow-sm z-10 left-1/2 -translate-x-1/2`} />
                {/* Ribbon Horizontal */}
                <div className={`absolute left-0 right-0 h-4 sm:h-5 ${box.ribbon} shadow-sm z-10 top-1/2 -translate-y-1/2`} />

                {/* Bow on Top */}
                <div className="absolute top-2 z-20 flex items-center justify-center">
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${box.ribbon} shadow-md flex items-center justify-center`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                  </div>
                </div>

                <Gift className="text-white/30 relative z-0" size={36} />

                {isThisSelected && (
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] flex items-center justify-center z-30 animate-pulse">
                    <Sparkles className="text-yellow-300 animate-spin" size={32} />
                  </div>
                )}
              </div>

              <span className="mt-3 text-xs sm:text-sm font-bold text-gray-800">
                {box.label}
              </span>
              <span className="text-[10px] text-brand-gold font-semibold uppercase tracking-wider">
                Tap to Open
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
