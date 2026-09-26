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
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm rounded-full shadow-[0_4px_25px_rgba(212,175,55,0.6)] hover:shadow-[0_4px_35px_rgba(212,175,55,0.9)] hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white"
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
