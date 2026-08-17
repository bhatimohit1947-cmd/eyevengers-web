"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 10) {
      setStep(2);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 4) {
      // Dummy success
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in or Create Account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-[20px] sm:px-10 border border-gray-100 relative">
          
          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="absolute top-4 left-4 text-gray-500 hover:text-gray-900"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleSendOtp}>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    id="phone"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 min-w-0 block w-full px-3 py-3 rounded-none rounded-r-md border border-gray-300 focus:ring-brand-navy focus:border-brand-navy sm:text-sm"
                    placeholder="Enter 10 digit number"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={phone.length !== 10}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-brand-navy hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  SEND OTP
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="text-center mb-6 mt-4">
                <p className="text-sm text-gray-600">Enter the 4 digit code sent to</p>
                <p className="font-bold text-gray-900">+91 {phone}</p>
              </div>

              <div>
                <label htmlFor="otp" className="sr-only">
                  OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  required
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="block w-full text-center tracking-[1em] font-bold text-2xl px-3 py-3 rounded-md border border-gray-300 focus:ring-brand-navy focus:border-brand-navy"
                  placeholder="••••"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={otp.length !== 4}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-brand-navy hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  VERIFY AND PROCEED
                </button>
              </div>
              
              <div className="text-center">
                <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <p className="text-center text-xs text-gray-500">
              By proceeding, you agree to our <a href="#" className="font-medium text-gray-900 hover:underline">Terms & Conditions</a> and <a href="#" className="font-medium text-gray-900 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
