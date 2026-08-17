"use client";

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';

interface MediaCard {
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  title: string;
  ctaLabel: string;
  ctaUrl: string;
}

interface MediaSliderProps {
  data: {
    cards: MediaCard[];
  };
}

export function MediaSlider({ data }: MediaSliderProps) {
  
  return (
    <div className="py-8 max-w-7xl mx-auto pl-4 md:pl-0">
      <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 no-scrollbar snap-x">
        {data.cards.map((card, index) => (
          <div 
            key={index}
            className="relative flex-shrink-0 w-[40vw] max-w-[280px] md:w-[320px] aspect-[9/16] rounded-[24px] overflow-hidden snap-center group block bg-gray-900 shadow-sm"
          >
            {card.mediaType === 'video' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-16 h-16 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                <button className="absolute inset-0 m-auto w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-brand-navy transition-colors">
                  <Play size={20} className="ml-1" />
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                <svg className="w-16 h-16 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 pointer-events-none"></div>

            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <h3 className="text-white font-bold text-lg md:text-xl mb-1">{card.title}</h3>
                <div className="w-12 h-1 bg-white/20 backdrop-blur-md rounded border border-white/10 mt-2"></div>
              </div>
              <Link 
                href={card.ctaUrl}
                className="bg-white text-brand-navy text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full hover:bg-brand-navy hover:text-white transition-colors flex-shrink-0"
              >
                {card.ctaLabel}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
