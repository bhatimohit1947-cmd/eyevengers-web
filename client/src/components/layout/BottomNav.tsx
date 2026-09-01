"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, ScanFace, Stethoscope, Clock } from 'lucide-react';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Stores', icon: MapPin, href: '/stores' },
  { label: 'AI Stylist', icon: ScanFace, href: '/ai-stylist' },
  { label: 'Eye Test', icon: Stethoscope, href: '/eye-test' },
  { label: 'Orders', icon: Clock, href: '/orders' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe z-50 md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-brand-navy' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
