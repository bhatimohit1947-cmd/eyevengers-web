"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useAddressStore } from '@/store/useAddressStore';
import { CheckCircle2, ArrowRight, Tag, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
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

  const [chosenBenefit, setChosenBenefit] = useState<'membership' | 'referral' | 'auto'>('auto');

  // Customer vouchers state
  const [userVouchers, setUserVouchers] = useState<any[]>([]);
  const [showVouchersList, setShowVouchersList] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: 'none' | 'success' | 'error', text: string }>({ type: 'none', text: '' });

  // Fetch customer active vouchers (Refer & Earn, Spin & Win, Mystery Box, Welcome)
  useEffect(() => {
    if (user?.phone) {
      const cleanPhone = user.phone.replace(/[^0-9]/g, '').slice(-10);
      fetch(`/api/referral?action=user-info&phone=${cleanPhone}&name=${encodeURIComponent(user.name || '')}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.vouchers)) {
            const activeVouchers = d.vouchers.filter((v: any) => v.status === 'ACTIVE');
            setUserVouchers(activeVouchers);
          }
        })
        .catch(() => {});
    }
  }, [user?.phone, user?.name]);

  const handleApplyVoucher = async (codeToApply: string) => {
    if (!codeToApply.trim()) return;
    const cleanCode = codeToApply.trim().toUpperCase();
    setCouponLoading(true);
    setCouponMessage({ type: 'none', text: '' });

    try {
      // 1. Try /api/referral (Covers Refer & Earn, Spin & Win, Mystery Box, Welcome vouchers)
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate-voucher', code: cleanCode })
      });
      const data = await res.json();
      if (res.ok && data.valid && data.voucher) {
        let discountVal = 0;
        const bType = data.voucher.benefitType;
        const bVal = Number(data.voucher.benefitValue || 0);

        if (bType === 'FREE_FRAME') {
          const frameItem = cartItems.find(i => !i.lensConfig || i.lensConfig.type === 'Standard' || Number(i.price) > 0) || cartItems[0];
          const framePrice = frameItem ? Number(frameItem.price) : 0;
          discountVal = Math.min(calculatedTotal, framePrice || calculatedTotal);
        } else if (bType === 'PERCENT_DISCOUNT') {
          discountVal = Math.round(calculatedTotal * ((bVal || 30) / 100));
        } else {
          // FLAT_DISCOUNT
          discountVal = Math.min(calculatedTotal, bVal || 150);
        }

        const couponObj = {
          code: cleanCode,
          discount: discountVal,
          title: data.voucher.benefitTitle || `${cleanCode} Applied`,
          benefitType: bType
        };
        setAppliedCoupon(couponObj);
        setChosenBenefit('referral');
        setCouponMessage({ type: 'success', text: `🎉 ${couponObj.title} applied! Saved ₹${discountVal}` });
        sessionStorage.setItem('eyevengers_applied_coupon', JSON.stringify(couponObj));
        localStorage.setItem('eyevengers_applied_coupon', JSON.stringify(couponObj));
        setCouponInput('');
        setCouponLoading(false);
        return;
      } else if (data.error && (data.error.includes('Already used') || data.error.includes('expired'))) {
        setCouponMessage({ type: 'error', text: data.error });
        setCouponLoading(false);
        return;
      }
    } catch(e) {}

    // 2. Fallback to sitewide promotional offers
    try {
      const offerRes = await fetch('https://eyevengers-web.onrender.com/api/offers/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, cartItems, user: { id: user?.id || 'guest', orderCount: 0 } })
      });
      const offerData = await offerRes.json();
      if (offerData.valid) {
        let discountVal = 0;
        if (offerData.offer.discountType === 'percentage') {
          discountVal = Math.round(calculatedTotal * (offerData.offer.discountValue / 100));
        } else {
          discountVal = Math.min(calculatedTotal, offerData.offer.discountValue);
        }
        const couponObj = {
          code: cleanCode,
          discount: discountVal,
          title: `${cleanCode} Applied`,
          benefitType: 'OFFER_COUPON'
        };
        setAppliedCoupon(couponObj);
        setCouponMessage({ type: 'success', text: `🎉 ${cleanCode} applied! Saved ₹${discountVal}` });
        sessionStorage.setItem('eyevengers_applied_coupon', JSON.stringify(couponObj));
        localStorage.setItem('eyevengers_applied_coupon', JSON.stringify(couponObj));
        setCouponInput('');
      } else {
        setCouponMessage({ type: 'error', text: offerData.error || 'Invalid or expired voucher code' });
      }
    } catch(e) {
      setCouponMessage({ type: 'error', text: 'Failed to apply voucher code' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMessage({ type: 'none', text: '' });
    sessionStorage.removeItem('eyevengers_applied_coupon');
    localStorage.removeItem('eyevengers_applied_coupon');
  };

  useEffect(() => {
    try {
      const pref = sessionStorage.getItem('eyevengers_chosen_benefit') || localStorage.getItem('eyevengers_chosen_benefit');
      if (pref === 'membership' || pref === 'referral') {
        setChosenBenefit(pref);
      }
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
  const couponDiscount = (chosenBenefit === 'membership') ? 0 : (appliedCoupon?.discount || 0);
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
        const effectiveTier = (chosenBenefit === 'referral') ? 'none' : (membershipTier || 'none');
        const effectiveBenefits = (chosenBenefit === 'referral') ? undefined : membershipBenefits;
        const userContext: UserContext = {
          tier: effectiveTier,
          membershipBenefits: effectiveBenefits
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
  }, [cartItems, user, membershipBenefits, membershipTier, baseTotalPrice, chosenBenefit]);

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

      // If any voucher was used, lock it online as claimed (works for Refer & Earn, Games, and Welcome vouchers)
      if (chosenBenefit !== 'membership' && appliedCoupon?.code) {
        fetch('/api/referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'claim-online',
            code: appliedCoupon.code,
            orderId: orderId,
            channel: 'ONLINE'
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
              
              <div className="space-y-4 mb-4 max-h-52 overflow-y-auto pr-2">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden relative">
                        {item.imageUrl ? (
                          item.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video src={item.imageUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                          ) : (
                            <OptimizedImage src={item.imageUrl} alt={item.title || "Product"} fill sizes="48px" className="object-cover" />
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

              {/* Discounts, Referrals & Games Vouchers Section */}
              <div className="border-t border-gray-100 pt-4 pb-3 mb-2">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded-md bg-blue-50 text-brand-navy">
                      <Tag size={13} />
                    </span>
                    <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Coupon & Rewards</h3>
                  </div>
                  {userVouchers.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {userVouchers.length} Unlocked
                    </span>
                  )}
                </div>

                {/* If coupon is applied: Show sleek applied badge */}
                {appliedCoupon && couponDiscount > 0 ? (
                  <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-gray-900 truncate">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full shrink-0">
                            Applied ✓
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 font-semibold truncate mt-0.5">
                          {appliedCoupon.title} (-₹{couponDiscount.toFixed(0)})
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl uppercase font-mono text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy transition"
                        />
                      </div>
                      <button
                        onClick={() => handleApplyVoucher(couponInput)}
                        disabled={couponLoading || !couponInput.trim()}
                        className="bg-brand-navy hover:bg-[#002b4d] text-white px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition shrink-0 disabled:opacity-50"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponMessage.type === 'error' && (
                      <p className="text-red-600 text-xs font-semibold mt-1.5">{couponMessage.text}</p>
                    )}
                    {couponMessage.type === 'success' && (
                      <p className="text-emerald-700 text-xs font-semibold mt-1.5">{couponMessage.text}</p>
                    )}
                  </div>
                )}

                {/* Available customer rewards (Refer & Earn, Spin & Win, Mystery Box) */}
                {userVouchers.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                    <button
                      onClick={() => setShowVouchersList(!showVouchersList)}
                      className="w-full flex items-center justify-between text-xs font-bold text-brand-navy hover:text-blue-900 transition py-0.5"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-500" />
                        <span>Your available rewards & game vouchers ({userVouchers.length})</span>
                      </span>
                      {showVouchersList ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    {(showVouchersList || !appliedCoupon) && (
                      <div className="space-y-2 mt-2 max-h-44 overflow-y-auto pr-1">
                        {userVouchers.map((v) => {
                          const isCurrent = appliedCoupon?.code?.toUpperCase() === v.code?.toUpperCase();
                          const isGame = v.source === 'game' || (v.referrerName && (v.referrerName.includes('Wheel') || v.referrerName.includes('Mystery Box')));
                          const isWelcome = v.source === 'welcome' || v.code?.startsWith('REF-WELCOME');
                          const originLabel = isGame ? '🎡 Spin & Win' : isWelcome ? '🎉 Welcome' : '👥 Refer';

                          return (
                            <div
                              key={v.code}
                              className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition text-xs ${
                                isCurrent ? 'bg-emerald-50/70 border-emerald-300' : 'bg-gray-50/80 border-gray-200 hover:bg-white hover:border-gray-300'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-gray-900 text-[11px]">{v.code}</span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100/80 text-blue-900">
                                    {originLabel}
                                  </span>
                                </div>
                                <div className="text-[11px] text-gray-600 truncate mt-0.5 font-medium">{v.benefitTitle}</div>
                              </div>
                              {isCurrent ? (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                                  Applied ✓
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleApplyVoucher(v.code)}
                                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition shrink-0 shadow-xs"
                                >
                                  Apply
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
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
