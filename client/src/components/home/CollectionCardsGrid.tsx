"use client";

import React from 'react';
import Link from 'next/link';

interface CollectionCard {
  title: string;
  subtitle: string;
  imageUrl: string;
  accentBorderColor: string;
  filterQuery: string;
}

interface CollectionGridProps {
  data: {
    heading: string;
    subheading: string;
    cards: CollectionCard[];
  };
}

export function CollectionCardsGrid({ data }: CollectionGridProps) {
  return (
    <div className="py-12 max-w-7xl mx-auto px-4 md:px-0">
      
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{data.heading}</h2>
        <p className="text-gray-500 font-medium">{data.subheading}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        {data.cards?.map((card, index) => (
          <Link 
            key={index}
            href={`/products?${card.filterQuery}`}
            className="group block"
          >
            <div className="bg-gray-50 rounded-[20px] md:rounded-[24px] overflow-hidden relative aspect-square mb-3 md:mb-4 border-2 transition-colors duration-300 group-hover:shadow-lg"
                 style={{ borderColor: 'transparent' }}
                 onMouseEnter={(e) => (e.currentTarget.style.borderColor = card.accentBorderColor)}
                 onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            >
               {/* Background Placeholder */}
               <div className="absolute inset-0 flex items-center justify-center bg-gray-100 group-hover:scale-105 transition-transform duration-700">
                 <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
               </div>
               
               <div className="absolute inset-0 border-8 md:border-[12px] border-white/50 m-2 rounded-[16px] pointer-events-none"></div>
            </div>
            
            <div className="text-center">
              <h3 className="font-bold text-gray-900 text-base md:text-xl">{card.title}</h3>
              <p className="text-xs md:text-sm text-gray-500">{card.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
      
    </div>
  );
}
