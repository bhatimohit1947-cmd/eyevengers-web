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
        const offerRes = await fetch(`https://eyevengers-web.onrender.com/api/offers/${id}`);
        const offerData = await offerRes.json();
        setOffer(offerData);

        // Fetch all products
        const prodRes = await fetch(`https://eyevengers-web.onrender.com/api/admin/products`);
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
          <span className="inline-block bg-white/15 text-brand-gold font-semibold text-xs tracking-wide px-3.5 py-1 rounded-full mb-4 border border-white/10">
            Exclusive Campaign
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-4">{offer.name}</h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto mb-6">
            Get {offer.discountValue}{offer.discountType === 'percentage' ? '%' : '₹'} OFF on selected premium products.
          </p>
          
          {offer.requiresCoupon && (
            <div className="inline-flex items-center gap-3 bg-white text-brand-navy px-5 py-3 rounded-xl font-bold shadow-lg">
              <Tag size={20} className="text-brand-gold" aria-hidden="true" />
              Use Code: <span className="text-xl text-green-600 font-black tracking-widest">{offer.couponCode}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
        
        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-gray-700">
            Showing {products.length} {products.length === 1 ? 'eligible product' : 'eligible products'}
          </h2>
          <button 
            type="button" 
            className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition focus-visible:ring-2 focus-visible:ring-brand-navy"
          >
            <Filter size={18} aria-hidden="true" /> Filter Options
          </button>
        </div>

        {/* Product Grid / Adaptable layout */}
        <div className={products.length === 1 ? "flex justify-center py-2" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"}>
          <div className={products.length === 1 ? "w-full max-w-sm" : "contents"}>
            {products.map(product => {
              // Calculate dynamic price based on THIS offer specifically
              // Note: In real logic, we use getEffectivePrice which checks global context.
              // Here, we override it to show this offer's direct impact.
              const discountAmount = offer.discountType === 'percentage' 
                ? product.price * (offer.discountValue / 100) 
                : offer.discountValue;
              
              const effectivePrice = Math.max(0, product.price - discountAmount);

              const displayImage = (product.image_url || product.imageUrl || '').split(',')[0].trim();

              return (
                <div key={product.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden group hover:shadow-lg transition-all flex flex-col relative">
                  <Link href={`/products/${product.id}`} className="block flex-1 flex flex-col">
                    <div className="relative aspect-[4/3] bg-gray-100 p-4">
                      <span 
                        className="absolute top-2.5 left-2.5 z-10 pointer-events-none inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold tracking-wide uppercase bg-red-600 text-white shadow-md ring-2 ring-white/80"
                        aria-label={`${offer.discountValue}${offer.discountType === 'percentage' ? ' percent' : ' Rupees'} discount`}
                      >
                        {offer.discountValue}{offer.discountType === 'percentage' ? '%' : '₹'} OFF
                      </span>
                      
                      {displayImage && !displayImage.match(/\.(mp4|webm|ogg)$/i) ? (
                        <img 
                          src={displayImage} 
                          alt={product.name} 
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='6' cy='12' r='4'/%3E%3Ccircle cx='18' cy='12' r='4'/%3E%3Cline x1='10' y1='12' x2='14' y2='12'/%3E%3C/svg%3E";
                            e.currentTarget.className = "w-24 h-24 m-auto opacity-40 object-contain";
                          }}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : displayImage ? (
                        <video src={displayImage} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" autoPlay loop muted playsInline />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
                          <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="6" cy="12" r="4"/><circle cx="18" cy="12" r="4"/><path d="M10 12h4"/>
                          </svg>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Image unavailable</span>
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
                      <h3 className="font-bold text-gray-900 mb-2 leading-tight flex-1 group-hover:text-brand-navy transition-colors">{product.name}</h3>
                      
                      <div className="flex items-end gap-2 mb-3 mt-auto">
                        <span className="text-xl font-black text-brand-navy">₹{Math.round(effectivePrice)}</span>
                        <span className="text-sm text-gray-400 line-through mb-0.5">₹{product.price}</span>
                      </div>
                      
                      <button 
                        type="button" 
                        className="w-full bg-brand-navy hover:bg-blue-900 text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-navy"
                      >
                        Buy Now <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </Link>
                  
                  {/* Wishlist Button */}
                  <button 
                    type="button"
                    aria-label={`Add ${product.name} to wishlist`}
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/products/${product.id}`;
                    }}
                    className="absolute top-3 right-3 text-gray-600 hover:text-red-500 z-10 transition bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-brand-navy"
                  >
                    <Heart size={18} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        
      </div>
    </div>
  );
}
