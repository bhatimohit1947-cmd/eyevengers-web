"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Crown, Medal, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface MembershipPlan {
  id: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  price: number;
  durationMonths: number;
  benefits: string[];
  benefitsJson?: any;
}

function MembershipPageContent() {
  const searchParams = useSearchParams();
  const offerId = searchParams.get('offerId');
  const autoBuyTier = searchParams.get('buy');
  
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [offerDetails, setOfferDetails] = useState<any>(null);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  
  const { membershipTier, purchaseMembership, isLoggedIn, openLoginModal } = useAuthStore();
  
  useEffect(() => {
    fetchPlans();
    if (offerId) {
      fetchOffer(offerId);
    }
  }, [offerId]);

  useEffect(() => {
    if (!loading && plans.length > 0 && autoBuyTier && !hasAutoTriggered) {
      const planToBuy = plans.find(p => p.tier === autoBuyTier.toLowerCase());
      if (planToBuy && membershipTier !== planToBuy.tier) {
        setHasAutoTriggered(true);
        // Add a slight delay for better UX so they see the page first
        setTimeout(() => handlePurchase(planToBuy), 500);
      }
    }
  }, [loading, plans, autoBuyTier, hasAutoTriggered, membershipTier]);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/memberships/plans`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((plan: any) => {
          if (!plan.benefitsJson && plan.benefits) {
             const displayBenefits: string[] = [];
             let parsedJson = undefined;
             for (const b of plan.benefits) {
               if (typeof b === 'string' && b.startsWith('__BENEFITS_JSON__:')) {
                 try { parsedJson = JSON.parse(b.replace('__BENEFITS_JSON__:', '')); } catch(e){}
               } else {
                 displayBenefits.push(b);
               }
             }
             if (parsedJson) {
               return { ...plan, benefits: displayBenefits, benefitsJson: parsedJson };
             }
          }
          return plan;
        });
        setPlans(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchOffer = async (id: string) => {
    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/offers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOfferDetails(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculatePrice = (plan: MembershipPlan) => {
    if (!offerDetails || offerDetails.status !== 'active') return plan.price;
    
    // If the offer specifies targetIds, check if this plan is in it
    if (offerDetails.targetIds && offerDetails.targetIds.length > 0) {
      if (!offerDetails.targetIds.includes(plan.id) && !offerDetails.targetIds.includes(plan.tier)) {
        return plan.price; // Offer doesn't apply to this plan
      }
    }
    
    const basePrice = plan.price;
    if (offerDetails.discountType === 'percentage') {
      return basePrice - (basePrice * (offerDetails.discountValue / 100));
    } else if (offerDetails.discountType === 'fixed') {
      return Math.max(0, basePrice - offerDetails.discountValue);
    }
    return basePrice;
  };

  const handlePurchase = (plan: MembershipPlan) => {
    if (!isLoggedIn) {
      openLoginModal(() => handlePurchase(plan));
      return;
    }
    
    // In a real app, this would call a payment gateway
    // Then on success update the user profile
    purchaseMembership(plan.tier as any, plan.benefitsJson);
    alert(`Successfully purchased ${plan.name}! Your shiny new badge is active.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-brand-navy mb-4 uppercase tracking-tight">
            Unlock Eyevengers VIP
          </h1>
          <p className="text-gray-600 text-lg">
            Get exclusive discounts, free shipping, and premium styling sessions. 
            Choose the plan that fits you best.
          </p>
          
          {offerDetails && offerDetails.status === 'active' && (
            <div className="mt-6 bg-yellow-100 text-yellow-800 p-4 rounded-xl border border-yellow-200 inline-flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="font-bold">Active Offer: {offerDetails.name}</span>
              <span className="bg-yellow-200 px-2 py-1 rounded text-xs ml-2">
                {offerDetails.discountType === 'percentage' ? `${offerDetails.discountValue}% OFF` : `₹${offerDetails.discountValue} OFF`}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">Loading plans...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const discountedPrice = calculatePrice(plan);
              const hasDiscount = discountedPrice < plan.price;
              
              const isCurrentPlan = membershipTier === plan.tier;
              const isHighlighted = autoBuyTier === plan.tier;
              
              return (
                <div 
                  key={plan.id}
                  className={`bg-white rounded-3xl p-8 border-2 transition-all hover:-translate-y-2 hover:shadow-2xl flex flex-col ${
                    isHighlighted ? 'ring-4 ring-brand-navy ring-opacity-50 scale-105' : ''
                  } ${
                    plan.tier === 'gold' 
                      ? 'border-yellow-400 shadow-yellow-100' 
                      : plan.tier === 'silver'
                        ? 'border-gray-300 shadow-gray-100'
                        : 'border-orange-300 shadow-orange-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black text-gray-900">{plan.name}</h3>
                    {plan.tier === 'gold' ? (
                      <Crown size={28} className="text-yellow-500" />
                    ) : (
                      <Medal size={28} className={plan.tier === 'silver' ? 'text-gray-400' : 'text-orange-600'} />
                    )}
                  </div>
                  
                  <div className="mb-6">
                    {hasDiscount ? (
                      <div className="flex flex-col">
                        <span className="text-gray-400 line-through text-lg">₹{plan.price}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-brand-navy">₹{discountedPrice}</span>
                          <span className="text-gray-500 font-medium">/{plan.durationMonths}mo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-brand-navy">₹{plan.price}</span>
                        <span className="text-gray-500 font-medium">/{plan.durationMonths}mo</span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchase(plan)}
                    disabled={isCurrentPlan}
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-wider transition-colors ${
                      isCurrentPlan 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : plan.tier === 'gold'
                          ? 'bg-gradient-to-r from-brand-navy to-brand-gold text-white hover:shadow-lg'
                          : 'bg-brand-navy text-white hover:bg-brand-navy/90'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Get Membership'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MembershipPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading plans...</div>}>
      <MembershipPageContent />
    </Suspense>
  );
}
