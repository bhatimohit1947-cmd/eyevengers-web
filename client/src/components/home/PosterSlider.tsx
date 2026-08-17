"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Poster {
  imageUrl: string;
  brandLogoUrl?: string;
  ctaText: string;
  ctaUrl?: string;
  targetUrl?: string;
  linkedOfferId?: string;
}

interface PosterSliderProps {
  data: {
    title?: string;
    posters: Poster[];
  };
}

export function PosterSlider({ data }: PosterSliderProps) {
  return (
    <div className="py-8 max-w-7xl mx-auto md:px-0">
      
      {data.title && (
        <div className="mb-6 px-4 md:px-0">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{data.title}</h2>
        </div>
      )}

      <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 pl-4 md:pl-0 no-scrollbar snap-x">
        {data.posters.map((poster, index) => (
          <Link 
            key={index}
            href={poster.targetUrl || poster.ctaUrl || (poster.linkedOfferId ? `/offers/${poster.linkedOfferId}` : '/')}
            className="relative flex-shrink-0 w-[45vw] md:w-[400px] aspect-[3/4] rounded-[24px] overflow-hidden snap-center group block"
          >
            {/* Background Image */}
            {poster.imageUrl ? (
              <img 
                src={poster.imageUrl} 
                alt={poster.ctaText} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                 <svg className="w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>

            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              
              {/* Logo Top */}
              <div className="w-24 h-8 bg-white/20 backdrop-blur-md rounded border border-white/10"></div>
              
              {/* CTA Bottom */}
              <div className="flex items-center text-white font-bold tracking-wider group-hover:text-brand-gold transition-colors">
                <span className="uppercase text-sm mr-2">{poster.ctaText}</span>
                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
              
            </div>
          </Link>
        ))}
      </div>
      
    </div>
  );
}
