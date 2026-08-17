"use client";

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';

// Dummy data
const MOCK_PRODUCTS = Array(8).fill(null).map((_, i) => ({
  id: `prod-${i}`,
  name: i % 2 === 0 ? "Midnight Blue Square Frame" : "Classic Tortoise Round Glasses",
  brand: i % 3 === 0 ? "JOHN JACOBS" : "VINCENT CHASE",
  imageUrl: "",
  mrp: 3500,
  sellingPrice: 1500,
  discountPercent: 57,
  rating: 4.5,
  reviewsCount: 128,
  tags: ["with Free BLU lenses", "Extra Light"]
}));

export default function ProductsPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-0">
      
      {/* Page Header & Breadcrumbs */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Eyeglasses</h1>
            <p className="text-sm text-gray-500 mt-1">Showing 142 items</p>
          </div>
          
          {/* Filter & Sort Controls */}
          <div className="flex gap-2">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm font-medium hover:border-brand-navy transition"
            >
              <SlidersHorizontal size={16} />
              Filter
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm font-medium hover:border-brand-navy transition">
              Sort By
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        
        {/* Desktop Filter Sidebar (Hidden on mobile) */}
        <aside className={`hidden md:block w-64 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-[20px] border border-gray-200 p-5 sticky top-24">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900">Filters</h2>
              <button className="text-xs text-blue-600 font-medium">Clear All</button>
            </div>
            
            {/* Filter Categories */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Frame Shape</h3>
                <div className="space-y-2">
                  {['Rectangle', 'Round', 'Wayfarer', 'Aviator'].map(shape => (
                    <label key={shape} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-brand-navy focus:ring-brand-navy" />
                      {shape}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Brand</h3>
                <div className="space-y-2">
                  {['Vincent Chase', 'John Jacobs', 'Lenskart Air'].map(brand => (
                    <label key={brand} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-brand-navy focus:ring-brand-navy" />
                      {brand}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {MOCK_PRODUCTS.map((product, idx) => (
              <ProductCard key={idx} product={product} />
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}
