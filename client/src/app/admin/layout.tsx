"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  PanelTop, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  LogOut,
  Tag,
  Crown,
  Stethoscope,
  MapPin,
  Glasses
} from 'lucide-react';

const sidebarLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Homepage Builder', href: '/admin/homepage', icon: PanelTop },
  { name: 'Offers & Campaigns', href: '/admin/offers', icon: Tag },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Lens Pricing', href: '/admin/lenses', icon: Glasses },
  { name: 'Membership Plans', href: '/admin/memberships', icon: Crown },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Physical Stores', href: '/admin/stores', icon: MapPin },
  { name: 'Eye Tests', href: '/admin/eye-tests', icon: Stethoscope },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-brand-navy text-white flex flex-col md:h-screen sticky top-0 z-40 flex-shrink-0">
        <div className="h-16 flex items-center px-6 font-black text-xl tracking-widest border-b border-white/10">
          EYEVENGERS
        </div>
        
        <nav className="flex-1 py-6 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible no-scrollbar">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center px-6 py-3 transition-colors ${
                  isActive 
                    ? 'bg-white/10 border-r-4 border-brand-gold text-brand-gold' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} className="mr-3 flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 hidden md:block">
          <button className="flex items-center text-gray-400 hover:text-white w-full px-2 py-2 transition-colors">
            <LogOut size={20} className="mr-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <h1 className="text-xl font-bold text-gray-800">Admin Portal</h1>
          
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-brand-navy rounded-full text-white flex items-center justify-center font-bold text-sm">
              AD
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </main>

    </div>
  );
}
