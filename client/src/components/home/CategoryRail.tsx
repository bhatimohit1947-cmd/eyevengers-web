"use client";

import React from 'react';
import Link from 'next/link';

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
    <div className="py-8 max-w-7xl mx-auto md:px-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-0 mb-4">
        <h2 className="text-[18px] md:text-2xl font-black text-brand-navy tracking-tight">{data.sectionTitle}</h2>
        {data.sectionTag && (
          <span className="bg-brand-light text-brand-navy border border-gray-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            {data.sectionTag}
          </span>
        )}
      </div>

      {/* Tiles Rail (Grid Layout to fill screen on all devices) */}
      <div className="grid grid-cols-4 gap-2 md:gap-6 px-4 md:px-0 pb-4 w-full">
        {data.tiles.map((tile, index) => {
          const finalUrl = tile.targetUrl || (tile.linkedOfferId ? `/offers/${tile.linkedOfferId}` : '#');
          return (
          <Link 
            key={index}
            href={finalUrl}
            className="flex flex-col items-center group w-full"
          >
            <div className="relative w-full aspect-square rounded-[18px] md:rounded-[32px] bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-brand-navy/30 group-hover:shadow-sm transition-all mb-2 md:mb-4">
              {/* Badge */}
              {tile.badgeText && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-brand-navy text-white text-[8px] md:text-xs font-bold px-1.5 md:px-3 py-0.5 md:py-1 rounded-sm md:rounded shadow-sm z-10 whitespace-nowrap">
                  {tile.badgeText}
                </div>
              )}

              {/* Image */}
              {tile.imageUrl ? (
                <img 
                  src={tile.imageUrl} 
                  alt={tile.label} 
                  className="w-full h-full object-cover rounded-[18px] md:rounded-[32px] group-hover:scale-105 transition-transform"
                />
              ) : (
                <svg className="w-1/2 h-1/2 text-gray-300 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            
            <span className="text-[11px] md:text-lg font-medium md:font-bold text-gray-600 md:text-gray-800 text-center leading-tight">
              {tile.label}
            </span>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
