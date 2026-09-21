"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAddressStore } from '@/store/useAddressStore';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import AddressManager from '@/components/checkout/AddressManager';
import { getEffectivePrice, ACTIVE_OFFERS, UserContext } from '@/utils/pricing';

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoggedIn, user, openLoginModal, membershipBenefits, membershipTier } = useAuthStore();
  const { items: cartItems, totalPrice: baseTotalPrice, clearCart } = useCartStore();
  const { getUserAddresses } = useAddressStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  
  const [calculatedTotal, setCalculatedTotal] = useState(baseTotalPrice);
  
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    title: string;
    benefitType?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('eyevengers_applied_coupon') || localStorage.getItem('eyevengers_applied_coupon');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.discount === 'number' && parsed.discount > 0) {
          setAppliedCoupon(parsed);
        }
      }
    } catch (e) {}
  }, []);

  const hasFreeShipping = membershipBenefits?.freeShipping === true;
  const shippingCharge = hasFreeShipping ? 0 : 50;
  const couponDiscount = appliedCoupon?.discount || 0;
  const finalTotalPrice = Math.max(0, calculatedTotal + shippingCharge - couponDiscount);
  
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    
    // Fetch offers and recalculate precise total per item to support Stacking Behavior
    fetch('https://eyevengers-web.onrender.com/api/offers')
      .then(r => r.json())
      .then(offersData => {
        if (Array.isArray(offersData)) {
          ACTIVE_OFFERS.length = 0;
          ACTIVE_OFFERS.push(...offersData);
        }
        
        let newTotal = 0;
        const userContext: UserContext = {
          tier: membershipTier || 'none',
          membershipBenefits
        };

        for (const item of cartItems) {
          const priceResult = getEffectivePrice({
            mrp: item.mrp || item.price, // Fallback if old item
            sellingPrice: item.price,
            categoryId: item.categoryId,
            brandId: item.brandId
          }, userContext);
          newTotal += priceResult.discountedPrice * item.qty;
        }
        setCalculatedTotal(newTotal);
      })
      .catch(err => {
        console.error("Failed to load offers for checkout", err);
        setCalculatedTotal(baseTotalPrice); // Fallback
      });
  }, [cartItems, user, membershipBenefits, baseTotalPrice]);

  useEffect(() => {
    if (!hydrated) return;
    
    if (!isLoggedIn) {
      router.push('/cart');
      setTimeout(() => openLoginModal(), 500);
      return;
    }
  }, [isLoggedIn, router, openLoginModal, hydrated]);

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address");
      return;
    }
    
    setIsPlacingOrder(true);
    
    // Simulate order placement
    setTimeout(() => {
      const addresses = getUserAddresses();
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const orderPayload = {
        id: orderId,
        userId: user?.id,
        createdAt: new Date().toISOString(),
        amount: finalTotalPrice,
        discountApplied: couponDiscount,
        couponCode: appliedCoupon?.code,
        status: 'Order Placed',
        paymentMethod: 'cod',
        paymentStatus: 'Pending',
        items: cartItems,
        address: selectedAddress,
        orderDetails: {
          frame: cartItems[0]?.title || 'Eyeglasses',
          imageUrl: cartItems[0]?.imageUrl,
          lensCategory: cartItems[0]?.lensConfig?.lensCategory || 'Frame Only',
          lensProduct: cartItems[0]?.lensConfig?.lensType,
          power: cartItems[0]?.lensConfig?.power,
          customerName: user?.name || 'Guest Customer',
          userPhone: user?.phone || 'N/A',
          email: user?.email || undefined,
          couponApplied: appliedCoupon?.code,
          benefitTitle: appliedCoupon?.title,
          couponDiscount: couponDiscount
        }
      };

      // If referral voucher, lock it online as claimed
      if (appliedCoupon?.code && appliedCoupon.code.startsWith('REF-')) {
        fetch('/api/referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'claim-online',
            code: appliedCoupon.code,
            orderId: orderId
          })
        }).catch(console.error);
      }

      // Clear applied coupon
      try {
        sessionStorage.removeItem('eyevengers_applied_coupon');
        localStorage.removeItem('eyevengers_applied_coupon');
      } catch (e) {}

      try {
        const storedOrders = JSON.parse(localStorage.getItem('eyevengers_mock_orders') || '[]');
        storedOrders.push(orderPayload);
        localStorage.setItem('eyevengers_mock_orders', JSON.stringify(storedOrders));
      } catch (e) {
        console.error("Failed to save mock order", e);
      }

      // POST to the API so it goes to the Vercel memory cache for instant UI updates
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      }).catch(console.error);

      // POST directly to Render from the browser so it doesn't get killed by Vercel's 10s timeout
      fetch('https://eyevengers-web.onrender.com/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      }).catch(console.error);

      setIsPlacingOrder(false);
      setOrderSuccess(true);
      clearCart();
    }, 1500);

  };

  if (!hydrated || !isLoggedIn) return null;

  if (orderSuccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <CheckCircle2 size={80} className="text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">Thank you for shopping with EYEVENGERS. Your eyewear is getting ready.</p>
        <button 
          onClick={() => router.push('/')}
          className="bg-brand-navy text-white px-8 py-3 rounded-full font-bold hover:bg-[#002b4d] transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  if (!hydrated) {
    return <div className="bg-gray-50 min-h-screen pb-24 md:pb-12"></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Delivery Address */}
          <div className="w-full lg:w-2/3">
            <AddressManager 
              selectedAddressId={selectedAddressId} 
              setSelectedAddressId={setSelectedAddressId} 
            />
          </div>
          
          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden relative">
                        {item.imageUrl ? (
                          item.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video src={item.imageUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                          ) : (
                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                          )
                        ) : (
                          <div className="w-full h-full bg-gray-200"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{item.title}</p>
                        <p className="text-gray-500 text-xs">Qty: {item.qty}</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">₹{item.price * item.qty}</p>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-100 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{calculatedTotal.toFixed(0)}</span>
                </div>
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Discount ({appliedCoupon.title || appliedCoupon.code})</span>
                    <span>-₹{couponDiscount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  {hasFreeShipping ? (
                    <div className="flex items-center gap-2">
                      <span className="line-through text-xs text-gray-400">₹50</span>
                      <span className="text-green-600 font-medium">FREE</span>
                    </div>
                  ) : (
                    <span>₹{shippingCharge}</span>
                  )}
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total Payable</span>
                  <span>₹{finalTotalPrice.toFixed(0)}</span>
                </div>
              </div>
              
              <button 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || cartItems.length === 0}
                className="w-full bg-brand-navy text-white font-bold text-base rounded-xl py-4 hover:bg-[#002b4d] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? 'Processing...' : 'Place Order'}
                {!isPlacingOrder && <ArrowRight size={20} />}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
