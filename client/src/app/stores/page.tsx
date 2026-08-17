"use client";
import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Map as MapIcon, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function StoresLocatorPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/stores?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setStores(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="bg-brand-navy text-white pt-10 pb-16 md:pt-16 md:pb-24 px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 tracking-tight">Our Stores</h1>
        <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto">
          Find an Eyevengers store near you to try on frames, get a free eye test, and experience our premium service.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 md:-mt-12 relative z-10">
        {loading ? (
          <div className="flex justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <Loader2 className="w-8 h-8 animate-spin text-brand-navy" />
          </div>
        ) : stores.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-10 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Stores Found</h2>
            <p className="text-gray-500">We are currently updating our store locator. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {stores.map((store) => (
              <div key={store.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-navy/30 transition-all flex flex-col h-full overflow-hidden group">
                <div className="p-4 md:p-6 flex-grow flex flex-col">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:bg-brand-navy transition-colors">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-brand-navy group-hover:text-white transition-colors" />
                  </div>
                  
                  <h3 className="font-black text-gray-900 text-sm md:text-lg mb-1 leading-tight">{store.name}</h3>
                  <p className="text-gray-500 text-[11px] md:text-sm mb-3 md:mb-4 flex-grow line-clamp-3">
                    {store.address}
                  </p>
                  
                  {store.phone && (
                    <div className="flex items-center text-gray-600 text-[10px] md:text-sm font-medium mt-auto bg-gray-50 p-2 md:p-3 rounded-lg">
                      <Phone className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 text-brand-navy" /> 
                      <span className="truncate">{store.phone}</span>
                    </div>
                  )}
                </div>
                
                {store.mapLink && (
                  <a 
                    href={store.mapLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-gray-50 border-t border-gray-100 p-3 md:p-4 flex items-center justify-between text-brand-navy hover:bg-brand-navy hover:text-white transition-colors group/link"
                  >
                    <span className="text-xs md:text-sm font-bold flex items-center">
                      <MapIcon className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" /> Get Directions
                    </span>
                    <ChevronRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
