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
  Sparkles
} from 'lucide-react';

export default function ReferAndEarnPage() {
  const { user, isLoggedIn, openLoginModal } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'rewards' | 'how-it-works'>('rewards');
  const [selectedVoucherForQR, setSelectedVoucherForQR] = useState<any>(null);

  // Friend simulation modal (for testing right inside the app)
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState('');

  const phone = user?.phone || '9876543210';
  const name = user?.name || 'Customer';

  const fetchReferralInfo = async () => {
    try {
      const res = await fetch(`/api/referral?action=user-info&phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load referral data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralInfo();
  }, [phone, name]);

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
            Refer A Friend & <span className="text-brand-gold">Get A FREE Frame</span>
          </h1>
          <p className="text-xs sm:text-base text-gray-200 max-w-2xl mx-auto mb-5 leading-relaxed">
            Dosto ko refer karein! Jaise hi aapke dost judte hain, aapko milta hai <span className="font-bold text-white">Free Frame ya 30% OFF</span> jise aap hamari shop par ya online dono jagah claim kar sakte hain.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-5 bg-white rounded-t-xl px-2 sm:px-4 pt-1 sm:pt-2">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === 'rewards'
                ? 'border-brand-navy text-brand-navy'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Gift size={15} />
            My Rewards ({data?.vouchers?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('how-it-works')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition ${
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
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isClaimed 
                              ? 'bg-gray-200 text-gray-700' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isClaimed ? 'ALREADY CLAIMED (EXPIRED)' : 'ACTIVE (READY TO CLAIM)'}
                          </span>
                          <span className="text-xs text-gray-400">
                            Referred: {v.referredName || 'Friend'}
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
                            href="/cart"
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

        {/* Tab 2: How to Claim at Shop Instructions */}
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
