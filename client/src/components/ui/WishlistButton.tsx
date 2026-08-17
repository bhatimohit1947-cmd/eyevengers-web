"use client";

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthGate } from '@/hooks/useAuthGate';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: number;
}

export function WishlistButton({ productId, className = "", size = 20 }: WishlistButtonProps) {
  const { hasItem, toggleItem } = useWishlistStore();
  const { requireAuth } = useAuthGate();
  const isWished = hasItem(productId);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    requireAuth(async () => {
      // Optimistic UI update
      toggleItem(productId);
      
      setIsUpdating(true);
      try {
        // Mock API Call to update backend
        const res = await fetch('/api/wishlist/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        });
        
        if (!res.ok) {
          // Revert optimistic update if API fails
          toggleItem(productId);
          console.error("Failed to update wishlist on server");
        }
      } catch (err) {
        // Revert on network error
        toggleItem(productId);
      } finally {
        setIsUpdating(false);
      }
    });
  };

  return (
    <button 
      onClick={handleClick}
      disabled={isUpdating}
      className={`p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none ${className}`}
    >
      <Heart 
        size={size} 
        className={`transition-colors duration-300 ${
          isWished ? 'fill-brand-navy text-brand-navy scale-110' : 'text-gray-400 hover:text-gray-700'
        }`} 
      />
    </button>
  );
}
