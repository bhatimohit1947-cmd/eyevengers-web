"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface PromoSlide {
  imageUrl?: string;
  ctaUrl?: string;
  targetUrl?: string;
  linkedOfferId?: string;
}

interface PromoSliderProps {
  data: {
    slides: PromoSlide[];
  };
}

export function PromoSlider({ data }: PromoSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide logic
  useEffect(() => {
    if (data.slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % data.slides.length;
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            left: nextIndex * scrollRef.current.offsetWidth,
            behavior: 'smooth'
          });
        }
        return nextIndex;
      });
    }, 4000); // Slides every 4 seconds

    return () => clearInterval(interval);
  }, [data.slides.length]);

  // Update dots when user manually swipes
  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollPosition = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const newIndex = Math.round(scrollPosition / width);
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  };

  return (
    <div className="py-6 w-full">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory flex-nowrap w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ scrollBehavior: 'smooth' }}
      >
        {data.slides?.map((slide, index) => (
          <Link 
            key={index}
            href={slide.targetUrl || slide.ctaUrl || (slide.linkedOfferId ? `/offers/${slide.linkedOfferId}` : '/')}
            className="flex-shrink-0 w-full snap-center block"
          >
            {/* 
              Aspect ratio changed to be a bit taller ("thoda bada") 
              e.g. 2:1 on mobile, 4:1 on desktop
            */}
            <div className="w-full aspect-[2/1] md:aspect-[4/1] bg-gray-100 flex items-center justify-center relative overflow-hidden group">
              {slide.imageUrl ? (
                slide.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video 
                    src={slide.imageUrl} 
                    className="w-full h-full object-cover object-center" 
                    autoPlay loop muted playsInline
                  />
                ) : (
                  <img 
                    src={slide.imageUrl} 
                    alt="Promo Banner" 
                    className="w-full h-full object-cover object-center" 
                  />
                )
              ) : (
                <div className="text-gray-300">
                  <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      
      {/* Dots Indicator */}
      {data.slides.length > 1 && (
        <div className="absolute -bottom-4 md:bottom-2 left-0 right-0 flex justify-center gap-2 pointer-events-none">
          {data.slides?.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === idx ? 'w-6 bg-brand-navy' : 'w-1.5 bg-gray-300'
              }`}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}
