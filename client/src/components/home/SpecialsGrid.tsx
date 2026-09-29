"use client";

import React from 'react';
import Link from 'next/link';
import { Glasses, Sun, ScanFace, Sparkles } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { isVideoUrl } from '@/utils/media';

interface SpecialsItem {
  label?: string;
  title?: string;
  ctaText?: string;
  headline?: string;
  iconImageUrl?: string;
  imageUrl?: string;
  ribbonText?: string;
  targetUrl?: string;
  linkedOfferId?: string;
}

interface SpecialsGridProps {
  data: {
    title: string;
    items: SpecialsItem[];
  };
}

export function SpecialsGrid({ data }: SpecialsGridProps) {
  return (
    <div className="py-2.5 md:py-5 max-w-7xl mx-auto px-3.5 sm:px-4 md:px-6">
      <h2 className="text-[17px] md:text-2xl font-bold text-gray-900 tracking-tight mb-2 md:mb-3">{data.title}</h2>
      
      <div className="grid grid-cols-4 gap-2 md:gap-4 pb-1 w-full">
        {data.items?.map((item, index) => {
          const imageSrc = item.iconImageUrl || item.imageUrl;
          const displayLabel = item.label || item.title || item.ctaText || item.headline || '';
          const finalUrl = item.targetUrl || (item.linkedOfferId ? `/offers/${item.linkedOfferId}` : '#');

          return (
            <Link 
              key={index}
              href={finalUrl}
              className="flex flex-col items-center group w-full"
            >
              {/* Outer container with overflow-visible */}
              <div className="relative w-full aspect-square mb-1.5 md:mb-2">
                {/* Centered Ribbon Badge - Flush inside top edge of tile */}
                {item.ribbonText && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-[#181E3B] text-white text-[8px] md:text-[9.5px] font-bold px-2 md:px-2.5 py-0.5 rounded-b-[6px] shadow-2xs z-30 tracking-tight whitespace-nowrap">
                    {item.ribbonText}
                  </div>
                )}

                {/* Inner media container with rounded corners and overflow-hidden */}
                <div className="relative w-full h-full rounded-[16px] md:rounded-[24px] overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-brand-navy/40 group-hover:shadow-sm transition-all">
                  {imageSrc ? (
                    isVideoUrl(imageSrc) ? (
                      <video 
                        src={imageSrc} 
                        className="absolute inset-0 w-full h-full object-cover rounded-[16px] md:rounded-[24px] group-hover:scale-105 transition-transform duration-300"
                        autoPlay loop muted playsInline preload="auto"
                      />
                    ) : (
                      <OptimizedImage 
                        src={imageSrc} 
                        alt={displayLabel || 'Special Offer'}
                        fill
                        sizes="(max-width: 768px) 25vw, 250px"
                        className="object-cover rounded-[16px] md:rounded-[24px] group-hover:scale-105 transition-transform duration-300"
                      />
                    )
                  ) : (
                    <div className="w-full h-full text-gray-300 group-hover:scale-110 group-hover:text-brand-navy transition-all flex items-center justify-center bg-gray-50">
                      {displayLabel.toLowerCase().includes('sun') ? <Sun size={32} /> :
                       displayLabel.toLowerCase().includes('lens') || displayLabel.toLowerCase().includes('power') ? <Glasses size={32} /> :
                       displayLabel.toLowerCase().includes('reading') ? <ScanFace size={32} /> :
                       <Sparkles size={32} />}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Text label right under tile */}
              <span className="text-[11px] md:text-base font-medium md:font-bold text-gray-700 md:text-gray-800 text-center leading-tight group-hover:text-brand-navy transition-colors">
                {displayLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

