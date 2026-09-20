"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export function GoogleTranslator() {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Define translation init callback
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi',
            autoDisplay: false,
            layout: window.google?.translate?.TranslateElement?.InlineLayout?.SIMPLE,
          },
          'google_translate_element'
        );
      }
    };

    // 2. Load Google Translate script once if not present
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    // 3. Keep body top at 0px and hide ONLY the top banner iframe
    const fixBanner = () => {
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.setProperty('top', '0px', 'important');
      }
      const bannerFrame = document.querySelector('iframe.goog-te-banner-frame') as HTMLElement | null;
      if (bannerFrame) {
        bannerFrame.style.setProperty('display', 'none', 'important');
        bannerFrame.style.setProperty('visibility', 'hidden', 'important');
        bannerFrame.style.setProperty('height', '0px', 'important');
        const parent = bannerFrame.parentElement;
        if (parent && parent.tagName === 'DIV' && parent !== document.body) {
          parent.style.setProperty('display', 'none', 'important');
          parent.style.setProperty('height', '0px', 'important');
        }
      }
    };

    const interval = setInterval(fixBanner, 200);
    const timeout = setTimeout(() => clearInterval(interval), 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // 4. Keep translation in sync during Next.js client-side navigation
  useEffect(() => {
    const isHindi = document.cookie.includes('googtrans=/en/hi') || 
                    localStorage.getItem('eyevengers_lang') === 'hi';

    if (isHindi) {
      const timer = setTimeout(() => {
        const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
        if (combo && combo.value !== 'hi') {
          combo.value = 'hi';
          combo.dispatchEvent(new Event('change'));
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <div 
      id="google_translate_element" 
      aria-hidden="true" 
      className="notranslate" 
      style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none', zIndex: -1 }} 
    />
  );
}
