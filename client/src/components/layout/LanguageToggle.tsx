"use client";

import React, { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';

interface LanguageToggleProps {
  variant?: 'header' | 'drawer';
}

export function LanguageToggle({ variant = 'header' }: LanguageToggleProps) {
  const [currentLang, setCurrentLang] = useState<'en' | 'hi'>('en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check initial language preference
    const hasHindiCookie = document.cookie.includes('googtrans=/en/hi');
    const storedLang = localStorage.getItem('eyevengers_lang');

    if (hasHindiCookie || storedLang === 'hi') {
      setCurrentLang('hi');
    } else {
      setCurrentLang('en');
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'hi' : 'en';
    const domain = window.location.hostname;
    const isLocalhost = domain === 'localhost' || domain === '127.0.0.1';

    if (nextLang === 'hi') {
      // 1. Set Google Translate cookie to Hindi
      document.cookie = `googtrans=/en/hi; path=/;`;
      if (!isLocalhost) {
        document.cookie = `googtrans=/en/hi; path=/; domain=.${domain};`;
        document.cookie = `googtrans=/en/hi; path=/; domain=${domain};`;
      }
      localStorage.setItem('eyevengers_lang', 'hi');
      setCurrentLang('hi');

      // 2. Trigger Google Translate combo if already loaded
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (combo) {
        combo.value = 'hi';
        combo.dispatchEvent(new Event('change'));
      } else {
        // Reload to let Google Translate initialize with the new cookie
        window.location.reload();
      }
    } else {
      // 1. Clear Google Translate cookie to restore English
      document.cookie = `googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      document.cookie = `googtrans=/en/en; path=/;`;
      if (!isLocalhost) {
        document.cookie = `googtrans=; path=/; domain=.${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        document.cookie = `googtrans=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        document.cookie = `googtrans=/en/en; path=/; domain=.${domain};`;
        document.cookie = `googtrans=/en/en; path=/; domain=${domain};`;
      }
      localStorage.setItem('eyevengers_lang', 'en');
      setCurrentLang('en');

      // Reload so React DOM re-renders clean original English without Google Translate wrappers
      window.location.reload();
    }
  };

  if (variant === 'drawer') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className="notranslate w-full flex items-center justify-between px-4 py-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 text-brand-navy font-bold text-sm transition"
        aria-label={`Change language, currently ${currentLang === 'en' ? 'English' : 'Hindi'}`}
      >
        <span className="flex items-center gap-2.5">
          <Languages size={18} className="text-brand-navy" aria-hidden="true" />
          <span>Language / भाषा</span>
        </span>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-navy text-white shadow-xs">
          {currentLang === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={currentLang === 'en' ? 'Switch website to Hindi (हिन्दी में बदलें)' : 'Switch website to English'}
      aria-label={`Current language is ${currentLang === 'en' ? 'English' : 'Hindi'}. Click to switch to ${currentLang === 'en' ? 'Hindi' : 'English'}.`}
      className="notranslate shrink-0 inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-brand-navy text-white hover:bg-blue-950 text-[11px] sm:text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer z-10 border border-white/10"
    >
      <Languages size={12} className="text-brand-gold shrink-0" aria-hidden="true" />
      <span className="font-bold tracking-tight">
        {currentLang === 'en' ? 'हिन्दी' : 'EN'}
      </span>
    </button>
  );
}
