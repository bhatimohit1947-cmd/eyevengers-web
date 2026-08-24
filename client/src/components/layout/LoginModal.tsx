"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { X, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

interface CustomerRecord {
  id: string;
  googleProviderId: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login, executePendingAction } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'LOGIN' | 'COMPLETE_PROFILE'>('LOGIN');
  const [googleData, setGoogleData] = useState<{ id: string; name: string; email: string } | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  if (!isLoginModalOpen) return null;

  // Retrieve mock DB
  const getCustomers = (): CustomerRecord[] => {
    try {
      return JSON.parse(localStorage.getItem('eyevengers_mock_customers') || '[]');
    } catch {
      return [];
    }
  };

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setIsLoading(true);
    try {
      // In a real app, this token goes to the backend to verify and fetch user info.
      // Here we fetch it directly from Google API for the client-side flow.
      let userInfo: any;
      
      // If we're using the mock client ID, simulate the response
      if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        userInfo = await res.json();
      } else {
        // Mock fallback for testing without Google Config
        userInfo = { sub: `google_${Date.now()}`, name: 'Demo User', email: 'demo@example.com' };
      }

      const googleId = userInfo.sub;
      const name = userInfo.name || '';
      const email = userInfo.email || '';

      const customers = getCustomers();
      const existingCustomer = customers.find(c => c.googleProviderId === googleId || c.email === email);

      if (existingCustomer && existingCustomer.phone) {
        // Existing user with full profile, log them in immediately
        completeLogin(existingCustomer);
      } else {
        // New user or missing phone, transition to profile completion
        setGoogleData({ id: googleId, name, email });
        setProfileName(name);
        setStep('COMPLETE_PROFILE');
      }
    } catch (err) {
      console.error("Google auth error", err);
      alert('Unable to sign in with Google. Please try again.');
    }
    setIsLoading(false);
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => alert('Unable to sign in with Google. Please try again.'),
  });

  const handleMockGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      handleGoogleSuccess({ access_token: 'mock_token' });
    }, 800);
  };

  const completeLogin = (customer: CustomerRecord) => {
    login({
      id: customer.id,
      googleProviderId: customer.googleProviderId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    }, 'none');
    
    setIsLoading(false);
    
    // Simulate backend login notification API call
    fetch(`https://eyevengers-web.onrender.com/api/admin/login-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: customer.phone || customer.email })
    }).catch(console.error);

    setStep('LOGIN');
    setGoogleData(null);
    closeLoginModal();
    executePendingAction();
  };

  const handleCompleteProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleData) return;
    
    // Validate phone number (exactly 10 digits)
    const cleanedPhone = profilePhone.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setPhoneError('');
    setIsLoading(true);

    const customers = getCustomers();
    let customer = customers.find(c => c.googleProviderId === googleData.id || c.email === googleData.email);

    if (customer) {
      // Update existing
      customer.name = profileName;
      customer.phone = cleanedPhone;
    } else {
      // Create new
      customer = {
        id: `CUST-${Date.now()}`,
        googleProviderId: googleData.id,
        name: profileName,
        email: googleData.email,
        phone: cleanedPhone,
        createdAt: new Date().toISOString()
      };
      customers.push(customer);
    }

    localStorage.setItem('eyevengers_mock_customers', JSON.stringify(customers));
    
    setTimeout(() => {
      completeLogin(customer!);
    }, 600);
  };

  const handleClose = () => {
    setStep('LOGIN');
    setGoogleData(null);
    closeLoginModal();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-[110] backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-2xl z-[120] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'LOGIN' ? 'Welcome to EYEVENGERS' : 'Complete Your Profile'}
          </h2>
          <button 
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 'LOGIN' ? (
            <div className="flex flex-col items-center">
              <p className="text-gray-600 mb-8 text-center">Sign in to continue</p>
              
              <button
                onClick={() => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? loginWithGoogle() : handleMockGoogleLogin()}
                disabled={isLoading}
                className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 shadow-sm relative overflow-hidden"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
              
              <p className="text-center text-xs text-gray-500 mt-6 font-medium">
                Fast, secure and password-free
              </p>
            </div>
          ) : (
            <form onSubmit={handleCompleteProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-navy focus:border-brand-navy sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="relative flex">
                  <div className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-gray-500 sm:text-sm font-medium">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, ''))} // only allow digits
                    className={`block w-full pl-3 pr-3 py-3 border rounded-r-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-navy focus:border-brand-navy sm:text-sm transition duration-150 ease-in-out ${phoneError ? 'border-red-300' : 'border-gray-200'}`}
                    placeholder="98XXXXXXXX"
                  />
                </div>
                {phoneError && <p className="mt-2 text-xs text-red-600 font-medium">{phoneError}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-brand-navy text-white font-bold py-3.5 rounded-xl hover:bg-[#002b4d] transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Saving...</>
                ) : (
                  'Continue →'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
