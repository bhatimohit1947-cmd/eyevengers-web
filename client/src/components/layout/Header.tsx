"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  UserCircle2,
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
import { useAddressStore } from '@/store/useAddressStore';
import { useAuthGate } from '@/hooks/useAuthGate';
import { LanguageToggle } from '@/components/layout/LanguageToggle';

const SEARCH_PLACEHOLDERS = [
  'Search for frames, brands, or lenses...',
  'Search "metal eyeglasses"',
  'Search "cricket sunglasses"',
  'Search "computer glasses"',
  'Search "contact lenses"'
];

export function Header() {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const { openMenu } = useUIStore();
  const { isLoggedIn, user, membershipTier, openLoginModal } = useAuthStore();
  const { totalCount } = useCartStore();
  const { productIds } = useWishlistStore();
  const { requireAuth } = useAuthGate();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Background sync user state & cloud data (Cart, Wishlist, Address)
  useEffect(() => {
    if (isHydrated && isLoggedIn && user?.phone) {
      // Sync membership
      fetch('/api/customers', { cache: 'no-store' })
        .then(res => res.json())
        .then(customers => {
          if (Array.isArray(customers)) {
            const currentUser = customers.find(c => c.phone === user.phone);
            if (currentUser && currentUser.membershipTier) {
              const store = useAuthStore.getState();
              if (store.membershipTier !== currentUser.membershipTier) {
                store.setMembershipTier(currentUser.membershipTier, currentUser.membershipBenefits);
              }
            }
          }
        })
        .catch(console.error);

      // Sync Cart, Wishlist, and Addresses from cloud
      useCartStore.getState().syncWithServer(user.phone);
      useWishlistStore.getState().syncWithServer(user.phone);
      useAddressStore.getState().syncWithServer(user.phone);
    }
  }, [isHydrated, isLoggedIn, user?.phone]);

  // Rotating search placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm transition-all duration-300">
      {/* Top Header Row */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 md:h-16 gap-2 sm:gap-4">
        {/* Brand Logo & Navigation on Left */}
        <div className="flex items-center gap-3 lg:gap-8 shrink-0">
          <Link href="/" className="notranslate font-black text-lg sm:text-xl tracking-tighter text-brand-navy hover:opacity-90 transition">
            EYEVENGERS
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6 font-semibold text-gray-800 text-sm">
            <Link href="/products?category=eyeglasses" className="hover:text-brand-navy transition">Eyeglasses</Link>
            <Link href="/products?category=sunglasses" className="hover:text-brand-navy transition">Sunglasses</Link>
            <Link href="/products?category=computer-glasses" className="hover:text-brand-navy transition">Computer Glasses</Link>
            <Link href="/products?category=contact-lenses" className="hover:text-brand-navy transition">Contact Lenses</Link>
            <Link href="/brands" className="hover:text-brand-navy transition">Brands</Link>
            <Link href="/refer-and-earn" className="text-amber-600 hover:text-amber-700 font-bold transition flex items-center gap-1">
              <span>🎁</span> Refer & Earn
            </Link>
          </nav>
        </div>

        {/* Desktop Integrated Search Bar */}
        <div className="hidden md:flex flex-1 max-w-lg mx-2">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search size={16} aria-hidden="true" />
            </div>
            <input
              type="search"
              aria-label="Search products, brands, or lenses"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition"
              placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
            />
          </div>
        </div>

        {/* Actions Cluster on Right */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Language Switcher (1-Click English <-> Hindi) */}
          <LanguageToggle />

          <Link 
            href="/membership"
            className={`hidden sm:flex items-center text-[8px] sm:text-xs font-bold px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition ${
              membershipTier !== 'none' 
                ? membershipTier === 'gold' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : membershipTier === 'silver'
                    ? 'bg-gray-100 text-gray-700 border border-gray-300'
                    : 'bg-orange-50 text-orange-800 border border-orange-200'
                : 'bg-gradient-to-r from-[#0B1550] to-[#D4AF37] text-white hover:shadow-md'
            }`}
          >
            {isHydrated && membershipTier === 'gold' && <><Crown size={12} className="mr-0.5 sm:mr-1 sm:w-3.5 sm:h-3.5"/> GOLD MEMBER</>}
            {isHydrated && membershipTier === 'silver' && <><Medal size={12} className="mr-0.5 sm:mr-1 sm:w-3.5 sm:h-3.5"/> SILVER MEMBER</>}
            {isHydrated && membershipTier === 'bronze' && <><Medal size={12} className="mr-0.5 sm:mr-1 sm:w-3.5 sm:h-3.5"/> BRONZE MEMBER</>}
            {(!isHydrated || membershipTier === 'none') && 'GET MEMBERSHIP'}
          </Link>
          
          <Link href="/wishlist" aria-label="Wishlist" className="p-1 sm:p-1.5 text-gray-700 hover:text-brand-navy transition relative rounded-lg hover:bg-gray-100">
            <Heart size={20} className="sm:w-[22px] sm:h-[22px]" aria-hidden="true" />
            {productIds.length > 0 && (
              <span className="absolute top-0 right-0 bg-brand-navy text-white text-[9px] font-bold w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center rounded-full">
                {productIds.length}
              </span>
            )}
          </Link>
          
          <Link href="/cart" aria-label="Shopping Cart" className="p-1 sm:p-1.5 text-gray-700 hover:text-brand-navy transition relative rounded-lg hover:bg-gray-100">
            <ShoppingBag size={20} className="sm:w-[22px] sm:h-[22px]" aria-hidden="true" />
            {totalCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center rounded-full">
                {totalCount}
              </span>
            )}
          </Link>

          {/* User Profile / Login Avatar */}
          <button 
            type="button"
            onClick={() => {
              if (isLoggedIn) {
                openMenu();
              } else {
                openLoginModal();
              }
            }}
            className="p-1 sm:p-1.5 text-gray-700 hover:text-brand-navy transition rounded-lg hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer"
            aria-label={isLoggedIn ? `Logged in as ${user?.name || 'User'}` : "Login or Sign up"}
          >
            {isLoggedIn ? (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-navy text-white flex items-center justify-center text-xs font-bold ring-2 ring-blue-100 shadow-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            ) : (
              <UserCircle2 size={22} className="sm:w-6 sm:h-6 text-gray-700 hover:text-brand-navy transition-colors" aria-hidden="true" />
            )}
          </button>

          {/* Mobile Hamburger Menu Toggle */}
          <button 
            type="button"
            onClick={openMenu}
            aria-label="Open Navigation Menu"
            className="lg:hidden p-1 sm:p-1.5 text-gray-700 hover:text-brand-navy rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <Menu size={22} className="sm:w-6 sm:h-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile-Only Search Bar with tight, consistent margins */}
      <div className="px-4 pb-2.5 pt-0.5 md:hidden flex justify-center">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="search"
            aria-label="Search products"
            className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-full text-sm bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-navy"
            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
          />
        </div>
      </div>
    </header>
  );
}
