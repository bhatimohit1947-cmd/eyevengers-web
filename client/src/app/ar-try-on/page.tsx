"use client";
import React from 'react';

export default function ARTryOnPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-3xl font-black text-brand-navy mb-2">AR Try-on</h1>
      <p className="text-gray-500 mb-8 max-w-md">Try thousands of frames virtually from the comfort of your home using our advanced augmented reality tech.</p>
      
      <div className="bg-purple-50 border border-purple-200 text-purple-800 px-6 py-4 rounded-xl text-sm font-bold">
        Please use the mobile app or allow camera access to use this feature. Coming soon to web!
      </div>
    </div>
  );
}
