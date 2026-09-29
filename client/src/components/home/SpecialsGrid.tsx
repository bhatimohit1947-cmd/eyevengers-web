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
    <div className="py-8 max-w-7xl mx-auto px-4 md:px-0">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">{data.title}</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-6">
        {data.items?.map((item, index) => {
          const imageSrc = item.iconImageUrl || item.imageUrl;
          const displayLabel = item.label || item.title || item.ctaText || item.headline || '';
          const finalUrl = item.targetUrl || (item.linkedOfferId ? `/offers/${item.linkedOfferId}` : '#');

          return (
            <Link 
              key={index}
              href={finalUrl}
              className="flex flex-col items-center justify-between group relative bg-white border border-gray-100 hover:border-brand-navy rounded-2xl md:rounded-3xl p-3 md:p-4 hover:shadow-lg transition-all duration-300 w-full h-full overflow-hidden"
            >
              {item.ribbonText && (
                <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[9px] md:text-[10px] font-black px-2 md:px-2.5 py-0.5 rounded-full shadow-md z-10 uppercase tracking-wider">
                  {item.ribbonText}
                </div>
              )}
              
              {/* Constant image container that auto-fits any small/large image perfectly */}
              <div className="relative w-full aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center mb-2.5 md:mb-3">
                {imageSrc ? (
                  isVideoUrl(imageSrc) ? (
                    <video 
                      src={imageSrc} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      autoPlay loop muted playsInline preload="auto"
                    />
                  ) : (
                    <OptimizedImage 
                      src={imageSrc} 
                      alt={displayLabel || 'Special Offer'}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  )
                ) : (
                  <div className="w-full h-full text-gray-300 group-hover:scale-110 group-hover:text-brand-navy transition-all flex items-center justify-center bg-slate-50">
                    {displayLabel.toLowerCase().includes('sun') ? <Sun size={36} /> :
                     displayLabel.toLowerCase().includes('lens') || displayLabel.toLowerCase().includes('power') ? <Glasses size={36} /> :
                     displayLabel.toLowerCase().includes('reading') ? <ScanFace size={36} /> :
                     <Sparkles size={36} />}
                  </div>
                )}
              </div>
              
              {/* Constant label area */}
              <div className="w-full text-center px-1">
                <span className="text-xs md:text-sm lg:text-base font-bold text-gray-800 text-center leading-snug group-hover:text-brand-navy transition-colors line-clamp-1">
                  {displayLabel}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

