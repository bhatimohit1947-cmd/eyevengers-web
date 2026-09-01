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
          <nav className="flex flex-col">
            {/* Shopping Categories */}
            <div className="px-6 pb-2 pt-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Shop</div>
            <Link href="/collections/eyeglasses" onClick={closeMenu} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group">
              <div className="flex items-center gap-3 font-medium text-gray-700 group-hover:text-brand-navy">
                <Glasses size={20} /> Eyeglasses
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-navy" />
            </Link>
            <Link href="/collections/sunglasses" onClick={closeMenu} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group">
              <div className="flex items-center gap-3 font-medium text-gray-700 group-hover:text-brand-navy">
                <Glasses size={20} /> Sunglasses
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-navy" />
            </Link>
            <Link href="/collections/contact-lenses" onClick={closeMenu} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group">
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
            {membershipTier === 'none' ? (
              <Link href="/membership" onClick={closeMenu} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group bg-yellow-50/50">
                <div className="flex items-center gap-3 font-bold text-yellow-700">
                  <Crown size={20} /> Get Membership
                </div>
              </Link>
            ) : (
              <Link href="/membership" onClick={closeMenu} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group bg-brand-navy/5">
                <div className="flex items-center gap-3 font-bold text-brand-navy capitalize">
                  <Crown size={20} className="text-yellow-500" /> {membershipTier} Member
                </div>
                <div className="text-xs text-brand-navy bg-brand-navy/10 px-2 py-1 rounded-full font-bold uppercase">
                  Active
                </div>
              </Link>
            )}

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
