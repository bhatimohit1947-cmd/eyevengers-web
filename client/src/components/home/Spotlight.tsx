"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface SpotlightCardProps {
  heading: string;
  description: string;
  ctaUrl: string;
  backgroundColor: string;
  iconPlaceholderColor: string;
}

interface SpotlightProps {
  data: {
    title?: string;
    cards: SpotlightCardProps[];
  };
}

export function Spotlight({ data }: SpotlightProps) {
  return (
    <div className="py-8 max-w-7xl mx-auto px-4 md:px-0">
      {data.title && (
        <div className="flex items-center mb-6">
          <h2 className="text-[18px] md:text-2xl font-black text-brand-navy tracking-tight">{data.title}</h2>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {data.cards.map((card, index) => (
          <Link 
            key={index} 
            href={card.ctaUrl}
            className="block relative rounded-[24px] p-6 md:p-8 overflow-hidden group hover:shadow-md transition-shadow h-48 md:h-56 flex flex-col justify-between"
            style={{ backgroundColor: card.backgroundColor }}
          >
            {/* Background Illustration Placeholder */}
            <div className="absolute right-0 bottom-0 w-32 h-32 md:w-48 md:h-48 rounded-tl-full opacity-50 transform translate-x-4 translate-y-4 group-hover:scale-105 transition-transform" style={{ backgroundColor: card.iconPlaceholderColor }}></div>
            
            <div className="relative z-10 w-2/3">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                {card.heading}
              </h3>
              <p className="text-sm text-gray-700 font-medium">
                {card.description}
              </p>
            </div>
            
            <div className="absolute bottom-6 right-6 z-10">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-900 group-hover:bg-brand-navy group-hover:text-white transition-colors">
                <ArrowRight size={20} className="transform -rotate-45 group-hover:rotate-0 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
