"use client";

import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { X, Loader2, ChevronLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface Address {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  addressLine: string;
  city: string;
  state: string;
}

interface CustomerRecord {
  id: string;
  name: string;
  email?: string;
  phone: string;
  pin: string;
  createdAt: string;
  cart?: any[];
  wishlist?: string[];
  orders?: any[];
  addresses?: Address[];
}

class ModalErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LoginModal Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 text-sm">Please try reloading the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login, executePendingAction } = useAuthStore();
  const [step, setStep] = useState<'ENTER_PHONE' | 'ENTER_PIN' | 'CREATE_PROFILE' | 'FORGOT_PIN_OTP' | 'SET_NEW_PIN'>('ENTER_PHONE');
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [otp, setOtp] = useState('');
  
  // Form State
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  
  // Errors
  const [error, setError] = useState('');

  if (!isLoginModalOpen) return null;

  const getCustomers = (): CustomerRecord[] => {
    try {
      const data = JSON.parse(localStorage.getItem('eyevengers_mock_customers') || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      const customers = getCustomers();
      const existingCustomer = customers.find(c => c.phone === phone);
      
      if (existingCustomer) {
        setStep('ENTER_PIN');
      } else {
        setStep('CREATE_PROFILE');
      }
      setIsLoading(false);
    }, 500);
  };

  const completeLogin = (customer: CustomerRecord) => {
    login({
      id: customer.id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
    }, 'none');
    
    // Simulate backend login notification API call
    fetch(`https://eyevengers-web.onrender.com/api/admin/login-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: customer.phone })
    }).catch(console.error);

    handleClose();
    executePendingAction();
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (pin.length !== 4) {
      setError('Please enter your 4-digit PIN.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const customers = getCustomers();
      const existingCustomer = customers.find(c => c.phone === phone);
      
      if (existingCustomer && existingCustomer.pin === pin) {
        completeLogin(existingCustomer);
      } else {
        setError('Incorrect PIN. Please try again.');
        setIsLoading(false);
      }
    }, 500);
  };

  const handleCreateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!profileName.trim()) {
      setError('Name is required.');
      return;
    }
    if (pin.length !== 4) {
      setError('Please set a 4-digit PIN.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const customers = getCustomers();
      const newCustomer: CustomerRecord = {
        id: `CUST-${Date.now()}`,
        name: profileName,
        email: profileEmail,
        phone: phone,
        pin: pin,
        createdAt: new Date().toISOString()
      };
      
      customers.push(newCustomer);
      localStorage.setItem('eyevengers_mock_customers', JSON.stringify(customers));
      
      completeLogin(newCustomer);
    }, 600);
  };

  const handleForgotPin = () => {
    setStep('FORGOT_PIN_OTP');
    setError('');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (otp.length !== 4) {
      setError('Please enter the 4-digit OTP.');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      // Accept any 4-digit OTP for mock purposes
      setStep('SET_NEW_PIN');
      setPin('');
      setOtp('');
      setIsLoading(false);
    }, 500);
  };

  const handleSetNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN.');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      const customers = getCustomers();
      const customerIndex = customers.findIndex(c => c.phone === phone);
      
      if (customerIndex >= 0) {
        customers[customerIndex].pin = pin;
        localStorage.setItem('eyevengers_mock_customers', JSON.stringify(customers));
        completeLogin(customers[customerIndex]);
      } else {
        setError('Customer not found.');
        setIsLoading(false);
      }
    }, 500);
  };

  const handleClose = () => {
    setStep('ENTER_PHONE');
    setPhone('');
    setPin('');
    setOtp('');
    setProfileName('');
    setProfileEmail('');
    setError('');
    setShowPin(false);
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
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 relative">
          {step !== 'ENTER_PHONE' && (
            <button 
              onClick={() => {
                setStep('ENTER_PHONE');
                setPin('');
                setError('');
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <h2 className="text-xl font-bold text-gray-900 mx-auto">
            {step === 'ENTER_PHONE' && 'Sign In / Register'}
            {step === 'ENTER_PIN' && 'Enter PIN'}
            {step === 'CREATE_PROFILE' && 'Create Profile'}
            {step === 'FORGOT_PIN_OTP' && 'Verify OTP'}
            {step === 'SET_NEW_PIN' && 'Set New PIN'}
          </h2>
          <button 
            onClick={handleClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <ModalErrorBoundary>
          <div className="p-6">
            {step === 'ENTER_PHONE' && (
            <form className="space-y-6" onSubmit={handlePhoneSubmit}>
              <div className="text-center mb-6">
                <p className="text-gray-600">Enter your mobile number to get started</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    id="phone"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    className={`flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-xl border focus:ring-brand-navy focus:border-brand-navy sm:text-sm outline-none transition-colors ${error ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter 10 digit number"
                  />
                </div>
                {error && <p className="mt-2 text-xs text-red-600 font-medium">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={phone.length !== 10 || isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-navy hover:bg-[#002b4d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Continue'}
              </button>
            </form>
          )}

          {step === 'ENTER_PIN' && (
            <form className="space-y-6" onSubmit={handlePinSubmit}>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">Welcome back!</p>
                <p className="font-bold text-gray-900 mt-1">+91 {phone}</p>
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 4-Digit PIN
                </label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    id="pin"
                    required
                    maxLength={4}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    className={`block w-full text-center tracking-[1em] font-bold text-2xl px-3 py-3 rounded-xl border focus:ring-brand-navy focus:border-brand-navy outline-none transition-colors ${error ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {error && <p className="mt-2 text-xs text-red-600 font-medium text-center">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={pin.length !== 4 || isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-navy hover:bg-[#002b4d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Login'}
              </button>
              
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={handleForgotPin}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Forgot PIN?
                </button>
              </div>
            </form>
          )}

          {step === 'CREATE_PROFILE' && (
            <form className="space-y-5" onSubmit={handleCreateProfileSubmit}>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">Looks like you're new here!</p>
                <p className="font-bold text-gray-900 mt-1">Create your profile</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 focus:bg-white focus:ring-brand-navy focus:border-brand-navy sm:text-sm outline-none transition-colors"
                  placeholder="e.g. Rahul Kumar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 focus:bg-white focus:ring-brand-navy focus:border-brand-navy sm:text-sm outline-none transition-colors"
                  placeholder="e.g. rahul@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Set 4-Digit PIN *</label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    required
                    maxLength={4}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    className={`block w-full text-center tracking-[0.5em] font-bold text-xl px-4 py-3 border rounded-xl bg-gray-50 placeholder-gray-300 focus:bg-white focus:ring-brand-navy focus:border-brand-navy sm:text-sm outline-none transition-colors ${error ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {error && <p className="mt-2 text-xs text-red-600 font-medium">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading || profileName.trim().length === 0 || pin.length !== 4}
                className="w-full mt-2 flex justify-center items-center gap-2 bg-brand-navy text-white font-bold py-3.5 rounded-xl hover:bg-[#002b4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account & Login'}
              </button>
            </form>
          )}

          {step === 'FORGOT_PIN_OTP' && (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">Enter the 4 digit OTP sent to</p>
                <p className="font-bold text-gray-900 mt-1">+91 {phone}</p>
              </div>

              <div>
                <label className="sr-only">OTP</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  className={`block w-full text-center tracking-[1em] font-bold text-2xl px-3 py-3 rounded-xl border focus:ring-brand-navy focus:border-brand-navy outline-none transition-colors ${error ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="••••"
                />
                {error && <p className="mt-2 text-xs text-red-600 font-medium text-center">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={otp.length !== 4 || isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-navy hover:bg-[#002b4d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Verify OTP'}
              </button>
            </form>
          )}

          {step === 'SET_NEW_PIN' && (
            <form className="space-y-6" onSubmit={handleSetNewPin}>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">Set a new 4-digit PIN for</p>
                <p className="font-bold text-gray-900 mt-1">+91 {phone}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New 4-Digit PIN</label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    required
                    maxLength={4}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    className={`block w-full text-center tracking-[1em] font-bold text-2xl px-3 py-3 rounded-xl border focus:ring-brand-navy focus:border-brand-navy outline-none transition-colors ${error ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {error && <p className="mt-2 text-xs text-red-600 font-medium text-center">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={pin.length !== 4 || isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-navy hover:bg-[#002b4d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save & Login'}
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-gray-100 pt-6">
            <p className="text-center text-xs text-gray-500">
              By proceeding, you agree to our <a href="#" className="font-medium text-gray-900 hover:underline">Terms & Conditions</a> and <a href="#" className="font-medium text-gray-900 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
        </ModalErrorBoundary>
      </div>
    </>
  );
}
