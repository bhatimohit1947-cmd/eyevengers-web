"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShieldCheck, ChevronRight, Tag, ShoppingBag, Sparkles, X, Crown, Gift, Check } from 'lucide-react';
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
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12 text-gray-900">
      <div className="max-w-4xl mx-auto md:px-4 py-4 md:py-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 px-4 md:px-0 mb-4">Cart ({cartItems.length} items)</h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Cart Items Column */}
          <div className="w-full md:w-2/3 flex flex-col gap-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 shadow-sm flex gap-3 md:gap-4 items-start">
                
                <Link href={`/products/${item.productId}`} className="w-24 sm:w-32 aspect-square bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative group">
                  {item.imageUrl ? (
                    item.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" autoPlay loop muted playsInline />
                    ) : (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    )
                  ) : (
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </Link>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">EYEVENGERS</p>
                        <Link href={`/products/${item.productId}`} className="block hover:text-brand-navy transition-colors">
                          {/* Issue 5 Fix: Use H2 instead of H3 to avoid skipped heading level */}
                          <h2 className="text-sm md:text-base font-semibold text-gray-900 leading-tight mb-1">{item.title}</h2>
                        </Link>
                        <p className="text-xs md:text-sm text-gray-600">Lens: <span className="font-medium text-gray-900">{item.lensConfig?.type || 'Standard'}</span></p>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.title} from cart`}
                        className="text-gray-400 hover:text-red-600 p-1.5 transition ml-2 rounded-lg"
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-3 md:mt-4">
                    <div className="flex items-center gap-2 md:gap-3 bg-white border border-gray-200 rounded-full px-1.5 md:px-2 py-0.5 md:py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.qty - 1))}
                        disabled={item.qty <= 1}
                        aria-label="Decrease quantity"
                        className="p-1 text-gray-600 hover:text-brand-navy disabled:opacity-40"
                      >
                        <Minus size={14} aria-hidden="true" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center tabular-nums">{item.qty}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.qty + 1)}
                        aria-label="Increase quantity"
                        className="p-1 text-gray-600 hover:text-brand-navy"
                      >
                        <Plus size={14} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex flex-col items-end tabular-nums">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 line-through">₹{item.price * 1.5}</span>
                        <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar: Unified Offers & Bill Details */}
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            
            {/* Issue 6 & 7 Fix: Consolidated unified 'Offers & Coupons' section */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <Tag size={16} className="text-brand-navy" aria-hidden="true" />
                Offers & Coupons
              </h2>

              {/* Coupon Input */}
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code" 
                  aria-label="Enter coupon code"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 uppercase font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                />
                <button 
                  onClick={applyCoupon}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-black transition"
                >
                  APPLY
                </button>
              </div>

              {couponState.type === 'error' && (
                <p className="text-red-600 text-xs font-semibold mb-2" role="alert">{couponState.message}</p>
              )}

              {couponState.type === 'success' && (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg mb-3">
                  <p className="text-emerald-700 text-xs font-semibold">{couponState.message}</p>
                  {/* Issue 10 Fix: Consistent Trash2 remove icon */}
                  <button 
                    onClick={removeCoupon}
                    aria-label="Remove applied coupon"
                    className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 ml-2 transition"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    <span>Remove</span>
                  </button>
                </div>
              )}

              {/* Unlocked Referral Rewards List */}
              {userVouchers.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-900 font-bold text-xs uppercase tracking-wider mb-2">
                    <Sparkles size={14} className="text-emerald-700" aria-hidden="true" />
                    Available Referral Rewards
                  </div>
                  <div className="space-y-2">
                    {userVouchers.map((v) => {
                      const isAlreadyApplied = couponState.type === 'success' && couponCode.toUpperCase() === v.code.toUpperCase();
                      return (
                        <div 
                          key={v.code} 
                          className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 transition ${
                            isAlreadyApplied ? 'bg-emerald-50/60 border-emerald-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-xs text-gray-900">{v.code}</div>
                            <div className="text-xs text-gray-600 truncate">{v.benefitTitle}</div>
                          </div>
                          {isAlreadyApplied ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                              Applied ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setCouponCode(v.code);
                                executeApply(v.code);
                              }}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shrink-0"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Issue 7 & 4 Fix: Clean, accessible Benefit Choice selector with proper font size (min 12px) */}
              {hasBothBenefits && (
                <div className="mt-4 pt-3.5 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-gray-900 font-bold text-xs uppercase tracking-wider">
                      <Crown size={14} className="text-amber-800" aria-hidden="true" />
                      Benefit Selection
                    </div>
                    <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full capitalize">
                      {membershipTier} Member
                    </span>
                  </div>

                  {/* Issue 4 Fix: Increased body text from 11px to 12px (text-xs) */}
                  <p className="text-xs text-gray-600 mb-3">
                    Choose which discount benefit to apply on this order:
                  </p>

                  <div className="space-y-2">
                    {/* Option 1: Membership Perk */}
                    <div
                      onClick={() => {
                        setChosenBenefit('membership');
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('eyevengers_chosen_benefit', 'membership');
                          localStorage.setItem('eyevengers_chosen_benefit', 'membership');
                        }
                      }}
                      className={`cursor-pointer p-3 rounded-lg border transition flex items-center justify-between gap-3 ${
                        chosenBenefit === 'membership'
                          ? 'border-brand-navy bg-blue-50/40 ring-1 ring-brand-navy'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          chosenBenefit === 'membership' ? 'border-brand-navy bg-brand-navy text-white' : 'border-gray-300'
                        }`}>
                          {chosenBenefit === 'membership' && <Check size={10} strokeWidth={3} aria-hidden="true" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-gray-900 flex items-center gap-1">
                            <Crown size={12} className="text-amber-800" aria-hidden="true" />
                            {membershipTier?.toUpperCase()} Member Discount
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            {discountPercent}% Instant Discount + Free Shipping
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 tabular-nums">
                        <div className="text-xs font-bold text-brand-navy">
                          -₹{rawMembershipDiscount.toFixed(0)}
                        </div>
                        <div className="text-xs font-medium text-gray-500">
                          {chosenBenefit === 'membership' ? 'Active ✓' : 'Select'}
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Referral Voucher */}
                    <div
                      onClick={() => {
                        setChosenBenefit('referral');
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('eyevengers_chosen_benefit', 'referral');
                          localStorage.setItem('eyevengers_chosen_benefit', 'referral');
                        }
                      }}
                      className={`cursor-pointer p-3 rounded-lg border transition flex items-center justify-between gap-3 ${
                        chosenBenefit === 'referral'
                          ? 'border-emerald-700 bg-emerald-50/40 ring-1 ring-emerald-700'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          chosenBenefit === 'referral' ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-gray-300'
                        }`}>
                          {chosenBenefit === 'referral' && <Check size={10} strokeWidth={3} aria-hidden="true" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-gray-900 flex items-center gap-1">
                            <Gift size={12} className="text-emerald-700" aria-hidden="true" />
                            Referral Voucher ({couponCode})
                          </div>
                          <div className="text-xs text-gray-600 truncate mt-0.5">
                            {couponState.message.replace('Applied!', '').replace('🎉', '').trim() || 'Reward Voucher'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 tabular-nums">
                        <div className="text-xs font-bold text-emerald-700">
                          -₹{rawReferralDiscount.toFixed(0)}
                        </div>
                        <div className="text-xs font-medium text-gray-500">
                          {chosenBenefit === 'referral' ? 'Active ✓' : 'Select'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bill Details Summary Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4 text-base">Bill Details</h2>
              
              {/* Issue 9 Fix: Standardized vertical right-aligned axis using text-right tabular-nums */}
              <div className="space-y-3 text-sm mb-4 border-b border-gray-100 pb-4">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total MRP</span>
                  <span className="text-right tabular-nums text-gray-900 font-medium">₹{totalMrp}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total Discount</span>
                  <span className="text-right tabular-nums text-emerald-700 font-medium">-₹{totalDiscount}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Shipping Charges</span>
                  <div className="text-right tabular-nums">
                    {hasFreeShipping ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="line-through text-xs text-gray-400">₹50</span>
                        <span className="text-emerald-700 font-bold">FREE</span>
                      </span>
                    ) : (
                      <span className="text-gray-900 font-medium">₹{shippingCharge}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Taxes & Fees</span>
                  <span className="text-right tabular-nums text-gray-900 font-medium">₹0</span>
                </div>

                {effectiveReferralDiscount > 0 && (
                  <div className="flex justify-between items-center text-gray-900">
                    <span className="text-emerald-700 font-medium">Referral Discount ({couponCode})</span>
                    <span className="text-right tabular-nums text-emerald-700 font-bold">-₹{effectiveReferralDiscount.toFixed(0)}</span>
                  </div>
                )}

                {effectiveMembershipDiscount > 0 && (
                  <div className="flex justify-between items-center text-gray-900">
                    <span className="text-brand-navy font-medium">Member Discount ({discountPercent}%)</span>
                    <span className="text-right tabular-nums text-brand-navy font-bold">-₹{effectiveMembershipDiscount.toFixed(0)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center font-bold text-lg text-gray-900 mb-5">
                <span>Total Payable</span>
                <span className="text-right tabular-nums">₹{Math.max(0, totalAmount + shippingCharge - effectiveReferralDiscount - effectiveMembershipDiscount).toFixed(0)}</span>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-brand-navy text-white font-bold text-base rounded-full py-3.5 hover:bg-blue-900 transition flex items-center justify-center gap-2 shadow-md shadow-blue-900/20"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>

              {/* Issue 8 Fix: Trust signals integrated into checkout summary area */}
              <div className="flex items-center justify-center gap-2 pt-3 text-xs text-gray-500 text-center">
                <ShieldCheck size={16} className="text-emerald-700 shrink-0" aria-hidden="true" />
                <span>Safe & Secure Payments • Easy Returns • 100% Authentic</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
