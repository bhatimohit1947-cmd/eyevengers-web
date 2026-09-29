"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { isVideoUrl } from '@/utils/media';

interface SecondaryBannerProps {
  data: {
    title?: string;
    subtitle?: string;
    description?: string;
    ctaLabel?: string;
    bottomRibbonText?: string;
    bannerImageUrl?: string;
    ctaUrl?: string;
    targetUrl?: string;
    linkedOfferId?: string;
  };
}

export function SecondaryBanner({ data }: SecondaryBannerProps) {
  const [offerData, setOfferData] = useState<any>(null);

  useEffect(() => {
    if (data.linkedOfferId) {
      fetch(`https://eyevengers-web.onrender.com/api/offers/${data.linkedOfferId}`)
        .then(res => res.json())
        .then(offer => {
          if (!offer.error) setOfferData(offer);
        })
        .catch(err => console.error("Failed to fetch offer for SecondaryBanner", err));
    }
  }, [data.linkedOfferId]);

  // Format dynamic text if offer has endDatetime
  let displayRibbonText = data.bottomRibbonText;
  if (data.linkedOfferId && offerData) {
    if (offerData.endDatetime) {
      const formattedDate = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date(offerData.endDatetime));
      displayRibbonText = `Ending on ${formattedDate}`;
    } else {
      displayRibbonText = `Ending Soon`;
    }
  }

  const finalHref = data.targetUrl || data.ctaUrl || (data.linkedOfferId ? `/offers/${data.linkedOfferId}` : '/');

  return (
    <Link href={finalHref} className="block w-full max-w-7xl mx-auto px-3.5 sm:px-4 md:px-6 group">
      <div className="relative w-full overflow-visible">
        
        {/* Main Banner Container */}
        <div className="relative w-full aspect-[3.6/1] md:aspect-[4.5/1] rounded-2xl md:rounded-[24px] overflow-hidden bg-slate-950 shadow-xs hover:shadow-md transition-all">
          {/* If an image or video poster is provided */}
          {data.bannerImageUrl ? (
            isVideoUrl(data.bannerImageUrl) ? (
              <video 
                src={data.bannerImageUrl} 
                className="w-full h-full object-cover rounded-2xl md:rounded-[24px]"
                autoPlay loop muted playsInline preload="auto"
              />
            ) : (
              <OptimizedImage 
                src={data.bannerImageUrl} 
                alt={data.title || "Offer Banner"} 
                fill
                sizes="(max-width: 768px) 100vw, 1280px"
                className="w-full h-full object-cover rounded-2xl md:rounded-[24px]"
              />
            )
          ) : (
            /* Fallback HTML Layout exactly matching the "hustlr CLUB" screenshot */
            <div className="absolute inset-0 z-0 flex items-center justify-between px-4 sm:px-6 md:px-10 py-3 md:py-5">
              {/* Background Radials */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent"></div>
                 <div className="absolute top-1/2 left-[40%] -translate-y-1/2 w-48 h-48 border border-white/5 rounded-full"></div>
                 <div className="absolute top-1/2 left-[40%] -translate-y-1/2 w-72 h-72 border border-white/5 rounded-full"></div>
              </div>

              {/* Text Left */}
              <div className="relative z-10 w-[65%] flex flex-col items-start justify-center">
                <h3 className="text-white text-xs sm:text-sm md:text-lg font-medium mb-0.5 flex items-center">
                  <span className="mr-1 opacity-90 font-normal">Join</span>
                  <span className="font-bold tracking-tight">{data.title?.replace('Join ', '') || 'hustlr CLUB'}</span>
                </h3>
                <h2 className="text-white text-sm sm:text-base md:text-2xl font-black leading-tight mb-0.5">
                  {data.subtitle || 'Get FREE Hustlr Eyeglasses'}
                </h2>
                <p className="text-blue-200 text-[10px] sm:text-xs md:text-sm font-medium opacity-80 line-clamp-1">
                  {data.description || 'with BLU screen lenses'}
                </p>
              </div>

              {/* Glasses Right Placeholder */}
              <div className="relative z-10 w-[35%] h-full flex justify-end items-center right-0">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-40 md:h-40 transform scale-110">
                  <svg viewBox="0 0 100 50" className="w-full h-full text-blue-400 drop-shadow-xl opacity-90" fill="currentColor">
                    <path d="M10,20 C10,10 25,10 40,15 C45,17 45,35 40,40 C30,45 10,40 10,20 Z" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M60,15 C75,10 90,10 90,20 C90,40 70,45 60,40 C55,35 55,17 60,15 Z" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M40,15 C45,12 55,12 60,15" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M10,20 C5,18 0,15 0,10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M90,20 C95,18 100,15 100,10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Restored Centered Bottom Ribbon Pill */}
        {displayRibbonText && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-[#0A1128] border border-gray-600 text-[#E0E5FF] text-[10px] md:text-xs font-medium px-4 py-1.5 rounded-full shadow-lg flex items-center justify-center whitespace-nowrap">
              {displayRibbonText}
            </div>
          </div>
        )}

      </div>
    </Link>
  );
}
