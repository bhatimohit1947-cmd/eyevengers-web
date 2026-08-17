"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Filter, Heart, Tag } from 'lucide-react';
import { getEffectivePrice } from '@/utils/pricing';

export default function OfferLandingPage() {
  const { id } = useParams();
  const [offer, setOffer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch specific offer details
        const offerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/offers/${id}`);
        const offerData = await offerRes.json();
        setOffer(offerData);

        // Fetch all products
        const prodRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/products`);
        const prodData = await prodRes.json();
        
        // Filter products using Smart Rules
        const filteredProducts = prodData.filter((product: any) => {
          if (offerData.scope !== 'smart_rules') return true;
          
          if (offerData.targetCategories && offerData.targetCategories.length > 0) {
            if (!offerData.targetCategories.includes(product.category)) return false;
          }
          
          if (offerData.targetBrands && offerData.targetBrands.length > 0) {
            if (!product.brand || !offerData.targetBrands.some((b: string) => b.toLowerCase() === product.brand.toLowerCase())) {
              return false;
            }
          }
          
          if (offerData.minPrice !== null && product.price < offerData.minPrice) return false;
          if (offerData.maxPrice !== null && product.price > offerData.maxPrice) return false;
          
          return true;
        });
        
        setProducts(filteredProducts);
      } catch (err) {
        console.error("Failed to load offer data", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading Offer Details...</div>;
  }

  if (!offer || offer.error) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Offer not found or expired.</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      
      {/* Dynamic Campaign Header */}
      <div className="bg-brand-navy text-white pt-10 pb-16 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 opacity-10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 text-center">
          <span className="inline-block bg-white/20 text-brand-gold font-bold uppercase tracking-wider text-xs px-3 py-1 rounded-full mb-4">
            Exclusive Campaign
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-4">{offer.name}</h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto mb-6">
            Get {offer.discountValue}{offer.discountType === 'percentage' ? '%' : '₹'} OFF on selected premium products.
          </p>
          
          {offer.requiresCoupon && (
            <div className="inline-flex items-center gap-3 bg-white text-brand-navy px-5 py-3 rounded-xl font-bold shadow-lg">
              <Tag size={20} className="text-brand-gold" />
              Use Code: <span className="text-xl text-green-600 font-black tracking-widest">{offer.couponCode}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
        
        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm font-bold text-gray-500">
            Showing {products.length} eligible products
          </div>
          <button className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 font-medium hover:bg-gray-50 transition">
            <Filter size={18} /> Filter Options
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => {
            // Calculate dynamic price based on THIS offer specifically
            // Note: In real logic, we use getEffectivePrice which checks global context.
            // Here, we override it to show this offer's direct impact.
            const discountAmount = offer.discountType === 'percentage' 
              ? product.price * (offer.discountValue / 100) 
              : offer.discountValue;
            
            const effectivePrice = Math.max(0, product.price - discountAmount);

            return (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden group hover:shadow-lg transition-all flex flex-col">
                <div className="relative aspect-[4/3] bg-gray-100 p-4">
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase z-10 shadow-sm">
                    {offer.discountValue}{offer.discountType === 'percentage' ? '%' : '₹'} OFF
                  </span>
                  
                  <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500 z-10 transition">
                    <Heart size={20} />
                  </button>
                  
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-300">
                      NO IMAGE
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{product.category}</p>
                    {product.brand && product.brand !== 'Generic' && (
                      <span className="text-xs font-bold text-brand-navy bg-blue-50 px-2 py-0.5 rounded-full">{product.brand}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 leading-tight flex-1">{product.name}</h3>
                  
                  <div className="flex items-end gap-2 mb-3 mt-auto">
                    <span className="text-xl font-black text-brand-navy">₹{Math.round(effectivePrice)}</span>
                    <span className="text-sm text-gray-400 line-through mb-0.5">₹{product.price}</span>
                  </div>
                  
                  <button className="w-full bg-brand-navy hover:bg-blue-900 text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
                    Add to Bag <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
      </div>
    </div>
  );
}
