"use client";

import React from 'react';
import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { isVideoUrl } from '@/utils/media';

interface CategoryTile {
  label: string;
  imageUrl: string;
  targetUrl: string;
  badgeText?: string;
  linkedOfferId?: string;
}

interface CategoryRailProps {
  data: {
    sectionTitle: string;
    sectionTag?: string;
    tiles: CategoryTile[];
  };
}

export function CategoryRail({ data }: CategoryRailProps) {
  return (
    <div className="py-2 md:py-3.5 max-w-7xl mx-auto px-3.5 sm:px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 md:mb-3">
        <h2 className="text-[17px] md:text-2xl font-black text-brand-navy tracking-tight">{data.sectionTitle}</h2>
        {data.sectionTag && (
          <span className="bg-[#EEF4FF] text-[#1E3A8A] border border-[#D0E0FF] text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            {data.sectionTag}
          </span>
        )}
      </div>

      {/* Tiles Rail (Grid Layout to fill screen on all devices) */}
      <div className="grid grid-cols-4 gap-2 md:gap-4 w-full">
        {data.tiles?.map((tile, index) => {
          const finalUrl = tile.targetUrl || (tile.linkedOfferId ? `/offers/${tile.linkedOfferId}` : '#');
          return (
          <Link 
            key={index}
            href={finalUrl}
            className="flex flex-col items-center group w-full"
          >
            <div className="relative w-full aspect-square rounded-[16px] md:rounded-[24px] bg-[#f8f9fa] flex items-center justify-center border border-gray-100 group-hover:border-brand-navy/30 group-hover:shadow-sm transition-all mb-1 md:mb-2 overflow-hidden">
              {/* Badge */}
              {tile.badgeText && (
                <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 bg-[#161F38] text-white text-[8px] md:text-[9.5px] font-black px-2 py-0.5 rounded-full shadow-2xs z-10 whitespace-nowrap">
                  {tile.badgeText}
                </div>
              )}

              {/* Image */}
              {tile.imageUrl ? (
                isVideoUrl(tile.imageUrl) ? (
                  <video 
                    src={tile.imageUrl} 
                    className="absolute inset-0 w-full h-full object-cover rounded-[16px] md:rounded-[24px] group-hover:scale-105 transition-transform"
                    autoPlay loop muted playsInline preload="auto"
                  />
                ) : (
                  <OptimizedImage 
                    src={tile.imageUrl} 
                    alt={tile.label} 
                    fill
                    sizes="(max-width: 768px) 25vw, 200px"
                    className="object-cover rounded-[16px] md:rounded-[24px] group-hover:scale-105 transition-transform"
                  />
                )
              ) : (
                <svg className="w-1/2 h-1/2 text-gray-300 group-hover:scale-110 transition-transform relative z-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            
            <span className="text-[11.5px] md:text-sm font-semibold text-gray-800 text-center leading-tight group-hover:text-brand-navy transition-colors">
              {tile.label || (tile as any).title || (tile as any).ctaText || (tile as any).headline}
            </span>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
