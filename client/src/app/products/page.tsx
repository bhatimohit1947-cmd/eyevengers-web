"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { SlidersHorizontal, ChevronDown, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { useSearchParams } from 'next/navigation';

function ProductsContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Custom Filters
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  
  const searchParams = useSearchParams();
  const genderFilter = searchParams.get('gender');
  const categoryFilter = searchParams.get('category');

  useEffect(() => {
    fetch('https://eyevengers-web.onrender.com/api/admin/products')
      .then(res => res.json())
      .then(data => {
        // Map backend data to ProductCard format
        const formattedProducts = (data || []).map((p: any) => {
          const hasDiscount = p.sku && p.sku.includes('|DISCOUNT:');
          const hasShape = p.sku && p.sku.includes('|SHAPE:');
          const discountPercent = hasDiscount ? Number(p.sku.split('|DISCOUNT:')[1].split('|')[0]) : 0;
          const shapeVal = hasShape ? p.sku.split('|SHAPE:')[1].split('|')[0] : '';
          const mrp = discountPercent > 0 ? Math.round(p.price / (1 - (discountPercent / 100))) : p.price;

          return {
            id: p.id,
            name: p.name,
            brand: p.brand,
            shape: shapeVal,
            imageUrl: p.image_url,
            mrp: mrp,
            sellingPrice: p.price,
            discountPercent: discountPercent,
            rating: 4.5,
            reviewsCount: 128,
            tags: p.stock > 0 ? [] : ["Out of Stock"],
            gender: p.gender,
            category: p.category
          };
        });
        setProducts(formattedProducts);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load products", err);
        setIsLoading(false);
      });
  }, []);

  // Filter Logic
  const filteredProducts = products.filter(p => {
    let matchGender = true;
    let matchCategory = true;
    let matchBrand = true;
    let matchShape = true;
    let matchPrice = true;
    
    if (genderFilter) {
      const gFilter = genderFilter.toLowerCase();
      const pGender = (p.gender || '').toLowerCase();
      if (gFilter === 'men' || gFilter === 'women') {
        matchGender = (pGender === gFilter || pGender === 'unisex');
      } else {
        matchGender = pGender === gFilter;
      }
    }
    
    if (categoryFilter) {
      matchCategory = (p.category || '').toLowerCase() === categoryFilter.toLowerCase();
    }
    
    if (selectedBrands.length > 0) matchBrand = selectedBrands.includes(p.brand);
    if (selectedShapes.length > 0) matchShape = selectedShapes.includes(p.shape);
    
    if (selectedPrices.length > 0) {
      matchPrice = selectedPrices.some(range => {
        if (range === 'under1000') return p.sellingPrice < 1000;
        if (range === '1000-2000') return p.sellingPrice >= 1000 && p.sellingPrice <= 2000;
        if (range === 'above2000') return p.sellingPrice > 2000;
        return false;
      });
    }
    
    return matchGender && matchCategory && matchBrand && matchShape && matchPrice;
  });

  const uniqueBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));
  const uniqueShapes = Array.from(new Set(products.map(p => p.shape).filter(Boolean)));

  const toggleFilter = (setState: any, state: string[], value: string) => {
    if (state.includes(value)) setState(state.filter(v => v !== value));
    else setState([...state, value]);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-0">
      
      {/* Page Header & Breadcrumbs */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 capitalize">
              {categoryFilter || 'All Products'} {genderFilter ? `- ${genderFilter}` : ''}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Showing {filteredProducts.length} items</p>
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
              <button 
                onClick={() => { setSelectedBrands([]); setSelectedShapes([]); setSelectedPrices([]); }}
                className="text-xs text-blue-600 font-medium"
              >
                Clear All
              </button>
            </div>
            
            {/* Filter Categories */}
            <div className="space-y-6">
              
              {/* Shape */}
              {uniqueShapes.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Frame Shape</h3>
                  <div className="space-y-2">
                    {uniqueShapes.map(shape => (
                      <label key={shape as string} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={selectedShapes.includes(shape as string)} onChange={() => toggleFilter(setSelectedShapes, selectedShapes, shape as string)} className="rounded border-gray-300 text-brand-navy focus:ring-brand-navy" />
                        {shape as string}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Brand */}
              {uniqueBrands.length > 0 && (
                <div className={`${uniqueShapes.length > 0 ? 'border-t border-gray-100 pt-4' : ''}`}>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Brand</h3>
                  <div className="space-y-2">
                    {uniqueBrands.map(brand => (
                      <label key={brand as string} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={selectedBrands.includes(brand as string)} onChange={() => toggleFilter(setSelectedBrands, selectedBrands, brand as string)} className="rounded border-gray-300 text-brand-navy focus:ring-brand-navy" />
                        {brand as string}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Price Range</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={selectedPrices.includes('under1000')} onChange={() => toggleFilter(setSelectedPrices, selectedPrices, 'under1000')} className="rounded border-gray-300 text-brand-navy focus:ring-brand-navy" />
                    Under ₹1000
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={selectedPrices.includes('1000-2000')} onChange={() => toggleFilter(setSelectedPrices, selectedPrices, '1000-2000')} className="rounded border-gray-300 text-brand-navy focus:ring-brand-navy" />
                    ₹1000 - ₹2000
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={selectedPrices.includes('above2000')} onChange={() => toggleFilter(setSelectedPrices, selectedPrices, 'above2000')} className="rounded border-gray-300 text-brand-navy focus:ring-brand-navy" />
                    Above ₹2000
                  </label>
                </div>
              </div>

            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-brand-navy" size={48} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No products found for this category or filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product, idx) => (
                <ProductCard key={product.id || idx} product={product} />
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-brand-navy" size={48} /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
