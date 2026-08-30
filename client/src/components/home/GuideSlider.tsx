"use client";

import React from 'react';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';

interface GuideCard {
  pillLabel: string;
  headline: string;
  videoUrl: string;
  thumbnailUrl?: string;
  backgroundColor: string;
}

interface GuideSliderProps {
  data: {
    title: string;
    guides: GuideCard[];
  };
}

export function GuideSlider({ data }: GuideSliderProps) {
  return (
    <div className="py-12 bg-gray-50 mt-8">
      <div className="max-w-7xl mx-auto px-4 md:px-0 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{data.title}</h2>
      </div>

      <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 px-4 md:px-0 max-w-7xl mx-auto no-scrollbar snap-x">
        {data.guides?.map((guide, index) => (
          <div 
            key={index}
            className="relative flex-shrink-0 w-[55vw] md:w-[350px] aspect-[4/5] rounded-[24px] overflow-hidden snap-center group flex flex-col justify-between p-6"
            style={{ backgroundColor: guide.backgroundColor }}
          >
            <div className="relative z-10">
              <span className="inline-block bg-white/20 backdrop-blur-md text-white border border-white/20 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                {guide.pillLabel}
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {guide.headline}
              </h3>
            </div>
            
            <div className="relative z-10 flex items-center justify-between mt-auto">
              <button className="flex items-center text-white font-bold hover:text-brand-gold transition-colors">
                <span className="uppercase text-sm mr-2">Learn More</span>
              </button>
              
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white hover:text-brand-navy transition-colors">
                <PlayCircle size={24} />
              </div>
            </div>

            {/* Decorative overlay matching video feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
            
            {/* Background Image Placeholder */}
            <div className="absolute right-0 bottom-0 w-48 h-48 bg-black/10 rounded-full blur-3xl transform translate-x-10 translate-y-10"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
