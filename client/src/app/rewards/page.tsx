"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { SpinningWheel } from '@/components/gamification/SpinningWheel';
import { MysteryBoxes } from '@/components/gamification/MysteryBoxes';
import { gameAudio } from '@/utils/gameAudio';
import { Sparkles, Gift, Lock, Clock, Copy, Check, AlertCircle, ShoppingBag, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

export default function RewardsPage() {
  const { user, isLoggedIn, openLoginModal, updateUserGender } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'wheel' | 'mystery_box'>('wheel');
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [gameState, setGameState] = useState<'idle' | 'spinning' | 'won' | 'ineligible' | 'already_played'>('idle');
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [wonReward, setWonReward] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [nextPlayCountdown, setNextPlayCountdown] = useState('');

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const url = user?.phone ? `/api/gamification?phone=${encodeURIComponent(user.phone)}` : '/api/gamification';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setConfig(data);
        if (data.activeGame === 'wheel') setActiveTab('wheel');
        else if (data.activeGame === 'mystery_box') setActiveTab('mystery_box');

        if (data.userStatus && !data.userStatus.canPlay) {
          setGameState('already_played');
          setWonReward(data.userStatus.lastWon);
          calculateCountdown(data.userStatus.nextPlayAt);
        } else {
          setGameState('idle');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [isLoggedIn, user?.phone]);

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

  const handlePlay = async (chosenGame: 'wheel' | 'mystery_box') => {
    if (!isLoggedIn || !user) {
      openLoginModal();
      return;
    }

    setErrorMessage('');

    // 🚀 Start spinning immediately on click (0ms delay)
    if (chosenGame === 'wheel') {
      setGameState('spinning');
    }

    try {
      const res = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'play',
          phone: user.phone || '9999999999',
          gender: user.gender || 'other',
          userName: user.name,
          gameType: chosenGame
        })
      });

      const data = await res.json();

      if (!data.success) {
        setGameState('idle');
        setTargetIndex(null);

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

      setWonReward(data.wonReward);
      const target = data.targetIndex !== undefined ? data.targetIndex : (data.sliceIndex !== undefined ? data.sliceIndex : 0);

      if (chosenGame === 'wheel') {
        setTargetIndex(target);
      } else {
        setTimeout(() => {
          setGameState('won');
          gameAudio.playVictory();
        }, 1200);
      }
    } catch (e: any) {
      setGameState('idle');
      setTargetIndex(null);
      setErrorMessage(e.message || 'Network error');
    }
  };

  const handleWheelEnd = () => {
    setGameState('won');
  };

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSelectGender = async (gender: 'male' | 'female' | 'other') => {
    updateUserGender(gender);
    setErrorMessage('');
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

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500 selection:text-slate-950 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-8 sm:pt-16 sm:pb-12 border-b border-white/10 bg-gradient-to-b from-navy-950 via-slate-900 to-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-4">
            <Sparkles size={14} />
            Exclusive Member Rewards
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 mb-3">
            {config?.title || "Lucky Spin & Mystery Box Zone"}
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto">
            {config?.subtitle || "Spin daily, unlock secret discount coupons, free lenses, and mega jackpots on designer frames."}
          </p>

          {/* Mode Switcher */}
          {config?.activeGame === 'both' && (
            <div className="inline-flex p-1.5 mt-6 bg-white/5 rounded-2xl border border-white/15">
              <button
                onClick={() => { setActiveTab('wheel'); setGameState('idle'); }}
                className={`px-5 py-2.5 text-xs sm:text-sm font-black rounded-xl flex items-center gap-2 transition-all ${
                  activeTab === 'wheel'
                    ? 'bg-amber-500 text-slate-950 shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                🎡 Lucky Spin Wheel
              </button>
              <button
                onClick={() => { setActiveTab('mystery_box'); setGameState('idle'); }}
                className={`px-5 py-2.5 text-xs sm:text-sm font-black rounded-xl flex items-center gap-2 transition-all ${
                  activeTab === 'mystery_box'
                    ? 'bg-amber-500 text-slate-950 shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                🎁 Mystery Gift Boxes
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Interactive Stage */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-b from-navy-900/60 to-slate-900/60 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
          
          {isLoading ? (
            <div className="py-20 text-center text-amber-400 font-bold">
              Loading reward zone...
            </div>
          ) : !isLoggedIn ? (
            /* Login Gate */
            <div className="text-center py-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 animate-pulse">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-black mb-2">Member Login Required</h2>
              <p className="text-sm text-gray-300 max-w-sm mb-6 leading-relaxed">
                Log in with your Eyevengers mobile number to claim your 1 free spin every 24 hours.
              </p>
              <button
                onClick={() => openLoginModal()}
                className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Login to Play Now
              </button>
            </div>
          ) : gameState === 'ineligible' ? (
            /* Ineligible Audience */
            <div className="text-center py-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-black mb-2">Exclusive Reward Zone</h2>
              <p className="text-sm text-gray-300 max-w-md mb-6 leading-relaxed">
                {errorMessage || config?.ineligibilityMessage}
              </p>
              <Link
                href="/products"
                className="py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm flex items-center gap-2"
              >
                <ShoppingBag size={18} />
                Explore Eyeglasses
              </Link>
            </div>
          ) : gameState === 'already_played' ? (
            /* Cooldown Active */
            <div className="text-center py-8 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                <Clock size={28} />
              </div>
              <h2 className="text-2xl font-black mb-1">Already Played Today!</h2>
              <p className="text-xs text-gray-300 mb-4">
                You get 1 free lucky spin every 24 hours. Next lucky draw unlocks in:
              </p>
              <div className="py-2.5 px-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xl font-black mb-6">
                ⏱ {nextPlayCountdown || "Come back tomorrow"}
              </div>

              {wonReward && wonReward.couponCode && (
                <div className="w-full max-w-md p-4 rounded-2xl bg-white/5 border border-white/10 text-left mb-6">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Your Active Coupon:</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-amber-300">{wonReward.couponCode}</span>
                    <button
                      onClick={() => handleCopyCode(wonReward.couponCode)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1.5"
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      {copiedCode ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{wonReward.label} ({wonReward.description})</div>
                </div>
              )}

              <Link
                href="/products"
                className="py-3 px-8 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm"
              >
                Shop With Coupon Now
              </Link>
            </div>
          ) : gameState === 'won' && wonReward ? (
            /* Won Screen */
            <div className="text-center py-8 flex flex-col items-center">
              <div className="text-5xl mb-2 animate-bounce">🎉</div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 mb-1">
                Congratulations!
              </h2>
              <p className="text-sm text-gray-300 mb-6">You unlocked an exclusive Eyevengers voucher</p>

              <div className="w-full max-w-md p-6 rounded-3xl bg-gradient-to-b from-amber-500/20 to-amber-500/5 border border-amber-500/40 text-center mb-6">
                <div className="text-3xl font-black text-amber-300 mb-1">{wonReward.label}</div>
                <div className="text-xs text-gray-300 mb-4">{wonReward.description}</div>

                {wonReward.couponCode ? (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-amber-400/50">
                    <span className="font-mono font-black text-lg text-amber-400 tracking-wider">
                      {wonReward.couponCode}
                    </span>
                    <button
                      onClick={() => handleCopyCode(wonReward.couponCode)}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      {copiedCode ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">No coupon required. Better luck next time!</div>
                )}
              </div>

              <Link
                href="/products"
                className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg"
              >
                Apply Coupon & Shop Frames
              </Link>
            </div>
          ) : (
            /* Ready to play */
            <div className="flex flex-col items-center">
              {errorMessage && (
                <div className="w-full max-w-md mb-6 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
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

        {/* Feature Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap size={20} />
            </span>
            <div>
              <h4 className="text-sm font-bold">100% Instant</h4>
              <p className="text-xs text-gray-400">Coupon code is revealed immediately</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Clock size={20} />
            </span>
            <div>
              <h4 className="text-sm font-bold">Daily Free Spin</h4>
              <p className="text-xs text-gray-400">Reset every 24 hours for all members</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h4 className="text-sm font-bold">Verified Checkout</h4>
              <p className="text-xs text-gray-400">Directly applicable during checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
