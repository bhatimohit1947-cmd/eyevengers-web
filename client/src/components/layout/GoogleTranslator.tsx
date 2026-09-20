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

    // 3. MutationObserver to permanently suppress Google's banner & body top: 40px shift
    const suppressGoogleBanner = () => {
      // Force body top to 0px
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.setProperty('top', '0px', 'important');
      }
      if (document.body.style.position && document.body.style.position !== 'static') {
        document.body.style.setProperty('position', 'static', 'important');
      }

      // Hide all injected banners, toolbars, and frames
      const banners = document.querySelectorAll(
        'body > .skiptranslate, iframe.goog-te-banner-frame, iframe[id*="google"], .goog-te-banner-frame, #goog-gt-tt, .VIpgJd-ZVi9od-OR9Gae-sztmxf'
      );
      banners.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.setProperty('display', 'none', 'important');
        htmlEl.style.setProperty('visibility', 'hidden', 'important');
        htmlEl.style.setProperty('height', '0px', 'important');
        htmlEl.style.setProperty('opacity', '0', 'important');
        htmlEl.style.setProperty('pointer-events', 'none', 'important');
      });
    };

    const observer = new MutationObserver(suppressGoogleBanner);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
      childList: true,
    });

    const interval = setInterval(suppressGoogleBanner, 100);
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // 4. Keep translation in sync during Next.js client-side navigation
  useEffect(() => {
    const isHindi = document.cookie.includes('googtrans=/en/hi') ||
      localStorage.getItem('eyevengers_lang') === 'hi';

    const timer = setTimeout(() => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (combo) {
        if (isHindi && combo.value !== 'hi') {
          combo.value = 'hi';
          combo.dispatchEvent(new Event('change'));
        } else if (!isHindi && combo.value && combo.value !== 'en' && combo.value !== '') {
          combo.value = 'en';
          combo.dispatchEvent(new Event('change'));
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      id="google_translate_element"
      aria-hidden="true"
      className="notranslate"
      style={{ display: 'none', position: 'absolute', opacity: 0, pointerEvents: 'none' }}
    />
  );
}
