"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeartCrack, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';

// In a real app, we'd fetch product details based on productIds from backend
// For Phase 1, we mock a database
const MOCK_PRODUCTS_DB: Record<string, any> = {
  "prod_1": { id: "prod_1", title: "Matte Black Rectangle", price: 1200, imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80" },
  "prod_2": { id: "prod_2", title: "Gold Rim Aviators", price: 2500, imageUrl: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=400&q=80" },
  "prod_3": { id: "prod_3", title: "Clear Frame Wayfarer", price: 1500, imageUrl: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=400&q=80" },
};

export default function WishlistPage() {
  const { productIds, toggleItem } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isLoggedIn, openLoginModal } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) {
      setTimeout(() => openLoginModal(), 500);
      return;
    }
    
    // Simulate fetching products by ID from API
    const fetchedItems = productIds.map(id => MOCK_PRODUCTS_DB[id] || { id, title: `Product ${id}`, price: 999 }).reverse();
    setItems(fetchedItems);
  }, [productIds]);

  const handleMoveToCart = (item: any) => {
    addItem({
      id: `${item.id}-${Date.now()}`,
      productId: item.id,
      qty: 1,
      price: item.price,
      title: item.title,
      imageUrl: item.imageUrl
    });
    toggleItem(item.id); // Remove from wishlist after moving
  };

  if (!hydrated) return null;

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 min-h-[60vh] flex flex-col items-center justify-center text-center">
        <HeartCrack size={64} className="text-gray-300 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Login to view wishlist</h1>
        <p className="text-gray-500 mb-8 max-w-md">Save items you love to your wishlist. Review them anytime and easily move them to your bag.</p>
        <button 
          onClick={() => openLoginModal()}
          className="bg-brand-navy text-white font-bold px-8 py-3 rounded-full hover:bg-[#002b4d] transition-colors"
        >
          Sign in or Create Account
        </button>
      </div>
    );
  }

  if (productIds.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 min-h-[60vh] flex flex-col items-center justify-center text-center">
        <HeartCrack size={64} className="text-gray-300 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h1>
        <p className="text-gray-500 mb-8 max-w-md">Save items you love to your wishlist. Review them anytime and easily move them to your bag.</p>
        <Link 
          href="/"
          className="bg-brand-navy text-white font-bold px-8 py-3 rounded-full hover:bg-[#002b4d] transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-black text-brand-navy mb-8">My Wishlist ({productIds.length})</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
            <div className="relative aspect-[4/3] bg-gray-50">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
              )}
              <button 
                onClick={() => toggleItem(item.id)}
                className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-brand-navy font-bold mb-4">₹{item.price}</p>
              
              <button 
                onClick={() => handleMoveToCart(item)}
                className="mt-auto w-full py-2.5 border-2 border-brand-navy text-brand-navy rounded-full font-bold hover:bg-brand-navy hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} /> Move to Bag
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
