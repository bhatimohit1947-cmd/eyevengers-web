"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { isVideoUrl } from '@/utils/media';

interface Slide {
  imageUrl: string;
  mobileImageUrl?: string;
  headline: string;
  subtext: string;
  ctaText?: string;
  ctaUrl?: string;
  targetUrl?: string;
  linkedOfferId?: string;
  logoUrl?: string;
  hideTextOverlay?: boolean;
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
    <div className="relative w-full max-w-7xl mx-auto px-3.5 sm:px-4 py-2.5 md:py-6 group overflow-hidden">
      
      <div className="overflow-hidden rounded-2xl md:rounded-[28px] relative bg-slate-950 aspect-[21/9] shadow-sm">
        
        {/* Slides Container */}
        <div 
          className="flex transition-transform duration-500 ease-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {data.slides?.map((slide, index) => {
            const hasTextOverlay = !slide.hideTextOverlay && Boolean(
              (slide.headline && slide.headline.trim() !== '') || 
              (slide.subtext && slide.subtext.trim() !== '')
            );
            const targetUrl = slide.targetUrl || slide.ctaUrl || (slide.linkedOfferId ? `/offers/${slide.linkedOfferId}` : (data.linkedOfferId ? `/offers/${data.linkedOfferId}` : '/'));

            return (
              <div key={index} className="w-full flex-shrink-0 relative">
                {/* When no text overlay is needed, the entire slide is a clickable link */}
                {!hasTextOverlay && (
                  <Link 
                    href={targetUrl} 
                    className="absolute inset-0 z-20 cursor-pointer"
                    aria-label={slide.headline || 'Banner'}
                  />
                )}

                {/* Background - Responsive Desktop & Mobile with zero-cut support */}
                {slide.imageUrl || slide.mobileImageUrl ? (
                  <>
                    {/* Desktop Media */}
                    <div className={`absolute inset-0 w-full h-full ${slide.mobileImageUrl ? 'hidden md:block' : 'block'}`}>
                      {isVideoUrl(slide.imageUrl || slide.mobileImageUrl || '') ? (
                        <video 
                          src={slide.imageUrl || slide.mobileImageUrl}
                          className="w-full h-full object-cover"
                          autoPlay loop muted playsInline preload="auto"
                        />
                      ) : (
                        <OptimizedImage 
                          src={slide.imageUrl || slide.mobileImageUrl || ''}
                          alt={slide.headline || 'Eyevengers Banner'}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 768px) 100vw, 1280px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    {/* Mobile Specific Media (If provided) */}
                    {slide.mobileImageUrl && (
                      <div className="absolute inset-0 w-full h-full block md:hidden">
                        {isVideoUrl(slide.mobileImageUrl) ? (
                          <video 
                            src={slide.mobileImageUrl}
                            className="w-full h-full object-cover"
                            autoPlay loop muted playsInline preload="auto"
                          />
                        ) : (
                          <OptimizedImage 
                            src={slide.mobileImageUrl}
                            alt={slide.headline || 'Eyevengers Banner'}
                            fill
                            priority={index === 0}
                            sizes="100vw"
                            className="object-cover"
                          />
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <svg className="w-24 h-24 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Gradient & Text Overlay - ONLY rendered if hasTextOverlay is true */}
                {hasTextOverlay && (
                  <>
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/50 md:to-transparent z-10 pointer-events-none"></div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end md:justify-center p-6 md:p-16 z-10 w-full md:w-1/2">
                      {slide.logoUrl && (
                        <div className="w-16 h-6 md:w-24 md:h-8 bg-white/20 backdrop-blur-sm rounded mb-4 md:mb-6"></div>
                      )}
                      
                      {slide.headline && (
                        <h2 className="text-2xl md:text-5xl font-black text-white mb-2 md:mb-3 uppercase tracking-wide leading-tight">
                          {slide.headline}
                        </h2>
                      )}
                      
                      {slide.subtext && (
                        <p className="text-sm md:text-lg text-gray-300 mb-6 md:mb-8 max-w-sm">
                          {slide.subtext}
                        </p>
                      )}
                      
                      <Link 
                        href={targetUrl}
                        className="bg-white text-brand-navy font-bold px-6 py-2.5 md:px-10 md:py-3 rounded-full w-fit hover:bg-gray-50 transition-colors text-sm md:text-base shadow-lg inline-block text-center"
                      >
                        {slide.ctaText || 'SHOP NOW'}
                      </Link>
                    </div>
                  </>
                )}
              </div>
            );
          })}
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
          <div className="absolute bottom-2 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-20">
            {data.slides?.map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1 md:h-1.5 rounded-full transition-all ${
                  currentSlide === i ? 'w-5 md:w-6 bg-white' : 'w-1 md:w-1.5 bg-white/40'
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
