"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { X, Mail, Lock, Loader2 } from 'lucide-react';

export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login, executePendingAction } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      login({
        id: 'user_123',
        name: 'Demo User',
        email: email || 'demo@example.com',
      }, 'none'); // login as standard user
      
      setIsLoading(false);
      closeLoginModal();
      
      // Auto-replay the action (e.g. wishlist add) if there was one pending
      executePendingAction();
    }, 1000);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-[110] backdrop-blur-sm"
        onClick={closeLoginModal}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-2xl z-[120] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Sign In / Register</h2>
          <button 
            onClick={closeLoginModal}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-navy focus:border-brand-navy sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  defaultValue="password123"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-navy focus:border-brand-navy sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-8 bg-brand-navy text-white font-bold py-3.5 rounded-xl hover:bg-[#002b4d] transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Signing in...</>
            ) : (
              'Sign In'
            )}
          </button>
          
          <p className="text-center text-xs text-gray-500 mt-6">
            By continuing, you agree to Eyevengers' Terms of Service and Privacy Policy.
          </p>
        </form>
      </div>
    </>
  );
}
