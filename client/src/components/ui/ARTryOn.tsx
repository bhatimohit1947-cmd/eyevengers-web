"use client";

import React, { useState, useEffect } from 'react';
import { Camera, X, RefreshCcw, Maximize } from 'lucide-react';

interface ARTryOnProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export function ARTryOn({ isOpen, onClose, productName }: ARTryOnProps) {
  const [loading, setLoading] = useState(true);

  // Mock loading sequence
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      
      {/* Modal Container */}
      <div className="relative w-full h-full md:w-[400px] md:h-[800px] md:max-h-[90vh] bg-gray-900 md:rounded-[32px] overflow-hidden flex flex-col border md:border-gray-800 shadow-2xl">
        
        {/* Header */}
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
          <div className="text-white font-bold text-sm drop-shadow-md">
            TRY ON IN 3D
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera/AR Viewport */}
        <div className="flex-1 relative flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white font-medium text-sm animate-pulse">Initializing Camera...</p>
            </div>
          ) : (
            <>
              {/* Fake camera feed background */}
              <div className="absolute inset-0 bg-gray-800">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              </div>
              
              {/* Face mesh guide (mock) */}
              <div className="relative w-48 h-64 border-2 border-dashed border-white/20 rounded-[40%] flex items-center justify-center">
                {/* Simulated Glasses overlaid on face */}
                <div className="absolute top-1/3 w-40 h-12 bg-black/40 border border-white/10 rounded-lg flex items-center justify-between px-2 backdrop-blur-sm shadow-xl">
                  <div className="w-14 h-10 rounded bg-blue-500/20 border border-blue-400/30"></div>
                  <div className="w-4 h-1 bg-gray-400/50"></div>
                  <div className="w-14 h-10 rounded bg-blue-500/20 border border-blue-400/30"></div>
                </div>
              </div>
              
              {/* Bottom gradient */}
              <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
            </>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col gap-6 z-10">
          
          {!loading && (
            <div className="text-center">
              <h3 className="text-white font-bold text-lg mb-1">{productName}</h3>
              <p className="text-gray-300 text-xs">Look straight ahead</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition">
              <RefreshCcw size={20} />
            </button>
            
            <button className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:scale-105 transition-transform">
              <Camera size={24} className="text-brand-navy" />
            </button>
            
            <button className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition">
              <Maximize size={20} />
            </button>
          </div>
          
        </div>

      </div>
    </div>
  );
}
