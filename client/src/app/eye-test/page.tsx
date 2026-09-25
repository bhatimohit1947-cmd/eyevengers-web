"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Stethoscope, Home as HomeIcon, MapPin, Calendar, Clock, CreditCard, CheckCircle2, ChevronRight, X, Loader2, Gift, Sparkles, Tag } from 'lucide-react';
import Link from 'next/link';

type BookingMode = 'none' | 'store' | 'home';

function EyeTestContent() {
  const searchParams = useSearchParams();
  const [bookingMode, setBookingMode] = useState<BookingMode>('none');
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settings from API
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [testPaymentMethod, setTestPaymentMethod] = useState<'online' | 'doorstep'>('doorstep');

  // Referral / Free Eye Test Voucher states
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherError, setVoucherError] = useState('');
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  // Stores from API
  const [stores, setStores] = useState<any[]>([]);

  // Global settings for toggle
  const [globalSettings, setGlobalSettings] = useState<any>({});

  const validateVoucherCode = async (codeToTest?: string) => {
    const code = (codeToTest || voucherCodeInput).trim().toUpperCase();
    if (!code) return;

    setIsCheckingVoucher(true);
    setVoucherError('');
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate-voucher', code })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedVoucher(data.voucher);
        setVoucherError('');
      } else {
        setVoucherError(data.error || 'Invalid or already claimed voucher code');
        setAppliedVoucher(null);
      }
    } catch (e) {
      setVoucherError('Failed to validate voucher code');
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch(`https://eyevengers-web.onrender.com/api/admin/eye-test/settings?t=${Date.now()}`).then(r => r.json()),
      fetch(`https://eyevengers-web.onrender.com/api/admin/stores?t=${Date.now()}`).then(r => r.json()),
      fetch(`https://eyevengers-web.onrender.com/api/admin/settings?t=${Date.now()}`).then(r => r.json())
    ])
      .then(([settingsData, storesData, globalData]) => {
        setSettings(settingsData);
        
        const validStores = Array.isArray(storesData) ? storesData : [];
        setStores(validStores);
        if (validStores.length > 0) setStoreLocation(validStores[0].name);

        setGlobalSettings(globalData || {});
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Handle URL prefill (e.g. /eye-test?mode=home&coupon=REF-RE6P-193)
  useEffect(() => {
    if (!searchParams) return;
    const mode = searchParams.get('mode');
    const coupon = searchParams.get('coupon');

    if (mode === 'home') {
      setBookingMode('home');
    } else if (mode === 'store') {
      setBookingMode('store');
    }

    if (coupon) {
      const cleanCoupon = coupon.trim().toUpperCase();
      setVoucherCodeInput(cleanCoupon);
      validateVoucherCode(cleanCoupon);
    }
  }, [searchParams]);

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const bookingPayload = {
        type: bookingMode,
        name,
        phone,
        date,
        time,
        location: bookingMode === 'store' ? storeLocation : address,
        paymentMethod: appliedVoucher 
          ? `Referral Reward (${appliedVoucher.code} - 100% FREE)` 
          : (bookingMode === 'home' ? testPaymentMethod : 'none'),
        voucherCode: appliedVoucher?.code || null,
        voucherTitle: appliedVoucher?.benefitTitle || null,
        amountPaid: appliedVoucher ? 0 : (bookingMode === 'home' ? (settings?.home?.price || 199) : 0),
        isFreeReward: !!appliedVoucher
      };

      await fetch(`https://eyevengers-web.onrender.com/api/admin/eye-test/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      // If a referral voucher was used, mark it as claimed online
      if (appliedVoucher?.code) {
        try {
          await fetch('/api/referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'claim-online',
              code: appliedVoucher.code,
              channel: 'HOME_EYE_TEST',
              orderId: `EYE-TEST-${phone.slice(-4) || 'BOOKING'}`
            })
          });
        } catch (e) {}
      }

      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to book appointment. Please try again.');
    }
    setIsSubmitting(false);
  };

  const handleNext = () => {
    if (bookingMode === 'home' && step === 2) {
      setStep(3); // Go to Payment / Confirmation
    } else {
      // Final submission for Store (no payment)
      handleFinalSubmit();
    }
  };

  const handleClose = () => {
    setBookingMode('none');
    setStep(1);
    setIsSuccess(false);
    // Reset form
    setName(''); setPhone(''); setDate(''); setTime(''); setAddress('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-brand-navy" />
      </div>
    );
  }

  // Fallback if settings fail to load
  const storeData = settings?.store || {
    isAvailable: true, title: "At Store Eye Test", description: "Visit our nearest store for a free 12-step eye examination using advanced automated equipment.", features: ["12-Step Checkup", "Expert Optometrists", "Free of Cost"], price: 0, imageUrl: ""
  };
  const homeData = settings?.home || {
    isAvailable: true, title: "Home Eye Test", description: "Can't visit? We'll bring the clinic to you. Get your eyes tested at home with portable advanced tech.", features: ["Certified Professional Visit", "Try 100+ Frames at Home", "Just ₹199 (100% Free with Referral Voucher)"], price: 199, imageUrl: ""
  };

  const isHomeTestEnabled = globalSettings.enableHomeEyeTest !== false && homeData.isAvailable;
  const effectiveHomePrice = appliedVoucher ? 0 : homeData.price;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="bg-brand-navy text-white pt-12 pb-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-brand-gold mb-3 border border-white/10">
            <Sparkles size={13} /> Certified Optometrist Care
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight">Expert Eye Testing</h1>
          <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
            Get a comprehensive eye checkup by certified optometrists. Visit our nearest store or enjoy the comfort of a certified home visit with 100+ frames to try!
          </p>
        </div>
      </div>

      {/* Cards Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          
          {/* Store Eye Test Card */}
          <div 
            onClick={() => storeData.isAvailable && setBookingMode('store')}
            className={`bg-white rounded-2xl md:rounded-3xl shadow-xl p-5 md:p-8 border border-gray-100 flex flex-col h-full relative overflow-hidden transition-all ${storeData.isAvailable ? 'hover:shadow-2xl hover:border-brand-navy/20 cursor-pointer group' : 'opacity-70 grayscale'}`}
          >
            <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-xs font-bold px-3.5 py-1.5 rounded-bl-xl uppercase tracking-wider">
              {storeData.price === 0 ? '100% Free' : `₹${storeData.price}`}
            </div>
            {!storeData.isAvailable && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
                <span className="bg-red-100 text-red-800 font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm text-center">Currently Unavailable</span>
              </div>
            )}
            {storeData.imageUrl ? (
              <div className={`w-full aspect-[16/9] mb-4 md:mb-6 rounded-xl md:rounded-2xl overflow-hidden transition-transform ${storeData.isAvailable ? 'group-hover:scale-105' : ''}`}>
                {storeData.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={storeData.imageUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <img src={storeData.imageUrl} alt={storeData.title} className="w-full h-full object-cover" />
                )}
              </div>
            ) : (
              <div className={`w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 transition-transform ${storeData.isAvailable ? 'group-hover:scale-110' : ''}`}>
                <MapPin className="w-6 h-6 md:w-8 md:h-8 text-brand-navy" />
              </div>
            )}
            <h2 className="text-lg md:text-2xl font-black text-gray-900 mb-1.5 md:mb-2">{storeData.title}</h2>
            <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6 flex-grow">{storeData.description}</p>
            <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
              {storeData.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-center text-xs md:text-sm text-gray-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> 
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button disabled={!storeData.isAvailable} className="w-full bg-brand-navy text-white font-bold py-3 md:py-3.5 rounded-xl flex items-center justify-center group-hover:bg-blue-900 transition-colors disabled:opacity-50 text-xs md:text-base cursor-pointer">
              Book Store Visit <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Home Eye Test Card */}
          <div 
            onClick={() => isHomeTestEnabled && setBookingMode('home')}
            className={`bg-white rounded-2xl md:rounded-3xl shadow-xl p-5 md:p-8 border border-gray-100 flex flex-col h-full relative overflow-hidden transition-all ${isHomeTestEnabled ? 'hover:shadow-2xl hover:border-yellow-400/50 cursor-pointer group' : 'opacity-70 grayscale'}`}
          >
            <div className="absolute top-0 right-0 bg-amber-100 text-amber-900 text-xs font-bold px-3.5 py-1.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
              <Gift size={12} className="text-amber-700" />
              Free with Referral
            </div>
            {!isHomeTestEnabled && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
                <span className="bg-red-100 text-red-800 font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm text-center">Currently Unavailable</span>
              </div>
            )}
            {homeData.imageUrl ? (
              <div className={`w-full aspect-[16/9] mb-4 md:mb-6 rounded-xl md:rounded-2xl overflow-hidden transition-transform ${isHomeTestEnabled ? 'group-hover:scale-105' : ''}`}>
                {homeData.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={homeData.imageUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <img src={homeData.imageUrl} alt={homeData.title} className="w-full h-full object-cover" />
                )}
              </div>
            ) : (
              <div className={`w-12 h-12 md:w-16 md:h-16 bg-yellow-50 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 transition-transform ${isHomeTestEnabled ? 'group-hover:scale-110' : ''}`}>
                <HomeIcon className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
              </div>
            )}
            <h2 className="text-lg md:text-2xl font-black text-gray-900 mb-1.5 md:mb-2">{homeData.title}</h2>
            <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6 flex-grow">{homeData.description}</p>
            <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
              {homeData.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-center text-xs md:text-sm text-gray-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
              <li className="flex items-center text-xs md:text-sm text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                <Gift className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                <span>100% Free with Active Referral Voucher</span>
              </li>
            </ul>
            <button disabled={!isHomeTestEnabled} className="w-full bg-gradient-to-r from-[#0B1550] to-[#D4AF37] text-white font-bold py-3 md:py-3.5 rounded-xl flex items-center justify-center hover:shadow-lg transition-shadow disabled:opacity-50 text-xs md:text-base cursor-pointer">
              Book Home Visit <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

        </div>
      </div>

      {/* Booking Modal Overlay */}
      {bookingMode !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={handleClose}></div>
          
          <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-navy flex items-center justify-center font-bold">
                  {bookingMode === 'store' ? <MapPin size={18} /> : <HomeIcon size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg text-brand-navy leading-tight">
                    {isSuccess ? 'Booking Confirmed!' : bookingMode === 'store' ? storeData.title : homeData.title}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {isSuccess ? 'Your appointment details' : `Step ${step} of ${bookingMode === 'home' ? 3 : 2}`}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 bg-white rounded-xl hover:bg-gray-100 transition shadow-xs text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 md:p-6 overflow-y-auto">
              
              {isSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 mb-2">Booking Confirmed!</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                    {appliedVoucher ? (
                      <span className="font-medium text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 inline-block mb-2">
                        🎉 100% Free Home Eye Test scheduled with Referral Reward ({appliedVoucher.code})!
                      </span>
                    ) : null}
                    <br />
                    {bookingMode === 'store' 
                      ? 'Aapki store appointment request receive ho gayi hai. Hamare optometrist aapke visit ke liye taiyar rahenge.' 
                      : 'Aapki home visit request receive ho gayi hai. Hamare certified optometrist gear aur 100+ frames ke sath aapke ghar visit karenge.'}
                  </p>
                  <button onClick={handleClose} className="bg-brand-navy text-white px-8 py-3 rounded-xl font-bold w-full hover:bg-blue-900 transition cursor-pointer">
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Step Indicators */}
                  {bookingMode === 'home' && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-brand-navy' : 'bg-gray-200'}`}></div>
                      <div className={`w-8 h-1 rounded-full ${step >= 2 ? 'bg-brand-navy' : 'bg-gray-200'}`}></div>
                      <div className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-brand-navy' : 'bg-gray-200'}`}></div>
                      <div className={`w-8 h-1 rounded-full ${step >= 3 ? 'bg-brand-navy' : 'bg-gray-200'}`}></div>
                      <div className={`w-2.5 h-2.5 rounded-full ${step >= 3 ? 'bg-brand-navy' : 'bg-gray-200'}`}></div>
                    </div>
                  )}

                  {/* FORM STEPS */}
                  {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Full Name</label>
                        <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy" placeholder="e.g. Rahul Sharma" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Phone Number</label>
                        <input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy" placeholder="10-digit mobile number" />
                      </div>

                      {bookingMode === 'store' && (
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Select Store Location</label>
                          <select value={storeLocation} onChange={e=>setStoreLocation(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy">
                            {stores.map((s: any) => (
                              <option key={s.id} value={s.name}>{s.name} - {s.address}</option>
                            ))}
                            {stores.length === 0 && (
                              <option>Main Flagship Store</option>
                            )}
                          </select>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => {
                          if (!name.trim() || !phone.trim()) {
                            alert("Please enter your name and phone number");
                            return;
                          }
                          setStep(2);
                        }} 
                        className="w-full bg-brand-navy hover:bg-blue-900 text-white font-bold py-3.5 rounded-xl mt-4 transition cursor-pointer"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input required type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 pl-9 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Time Slot</label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input required type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 pl-9 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy" />
                          </div>
                        </div>
                      </div>

                      {bookingMode === 'home' && (
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Doorstep Address for Visit</label>
                          <textarea required value={address} onChange={e=>setAddress(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy" placeholder="House/Flat No., Street, Landmark, Area Pincode" />
                        </div>
                      )}

                      {/* Referral Voucher / Coupon Box for Home Visit */}
                      {bookingMode === 'home' && (
                        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                              <Gift size={14} className="text-emerald-600 shrink-0" />
                              Have a Referral / Free Test Voucher?
                            </span>
                            {appliedVoucher && (
                              <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full uppercase">
                                100% Free Applied
                              </span>
                            )}
                          </div>

                          {!appliedVoucher ? (
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={voucherCodeInput} 
                                onChange={e => {
                                  setVoucherCodeInput(e.target.value.toUpperCase());
                                  setVoucherError('');
                                }}
                                placeholder="e.g. REF-RE6P-193" 
                                className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold uppercase placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => validateVoucherCode()}
                                disabled={isCheckingVoucher || !voucherCodeInput.trim()}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                              >
                                {isCheckingVoucher ? <Loader2 size={13} className="animate-spin" /> : 'Apply'}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-300">
                              <div>
                                <div className="font-mono font-black text-xs text-emerald-900">{appliedVoucher.code}</div>
                                <div className="text-[11px] font-semibold text-emerald-700">{appliedVoucher.benefitTitle || '100% Free Home Eye Test Applied'}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setAppliedVoucher(null);
                                  setVoucherCodeInput('');
                                }}
                                className="text-xs font-bold text-red-600 hover:text-red-700 p-1 cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          )}

                          {voucherError && (
                            <p className="text-[11px] font-semibold text-red-600">{voucherError}</p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3 mt-4">
                        <button onClick={() => setStep(1)} disabled={isSubmitting} className="px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 disabled:opacity-50 cursor-pointer">
                          Back
                        </button>
                        <button 
                          onClick={() => {
                            if (!date || !time || (bookingMode === 'home' && !address.trim())) {
                              alert("Please complete the appointment date, time, and address");
                              return;
                            }
                            handleNext();
                          }} 
                          disabled={isSubmitting} 
                          className="flex-1 bg-brand-navy hover:bg-blue-900 text-white font-bold py-3.5 rounded-xl flex items-center justify-center disabled:opacity-70 cursor-pointer"
                        >
                          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : bookingMode === 'store' ? 'Confirm Booking' : 'Proceed to Confirmation'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment / Voucher Confirmation (Home Only) */}
                  {step === 3 && bookingMode === 'home' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                      {appliedVoucher ? (
                        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-2 border-emerald-300 rounded-2xl p-5 text-center space-y-2.5">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1">
                            <Sparkles size={22} />
                          </div>
                          <span className="text-[10px] font-black tracking-wider uppercase bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full">
                            REFERRAL REWARD COVERED
                          </span>
                          <h4 className="text-lg font-black text-emerald-950">
                            100% FREE Home Eye Test
                          </h4>
                          <p className="text-xs text-emerald-800">
                            Voucher <strong className="font-mono">{appliedVoucher.code}</strong> completely covers the home optometrist visit fee.
                          </p>
                          <div className="pt-3 border-t border-emerald-200 flex items-center justify-between text-sm font-bold text-gray-800">
                            <span>Amount to Pay:</span>
                            <span className="text-lg font-black text-emerald-700">₹0 (FREE)</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs text-yellow-800 font-medium">Home Visit Fee</p>
                              <p className="text-xl font-black text-brand-navy">₹{homeData.price}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-yellow-700 font-bold bg-yellow-200/50 px-2 py-0.5 rounded uppercase">Refundable</p>
                              <p className="text-[9px] text-gray-500 mt-1">on any purchase</p>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <label className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer ${testPaymentMethod === 'doorstep' ? 'border-brand-navy bg-blue-50/30' : 'border-gray-200'}`} onClick={() => setTestPaymentMethod('doorstep')}>
                              <div className="flex items-center gap-3">
                                <HomeIcon className={testPaymentMethod === 'doorstep' ? 'text-brand-navy' : 'text-gray-500'} />
                                <span className="font-bold text-sm text-gray-800">Pay at Doorstep</span>
                              </div>
                              <div className={`w-4 h-4 rounded-full ${testPaymentMethod === 'doorstep' ? 'border-4 border-brand-navy bg-white' : 'border border-gray-300'}`}></div>
                            </label>

                            <label className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer ${testPaymentMethod === 'online' ? 'border-brand-navy bg-blue-50/30' : 'border-gray-200'}`} onClick={() => setTestPaymentMethod('online')}>
                              <div className="flex items-center gap-3">
                                <CreditCard className={testPaymentMethod === 'online' ? 'text-brand-navy' : 'text-gray-500'} />
                                <span className="font-bold text-sm text-gray-800">Pay Online (Razorpay)</span>
                              </div>
                              <div className={`w-4 h-4 rounded-full ${testPaymentMethod === 'online' ? 'border-4 border-brand-navy bg-white' : 'border border-gray-300'}`}></div>
                            </label>
                          </div>
                        </>
                      )}

                      <div className="flex gap-3 mt-4">
                        <button onClick={() => setStep(2)} disabled={isSubmitting} className="px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 disabled:opacity-50 cursor-pointer">
                          Back
                        </button>
                        <button 
                          onClick={handleFinalSubmit} 
                          disabled={isSubmitting} 
                          className={`flex-1 font-bold py-3.5 rounded-xl shadow-lg flex justify-center items-center disabled:opacity-70 text-white cursor-pointer ${
                            appliedVoucher 
                              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' 
                              : 'bg-brand-navy hover:bg-blue-900 shadow-brand-navy/30'
                          }`}
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : appliedVoucher ? (
                            'Confirm 100% FREE Booking'
                          ) : testPaymentMethod === 'online' ? (
                            `Pay ₹${homeData.price} Securely`
                          ) : (
                            'Confirm Booking'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function EyeTestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-brand-navy" />
      </div>
    }>
      <EyeTestContent />
    </Suspense>
  );
}
