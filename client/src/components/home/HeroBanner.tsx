"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Sparkles } from 'lucide-react';

interface HeroBannerProps {
  data: {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    targetUrl?: string;
    subtextPrimary?: string;
    subtextSecondary?: string;
    bannerImageUrl?: string;
    countdownEndDatetime?: string;
    badgeText?: string;
    linkedOfferId?: string;
  };
}

export function HeroBanner({ data }: HeroBannerProps) {
  const [offerData, setOfferData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Fetch dynamic offer data if linked
  useEffect(() => {
    if (data.linkedOfferId) {
      fetch(`https://eyevengers-web.onrender.com/api/offers/${data.linkedOfferId}`)
        .then(res => res.json())
        .then(offer => {
          if (!offer.error) setOfferData(offer);
        })
        .catch(err => console.error("Failed to fetch offer for HeroBanner", err));
    }
  }, [data.linkedOfferId]);

  useEffect(() => {
    // Prefer dynamic offer end date over static config
    // If offer is linked but lacks an end date, we intentionally set it to null so the timer hides
    let targetDatetime = data.countdownEndDatetime;
    if (data.linkedOfferId && offerData) {
      targetDatetime = offerData.endDatetime || null;
    }
    
    if (!targetDatetime) return;
    const endDate = new Date(targetDatetime).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = endDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data.countdownEndDatetime, offerData]);

  const pad = (num: number) => num.toString().padStart(2, '0');

  const finalHref = data.targetUrl || data.ctaUrl || (data.linkedOfferId ? `/offers/${data.linkedOfferId}` : '/');

  return (
    <div className="w-full relative overflow-hidden group">
      
      <Link href={finalHref} className="block w-full">
        <div className={`w-full relative flex items-center ${!data.bannerImageUrl ? 'min-h-[250px] md:min-h-[400px]' : ''}`}>
          
          {/* If admin uploads a poster image, it takes over the background without cropping */}
          {data.bannerImageUrl ? (
            <div className="w-full relative z-0">
              <img 
                src={data.bannerImageUrl} 
                alt="Banner Poster" 
                className="w-full h-auto block object-contain"
              />
            </div>
          ) : (
            /* Fallback HTML Background if no poster image is uploaded */
            <div className="absolute inset-0 z-0 bg-[#004777] bg-gradient-to-r from-[#003b62] to-[#005a96]">
              <div className="absolute top-1/2 left-3/4 -translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-400/20 rounded-full blur-[100px]"></div>
            </div>
          )}

          {/* Overlaid Timer Feature (This remains fixed even if poster changes) */}
          {((data.linkedOfferId && offerData && offerData.endDatetime) || (!data.linkedOfferId && data.countdownEndDatetime)) && (
            <div className="absolute top-4 md:top-6 left-0 right-0 flex flex-col items-center z-30 drop-shadow-md">
              {data.badgeText && (
                <div className="bg-white text-black border border-gray-200 text-[8px] md:text-[10px] font-bold px-2 md:px-3 py-0.5 md:py-1 rounded shadow-sm mb-[-8px] md:mb-[-12px] z-10 uppercase tracking-wider">
                  {data.badgeText}
                </div>
              )}
              <div className="flex items-center w-full max-w-lg justify-center relative">
                <div className="w-16 md:w-32 h-px bg-[#0a1128]"></div>
                <div className="bg-[#0a1128] text-white px-3 md:px-6 py-1 md:py-2 rounded-full flex items-center gap-1.5 md:gap-2 mx-0 shadow-lg relative z-0">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  <span className="font-bold text-[10px] md:text-base tracking-widest">
                    {pad(timeLeft.days)}d : {pad(timeLeft.hours)}h : {pad(timeLeft.minutes)}m
                  </span>
                </div>
                <div className="w-16 md:w-32 h-px bg-[#0a1128]"></div>
              </div>
            </div>
          )}

          {/* Fallback HTML Content if no poster image is uploaded */}
          {!data.bannerImageUrl && (
            <div className="max-w-7xl mx-auto w-full px-4 md:px-12 relative z-10 flex flex-col md:flex-row items-center justify-between pb-8 pt-20 md:pb-24 md:pt-28">
              <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left z-20">
                <h1 className="text-3xl md:text-6xl lg:text-[72px] font-black uppercase tracking-tight leading-[1.05] mb-2 md:mb-4 text-white drop-shadow-sm whitespace-pre-line">
                  {data.title}
                </h1>
                <p className="text-sm md:text-2xl font-medium mb-4 md:mb-8 text-gray-100">
                  {data.subtitle}
                </p>
                <div className="bg-white text-brand-navy font-bold px-6 py-2.5 md:px-10 md:py-4 rounded-full transition-colors text-sm md:text-lg shadow-lg block w-fit mx-auto md:mx-0">
                  {data.ctaLabel}
                </div>
                {(data.subtextPrimary || data.subtextSecondary) && (
                  <div className="mt-4 md:mt-8 flex flex-col items-center md:items-start gap-0.5 md:gap-1">
                    {data.subtextPrimary && <p className="text-sm md:text-xl font-semibold text-white">{data.subtextPrimary}</p>}
                    {data.subtextSecondary && <p className="text-xs md:text-base text-gray-200">{data.subtextSecondary}</p>}
                  </div>
                )}
              </div>

              {/* Hide the massive SVG glasses on mobile to save vertical space */}
              <div className="hidden md:flex w-full md:w-1/2 mt-12 md:mt-0 justify-center md:justify-end relative h-48 md:h-[400px] z-10">
                <div className="relative w-full max-w-[300px] md:max-w-[500px] h-full flex items-center justify-center transform md:scale-125 md:translate-x-12">
                   <div className="w-full h-full relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 rounded-full blur-2xl"></div>
                      <svg className="w-full h-full text-brand-gold/80 drop-shadow-2xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16s2-3 9-3 9 3 9 3-2-8-9-8-9 8-9 8z" />
                        <circle cx="7" cy="14" r="4" fill="rgba(255,255,255,0.1)" />
                        <circle cx="17" cy="14" r="4" fill="rgba(255,255,255,0.1)" />
                      </svg>
                   </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </Link>
    </div>
  );
}
