"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeartCrack, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';

// MOCK_PRODUCTS_DB removed, we will fetch real data from backend

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
    
    // Fetch products from API and match with productIds
    if (productIds.length > 0) {
      fetch('https://eyevengers-web.onrender.com/api/admin/products')
        .then(res => res.json())
        .then(data => {
          const fetchedItems = data
            .filter((p: any) => productIds.includes(p.id))
            .map((p: any) => {
              const img = p.image_url || p.imageUrl || '';
              return {
                id: p.id,
                title: p.name,
                price: p.price,
                imageUrl: img.split(',')[0].trim()
              };
            });
          setItems(fetchedItems.reverse());
        })
        .catch(err => console.error("Failed to fetch wishlist products", err));
    } else {
      setItems([]);
    }
  }, [productIds, hydrated, isLoggedIn, openLoginModal]);

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
          <div key={item.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col relative group">
            <Link href={`/products/${item.id}`} className="block relative aspect-[4/3] bg-gray-50 overflow-hidden">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
              )}
            </Link>
            <button 
              onClick={(e) => { e.preventDefault(); toggleItem(item.id); }}
              className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm text-gray-400 hover:text-red-500 hover:bg-white transition-colors z-10"
            >
              <Trash2 size={16} />
            </button>
            <div className="p-4 flex-1 flex flex-col">
              <Link href={`/products/${item.id}`} className="block hover:text-brand-navy transition-colors">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{item.title}</h3>
              </Link>
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
