"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShieldCheck, ChevronRight, ChevronDown, ChevronUp, Tag, ShoppingBag, Sparkles, X, Crown, Gift, Check, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const { items: cartItems, removeItem, updateQuantity, totalPrice } = useCartStore();
  const { requireAuth } = useAuthGate();
  const { user, membershipBenefits, membershipTier } = useAuthStore();

  // We are assuming mrp is some fixed percentage higher for UI mock purposes, 
  // since useCartStore only stores `price`. Let's mock MRP as price * 1.5
  const totalMrp = cartItems.reduce((acc, item) => acc + (item.price * 1.5 * item.qty), 0);
  const totalDiscount = cartItems.reduce((acc, item) => acc + ((item.price * 1.5 - item.price) * item.qty), 0);
  const totalAmount = totalPrice;
  
  const hasMembership = Boolean(membershipTier && membershipTier !== 'none');
  const discountPercent = membershipBenefits?.discountPercent || (membershipTier === 'gold' ? 15 : membershipTier === 'silver' ? 10 : membershipTier === 'bronze' ? 5 : 0);
  const rawMembershipDiscount = (hasMembership && discountPercent > 0) ? (totalAmount * (discountPercent / 100)) : 0;
  
  const hasFreeShipping = membershipBenefits?.freeShipping === true || hasMembership;
  const shippingCharge = hasFreeShipping ? 0 : 50;

  const [chosenBenefit, setChosenBenefit] = useState<'membership' | 'referral'>('membership');
  const [showOtherVouchers, setShowOtherVouchers] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponState, setCouponState] = useState<{type: 'none' | 'success' | 'error', message: string, discount: number}>({
    type: 'none',
    message: '',
    discount: 0
  });

  const [userVouchers, setUserVouchers] = useState<any[]>([]);

  // 1. Fetch Logged-in Customer's Active Rewards & sync membership tier
  useEffect(() => {
    if (user?.phone) {
      const cleanPhone = user.phone.replace(/[^0-9]/g, '').slice(-10);
      fetch(`/api/referral?action=user-info&phone=${cleanPhone}&name=${encodeURIComponent(user.name || '')}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            if (Array.isArray(d.vouchers)) {
              const activeVouchers = d.vouchers.filter((v: any) => v.status === 'ACTIVE');
              setUserVouchers(activeVouchers);
            }
            if (d.customer?.membershipTier && d.customer.membershipTier !== 'none') {
              const currentTier = useAuthStore.getState().membershipTier;
              if (currentTier !== d.customer.membershipTier) {
                useAuthStore.getState().setMembershipTier(d.customer.membershipTier, d.customer.membershipBenefits);
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [user?.phone, user?.name]);

  const executeApply = async (codeToApply: string) => {
    if (!codeToApply.trim()) return;
    const cleanCode = codeToApply.trim().toUpperCase();
    setCouponState({ type: 'none', message: 'Validating...', discount: 0 });
    
    // Check if referral voucher
    if (cleanCode.startsWith('REF-')) {
      try {
        const res = await fetch('/api/referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'validate-voucher', code: cleanCode })
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          let discountVal = 0;
          if (data.voucher.benefitType === 'FREE_FRAME') {
            // Free frame discount: deduct frame price up to ₹1500 (or totalAmount)
            const frameItem = cartItems.find(i => !i.lensConfig || i.lensConfig.type === 'Standard' || i.price > 0) || cartItems[0];
            const framePrice = frameItem ? frameItem.price : 1500;
            discountVal = Math.min(totalAmount, Math.max(framePrice, 1500));
          } else if (data.voucher.benefitType === 'PERCENT_DISCOUNT') {
            discountVal = totalAmount * ((data.voucher.benefitValue || 30) / 100);
          } else {
            discountVal = Math.min(totalAmount, data.voucher.benefitValue || 200);
          }

          setCouponState({ 
            type: 'success', 
            message: `🎉 ${data.voucher.benefitTitle} Applied!`, 
            discount: discountVal 
          });

          // Persist to session & local storage for Checkout carryover
          const appliedObj = {
            code: cleanCode,
            discount: discountVal,
            benefitType: data.voucher.benefitType,
            title: data.voucher.benefitTitle
          };
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('eyevengers_applied_coupon', JSON.stringify(appliedObj));
            localStorage.setItem('eyevengers_applied_coupon', JSON.stringify(appliedObj));
          }
          return;
        } else {
          setCouponState({ type: 'error', message: data.error || 'Invalid or already claimed referral voucher', discount: 0 });
          return;
        }
      } catch (e) {
        setCouponState({ type: 'error', message: 'Error checking referral voucher', discount: 0 });
        return;
      }
    }

    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/offers/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, cartItems, user: { id: 'guest', orderCount: 0 } })
      });
      const data = await res.json();
      
      if (data.valid) {
        let discountVal = 0;
        if (data.offer.discountType === 'percentage') {
          discountVal = totalAmount * (data.offer.discountValue / 100);
        } else {
          discountVal = data.offer.discountValue;
        }
        setCouponState({ type: 'success', message: `${cleanCode} applied!`, discount: discountVal });

        const appliedObj = {
          code: cleanCode,
          discount: discountVal,
          benefitType: 'OFFER_COUPON',
          title: `${cleanCode} Applied`
        };
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('eyevengers_applied_coupon', JSON.stringify(appliedObj));
          localStorage.setItem('eyevengers_applied_coupon', JSON.stringify(appliedObj));
        }
      } else {
        setCouponState({ type: 'error', message: data.error || 'Invalid coupon code', discount: 0 });
      }
    } catch (err) {
      setCouponState({ type: 'error', message: 'Failed to apply coupon', discount: 0 });
    }
  };

  const applyCoupon = () => {
    executeApply(couponCode);
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponState({ type: 'none', message: '', discount: 0 });
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('eyevengers_applied_coupon');
      localStorage.removeItem('eyevengers_applied_coupon');
    }
  };

  // 2. Auto apply if coupon code or preference is passed in URL e.g. /cart?coupon=REF-FREE-789&prefer=referral
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCoupon = urlParams.get('coupon');
      const urlPrefer = urlParams.get('prefer');

      if (urlPrefer === 'referral' || urlPrefer === 'membership') {
        setChosenBenefit(urlPrefer);
        sessionStorage.setItem('eyevengers_chosen_benefit', urlPrefer);
        localStorage.setItem('eyevengers_chosen_benefit', urlPrefer);
      } else {
        const cachedPref = sessionStorage.getItem('eyevengers_chosen_benefit') || localStorage.getItem('eyevengers_chosen_benefit');
        if (cachedPref === 'referral' || cachedPref === 'membership') {
          setChosenBenefit(cachedPref);
        }
      }

      if (urlCoupon) {
        setCouponCode(urlCoupon.toUpperCase());
        executeApply(urlCoupon.toUpperCase());
        if (urlPrefer === 'referral' || !urlPrefer) {
          setChosenBenefit('referral');
          sessionStorage.setItem('eyevengers_chosen_benefit', 'referral');
          localStorage.setItem('eyevengers_chosen_benefit', 'referral');
        }
      } else {
        // Load existing applied coupon
        try {
          const cached = sessionStorage.getItem('eyevengers_applied_coupon') || localStorage.getItem('eyevengers_applied_coupon');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.code) {
              setCouponCode(parsed.code);
              executeApply(parsed.code);
            }
          }
        } catch (e) {}
      }
    }
  }, [totalAmount]);

  const rawReferralDiscount = couponState.type === 'success' ? couponState.discount : 0;
  const hasBothBenefits = hasMembership && rawReferralDiscount > 0;

  let effectiveMembershipDiscount = 0;
  let effectiveReferralDiscount = 0;

  if (hasBothBenefits) {
    if (chosenBenefit === 'membership') {
      effectiveMembershipDiscount = rawMembershipDiscount;
      effectiveReferralDiscount = 0;
    } else {
      effectiveMembershipDiscount = 0;
      effectiveReferralDiscount = rawReferralDiscount;
    }
  } else {
    effectiveMembershipDiscount = rawMembershipDiscount;
    effectiveReferralDiscount = rawReferralDiscount;
  }

  const handleCheckout = () => {
    requireAuth(() => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('eyevengers_chosen_benefit', chosenBenefit);
        localStorage.setItem('eyevengers_chosen_benefit', chosenBenefit);
        if (hasBothBenefits && chosenBenefit === 'membership') {
          sessionStorage.removeItem('eyevengers_applied_coupon');
          localStorage.removeItem('eyevengers_applied_coupon');
        }
      }
      router.push('/checkout');
    });
  };


  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 min-h-[60vh] flex flex-col items-center justify-center text-center">
        <ShoppingBag size={64} className="text-gray-300 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8 max-w-md">Looks like you haven't added anything to your bag yet.</p>
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
    <div className="bg-[#f8fafc] min-h-screen pb-24 md:pb-16 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Header Breadcrumb / Title */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">Shopping Bag</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Review your frames, lenses, and applied promotional discounts.</p>
          </div>
          <span className="text-xs sm:text-sm font-bold bg-white border border-gray-200 text-brand-navy px-3.5 py-1.5 rounded-full shadow-xs">
            {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cart Items List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {cartItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:shadow-sm transition flex gap-4 sm:gap-5 items-start"
              >
                {/* Product Image Thumbnail */}
                <Link 
                  href={`/products/${item.productId}`} 
                  className="w-24 sm:w-32 aspect-square bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative group border border-gray-100"
                >
                  {item.imageUrl ? (
                    item.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" autoPlay loop muted playsInline />
                    ) : (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )
                  ) : (
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-h-[100px] sm:min-h-[120px]">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-black text-brand-navy tracking-widest uppercase bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-1">
                          Eyevengers
                        </span>
                        <Link href={`/products/${item.productId}`} className="block hover:text-brand-navy transition">
                          <h2 className="text-base sm:text-lg font-bold text-gray-950 leading-snug">{item.title}</h2>
                        </Link>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                          <span>Lens:</span>
                          <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                            {item.lensConfig?.type || 'Standard'}
                          </span>
                        </div>
                      </div>

                      {/* Remove Item Button */}
                      <button 
                        onClick={() => removeItem(item.id)}
                        title="Remove product"
                        aria-label={`Remove ${item.title} from cart`}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Quantity & Price Row */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50">
                    {/* Quantity Stepper */}
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.qty - 1))}
                        disabled={item.qty <= 1}
                        aria-label="Decrease quantity"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:bg-white hover:text-brand-navy disabled:opacity-30 transition"
                      >
                        <Minus size={13} aria-hidden="true" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold tabular-nums text-gray-900">{item.qty}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.qty + 1)}
                        aria-label="Increase quantity"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:bg-white hover:text-brand-navy transition"
                      >
                        <Plus size={13} aria-hidden="true" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <span className="text-xs text-gray-400 line-through mr-2">₹{item.price * 1.5}</span>
                      <span className="text-base sm:text-lg font-black text-gray-950">₹{item.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Free Shipping Progress or Guarantee Message */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                <ShieldCheck size={18} />
              </span>
              <div className="text-xs text-emerald-950">
                <span className="font-bold">100% Genuine Eyewear & Free Lens Fitting</span>
                <p className="text-emerald-800 text-[11px] mt-0.5">Every frame is backed by our 1-Year Quality Warranty and safe door-to-door delivery.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Offers & Order Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
            
            {/* 1. Offers & Coupons Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-brand-navy">
                    <Tag size={16} />
                  </span>
                  <h2 className="font-bold text-gray-950 text-sm">Discounts & Offers</h2>
                </div>
                {userVouchers.length > 0 && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {userVouchers.length} Rewards Available
                  </span>
                )}
              </div>

              {/* If a coupon is applied: Show sleek applied banner */}
              {couponState.type === 'success' ? (
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-gray-900 tracking-wider truncate">{couponCode}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          Applied ✓
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 font-semibold truncate mt-0.5">
                        {couponState.message.replace('Applied!', '').replace('🎉', '').trim() || 'Referral Voucher Active'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={removeCoupon}
                    aria-label="Remove coupon"
                    className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                /* No coupon applied yet: Clean Input Box */
                <div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input 
                        type="text" 
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code" 
                        aria-label="Enter coupon code"
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl uppercase font-mono text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy transition"
                      />
                    </div>
                    <button 
                      onClick={applyCoupon}
                      className="bg-brand-navy hover:bg-blue-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shrink-0 shadow-xs"
                    >
                      Apply
                    </button>
                  </div>
                  {couponState.type === 'error' && (
                    <p className="text-red-600 text-xs font-semibold mt-2" role="alert">{couponState.message}</p>
                  )}
                </div>
              )}

              {/* Expandable / Clean Unlocked Referral Rewards List */}
              {userVouchers.length > 0 && (
                <div className="mt-3.5 pt-3.5 border-t border-gray-100">
                  <button
                    onClick={() => setShowOtherVouchers(!showOtherVouchers)}
                    className="w-full flex items-center justify-between text-xs font-bold text-brand-navy hover:text-blue-900 transition py-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-600" />
                      <span>{couponState.type === 'success' ? 'Switch to another unlocked voucher' : 'Your unlocked referral vouchers'} ({userVouchers.length})</span>
                    </span>
                    {showOtherVouchers ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {(showOtherVouchers || couponState.type !== 'success') && (
                    <div className="space-y-2 mt-2.5">
                      {userVouchers.map((v) => {
                        const isCurrentApplied = couponState.type === 'success' && couponCode.toUpperCase() === v.code.toUpperCase();
                        return (
                          <div 
                            key={v.code} 
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                              isCurrentApplied ? 'bg-emerald-50/60 border-emerald-300' : 'bg-gray-50/70 border-gray-200 hover:border-gray-300 hover:bg-white'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-mono font-black text-xs text-gray-900">{v.code}</div>
                              <div className="text-xs text-gray-600 truncate mt-0.5">{v.benefitTitle}</div>
                            </div>
                            {isCurrentApplied ? (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                                Applied ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setCouponCode(v.code);
                                  executeApply(v.code);
                                }}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shrink-0 shadow-xs"
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

              {/* 2. Benefit Selection: Only shown when Member + Referral coupon both exist */}
              {hasBothBenefits && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider">
                      <Crown size={14} className="text-amber-500" />
                      Benefit Selection
                    </div>
                    <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full capitalize">
                      ⭐ {membershipTier} Member
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Choose which offer you prefer for this order:
                  </p>

                  <div className="space-y-2.5">
                    {/* Option 1: Referral Voucher */}
                    <div
                      onClick={() => {
                        setChosenBenefit('referral');
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('eyevengers_chosen_benefit', 'referral');
                          localStorage.setItem('eyevengers_chosen_benefit', 'referral');
                        }
                      }}
                      className={`cursor-pointer p-3.5 rounded-xl border-2 transition flex items-center justify-between gap-3 ${
                        chosenBenefit === 'referral'
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          chosenBenefit === 'referral' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300'
                        }`}>
                          {chosenBenefit === 'referral' && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-950 flex items-center gap-1.5">
                            <Gift size={13} className="text-emerald-600 shrink-0" />
                            <span className="truncate">Referral Reward ({couponCode})</span>
                          </div>
                          <div className="text-[11px] text-gray-500 truncate mt-0.5">
                            100% Free Frame Discount applied
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-emerald-700">
                          -₹{rawReferralDiscount.toFixed(0)}
                        </div>
                        <div className="text-[10px] font-bold text-emerald-800">
                          {chosenBenefit === 'referral' ? 'Selected ✓' : 'Select'}
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Membership Perk */}
                    <div
                      onClick={() => {
                        setChosenBenefit('membership');
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('eyevengers_chosen_benefit', 'membership');
                          localStorage.setItem('eyevengers_chosen_benefit', 'membership');
                        }
                      }}
                      className={`cursor-pointer p-3.5 rounded-xl border-2 transition flex items-center justify-between gap-3 ${
                        chosenBenefit === 'membership'
                          ? 'border-brand-navy bg-blue-50/50 shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          chosenBenefit === 'membership' ? 'border-brand-navy bg-brand-navy text-white' : 'border-gray-300'
                        }`}>
                          {chosenBenefit === 'membership' && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-950 flex items-center gap-1.5">
                            <Crown size={13} className="text-amber-500 shrink-0" />
                            <span className="capitalize">{membershipTier} Membership</span>
                          </div>
                          <div className="text-[11px] text-gray-500 truncate mt-0.5">
                            {discountPercent}% Off + Free Shipping
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-brand-navy">
                          -₹{rawMembershipDiscount.toFixed(0)}
                        </div>
                        <div className="text-[10px] font-bold text-brand-navy">
                          {chosenBenefit === 'membership' ? 'Selected ✓' : 'Select'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 mt-2.5 text-center">
                    💡 Your unused benefit will stay safely active for your next purchase.
                  </p>
                </div>
              )}
            </div>

            {/* 3. Order Summary & Checkout Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs">
              <h2 className="font-bold text-gray-950 text-base mb-4">Order Summary</h2>
              
              <div className="space-y-3 text-sm border-b border-gray-100 pb-4 mb-4">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total MRP</span>
                  <span className="tabular-nums font-semibold text-gray-900">₹{totalMrp.toFixed(0)}</span>
                </div>
                
                <div className="flex justify-between items-center text-gray-600">
                  <span>Product Discount</span>
                  <span className="tabular-nums font-semibold text-emerald-700">-₹{totalDiscount.toFixed(0)}</span>
                </div>
                
                <div className="flex justify-between items-center text-gray-600">
                  <span>Delivery Fee</span>
                  <div className="tabular-nums text-right">
                    {hasFreeShipping ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="line-through text-xs text-gray-400">₹50</span>
                        <span className="text-emerald-700 font-bold">FREE</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-gray-900">₹{shippingCharge}</span>
                    )}
                  </div>
                </div>

                {/* Applied Benefit Line */}
                {effectiveReferralDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-bold bg-emerald-50/60 p-2 rounded-lg">
                    <span className="text-xs">Referral Voucher ({couponCode})</span>
                    <span className="tabular-nums">-₹{effectiveReferralDiscount.toFixed(0)}</span>
                  </div>
                )}

                {effectiveMembershipDiscount > 0 && (
                  <div className="flex justify-between items-center text-brand-navy font-bold bg-blue-50/60 p-2 rounded-lg">
                    <span className="text-xs">{membershipTier?.toUpperCase()} Member Discount ({discountPercent}%)</span>
                    <span className="tabular-nums">-₹{effectiveMembershipDiscount.toFixed(0)}</span>
                  </div>
                )}
              </div>

              {/* Total Payable */}
              <div className="flex justify-between items-baseline mb-5">
                <div>
                  <span className="text-sm font-bold text-gray-950 block">Total Payable</span>
                  <span className="text-[11px] text-gray-400 font-medium">Inclusive of all taxes</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight tabular-nums">
                    ₹{Math.max(0, totalAmount + shippingCharge - effectiveReferralDiscount - effectiveMembershipDiscount).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Proceed to Checkout CTA */}
              <button 
                onClick={handleCheckout}
                className="w-full bg-brand-navy hover:bg-blue-900 text-white font-bold text-sm sm:text-base py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-brand-navy/20 hover:shadow-lg hover:shadow-brand-navy/30"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>

              {/* Trust & Guarantee */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-500 font-medium text-center">
                <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                <span>100% Secure Checkout • Easy 7-Day Returns • Authentic</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

