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
        {data.cards?.map((card, index) => (
          <div 
            key={index}
            className="relative flex-shrink-0 w-[40vw] max-w-[280px] md:w-[320px] aspect-[9/16] rounded-[24px] overflow-hidden snap-center group block bg-gray-900 shadow-sm"
          >
            {card.mediaUrl ? (
              card.mediaUrl.match(/\.(mp4|webm|ogg)$/i) || card.mediaType === 'video' ? (
                <>
                  <video 
                    src={card.mediaUrl} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    autoPlay loop muted playsInline
                  />
                  <div className="absolute top-4 right-4 w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10 pointer-events-none">
                    <Play size={16} className="ml-1" />
                  </div>
                </>
              ) : (
                <img 
                  src={card.mediaUrl} 
                  alt={card.title} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              )
            ) : (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                {card.mediaType === 'video' && (
                  <div className="absolute top-4 right-4 w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10">
                    <Play size={16} className="ml-1" />
                  </div>
                )}
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 pointer-events-none"></div>

            <div className="absolute bottom-6 left-6 right-6 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
              <div className="w-full">
                <h3 className="text-white font-bold text-lg md:text-xl mb-1 line-clamp-2 pr-2">{card.title}</h3>
                <div className="w-12 h-1 bg-white/20 backdrop-blur-md rounded border border-white/10 mt-2"></div>
              </div>
              <Link 
                href={card.ctaUrl}
                className="bg-white text-brand-navy text-[10px] md:text-xs font-bold px-4 py-2 rounded-full hover:bg-brand-navy hover:text-white transition-colors flex-shrink-0 whitespace-nowrap"
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
