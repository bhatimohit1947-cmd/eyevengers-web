"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  imageUrl: string;
  headline: string;
  subtext: string;
  ctaUrl?: string;
  targetUrl?: string;
  linkedOfferId?: string;
  logoUrl?: string;
}

interface SliderBannerProps {
  data: {
    slides: Slide[];
    autoplayMs?: number;
    dots?: boolean;
    linkedOfferId?: string;
  };
}

export function SliderBanner({ data }: SliderBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === data.slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? data.slides.length - 1 : prev - 1));
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto md:px-4 py-8 group">
      
      <div className="overflow-hidden md:rounded-[24px] relative bg-black aspect-[4/3] md:aspect-[21/9]">
        
        {/* Slides Container */}
        <div 
          className="flex transition-transform duration-500 ease-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {data.slides.map((slide, index) => (
            <div key={index} className="w-full flex-shrink-0 relative">
              {/* Background */}
              {slide.imageUrl ? (
                slide.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video 
                    src={slide.imageUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay loop muted playsInline
                  />
                ) : (
                  <img 
                    src={slide.imageUrl}
                    alt={slide.headline}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                  <svg className="w-24 h-24 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/50 md:to-transparent"></div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end md:justify-center p-6 md:p-16 z-10 w-full md:w-1/2">
                
                {slide.logoUrl && (
                  <div className="w-16 h-6 md:w-24 md:h-8 bg-white/20 backdrop-blur-sm rounded mb-4 md:mb-6"></div>
                )}
                
                <h2 className="text-2xl md:text-5xl font-black text-white mb-2 md:mb-3 uppercase tracking-wide leading-tight">
                  {slide.headline}
                </h2>
                
                <p className="text-sm md:text-lg text-gray-300 mb-6 md:mb-8 max-w-sm">
                  {slide.subtext}
                </p>
                
                <Link 
                  href={slide.targetUrl || slide.ctaUrl || (slide.linkedOfferId ? `/offers/${slide.linkedOfferId}` : (data.linkedOfferId ? `/offers/${data.linkedOfferId}` : '/'))}
                  className="bg-white text-black font-bold px-6 py-2.5 md:px-8 md:py-3 rounded-full w-fit hover:bg-gray-200 transition-colors text-xs md:text-base"
                >
                  SHOP NOW
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {data.slides.length > 1 && (
          <>
            <button 
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center text-white hover:bg-white flex transition-colors group-hover:opacity-100 opacity-0 md:opacity-0 hidden md:flex"
            >
              <ChevronLeft size={24} className="text-white hover:text-black transition-colors" />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center text-white hover:bg-white flex transition-colors group-hover:opacity-100 opacity-0 md:opacity-0 hidden md:flex"
            >
              <ChevronRight size={24} className="text-white hover:text-black transition-colors" />
            </button>
          </>
        )}

        {/* Dots */}
        {(data.dots !== false && data.slides.length > 1) && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {data.slides.map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  currentSlide === i ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
