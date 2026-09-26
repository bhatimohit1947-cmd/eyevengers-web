"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { GameModal } from './GameModal';
import { Sparkles, Gift } from 'lucide-react';

export function LuckyGamesWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [activeGame, setActiveGame] = useState<'wheel' | 'mystery_box' | 'both'>('both');

  // Do not show in Admin Panel
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) return;

    // Check if enabled on backend
    fetch('/api/gamification')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setIsEnabled(data.isEnabled);
          setActiveGame(data.activeGame || 'both');
        }
      })
      .catch(() => {});
  }, [isAdmin]);

  if (isAdmin || !isEnabled) return null;

  return (
    <>
      {/* Floating Trigger Button */}
      <aside
        aria-label="Daily rewards"
        className="fixed bottom-24 left-4 z-40 sm:bottom-8 sm:left-8 group"
      >
        {/* Desktop View: Full Horizontal Pill */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative hidden sm:flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm rounded-full shadow-[0_4px_25px_rgba(212,175,55,0.6)] hover:shadow-[0_4px_35px_rgba(212,175,55,0.9)] hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white"
          title="Play Lucky Spin & Win Free Vouchers!"
        >
          {/* Animated Glow Halo */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 blur-sm opacity-70 group-hover:opacity-100 animate-pulse -z-10" />

          {/* Icon */}
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-950 text-amber-400 shadow-inner">
            {activeGame === 'mystery_box' ? <Gift size={16} /> : <Sparkles size={16} />}
          </span>

          {/* Text */}
          <span className="tracking-wide uppercase font-black pr-1 flex flex-col items-start leading-none">
            <span className="text-[9px] text-slate-900 font-bold opacity-80">DAILY REWARD</span>
            <span className="text-xs sm:text-sm font-black text-slate-950">
              {activeGame === 'mystery_box' ? 'Mystery Box' : 'Spin & Win'}
            </span>
          </span>

          {/* Free Badge */}
          <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black tracking-widest uppercase animate-bounce">
            FREE
          </span>
        </button>

        {/* Mobile View: Small Round Wheel Button with 'Spin & Win' label */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex sm:hidden flex-col items-center group active:scale-90 transition-transform"
          title="Spin & Win Free Vouchers"
          aria-label="Spin and Win"
        >
          <div className="relative w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 shadow-[0_4px_20px_rgba(212,175,55,0.7)] border-2 border-white flex items-center justify-center">
            {/* Pulsing Glow behind */}
            <span className="absolute -inset-1 rounded-full bg-amber-400 blur-sm opacity-80 animate-pulse -z-10" />

            {/* Continuous rotating colorful wheel graphic */}
            <div className="w-full h-full rounded-full overflow-hidden relative animate-[spin_6s_linear_infinite]">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" />
                {/* 6 colorful slices */}
                <path d="M50 50 L50 2 A48 48 0 0 1 91.6 26 Z" fill="#ef4444" />
                <path d="M50 50 L91.6 26 A48 48 0 0 1 91.6 74 Z" fill="#f59e0b" />
                <path d="M50 50 L91.6 74 A48 48 0 0 1 50 98 Z" fill="#10b981" />
                <path d="M50 50 L50 98 A48 48 0 0 1 8.4 74 Z" fill="#3b82f6" />
                <path d="M50 50 L8.4 74 A48 48 0 0 1 8.4 26 Z" fill="#8b5cf6" />
                <path d="M50 50 L8.4 26 A48 48 0 0 1 50 2 Z" fill="#ec4899" />
                {/* Center hub */}
                <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#d97706" strokeWidth="2.5" />
                <circle cx="50" cy="50" r="6" fill="#f59e0b" />
              </svg>
            </div>

            {/* Static Wheel Pointer on Top */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[7px] border-t-amber-300 drop-shadow z-10" />

            {/* Tiny FREE Badge */}
            <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-rose-600 text-white text-[8px] font-black tracking-wider uppercase shadow-md animate-bounce">
              FREE
            </span>
          </div>

          {/* Small text label below */}
          <span className="mt-1 px-1.5 py-0.5 rounded-full bg-slate-950/95 border border-amber-400/80 text-[9px] font-black text-amber-300 tracking-tight leading-none shadow-md whitespace-nowrap">
            Spin & Win
          </span>
        </button>
      </aside>

      {/* Main Modal */}
      <GameModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultGame={activeGame === 'mystery_box' ? 'mystery_box' : 'wheel'}
      />
    </>
  );
}
