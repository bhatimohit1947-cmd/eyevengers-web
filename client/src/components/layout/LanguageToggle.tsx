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
    const host = window.location.hostname;
    const parts = host.split('.');
    const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : host;

    const cookieVal = nextLang === 'hi' ? '/en/hi' : '/en/en';

    // 1. Set Google Translate cookie on host and root domain
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    if (rootDomain !== 'localhost' && rootDomain !== '127.0.0.1') {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=.${rootDomain};`;
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${rootDomain};`;
      document.cookie = `googtrans=${cookieVal}; path=/; domain=.${host};`;
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${host};`;
    }

    if (nextLang === 'en') {
      // Clear cookie completely to restore English
      document.cookie = `googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      if (rootDomain !== 'localhost' && rootDomain !== '127.0.0.1') {
        document.cookie = `googtrans=; path=/; domain=.${rootDomain}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        document.cookie = `googtrans=; path=/; domain=${rootDomain}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        document.cookie = `googtrans=; path=/; domain=.${host}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        document.cookie = `googtrans=; path=/; domain=${host}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      }
    }

    localStorage.setItem('eyevengers_lang', nextLang);
    setCurrentLang(nextLang);

    // 2. Trigger Google Translate combo if already mounted
    const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (combo) {
      combo.value = nextLang;
      combo.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 3. Reload so Google Translate translates the entire page cleanly without artifacts
    window.location.reload();
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
      className="notranslate shrink-0 inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-brand-navy text-white hover:bg-blue-950 text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer z-10"
    >
      <Languages size={14} className="text-brand-gold animate-pulse" aria-hidden="true" />
      <span className="font-bold tracking-wide">
        {currentLang === 'en' ? 'हिन्दी' : 'English'}
      </span>
    </button>
  );
}
