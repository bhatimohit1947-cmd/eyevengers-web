"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, MoreHorizontal, ArrowLeft, ShoppingBag } from 'lucide-react';

const MOCK_REELS = [
  {
    id: 1,
    videoUrl: "", // Mock
    title: "Summer Vibes 😎",
    description: "Check out the new Air Flex series. Super light!",
    productName: "Air Flex Square",
    price: "₹1,999",
    likes: "12K",
    comments: "450",
    backgroundColor: "bg-gradient-to-br from-blue-900 to-black"
  },
  {
    id: 2,
    videoUrl: "", // Mock
    title: "Office Ready 💼",
    description: "Anti-glare lenses are a game changer for long hours.",
    productName: "Midnight Blue Frame",
    price: "₹1,500",
    likes: "8.5K",
    comments: "210",
    backgroundColor: "bg-gradient-to-br from-gray-900 to-black"
  },
  {
    id: 3,
    videoUrl: "", // Mock
    title: "Weekend Getaway 🏖️",
    description: "Polarized sunglasses you need this summer.",
    productName: "Golden Aviator Pro",
    price: "₹2,500",
    likes: "24K",
    comments: "1.2K",
    backgroundColor: "bg-gradient-to-br from-orange-900 to-black"
  }
];

export default function ReelsPage() {
  const [currentReelIndex, setCurrentReelIndex] = useState(0);

  // Simplified scroll snap handling mock
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const index = Math.round(target.scrollTop / target.clientHeight);
    setCurrentReelIndex(index);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 text-white flex flex-col md:flex-row h-screen">
      
      {/* Mobile Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
        <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <span className="font-bold text-lg tracking-widest">REELS</span>
        <div className="w-10"></div> {/* Spacer for center alignment */}
      </div>

      {/* Main Feed Container */}
      <div 
        className="flex-1 h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar relative w-full md:max-w-md md:mx-auto md:border-x md:border-gray-800"
        onScroll={handleScroll}
      >
        {MOCK_REELS.map((reel) => (
          <div key={reel.id} className={`w-full h-full snap-start relative ${reel.backgroundColor} flex flex-col justify-end pb-24 md:pb-6`}>
            
            {/* Video Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
               <svg className="w-32 h-32 animate-pulse text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Reel Content Overlay */}
            <div className="relative z-10 px-4 flex gap-4">
              
              {/* Text and Product Link */}
              <div className="flex-1 flex flex-col justify-end gap-3 pb-2">
                <div>
                  <h3 className="font-bold text-lg mb-1">{reel.title}</h3>
                  <p className="text-sm text-gray-200 line-clamp-2">{reel.description}</p>
                </div>

                {/* Attached Product Card */}
                <Link href="/products/1" className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 border border-white/20 hover:bg-white/20 transition-colors">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{reel.productName}</p>
                    <p className="text-xs text-gray-300">{reel.price}</p>
                  </div>
                  <button className="bg-brand-gold text-brand-navy p-2 rounded-full font-bold">
                    <ShoppingBag size={16} />
                  </button>
                </Link>
              </div>

              {/* Action Buttons (Right Sidebar) */}
              <div className="w-12 flex flex-col items-center justify-end gap-6 pb-2">
                <button className="flex flex-col items-center gap-1 group">
                  <div className="w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-black/40 transition">
                    <Heart size={24} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-white drop-shadow-md">{reel.likes}</span>
                </button>
                
                <button className="flex flex-col items-center gap-1 group">
                  <div className="w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-black/40 transition">
                    <MessageCircle size={22} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-white drop-shadow-md">{reel.comments}</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                  <div className="w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-black/40 transition">
                    <Share2 size={22} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-white drop-shadow-md">Share</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                  <div className="w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-black/40 transition">
                    <MoreHorizontal size={22} className="text-white" />
                  </div>
                </button>
              </div>
              
            </div>
            
          </div>
        ))}
      </div>
      
    </div>
  );
}
