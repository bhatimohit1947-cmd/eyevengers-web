"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  Zap, 
  ChevronDown, 
  Heart, 
  ShoppingBag, 
  Menu, 
  Search,
  Crown,
  Medal
} from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthGate } from '@/hooks/useAuthGate';

const SEARCH_PLACEHOLDERS = [
  'Search "metal eyeglasses"',
  'Search "cricket sunglasses"',
  'Search "computer glasses"',
  'Search "contact lenses"'
];

export function Header() {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  const { openMenu } = useUIStore();
  const { isLoggedIn, user, membershipTier, openLoginModal } = useAuthStore();
  const { totalCount } = useCartStore();
  const { productIds } = useWishlistStore();
  const { requireAuth } = useAuthGate();

  // Rotating search placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm transition-all duration-300">
      {/* Top Header Row - Always visible */}
      <div className="flex items-center justify-between px-4 py-3 overflow-hidden h-16 opacity-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => isLoggedIn ? openMenu() : openLoginModal()}
            className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition overflow-hidden"
          >
            {isLoggedIn && user?.name ? (
               <div className="w-5 h-5 bg-brand-navy rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                 {user.name[0].toUpperCase()}
               </div>
            ) : (
              <User size={20} />
            )}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/membership"
            className={`flex items-center text-[8px] sm:text-xs font-bold px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition ${
              membershipTier !== 'none' 
                ? membershipTier === 'gold' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : membershipTier === 'silver'
                    ? 'bg-gray-100 text-gray-700 border border-gray-300'
                    : 'bg-orange-50 text-orange-800 border border-orange-200'
                : 'bg-gradient-to-r from-[#0B1550] to-[#D4AF37] text-white hover:shadow-md'
            }`}
          >
            {membershipTier === 'gold' && <><Crown size={12} className="mr-0.5 sm:mr-1 sm:w-3.5 sm:h-3.5"/> GOLD MEMBER</>}
            {membershipTier === 'silver' && <><Medal size={12} className="mr-0.5 sm:mr-1 sm:w-3.5 sm:h-3.5"/> SILVER MEMBER</>}
            {membershipTier === 'bronze' && <><Medal size={12} className="mr-0.5 sm:mr-1 sm:w-3.5 sm:h-3.5"/> BRONZE MEMBER</>}
            {membershipTier === 'none' && 'GET MEMBERSHIP'}
          </Link>
          
          <Link href="/wishlist" className="text-gray-700 hover:text-brand-navy transition relative">
            <Heart size={24} />
            {productIds.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-navy text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {productIds.length}
              </span>
            )}
          </Link>
          
          <button className="text-gray-700 hover:text-brand-navy transition relative">
            <ShoppingBag size={24} />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {totalCount}
              </span>
            )}
          </button>
          
          <button 
            onClick={openMenu}
            className="text-gray-700 hover:text-brand-navy transition"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Search Bar Row - Always visible */}
      <div className="px-4 pb-3 pt-1">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-navy focus:border-brand-navy sm:text-sm transition duration-150 ease-in-out"
            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
          />
        </div>
      </div>
    </header>
  );
}
