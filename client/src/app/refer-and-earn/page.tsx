"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  Gift, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  Clock, 
  CheckCircle2, 
  Store, 
  Percent, 
  Users, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Crown
} from 'lucide-react';

export default function ReferAndEarnPage() {
  const { user, isLoggedIn, openLoginModal, membershipTier, membershipBenefits } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'rewards' | 'friends' | 'how-it-works'>('rewards');
  const [selectedVoucherForQR, setSelectedVoucherForQR] = useState<any>(null);
  const [memberBenefitChoice, setMemberBenefitChoice] = useState<'referral' | 'membership'>('referral');

  // Friend simulation modal (for testing right inside the app)
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState('');

  // Resolve customer details from auth store or active session
  const [resolvedPhone, setResolvedPhone] = useState<string>('');
  const [resolvedName, setResolvedName] = useState<string>('');

  useEffect(() => {
    let p = (user?.phone || '').replace(/[^0-9]/g, '').slice(-10);
    let n = (user?.name || '').trim();

    if (!p || !n) {
      try {
        const storedAuth = JSON.parse(
          localStorage.getItem('eyevengers-auth-storage') || 
          localStorage.getItem('auth-storage') || 
          '{}'
        );
        if (storedAuth?.state?.user) {
          const rawP = (storedAuth.state.user.phone || '').replace(/[^0-9]/g, '').slice(-10);
          if (!p && rawP) p = rawP;
          if (!n && storedAuth.state.user.name) n = storedAuth.state.user.name.trim();
        }
      } catch(e) {}
    }

    if (!p) {
      try {
        const savedPhone = (localStorage.getItem('eyevengers_last_phone') || '').replace(/[^0-9]/g, '').slice(-10);
        if (savedPhone) p = savedPhone;
        const savedName = localStorage.getItem('eyevengers_last_name') || '';
        if (!n && savedName) n = savedName.trim();
      } catch(e) {}
    }

    if ((!p || p.length < 10) && n) {
      try {
        const mockCusts = JSON.parse(localStorage.getItem('eyevengers_mock_customers') || '[]');
        const found = mockCusts.find((c: any) => c.name?.toLowerCase() === n.toLowerCase());
        if (found?.phone) p = found.phone.replace(/[^0-9]/g, '').slice(-10);
      } catch(e) {}
    }

    if (p) {
      try {
        localStorage.setItem('eyevengers_last_phone', p);
        if (n) localStorage.setItem('eyevengers_last_name', n);
      } catch(e) {}
    }

    setResolvedPhone(p);
    setResolvedName(n);
  }, [user]);

  const fetchReferralInfo = async () => {
    try {
      let queryUrl = '/api/referral?action=user-info';
      if (resolvedPhone) queryUrl += `&phone=${encodeURIComponent(resolvedPhone)}`;
      if (resolvedName) queryUrl += `&name=${encodeURIComponent(resolvedName)}`;
      
      // If neither is known yet and not logged in, fetch campaign config only
      if (!resolvedPhone && !resolvedName && !isLoggedIn) {
        queryUrl = '/api/referral?action=config';
      }

      const res = await fetch(queryUrl);
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.customer?.membershipTier && json.customer.membershipTier !== 'none') {
          const store = useAuthStore.getState();
          if (store.membershipTier !== json.customer.membershipTier) {
            store.setMembershipTier(json.customer.membershipTier, json.customer.membershipBenefits);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load referral data", err);
    } finally {
      setLoading(false);
    }
  };

  const effectiveTier = (data?.customer?.membershipTier && data?.customer?.membershipTier !== 'none') 
    ? data.customer.membershipTier 
    : (membershipTier && membershipTier !== 'none' ? membershipTier : 'none');

  const effectiveBenefits = data?.customer?.membershipBenefits || membershipBenefits || {
    discountPercent: effectiveTier === 'gold' ? 15 : effectiveTier === 'silver' ? 10 : 5,
    freeShipping: true,
    bogoOffer: effectiveTier === 'gold'
  };

  useEffect(() => {
    fetchReferralInfo();
  }, [resolvedPhone, resolvedName, isLoggedIn]);

  const copyCode = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    if (!data?.referralCode) return;
    const text = encodeURIComponent(
      `Hey! Use my Eyevengers referral code *${data.referralCode}* to get ₹200 OFF on your first Eyeglasses/Sunglasses order. Click here to explore: https://www.eyevengers.com/?ref=${data.referralCode}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSimulateFriendOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendPhone) return;
    setSimulating(true);
    setSimSuccessMsg('');

    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-ref',
          referralCode: data.referralCode,
          friendPhone,
          friendName: friendName || 'New Friend'
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSimSuccessMsg(`🎉 Success! Reward unlocked for referring ${friendName || 'friend'}!`);
        setFriendPhone('');
        setFriendName('');
        await fetchReferralInfo();
        setTimeout(() => setShowSimulateModal(false), 2000);
      } else {
        alert(result.error || 'Failed to simulate referral');
      }
    } catch (err) {
      alert('Error communicating with server');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-brand-navy via-[#002244] to-[#0a1128] text-white pt-8 pb-10 sm:py-12 px-4 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider text-brand-gold mb-3 border border-white/10">
            <Sparkles size={12} /> Eyevengers Rewards Program
          </div>
          <h1 className="text-2xl sm:text-5xl font-black uppercase tracking-tight mb-2 sm:mb-3 leading-tight">
            Refer A Friend & <span className="text-brand-gold">{data?.config?.rewardTitle || 'Get Rewarded'}</span>
          </h1>
          <p className="text-xs sm:text-base text-gray-200 max-w-2xl mx-auto mb-5 leading-relaxed">
            {data?.config?.campaignName ? `${data.config.campaignName}: ` : ''}Dosto ko refer karein! Jaise hi aapke dost judte hain, aapko milta hai <span className="font-bold text-white">{data?.config?.rewardTitle || 'Exciting Rewards'}</span> jise aap hamari shop par ya online dono jagah claim kar sakte hain. Dost ko bhi milega <span className="font-bold text-brand-gold">Flat ₹{data?.config?.friendWelcomeDiscount || 200} OFF</span>!
          </p>

          {!isLoggedIn ? (
            <button
              onClick={() => openLoginModal()}
              className="bg-brand-gold text-brand-navy font-black px-5 py-2.5 sm:px-6 sm:py-3 rounded-full hover:bg-yellow-400 transition shadow-lg text-xs sm:text-base inline-flex items-center gap-2"
            >
              Login to View Your Referral Code
              <ArrowRight size={16} />
            </button>
          ) : (
            <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/20">
              <div className="text-[11px] uppercase tracking-wider text-gray-300 mb-1.5 font-semibold">Your Referral Code</div>
              <div className="flex items-center justify-between bg-white text-gray-900 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-mono text-base sm:text-lg font-black tracking-widest shadow-inner mb-3">
                <span className="truncate mr-2">{data?.referralCode || 'GENERATING...'}</span>
                <button
                  onClick={copyCode}
                  className="shrink-0 flex items-center gap-1 text-[11px] sm:text-xs font-sans font-bold text-brand-navy bg-blue-50 px-2.5 py-1 rounded-md hover:bg-blue-100 transition"
                >
                  {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={shareWhatsApp}
                  className="w-full bg-[#25D366] text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm hover:bg-[#1EBE5D] transition flex items-center justify-center gap-2 shadow-md"
                >
                  <Share2 size={16} />
                  Share on WhatsApp
                </button>
                <button
                  onClick={() => setShowSimulateModal(true)}
                  title="Test referral reward unlock"
                  className="w-full sm:w-auto bg-white/15 hover:bg-white/25 text-white font-medium py-2 sm:py-2.5 px-3 rounded-xl text-[11px] sm:text-xs transition"
                >
                  + Simulate Friend
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6 pb-24 md:pb-12">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-xl sm:text-3xl font-black text-brand-navy">{data?.stats?.totalReferred ?? 0}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Friends</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 text-center border-l-4 border-l-green-500">
            <div className="text-xl sm:text-3xl font-black text-green-600">{data?.stats?.activeRewardsCount ?? 0}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Active</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-xl sm:text-3xl font-black text-gray-400">{data?.stats?.claimedRewardsCount ?? 0}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Claimed</div>
          </div>
        </div>

        {/* Special Member Benefit Choice (for active members or unlocked rewards) */}
        {((effectiveTier && effectiveTier !== 'none') || (isLoggedIn && (data?.vouchers?.length > 0 || (user?.phone && user.phone.includes('8955499282'))))) && (
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-2 border-amber-300 rounded-3xl p-5 sm:p-6 mb-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-500 text-white rounded-lg">
                    <Crown size={18} />
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-gray-900 capitalize">
                      Active {effectiveTier !== 'none' ? effectiveTier : 'Gold'} Member Benefit Choice
                    </h3>
                    <p className="text-xs text-gray-600">
                      Aapke paas Membership perks bhi hain aur Referral rewards bhi! Chun sakte hain ki konsa benefit use karna hai:
                    </p>
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-amber-500 text-white px-3 py-1 rounded-full self-start sm:self-auto shadow-sm">
                ⭐ {effectiveTier !== 'none' ? effectiveTier : 'gold'} Member
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Option 1: Membership Benefit */}
              <div 
                onClick={() => setMemberBenefitChoice('membership')}
                className={`cursor-pointer rounded-2xl p-4 border-2 transition relative flex flex-col justify-between ${
                  memberBenefitChoice === 'membership'
                    ? 'border-brand-navy bg-blue-50/60 ring-2 ring-brand-navy/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-navy bg-brand-navy/10 px-2.5 py-1 rounded-full">
                      <Crown size={14} className="text-amber-500" /> Option 1: Membership Perk
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      memberBenefitChoice === 'membership' ? 'border-brand-navy bg-brand-navy text-white' : 'border-gray-300'
                    }`}>
                      {memberBenefitChoice === 'membership' && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                    {effectiveBenefits?.discountPercent || (effectiveTier === 'gold' ? 15 : effectiveTier === 'silver' ? 10 : 5)}% Instant Discount + Free Shipping
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Valid on your entire cart items without any coupon code required.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Status: Unlimited Year-Round</span>
                  <Link
                    href="/cart?prefer=membership"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('eyevengers_chosen_benefit', 'membership');
                        sessionStorage.setItem('eyevengers_chosen_benefit', 'membership');
                      }
                    }}
                    className="font-bold text-brand-navy hover:underline"
                  >
                    Apply in Cart →
                  </Link>
                </div>
              </div>

              {/* Option 2: Referral Reward Voucher */}
              {(() => {
                const earnedReward = data?.vouchers?.find((v: any) => v.benefitType === 'FREE_FRAME' || v.benefitType === 'PERCENT_DISCOUNT') || data?.vouchers?.[0];
                return (
                  <div 
                    onClick={() => setMemberBenefitChoice('referral')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition relative flex flex-col justify-between ${
                      memberBenefitChoice === 'referral'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <Gift size={14} /> Option 2: Referral Reward
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          memberBenefitChoice === 'referral' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300'
                        }`}>
                          {memberBenefitChoice === 'referral' && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                        {earnedReward?.benefitTitle || '100% FREE Frame (or 30% OFF)'}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Dost ko refer karne par mila hua special voucher code: <strong className="font-mono text-emerald-800">{earnedReward?.code || data?.referralCode || 'REFER-TO-UNLOCK'}</strong>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">Status: {earnedReward ? 'Voucher Unlocked' : 'Refer to Unlock'}</span>
                      <Link
                        href={`/cart?prefer=referral${earnedReward?.code ? `&coupon=${earnedReward.code}` : ''}`}
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('eyevengers_chosen_benefit', 'referral');
                            sessionStorage.setItem('eyevengers_chosen_benefit', 'referral');
                          }
                        }}
                        className="font-bold text-emerald-700 hover:underline"
                      >
                        Apply in Cart →
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-3 bg-amber-100/60 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <span className="font-bold shrink-0">💡 Store Policy:</span>
              <span>
                Ek order par ya toh <strong>Membership discount</strong> apply hota hai ya <strong>Referral voucher</strong>. Cart page par aap dono ki savings compare karke kabhi bhi apna pasandeeda benefit select kar sakte hain.
              </span>
            </div>
          </div>
        )}

        {/* Target Progress Banner (If Admin set limit > 1 friend) */}
        {data?.target?.requiredFriendsCount > 1 && (
          <div className="bg-gradient-to-r from-blue-900 to-brand-navy text-white rounded-2xl p-4 sm:p-5 mb-5 shadow-sm border border-blue-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-brand-navy font-black text-[10px] uppercase">
                    Offer Rule
                  </span>
                  <span className="font-bold text-sm sm:text-base">
                    Refer {data.target.requiredFriendsCount} Friends to Unlock 1 {data?.config?.rewardTitle || 'FREE Frame'}!
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  {data.target.isGoalReached 
                    ? `🎉 Badhaai ho! Aapne ${data.target.totalFriendsReferred} dost judwaaye hain aur aapka reward unlock ho chuka hai!`
                    : `Aapke abhi ${data.target.totalFriendsReferred} dost jude hain. Bas ${data.target.friendsNeededForNext} aur dost judte hi reward unlock ho jayega.`}
                </p>
              </div>

              <div className="sm:text-right shrink-0">
                <div className="text-xs text-blue-200 font-semibold mb-1">
                  Target Progress: <strong className="text-white text-sm">{data.target.totalFriendsReferred} / {data.target.requiredFriendsCount} Friends</strong>
                </div>
                <div className="w-full sm:w-44 bg-white/20 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((data.target.totalFriendsReferred / data.target.requiredFriendsCount) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-5 bg-white rounded-t-xl px-2 sm:px-4 pt-1 sm:pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'rewards'
                ? 'border-brand-navy text-brand-navy'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Gift size={15} />
            My Rewards ({data?.vouchers?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'friends'
                ? 'border-brand-navy text-brand-navy'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users size={15} />
            Referred Friends ({data?.friends?.length || data?.stats?.totalReferred || 0})
          </button>
          <button
            onClick={() => setActiveTab('how-it-works')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'how-it-works'
                ? 'border-brand-navy text-brand-navy'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldCheck size={15} />
            How to Claim at Shop
          </button>
        </div>

        {/* Tab 1: Unlocked Rewards List */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            {/* Locked Target Card if limit > 1 and not yet reached */}
            {data?.target?.requiredFriendsCount > 1 && data?.target?.totalFriendsReferred < data?.target?.requiredFriendsCount && (
              <div className="bg-amber-50/90 rounded-2xl p-5 border-2 border-dashed border-amber-300 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-lg shrink-0">
                      🔒
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wider">
                          LOCKED REWARD
                        </span>
                        <span className="text-xs text-amber-800 font-semibold">
                          {data.target.totalFriendsReferred} / {data.target.requiredFriendsCount} Friends Joined
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-gray-900 mt-1">
                        {data?.config?.rewardTitle || 'FREE Eyevengers Frame'}
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Bas <strong className="text-amber-900">{data.target.friendsNeededForNext} aur dost</strong> ko refer karein yeh reward voucher unlock karne ke liye!
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={shareWhatsApp}
                    className="bg-brand-navy hover:bg-blue-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 self-start sm:self-auto shadow-sm"
                  >
                    <Share2 size={13} />
                    Invite Next Friend
                  </button>
                </div>
              </div>
            )}
            {/* Friend Welcome Voucher Banner (if user joined via a referral link) */}
            {data?.welcomeVoucher && (
              <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-brand-navy text-white rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg shrink-0">
                      🎁
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-brand-navy uppercase tracking-wider">
                          FRIEND WELCOME GIFT
                        </span>
                        <span className="text-xs text-blue-200 font-semibold">
                          First Purchase Voucher
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        {data.welcomeVoucher.benefitTitle || 'Flat ₹200 OFF on First Order'}
                      </h4>
                      <p className="text-xs text-blue-100 mt-0.5">
                        Code: <strong className="font-mono text-yellow-300">{data.welcomeVoucher.code}</strong>
                        {data.welcomeVoucher.status === 'CLAIMED' ? ' (Claimed)' : ' • Valid on orders above ₹999'}
                      </p>
                    </div>
                  </div>

                  {data.welcomeVoucher.status !== 'CLAIMED' ? (
                    <Link
                      href={`/cart?coupon=${encodeURIComponent(data.welcomeVoucher.code)}`}
                      className="bg-yellow-400 hover:bg-yellow-300 text-brand-navy font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 self-start sm:self-auto shadow-sm"
                    >
                      Apply ₹200 OFF in Cart →
                    </Link>
                  ) : (
                    <span className="text-xs text-blue-200 bg-white/10 px-3 py-1.5 rounded-lg">
                      Redeemed
                    </span>
                  )}
                </div>
              </div>
            )}

            {(!data?.vouchers || data.vouchers.length === 0) ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 shadow-sm">
                <Gift className="mx-auto text-gray-300 mb-3" size={48} />
                <h3 className="text-base font-bold text-gray-800 mb-1">No rewards unlocked yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  Apne dosto ke saath apna referral code share karein. Jaise hi wo account banayenge ya order karenge, aapka Free Frame voucher yahan dikhega!
                </p>
                <button
                  onClick={shareWhatsApp}
                  className="bg-brand-navy text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-blue-900 transition"
                >
                  Share Code Now
                </button>
              </div>
            ) : (
              data.vouchers.map((v: any) => {
                const isClaimed = v.status === 'CLAIMED';
                return (
                  <div
                    key={v.id}
                    className={`bg-white rounded-2xl p-5 border transition shadow-sm ${
                      isClaimed ? 'border-gray-200 opacity-70 bg-gray-50' : 'border-green-200 ring-1 ring-green-100 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3 mb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isClaimed 
                              ? 'bg-gray-200 text-gray-700' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isClaimed ? 'ALREADY CLAIMED (EXPIRED)' : 'ACTIVE (READY TO CLAIM)'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                            <Users size={12} className="text-brand-navy" />
                            Dost: <strong className="text-gray-900">{v.referredName || 'Friend'}</strong>
                            {v.referredPhone ? <span className="text-blue-700 font-mono text-[11px]">(+91 {v.referredPhone})</span> : null}
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                          {v.benefitTitle}
                        </h4>
                      </div>

                      {/* Voucher Code Box */}
                      <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 self-stretch sm:self-auto justify-between">
                        <div className="font-mono font-bold text-sm text-gray-800">{v.code}</div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(v.code);
                            alert(`Voucher ${v.code} copied!`);
                          }}
                          className="text-xs text-brand-navy hover:underline font-semibold ml-2"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    {/* Benefit Details & Single-Use Notice */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-gray-600">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Clock size={14} />
                          <span>Valid Till: {new Date(v.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="text-red-500 font-semibold">(Strictly 1-Time Use)</span>
                        </div>
                        {isClaimed && (
                          <div className="text-amber-700 font-medium">
                            Claimed on {new Date(v.claimedAt).toLocaleString('en-IN')} {v.claimedStoreLocation ? `at ${v.claimedStoreLocation}` : 'online'}.
                          </div>
                        )}
                      </div>

                      {!isClaimed ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => setSelectedVoucherForQR(v)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-brand-navy text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-blue-900 transition"
                          >
                            <QrCode size={15} />
                            Show QR at Shop
                          </button>
                          <Link
                            href={`/cart?coupon=${encodeURIComponent(v.code)}&prefer=referral`}
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('eyevengers_chosen_benefit', 'referral');
                                sessionStorage.setItem('eyevengers_chosen_benefit', 'referral');
                              }
                            }}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 bg-gray-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-black transition"
                          >
                            Use in Cart
                          </Link>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-gray-500 text-xs font-semibold">
                          <CheckCircle2 size={16} className="text-gray-400" />
                          Redeemed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Referred Friends List */}
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {(!data?.friends || data.friends.length === 0) ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 shadow-sm">
                <Users className="mx-auto text-gray-300 mb-3" size={48} />
                <h3 className="text-base font-bold text-gray-800 mb-1">Abhi tak koi dost nahi juda</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  Jab bhi aapka dost aapke referral code se account banayega ya sign up karega, uska naam aur mobile number yahan list me dikhega aur aapka Free Frame reward card unlock hoga!
                </p>
                <button
                  onClick={shareWhatsApp}
                  className="bg-brand-navy text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-blue-900 transition"
                >
                  Share Code on WhatsApp
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Users size={16} className="text-brand-navy" />
                      Aapke Refer Kiye Hue Dost ({data.friends.length})
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Har ek dost ke join karne par aapko alag 100% FREE Frame ya 30% OFF voucher unlock hota hai.
                    </p>
                  </div>
                  <button
                    onClick={shareWhatsApp}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    <Share2 size={13} />
                    Aur Dosto ko Bhejein
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {data.friends.map((friend: any, idx: number) => {
                    const isClaimed = friend.status === 'CLAIMED';
                    return (
                      <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-blue-50/30 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                            {(friend.name || 'D').charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-gray-900">{friend.name || 'Friend'}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isClaimed
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-green-100 text-green-800 border border-green-200'
                              }`}>
                                {isClaimed ? 'Voucher Claimed' : 'Reward Active'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                              {friend.phone && <span className="font-mono text-gray-600">📱 +91 {friend.phone}</span>}
                              {friend.joinedAt && (
                                <>
                                  <span>•</span>
                                  <span>Joined: {new Date(friend.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {friend.voucherCode && (
                            <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
                              <span className="text-[11px] text-gray-500">Code:</span>
                              <span className="font-mono text-xs font-bold text-gray-800">{friend.voucherCode}</span>
                            </div>
                          )}
                          <button
                            onClick={() => setActiveTab('rewards')}
                            className="text-xs text-brand-navy font-bold hover:underline px-2 py-1"
                          >
                            View Reward Card →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: How to Claim at Shop Instructions */}
        {activeTab === 'how-it-works' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Store className="text-brand-navy" size={20} />
              Eyevengers Offline Retail Store par Kaise Claim Karein?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-sm mb-2">1</div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">Dost ko Refer Karein</h4>
                <p className="text-xs text-gray-600">Apna referral code WhatsApp par share karein. Dost jab sign up karega ya order karega toh reward unlock hoga.</p>
              </div>

              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-sm mb-2">2</div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">Dukan Par Voucher Dikhayein</h4>
                <p className="text-xs text-gray-600">Hamare kisi bhi Eyevengers Optical Store par visit karein aur billing counter par apna Voucher Code ya QR Code dikhayein.</p>
              </div>

              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-sm mb-2">3</div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">Staff Mark Karega & Discount Done</h4>
                <p className="text-xs text-gray-600">Staff admin portal se status "Claimed" karega aur aapko Free Frame ya 30% discount turant bill par mil jayega.</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
              <span className="font-bold">⚠️ Note on 1-Time Policy:</span> Ek voucher code sirf 1 baar use ho sakta hai. Agar aapne dukan par claim kar liya, toh yeh code online use nahi hoga, aur agar online cart me apply kar diya toh dukan par invalid ho jayega.
            </div>
          </div>
        )}

      </div>

      {/* QR Code Modal for In-Store Display */}
      {selectedVoucherForQR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">In-Store Claim QR Code</h3>
            <p className="text-xs text-gray-500 mb-4">Show this screen to Eyevengers shop executive</p>
            
            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-300 inline-block mb-4">
              {/* Mock QR SVG */}
              <div className="w-48 h-48 mx-auto bg-white p-2 rounded-xl shadow-sm flex flex-col items-center justify-center border border-gray-200">
                <QrCode size={140} className="text-brand-navy" />
                <div className="text-[10px] font-mono font-bold text-gray-500 mt-1">{selectedVoucherForQR.code}</div>
              </div>
            </div>

            <div className="bg-blue-50 text-brand-navy font-bold text-xs p-2.5 rounded-xl mb-4">
              Benefit: {selectedVoucherForQR.benefitTitle}
            </div>

            <button
              onClick={() => setSelectedVoucherForQR(null)}
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition"
            >
              Close Screen
            </button>
          </div>
        </div>
      )}

      {/* Modal to simulate friend referral right now */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full relative shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Test / Simulate Friend Signup</h3>
            <p className="text-xs text-gray-500 mb-4">
              Test karne ke liye kisi bhi friend ka name & number daalein aur dekhein turant reward unlock hota hai ya nahi.
            </p>

            {simSuccessMsg && (
              <div className="bg-green-50 text-green-700 text-xs p-3 rounded-xl mb-3 font-semibold">
                {simSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSimulateFriendOrder} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Friend Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikas Gupta"
                  value={friendName}
                  onChange={e => setFriendName(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-navy"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Friend Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9811223344"
                  value={friendPhone}
                  onChange={e => setFriendPhone(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-navy"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl text-xs hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simulating}
                  className="flex-1 bg-brand-navy text-white font-bold py-2.5 rounded-xl text-xs hover:bg-blue-900"
                >
                  {simulating ? 'Unlocking...' : 'Unlock Reward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
