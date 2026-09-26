"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { SpinningWheel } from './SpinningWheel';
import { MysteryBoxes } from './MysteryBoxes';
import { GameReward } from '@/types/gamification';
import { gameAudio } from '@/utils/gameAudio';
import { X, Sparkles, Gift, Lock, Copy, Check, Clock, ChevronRight, AlertCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGame?: 'wheel' | 'mystery_box';
}

export function GameModal({ isOpen, onClose, defaultGame = 'wheel' }: GameModalProps) {
  const { user, isLoggedIn, openLoginModal, updateUserGender } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'wheel' | 'mystery_box'>(defaultGame);
  const [config, setConfig] = useState<any>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  
  // Game Play State
  const [gameState, setGameState] = useState<'idle' | 'spinning' | 'won' | 'ineligible' | 'already_played'>('idle');
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [wonReward, setWonReward] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [nextPlayCountdown, setNextPlayCountdown] = useState<string>('');

  // Confetti Canvas Ref
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch gamification config & user play history
  const fetchConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const url = user?.phone ? `/api/gamification?phone=${encodeURIComponent(user.phone)}` : '/api/gamification';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setConfig(data);
        if (data.activeGame === 'wheel') setActiveTab('wheel');
        else if (data.activeGame === 'mystery_box') setActiveTab('mystery_box');

        // Check if user already played
        if (data.userStatus && !data.userStatus.canPlay) {
          setGameState('already_played');
          setWonReward(data.userStatus.lastWon);
          calculateCountdown(data.userStatus.nextPlayAt);
        } else {
          setGameState('idle');
        }
      }
    } catch (e) {
      console.error('Failed to load gamification config', e);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      setCopiedCode(false);
    }
  }, [isOpen, isLoggedIn, user?.phone]);

  // Countdown timer for 24h cooldown
  const calculateCountdown = (nextPlayAtIso: string | null) => {
    if (!nextPlayAtIso) return;
    const target = new Date(nextPlayAtIso).getTime();
    const update = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setNextPlayCountdown('Ready to play!');
        setGameState('idle');
        return;
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setNextPlayCountdown(`${hrs}h ${mins}m ${secs}s`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  };

  // Canvas Confetti Effect
  const triggerConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = canvas.parentElement?.clientHeight || 450;

    const colors = ['#D4AF37', '#004777', '#FF6B6B', '#4ECDC4', '#FFE66D', '#9B5DE5'];
    const particles: any[] = [];

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.7) * 14,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 10,
        gravity: 0.35,
        opacity: 1
      });
    }

    let animationFrame: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.spin;
        p.opacity -= 0.008;

        if (p.opacity > 0) {
          active = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (active) {
        animationFrame = requestAnimationFrame(render);
      }
    };

    render();
  };

  // Play Action Trigger
  const handlePlay = async (chosenGame: 'wheel' | 'mystery_box') => {
    if (!isLoggedIn || !user) {
      openLoginModal();
      return;
    }

    if (!user.gender) {
      // Prompt user to select gender
      setErrorMessage("Please select your gender profile below to spin!");
      return;
    }

    setErrorMessage('');
    
    try {
      const res = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'play',
          phone: user.phone || '9999999999',
          gender: user.gender,
          userName: user.name,
          gameType: chosenGame
        })
      });

      const data = await res.json();

      if (!data.success) {
        if (data.eligible === false) {
          setGameState('ineligible');
          setErrorMessage(data.ineligibilityMessage || config?.ineligibilityMessage);
          return;
        }

        if (data.alreadyPlayed) {
          setGameState('already_played');
          setWonReward(data.lastWonReward);
          calculateCountdown(data.nextPlayAt);
          return;
        }

        setErrorMessage(data.error || 'Something went wrong. Please try again.');
        return;
      }

      // Success
      setWonReward(data.wonReward);
      
      if (chosenGame === 'wheel') {
        setTargetIndex(data.targetIndex);
        setGameState('spinning');
      } else {
        // Mystery Box
        setTimeout(() => {
          setGameState('won');
          gameAudio.playVictory();
          triggerConfetti();
        }, 1200);
      }

    } catch (e: any) {
      setErrorMessage(e.message || 'Network error, please try again.');
    }
  };

  // Wheel Spin Completed
  const handleWheelEnd = () => {
    setGameState('won');
    gameAudio.playVictory();
    triggerConfetti();
  };

  // Copy Coupon Code
  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Gender Selection for existing users without gender in profile
  const handleSelectGender = async (gender: 'male' | 'female' | 'other') => {
    updateUserGender(gender);
    setErrorMessage('');
    // Also save in customer records
    if (user?.phone) {
      try {
        await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: user.phone,
            name: user.name,
            email: user.email,
            gender
          })
        });
      } catch (e) {}
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Confetti Overlay */}
      <canvas
        ref={confettiCanvasRef}
        className="pointer-events-none absolute inset-0 z-50 w-full h-full"
      />

      <div className="relative w-full max-w-lg bg-gradient-to-b from-navy-950 via-slate-900 to-navy-950 rounded-3xl border border-amber-500/30 shadow-[0_0_50px_rgba(212,175,55,0.25)] text-white overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
                {config?.title || "Eyevengers Lucky Draw"}
              </h2>
              <p className="text-[11px] text-gray-400">
                {config?.subtitle || "Spin & Win Exclusive Vouchers"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Game Mode Tabs (If 'both' is allowed) */}
        {config?.activeGame === 'both' && gameState === 'idle' && (
          <div className="flex p-1.5 mx-6 mt-3 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('wheel')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'wheel'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              🎡 Lucky Wheel
            </button>
            <button
              onClick={() => setActiveTab('mystery_box')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'mystery_box'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              🎁 Mystery Boxes
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center">

          {/* 1. NOT LOGGED IN STATE */}
          {!isLoggedIn ? (
            <div className="text-center py-8 px-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 animate-pulse">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Member Login Required</h3>
              <p className="text-sm text-gray-300 max-w-sm mb-6 leading-relaxed">
                Log in to your Eyevengers account to unlock your daily lucky spin and win instant discount coupons!
              </p>
              <button
                onClick={() => {
                  onClose();
                  openLoginModal();
                }}
                className="w-full max-w-xs py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-transform"
              >
                Login to Play Free
              </button>
            </div>
          ) : !user?.gender ? (
            /* 2. GENDER SELECTION PROMPT (If existing user has no gender saved) */
            <div className="text-center py-6 px-4 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                <Sparkles size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">One Quick Step!</h3>
              <p className="text-xs text-gray-300 mb-5 max-w-xs">
                Please select your gender profile so we can tailor exclusive rewards and discounts for you:
              </p>
              <div className="flex gap-2.5 w-full max-w-xs justify-center mb-4">
                {(['male', 'female', 'other'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => handleSelectGender(g)}
                    className="flex-1 py-3 px-2 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-slate-950 border border-white/15 text-xs font-bold capitalize transition-all"
                  >
                    {g === 'male' ? '👨 Male' : g === 'female' ? '👩 Female' : '🌈 Other'}
                  </button>
                ))}
              </div>
            </div>
          ) : gameState === 'ineligible' ? (
            /* 3. INELIGIBLE TARGET AUDIENCE STATE */
            <div className="text-center py-8 px-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Offer Not Applicable</h3>
              <p className="text-sm text-gray-300 max-w-sm mb-6 leading-relaxed">
                {errorMessage || config?.ineligibilityMessage || "Yeh special lucky reward abhi selected category ke users ke liye active hai."}
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="w-full max-w-xs py-3.5 px-6 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                Explore Eyeglasses
              </Link>
            </div>
          ) : gameState === 'already_played' ? (
            /* 4. 24-HOUR COOLDOWN ACTIVE */
            <div className="text-center py-6 px-4 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                <Clock size={28} />
              </div>
              <h3 className="text-xl font-black text-white mb-1">Played Today!</h3>
              <p className="text-xs text-gray-300 mb-4">
                You get 1 free lucky chance every 24 hours. Next spin unlocks in:
              </p>
              <div className="py-2.5 px-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-lg font-black tracking-wider mb-6">
                ⏱ {nextPlayCountdown || "Come back tomorrow"}
              </div>

              {wonReward && wonReward.couponCode && (
                <div className="w-full max-w-sm p-4 rounded-2xl bg-white/5 border border-white/10 text-left mb-4">
                  <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Your Active Coupon:</div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-amber-300 tracking-wide">{wonReward.couponCode}</span>
                    <button
                      onClick={() => handleCopyCode(wonReward.couponCode)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1"
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      {copiedCode ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{wonReward.label} ({wonReward.description})</div>
                </div>
              )}

              <Link
                href="/products"
                onClick={onClose}
                className="w-full max-w-xs py-3 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm tracking-wide text-center"
              >
                Shop With Coupon Now
              </Link>
            </div>
          ) : gameState === 'won' && wonReward ? (
            /* 5. VICTORY / WON SCREEN */
            <div className="text-center py-6 px-4 flex flex-col items-center animate-scaleIn">
              <div className="text-4xl mb-2 animate-bounce">🎉</div>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 mb-1">
                Congratulations!
              </h3>
              <p className="text-xs text-gray-300 mb-4">You unlocked an exclusive reward</p>

              <div className="w-full max-w-sm p-5 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-500/5 border border-amber-500/40 text-center mb-6 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                <div className="text-2xl sm:text-3xl font-black text-amber-300 mb-1">
                  {wonReward.label}
                </div>
                <div className="text-xs text-gray-300 mb-4">{wonReward.description}</div>

                {wonReward.couponCode ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-amber-400/50">
                    <span className="font-mono font-black text-base text-amber-400 tracking-wider">
                      {wonReward.couponCode}
                    </span>
                    <button
                      onClick={() => handleCopyCode(wonReward.couponCode)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      {copiedCode ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">No coupon required. Better luck next time!</div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Link
                  href="/products"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide text-center hover:brightness-110 shadow-lg"
                >
                  Shop Eyeglasses Now
                </Link>
                <button
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* 6. READY / PLAYING SCREEN */
            <div className="w-full flex flex-col items-center">
              {errorMessage && (
                <div className="w-full max-w-sm mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {activeTab === 'wheel' ? (
                <SpinningWheel
                  rewards={config?.rewards || []}
                  targetIndex={targetIndex}
                  isSpinning={gameState === 'spinning'}
                  onSpinStart={() => handlePlay('wheel')}
                  onSpinEnd={handleWheelEnd}
                  disabled={gameState === 'spinning'}
                />
              ) : (
                <MysteryBoxes
                  onSelectBox={() => handlePlay('mystery_box')}
                  isLoading={gameState === 'spinning'}
                  disabled={gameState === 'spinning'}
                />
              )}
            </div>
          )}

        </div>

        {/* Footer info note */}
        <div className="px-6 py-3 bg-black/40 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-400">
            * 1 free chance every 24 hours per verified account. Coupons valid on online orders.
          </p>
        </div>

      </div>
    </div>
  );
}
