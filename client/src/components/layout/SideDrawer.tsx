"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  X, UserCircle2, Glasses, Heart, ShoppingBag, 
  MapPin, HelpCircle, LogOut, ChevronRight, Crown 
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { LanguageToggle } from '@/components/layout/LanguageToggle';

export function SideDrawer() {
  const { isMenuOpen, closeMenu } = useUIStore();
  const { isLoggedIn, user, membershipTier, logout, openLoginModal } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    closeMenu();
    if (['/orders', '/checkout', '/wishlist'].includes(pathname)) {
      router.push('/');
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm transition-opacity duration-300"
          onClick={closeMenu}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-[85%] max-w-[360px] bg-white z-[100] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header - Profile Block */}
        <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-navy rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{user?.name}</h3>
                <p className="text-xs text-gray-500">{user?.email}</p>
                {membershipTier !== 'none' && (
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    membershipTier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                    membershipTier === 'silver' ? 'bg-gray-100 text-gray-700' :
                    'bg-orange-50 text-orange-800'
                  }`}>
                    {membershipTier} Member
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => {
                closeMenu();
                openLoginModal();
              }}
            >
              <UserCircle2 size={48} className="text-gray-400 group-hover:text-brand-navy transition-colors" />
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-brand-navy transition-colors">Login / Sign Up</h3>
                <p className="text-xs text-gray-500">Access orders, wishlist & more</p>
              </div>
            </div>
          )}
          
          <button 
            onClick={closeMenu}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Links */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Quick Language Toggle */}
          <div className="px-6 mb-3">
            <LanguageToggle variant="drawer" />
          </div>

          {/* TOP PRIORITY: Refer & Earn & Membership */}
          <div className="px-4 mb-3 space-y-2">
            <Link 
              href="/refer-and-earn" 
              onClick={closeMenu} 
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/30 hover:border-amber-500 transition group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-sm">🎁</span>
                <div>
                  <div className="font-black text-sm text-gray-900 leading-tight">Refer & Earn</div>
                  <div className="text-[11px] font-semibold text-amber-700">Get a FREE Frame or 30% OFF</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {membershipTier === 'none' ? (
              <Link 
                href="/membership" 
                onClick={closeMenu} 
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/10 to-transparent border border-brand-navy/20 hover:border-brand-navy transition group shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-brand-navy text-brand-gold flex items-center justify-center shadow-sm">
                    <Crown size={20} />
                  </span>
                  <div>
                    <div className="font-black text-sm text-gray-900 leading-tight">Get Membership</div>
                    <div className="text-[11px] font-semibold text-gray-500">Gold & Silver Benefits</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-brand-navy group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <Link 
                href="/membership" 
                onClick={closeMenu} 
                className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-navy text-white shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Crown size={20} className="text-brand-gold" />
                  <div>
                    <div className="font-bold text-sm capitalize">{membershipTier} Member</div>
                    <div className="text-[10px] text-gray-300">Active Membership</div>
                  </div>
                </div>
                <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase">View</div>
              </Link>
            )}
          </div>

          <div className="h-px bg-gray-100 my-2 mx-6"></div>

          <nav className="flex flex-col">
            {/* Shopping Categories */}
            <div className="px-6 pb-2 pt-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Shop</div>
            <Link href="/products?category=eyeglasses" onClick={closeMenu} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group">
              <div className="flex items-center gap-3 font-medium text-gray-700 group-hover:text-brand-navy">
                <Glasses size={20} /> Eyeglasses
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-navy" />
            </Link>
            <Link href="/products?category=sunglasses" onClick={closeMenu} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group">
              <div className="flex items-center gap-3 font-medium text-gray-700 group-hover:text-brand-navy">
                <Glasses size={20} /> Sunglasses
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-navy" />
            </Link>
            <Link href="/products?category=contact-lenses" onClick={closeMenu} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group">
              <div className="flex items-center gap-3 font-medium text-gray-700 group-hover:text-brand-navy">
                <div className="w-5 h-5 rounded-full border-2 border-current"></div> Contact Lenses
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-navy" />
            </Link>
            
            <div className="h-px bg-gray-100 my-2 mx-6"></div>

            {/* Services */}
            <div className="px-6 pb-2 pt-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Services</div>
            <Link href="/eye-test" onClick={closeMenu} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group">
              <div className="flex items-center gap-3 font-medium text-gray-700 group-hover:text-brand-navy">
                <UserCircle2 size={20} /> Free Eye Test at Home
              </div>
            </Link>
            <Link href="/stores" onClick={closeMenu} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group">
              <div className="flex items-center gap-3 font-medium text-gray-700 group-hover:text-brand-navy">
                <MapPin size={20} /> Find a Store
              </div>
            </Link>

            <div className="h-px bg-gray-100 my-2 mx-6"></div>

            {/* Account */}
            <div className="px-6 pb-2 pt-2 text-xs font-bold text-gray-400 uppercase tracking-wider">My Account</div>
            <Link href="/orders" onClick={closeMenu} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group">
              <div className="flex items-center gap-3 font-medium text-gray-700 group-hover:text-brand-navy">
                <ShoppingBag size={20} /> My Orders
              </div>
            </Link>
            <Link href="/wishlist" onClick={closeMenu} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group">
              <div className="flex items-center gap-3 font-medium text-gray-700 group-hover:text-brand-navy">
                <Heart size={20} /> My Wishlist
              </div>
            </Link>
            <Link href="/help" onClick={closeMenu} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group">
              <div className="flex items-center gap-3 font-medium text-gray-700 group-hover:text-brand-navy">
                <HelpCircle size={20} /> Help & Support
              </div>
            </Link>
            
            {isLoggedIn && (
              <button onClick={handleLogout} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group text-left w-full">
                <div className="flex items-center gap-3 font-medium text-red-600">
                  <LogOut size={20} /> Logout
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-center text-gray-500 font-medium mb-3">Follow Us</p>
          <div className="flex items-center justify-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-brand-navy hover:text-white transition-colors cursor-pointer">
               <span className="font-bold text-xs">IG</span>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-brand-navy hover:text-white transition-colors cursor-pointer">
               <span className="font-bold text-xs">FB</span>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-brand-navy hover:text-white transition-colors cursor-pointer">
               <span className="font-bold text-xs">TW</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
