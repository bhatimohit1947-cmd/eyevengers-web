"use client";
import { fetchWithAuth } from '@/utils/fetchWithAuth';

import React, { useState, useEffect } from 'react';
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
  Glasses,
  Bell
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [counts, setCounts] = useState({ notifications: 0, orders: 0, eyeTests: 0 });
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    setIsHydrated(true);
    if (localStorage.getItem('eyevengers_admin_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetchWithAuth(`https://eyevengers-web.onrender.com/api/admin/sidebar-counts`);
        const data = await res.json();
        if (data && !data.error) {
          setCounts(data);
        }
      } catch (error) {
        console.error("Failed to fetch sidebar counts", error);
      }
    };
    fetchCounts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const sidebarLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Homepage Builder', href: '/admin/homepage', icon: PanelTop },
    { name: 'Offers & Campaigns', href: '/admin/offers', icon: Tag },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Lens Pricing', href: '/admin/lenses', icon: Glasses },
    { name: 'Membership Plans', href: '/admin/memberships', icon: Crown },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, badge: counts.orders },
    { name: 'Physical Stores', href: '/admin/stores', icon: MapPin },
    { name: 'Eye Tests', href: '/admin/eye-tests', icon: Stethoscope, badge: counts.eyeTests },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Policies', href: '/admin/settings/policies', icon: Settings },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('https://eyevengers-web.onrender.com/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('eyevengers_admin_token', data.token);
        localStorage.setItem('eyevengers_admin_auth', 'true');
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Failed to connect to the server');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('eyevengers_admin_token');
    localStorage.removeItem('eyevengers_admin_auth');
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
  };

  if (!isHydrated) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div></div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
          <div>
            <h2 className="mt-2 text-center text-3xl font-black tracking-widest text-brand-navy uppercase">
              Eyevengers
            </h2>
            <h3 className="mt-4 text-center text-xl font-bold text-gray-900">
              Admin Portal Access
            </h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              Please enter your authorized credentials to continue
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">Admin Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy transition-all"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center border border-red-100">
                {loginError}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-brand-navy hover:bg-[#002b4d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy transition-all shadow-md hover:shadow-lg"
              >
                Secure Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
                className={`flex items-center justify-between px-6 py-3 transition-colors ${
                  isActive 
                    ? 'bg-white/10 border-r-4 border-brand-gold text-brand-gold' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <Icon size={20} className="mr-3 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">{link.name}</span>
                </div>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 hidden md:block">
          <button 
            onClick={handleLogout}
            className="flex items-center text-gray-400 hover:text-white w-full px-2 py-2 transition-colors"
          >
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
