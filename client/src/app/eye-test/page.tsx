"use client";
import React, { useState, useEffect } from 'react';
import { Stethoscope, Home as HomeIcon, MapPin, Calendar, Clock, CreditCard, CheckCircle2, ChevronRight, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

type BookingMode = 'none' | 'store' | 'home';

export default function EyeTestPage() {
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

  // Stores from API
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`https://eyevengers-web.onrender.com/api/admin/eye-test/settings?t=${Date.now()}`).then(r => r.json()),
      fetch(`https://eyevengers-web.onrender.com/api/admin/stores?t=${Date.now()}`).then(r => r.json())
    ])
      .then(([settingsData, storesData]) => {
        setSettings(settingsData);
        setStores(storesData);
        if (storesData.length > 0) setStoreLocation(storesData[0].name);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`https://eyevengers-web.onrender.com/api/admin/eye-test/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: bookingMode,
          name,
          phone,
          date,
          time,
          location: bookingMode === 'store' ? storeLocation : address
        })
      });
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to book appointment. Please try again.');
    }
    setIsSubmitting(false);
  };

  const handleNext = () => {
    if (bookingMode === 'home' && step === 2) {
      setStep(3); // Go to Payment
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
    isAvailable: true, title: "Home Eye Test", description: "Can't visit? We'll bring the clinic to you. Get your eyes tested at home with portable advanced tech.", features: ["Certified Professional Visit", "Try 100+ Frames at Home", "Just ₹199 (Refundable)"], price: 199, imageUrl: ""
  };

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
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Expert Eye Testing</h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto">
            Get a comprehensive eye checkup by certified optometrists. Choose between our state-of-the-art stores or the comfort of your home.
          </p>
        </div>
      </div>

      {/* Cards Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-20">
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Store Eye Test Card */}
          <div 
            onClick={() => storeData.isAvailable && setBookingMode('store')}
            className={`bg-white rounded-3xl shadow-xl p-5 md:p-8 border border-gray-100 flex flex-col h-full relative overflow-hidden transition-all ${storeData.isAvailable ? 'hover:shadow-2xl hover:border-brand-navy/20 cursor-pointer group' : 'opacity-70 grayscale'}`}
          >
            <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              {storeData.price === 0 ? 'Free' : `₹${storeData.price}`}
            </div>
            {!storeData.isAvailable && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
                <span className="bg-red-100 text-red-800 font-bold px-4 py-2 rounded-full text-sm">Currently Unavailable</span>
              </div>
            )}
            {storeData.imageUrl ? (
              <div className={`w-full aspect-[16/9] mb-4 md:mb-6 rounded-2xl overflow-hidden transition-transform ${storeData.isAvailable ? 'group-hover:scale-105' : ''}`}>
                {storeData.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={storeData.imageUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <img src={storeData.imageUrl} alt={storeData.title} className="w-full h-full object-cover" />
                )}
              </div>
            ) : (
              <div className={`w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 md:mb-6 transition-transform ${storeData.isAvailable ? 'group-hover:scale-110' : ''}`}>
                <MapPin className="w-6 h-6 md:w-8 md:h-8 text-brand-navy" />
              </div>
            )}
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2">{storeData.title}</h2>
            <p className="text-sm md:text-base text-gray-500 mb-6 flex-grow">{storeData.description}</p>
            <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
              {storeData.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-center text-xs md:text-sm text-gray-700 font-medium">
                  <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-2 flex-shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <button disabled={!storeData.isAvailable} className="w-full bg-brand-navy text-white font-bold py-2.5 md:py-3 rounded-xl flex items-center justify-center group-hover:bg-blue-900 transition-colors disabled:opacity-50 text-sm md:text-base">
              Book Store Visit <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Home Eye Test Card */}
          <div 
            onClick={() => homeData.isAvailable && setBookingMode('home')}
            className={`bg-white rounded-3xl shadow-xl p-5 md:p-8 border border-gray-100 flex flex-col h-full relative overflow-hidden transition-all ${homeData.isAvailable ? 'hover:shadow-2xl hover:border-yellow-400/50 cursor-pointer group' : 'opacity-70 grayscale'}`}
          >
            <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Premium
            </div>
            {!homeData.isAvailable && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
                <span className="bg-red-100 text-red-800 font-bold px-4 py-2 rounded-full text-sm">Currently Unavailable</span>
              </div>
            )}
            {homeData.imageUrl ? (
              <div className={`w-full aspect-[16/9] mb-4 md:mb-6 rounded-2xl overflow-hidden transition-transform ${homeData.isAvailable ? 'group-hover:scale-105' : ''}`}>
                {homeData.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={homeData.imageUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <img src={homeData.imageUrl} alt={homeData.title} className="w-full h-full object-cover" />
                )}
              </div>
            ) : (
              <div className={`w-12 h-12 md:w-16 md:h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mb-4 md:mb-6 transition-transform ${homeData.isAvailable ? 'group-hover:scale-110' : ''}`}>
                <HomeIcon className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
              </div>
            )}
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2">{homeData.title}</h2>
            <p className="text-sm md:text-base text-gray-500 mb-6 flex-grow">{homeData.description}</p>
            <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
              {homeData.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-center text-xs md:text-sm text-gray-700 font-medium">
                  <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 mr-2 flex-shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <button disabled={!homeData.isAvailable} className="w-full bg-gradient-to-r from-[#0B1550] to-[#D4AF37] text-white font-bold py-2.5 md:py-3 rounded-xl flex items-center justify-center hover:shadow-lg transition-shadow disabled:opacity-50 text-sm md:text-base">
              Book Home Visit <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

        </div>
      </div>

      {/* Booking Modal Overlay */}
      {bookingMode !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>
          
          <div className="bg-white rounded-[24px] w-full max-w-md relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-black text-lg md:text-xl text-brand-navy">
                {isSuccess ? 'Booking Confirmed!' : bookingMode === 'store' ? storeData.title : homeData.title}
              </h3>
              <button onClick={handleClose} className="p-2 bg-white rounded-full hover:bg-gray-100 transition shadow-sm">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 overflow-y-auto">
              
              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 mb-2">You're all set!</h4>
                  <p className="text-gray-500 mb-6">
                    {bookingMode === 'store' 
                      ? 'Your appointment has been booked. Please reach the store 5 minutes early.' 
                      : 'Our optometrist will call you shortly to confirm your home visit.'}
                  </p>
                  <button onClick={handleClose} className="bg-brand-navy text-white px-8 py-3 rounded-xl font-bold w-full">
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Step Indicators */}
                  {bookingMode === 'home' && (
                    <div className="flex items-center justify-center gap-2 mb-6">
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
                        <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                        <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-navy" placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                        <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-navy" placeholder="+91 XXXXX XXXXX" />
                      </div>

                      {bookingMode === 'store' && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Select Store</label>
                          <select value={storeLocation} onChange={e=>setStoreLocation(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-navy bg-white outline-none">
                            {stores.length === 0 ? (
                              <option disabled value="">No stores available</option>
                            ) : (
                              stores.map(store => (
                                <option key={store.id} value={store.name}>{store.name}</option>
                              ))
                            )}
                          </select>
                        </div>
                      )}
                      
                      <button onClick={() => setStep(2)} className="w-full bg-brand-navy text-white font-bold py-3.5 rounded-xl mt-4">
                        Continue
                      </button>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-brand-navy" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Time</label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-brand-navy" />
                          </div>
                        </div>
                      </div>

                      {bookingMode === 'home' && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Full Address for Visit</label>
                          <textarea value={address} onChange={e=>setAddress(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-navy" placeholder="House/Flat No., Street, Landmark, Pincode" />
                        </div>
                      )}

                      <div className="flex gap-3 mt-4">
                        <button onClick={() => setStep(1)} disabled={isSubmitting} className="px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 disabled:opacity-50">
                          Back
                        </button>
                        <button onClick={handleNext} disabled={isSubmitting} className="flex-1 bg-brand-navy text-white font-bold py-3.5 rounded-xl flex items-center justify-center disabled:opacity-70">
                          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : bookingMode === 'store' ? 'Confirm Booking' : 'Proceed to Pay'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment Step (Home Only) */}
                  {step === 3 && bookingMode === 'home' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
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

                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 border-2 border-brand-navy rounded-xl bg-blue-50/30 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <CreditCard className="text-brand-navy" />
                            <span className="font-bold text-sm text-gray-800">Card / UPI (Mock)</span>
                          </div>
                          <div className="w-4 h-4 rounded-full border-4 border-brand-navy bg-white"></div>
                        </label>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500 flex items-start gap-2">
                        <span className="text-brand-navy font-bold">Note:</span>
                        This is a simulated payment gateway. Clicking Pay will securely mock the transaction.
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button onClick={() => setStep(2)} disabled={isSubmitting} className="px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 disabled:opacity-50">
                          Back
                        </button>
                        <button onClick={handleFinalSubmit} disabled={isSubmitting} className="flex-1 bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/30 flex justify-center items-center disabled:opacity-70">
                          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₹${homeData.price} Securely`}
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
