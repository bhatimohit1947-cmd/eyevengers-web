"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShieldCheck, ChevronRight, Tag } from 'lucide-react';

export default function CartPage() {
  const cartItems = [
    {
      id: "prod-1",
      name: "Midnight Blue Square Frame",
      brand: "VINCENT CHASE",
      sellingPrice: 1500,
      mrp: 3500,
      quantity: 1,
      lensType: "Zero Power",
      lensPrice: 0,
      imageUrl: ""
    }
  ];

  const totalMrp = cartItems.reduce((acc, item) => acc + (item.mrp * item.quantity), 0);
  const totalDiscount = cartItems.reduce((acc, item) => acc + ((item.mrp - item.sellingPrice) * item.quantity), 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + (item.sellingPrice * item.quantity) + item.lensPrice, 0);

  const [couponCode, setCouponCode] = useState("");
  const [couponState, setCouponState] = useState<{type: 'none' | 'success' | 'error', message: string, discount: number}>({
    type: 'none',
    message: '',
    discount: 0
  });

  const applyCoupon = async () => {
    if (!couponCode) return;
    setCouponState({ type: 'none', message: 'Validating...', discount: 0 });
    
    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/offers/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, cartItems, user: { id: 'guest', orderCount: 0 } })
      });
      const data = await res.json();
      
      if (data.valid) {
        // Calculate mock discount based on the offer
        let discountVal = 0;
        if (data.offer.discountType === 'percentage') {
          discountVal = totalAmount * (data.offer.discountValue / 100);
        } else {
          discountVal = data.offer.discountValue;
        }
        setCouponState({ type: 'success', message: `${couponCode} applied!`, discount: discountVal });
      } else {
        setCouponState({ type: 'error', message: data.error, discount: 0 });
      }
    } catch (err) {
      setCouponState({ type: 'error', message: 'Failed to apply coupon', discount: 0 });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto md:px-4 py-4 md:py-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 px-4 md:px-0 mb-4">Cart ({cartItems.length} items)</h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Cart Items */}
          <div className="w-full md:w-2/3 flex flex-col gap-4">
            {cartItems.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-4">
                
                <div className="w-full sm:w-32 aspect-[4/3] sm:aspect-square bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{item.brand}</p>
                        <h3 className="font-semibold text-gray-900 leading-tight mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-500">Lens: <span className="font-medium text-gray-900">{item.lensType}</span></p>
                      </div>
                      <button className="text-gray-400 hover:text-red-500 p-1 transition">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-2 py-1">
                      <button className="p-1 text-gray-500 hover:text-brand-navy disabled:opacity-50">
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button className="p-1 text-gray-500 hover:text-brand-navy">
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 line-through">₹{item.mrp + item.lensPrice}</span>
                        <span className="text-lg font-bold text-gray-900">₹{item.sellingPrice + item.lensPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-[#fcf8e3] rounded-xl p-4 flex items-start gap-3 mt-2">
              <ShieldCheck size={20} className="text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                Safe and Secure Payments. Easy returns. 100% Authentic products.
              </div>
            </div>
          </div>

          {/* Bill Details */}
          <div className="w-full md:w-1/3">
            
            {/* Coupon Code Input */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Tag size={16} /> Have a Coupon?</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code" 
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 uppercase font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                />
                <button 
                  onClick={applyCoupon}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition"
                >
                  APPLY
                </button>
              </div>
              {couponState.type === 'error' && <p className="text-red-500 text-xs font-bold mt-2">{couponState.message}</p>}
              {couponState.type === 'success' && <p className="text-green-600 text-xs font-bold mt-2">{couponState.message}</p>}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4">Bill Details</h2>
              
              <div className="space-y-3 text-sm mb-4 border-b border-gray-100 pb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Total MRP</span>
                  <span>₹{totalMrp}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Total Discount</span>
                  <span>-₹{totalDiscount}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes & Fees</span>
                  <span>₹0</span>
                </div>
                {couponState.type === 'success' && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Coupon Discount</span>
                    <span>-₹{couponState.discount.toFixed(0)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between font-bold text-lg text-gray-900 mb-6">
                <span>Total Payable</span>
                <span>₹{(totalAmount - couponState.discount).toFixed(0)}</span>
              </div>

              <Link 
                href="/checkout"
                className="w-full bg-brand-navy text-white font-bold text-base rounded-full py-3.5 hover:bg-blue-900 transition flex items-center justify-center gap-2 shadow-md shadow-blue-900/20"
              >
                PROCEED TO CHECKOUT
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
