"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star, Clock } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';
import { WishlistButton } from '@/components/ui/WishlistButton';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    brand: string;
    imageUrl: string;
    mrp: number;
    sellingPrice: number;
    discountPercent: number;
    rating: number;
    reviewsCount: number;
    tags: string[];
  };
  appliedOffer?: {
    name: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    endDatetime?: string;
  };
}

export function ProductCard({ product, appliedOffer }: ProductCardProps) {
  const timeLeft = useCountdown(appliedOffer?.endDatetime);
  const showCountdown = timeLeft && timeLeft.days < 2; // Within 48 hours

  // Auto generate badge text (Enhancement 5)
  let offerBadgeText = "";
  if (appliedOffer) {
    if (appliedOffer.discountType === 'percentage') {
      offerBadgeText = `${appliedOffer.discountValue}% OFF`;
    } else {
      offerBadgeText = `Save ₹${appliedOffer.discountValue}`;
    }
  }

  return (
    <div className="bg-white rounded-[20px] overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 relative group flex flex-col h-full">
      
      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
        
        {/* Auto Generated Offer Badge */}
        {appliedOffer && (
          <div className="flex flex-col gap-1 w-fit">
            <span className="bg-[#D4AF37] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm w-fit">
              {offerBadgeText}
            </span>
            <span className="bg-white/90 backdrop-blur-sm text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              {appliedOffer.name}
            </span>
          </div>
        )}

        {/* Existing Static Discount (Fallback) */}
        {!appliedOffer && product.discountPercent > 0 && (
          <span className="bg-[#D4AF37] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm w-fit">
            {product.discountPercent}% OFF
          </span>
        )}

        {/* Countdown Chip (48hr urgency) */}
        {showCountdown && (
          <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 w-fit animate-pulse">
            <Clock size={10} />
            Ends in {timeLeft.hours}h {timeLeft.minutes}m
          </span>
        )}
      </div>
      
      <WishlistButton 
        productId={product.id} 
        className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-sm shadow-sm" 
        size={18}
      />

      {/* Image Container */}
      <Link href={`/products/${product.id}`} className="block relative pt-[75%] bg-gray-50 overflow-hidden group-hover:opacity-90 transition-opacity">
        {product.imageUrl ? (
          product.imageUrl.split(',')[0].trim().match(/\.(mp4|webm|ogg)$/i) ? (
            <video 
              src={product.imageUrl.split(',')[0].trim()} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              autoPlay loop muted playsInline
            />
          ) : (
            <img 
              src={product.imageUrl.split(',')[0].trim()} 
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{product.brand}</h3>
          <div className="flex items-center bg-gray-100 rounded-full px-1.5 py-0.5">
            <span className="text-[10px] font-bold text-gray-700 mr-1">{product.rating}</span>
            <Star size={10} className="fill-brand-gold text-brand-gold" />
          </div>
        </div>
        
        <Link href={`/products/${product.id}`} className="block group-hover:text-brand-navy transition-colors">
          <h2 className="text-base font-semibold text-gray-900 leading-tight mb-2 line-clamp-2">
            {product.name}
          </h2>
        </Link>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4 mt-auto">
          {product.tags.map((tag, i) => (
            <span key={i} className="text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-sm">
              {tag}
            </span>
          ))}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">₹{product.sellingPrice}</span>
            {product.discountPercent > 0 && (
              <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
            )}
          </div>
          <Link 
            href={`/products/${product.id}`}
            className="text-xs font-bold bg-brand-light text-brand-navy px-4 py-2 rounded-full hover:bg-brand-navy hover:text-white transition-colors"
          >
            VIEW
          </Link>
        </div>
      </div>
    </div>
  );
}
