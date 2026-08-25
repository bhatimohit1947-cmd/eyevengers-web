"use client";

import React, { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthGate } from '@/hooks/useAuthGate';
import { WishlistButton } from '@/components/ui/WishlistButton';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';

export default function ProductPage() {
  const [lensType, setLensType] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState('');

  const { addItem } = useCartStore();
  const { requireAuth } = useAuthGate();

  const product = {
    id: "prod_101",
    title: "Vincent Chase Online",
    price: 1500,
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80"
  };

  const handleAddToCart = async () => {
    // Validate configuration
    if (!lensType) {
      setError('Please select a lens type before adding to bag');
      return;
    }
    
    setError('');
    
    requireAuth(async () => {
      setIsAdding(true);
      
      try {
        // Mock API Call
        const res = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            productId: product.id, 
            lensConfig: { type: lensType }, 
            qty: 1 
          })
        });
        
        // Optimistic Update
        addItem({
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          qty: 1,
          price: product.price,
          title: product.title,
          lensConfig: { type: lensType },
          imageUrl: product.imageUrl
        });

        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (err) {
        console.error(err);
      } finally {
        setIsAdding(false);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Images */}
        <div className="w-full md:w-1/2">
          <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden relative">
            <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4">
              <WishlistButton productId={product.id} className="bg-white shadow-md p-3" size={24} />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="w-full md:w-1/2">
          <h1 className="text-3xl font-black text-gray-900 mb-2">{product.title}</h1>
          <p className="text-2xl font-bold text-brand-navy mb-8">₹{product.price}</p>

          <div className="mb-8 border-t border-b border-gray-100 py-6">
            <h3 className="font-bold text-gray-900 mb-4">Select Lens Type</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setLensType('Zero Power')}
                className={`flex-1 py-4 border-2 rounded-xl font-bold transition-colors ${
                  lensType === 'Zero Power' ? 'border-brand-navy bg-blue-50 text-brand-navy' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Zero Power
              </button>
              <button 
                onClick={() => setLensType('Single Vision')}
                className={`flex-1 py-4 border-2 rounded-xl font-bold transition-colors ${
                  lensType === 'Single Vision' ? 'border-brand-navy bg-blue-50 text-brand-navy' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                With Power
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3 font-bold">{error}</p>}
          </div>

          <button 
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full bg-brand-navy text-white font-bold py-4 rounded-full text-lg hover:bg-[#002b4d] transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag size={24} />
            {isAdding ? 'Adding...' : 'Add to Bag'}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <CheckCircle2 className="text-green-400" />
          <span className="font-bold">Added to Bag!</span>
          <a href="#" className="ml-4 text-brand-gold hover:underline">View Bag</a>
        </div>
      )}
    </div>
  );
}
