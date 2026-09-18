"use client";

import React from 'react';
import Link from 'next/link';
import { Settings, Glasses, Sun, ScanFace, Sparkles } from 'lucide-react';

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
        {data.items?.map((item, index) => (
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
              <div className="w-12 h-12 md:w-16 md:h-16 mb-2 text-gray-300 group-hover:scale-110 group-hover:text-brand-navy transition-all flex items-center justify-center">
                {item.label.toLowerCase().includes('sun') ? <Sun size={32} /> :
                 item.label.toLowerCase().includes('lens') || item.label.toLowerCase().includes('power') ? <Glasses size={32} /> :
                 item.label.toLowerCase().includes('reading') ? <ScanFace size={32} /> :
                 <Sparkles size={32} />}
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
