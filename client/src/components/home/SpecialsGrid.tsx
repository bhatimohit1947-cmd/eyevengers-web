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
      <h2 className="text-[18px] md:text-2xl font-bold text-gray-900 tracking-tight mb-4">{data.title}</h2>
      
      <div className="grid grid-cols-4 gap-2 md:gap-6 pb-2 w-full">
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
              {/* Full-fit tile with zero padding gaps, edge-to-edge rounded image */}
              <div className="relative w-full aspect-square rounded-[18px] md:rounded-[32px] overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-brand-navy/40 group-hover:shadow-sm transition-all mb-2 md:mb-3">
                {item.ribbonText && (
                  <div className="absolute top-1.5 left-1.5 md:top-2.5 md:left-2.5 bg-brand-navy text-white text-[8px] md:text-xs font-bold px-1.5 md:px-2.5 py-0.5 rounded shadow-sm z-10 whitespace-nowrap">
                    {item.ribbonText}
                  </div>
                )}
                
                {imageSrc ? (
                  isVideoUrl(imageSrc) ? (
                    <video 
                      src={imageSrc} 
                      className="absolute inset-0 w-full h-full object-cover rounded-[18px] md:rounded-[32px] group-hover:scale-105 transition-transform duration-300"
                      autoPlay loop muted playsInline preload="auto"
                    />
                  ) : (
                    <OptimizedImage 
                      src={imageSrc} 
                      alt={displayLabel || 'Special Offer'}
                      fill
                      sizes="(max-width: 768px) 25vw, 250px"
                      className="object-cover rounded-[18px] md:rounded-[32px] group-hover:scale-105 transition-transform duration-300"
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

