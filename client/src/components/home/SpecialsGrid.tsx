"use client";

import React from 'react';
import Link from 'next/link';

interface SpecialsItem {
  label: string;
  iconImageUrl?: string;
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
      
      <div className="grid grid-cols-4 gap-3 md:gap-6">
        {data.items.map((item, index) => (
          <Link 
            key={index}
            href={item.targetUrl || (item.linkedOfferId ? `/offers/${item.linkedOfferId}` : '#')}
            className="flex flex-col items-center group relative bg-white border border-gray-100 rounded-2xl p-2 md:p-6 hover:border-brand-navy hover:shadow-md transition-all"
          >
            {item.ribbonText && (
              <div className="absolute -top-2 -left-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm z-10 transform -rotate-12">
                {item.ribbonText}
              </div>
            )}
            
            {item.iconImageUrl ? (
              <div className="w-12 h-12 md:w-16 md:h-16 mb-2 group-hover:scale-110 transition-transform">
                {item.iconImageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video 
                    src={item.iconImageUrl} 
                    className="w-full h-full object-contain"
                    autoPlay loop muted playsInline
                  />
                ) : (
                  <img 
                    src={item.iconImageUrl} 
                    alt={item.label}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 mb-2 text-gray-300 group-hover:scale-110 transition-transform">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
            )}
            
            <span className="text-xs md:text-sm font-bold text-gray-700 text-center leading-tight group-hover:text-brand-navy">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
