"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { 
  Store, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  ShieldCheck,
  Building,
  RefreshCw,
  Gift,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function AdminRedeemVoucherPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [allVouchers, setAllVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'CLAIMED' | 'ALL'>('ACTIVE');

  // Dynamic Physical Stores
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [storeLocation, setStoreLocation] = useState('Eyevengers Store');
  const [staffName, setStaffName] = useState('Store Manager');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch Real Physical Stores added in Admin Panel
  useEffect(() => {
    const fetchPhysicalStores = async () => {
      try {
        const res = await fetchWithAuth(`https://eyevengers-web.onrender.com/api/admin/stores?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAvailableStores(data);
            const firstStore = data[0];
            setStoreLocation(`${firstStore.name}${firstStore.address ? ` - ${firstStore.address}` : ''}`);
            return;
          }
        }
        // Fallback to public stores route
        const fallbackRes = await fetch('https://eyevengers-web.onrender.com/api/stores');
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          if (Array.isArray(fbData) && fbData.length > 0) {
            setAvailableStores(fbData);
            setStoreLocation(`${fbData[0].name}${fbData[0].address ? ` - ${fbData[0].address}` : ''}`);
          }
        }
      } catch (err) {
        console.error("Failed to load physical stores:", err);
      }
    };

    fetchPhysicalStores();
  }, []);

  // 2. Load All Vouchers
  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/referral?action=admin-all');
      const data = await res.json();
      if (data.success && Array.isArray(data.vouchers)) {
        setAllVouchers(data.vouchers);
        // Preselect the first active voucher if none selected
        if (!selectedVoucher) {
          const firstActive = data.vouchers.find((v: any) => v.status === 'ACTIVE');
          if (firstActive) setSelectedVoucher(firstActive);
        }
      }
    } catch (err) {
      console.error("Failed to load vouchers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // 3. Filter Vouchers by Tab and Search Query in real-time
  const filteredVouchers = useMemo(() => {
    return allVouchers.filter((v: any) => {
      // Tab filter
      if (activeTab === 'ACTIVE' && v.status !== 'ACTIVE') return false;
      if (activeTab === 'CLAIMED' && v.status !== 'CLAIMED') return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const code = (v.code || '').toLowerCase();
      const refName = (v.referrerName || '').toLowerCase();
      const refPhone = (v.referrerPhone || '').toLowerCase();
      const frdName = (v.referredName || '').toLowerCase();
      const frdPhone = (v.referredPhone || '').toLowerCase();
      const benefit = (v.benefitTitle || '').toLowerCase();

      return code.includes(q) || 
             refName.includes(q) || 
             refPhone.includes(q) || 
             frdName.includes(q) || 
             frdPhone.includes(q) || 
             benefit.includes(q);
    });
  }, [allVouchers, activeTab, searchQuery]);

  const stats = useMemo(() => {
    const total = allVouchers.length;
    const active = allVouchers.filter(v => v.status === 'ACTIVE').length;
    const claimedStore = allVouchers.filter(v => v.status === 'CLAIMED' && v.claimedChannel === 'STORE').length;
    const claimedOnline = allVouchers.filter(v => v.status === 'CLAIMED' && v.claimedChannel === 'ONLINE').length;
    return { total, active, claimedStore, claimedOnline };
  }, [allVouchers]);

  // 4. Redeem Voucher at Store
  const handleRedeemAtStore = async () => {
    if (!selectedVoucher) return;

    const confirmAction = confirm(
      `Confirm In-Store Claim for ${selectedVoucher.code}?\n\nCustomer: ${selectedVoucher.referrerName} (${selectedVoucher.referrerPhone})\nBenefit: ${selectedVoucher.benefitTitle}\nStore: ${storeLocation}\n\nThis will permanently lock the single-use voucher.`
    );
    if (!confirmAction) return;

    setRedeeming(true);
    setErrorMessage('');
    setRedeemSuccess(null);

    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'redeem-store',
          voucherCode: selectedVoucher.code,
          storeLocation,
          staffName: staffName || 'Store Manager',
          invoiceNo: invoiceNo || `INV-${Date.now().toString().slice(-6)}`,
          notes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRedeemSuccess(data);
        setSelectedVoucher(data.voucher);
        // Refresh vouchers list
        fetchVouchers();
      } else {
        setErrorMessage(data.error || 'Failed to claim voucher');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server error while redeeming');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-100 text-brand-navy px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Store size={14} /> Physical Shop Staff Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            In-Store Voucher Redemption
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse unused customer referral vouchers & lock them permanently upon offline billing.
          </p>
        </div>

        {/* Dynamic Physical Store Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Shop:</div>
          <div className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-2xl border border-gray-200 transition">
            <Building size={16} className="text-brand-navy shrink-0 ml-1" />
            <select 
              value={storeLocation}
              onChange={e => setStoreLocation(e.target.value)}
              className="text-xs font-bold text-gray-800 bg-transparent focus:outline-none pr-3 cursor-pointer max-w-xs truncate"
            >
              {availableStores.length > 0 ? (
                availableStores.map((store) => (
                  <option 
                    key={store.id} 
                    value={`${store.name}${store.address ? ` - ${store.address}` : ''}`}
                  >
                    {store.name} {store.address ? `(${store.address})` : ''}
                  </option>
                ))
              ) : (
                <option value="Eyevengers Main Retail Store">Eyevengers Main Retail Store</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('ACTIVE')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === 'ACTIVE' 
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm' 
              : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
          }`}
        >
          <div className="text-xs font-bold text-emerald-700 uppercase flex items-center justify-between">
            <span>Unused / Ready to Claim</span>
            <Sparkles size={16} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-900 mt-2">{stats.active}</div>
          <div className="text-[11px] text-emerald-600 mt-1">Available with customers</div>
        </div>

        <div 
          onClick={() => setActiveTab('CLAIMED')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === 'CLAIMED' 
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-sm' 
              : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
          }`}
        >
          <div className="text-xs font-bold text-blue-700 uppercase flex items-center justify-between">
            <span>Claimed at Stores</span>
            <Store size={16} className="text-blue-500" />
          </div>
          <div className="text-3xl font-black text-blue-900 mt-2">{stats.claimedStore}</div>
          <div className="text-[11px] text-blue-600 mt-1">Redeemed in physical shops</div>
        </div>

        <div 
          onClick={() => setActiveTab('CLAIMED')}
          className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm"
        >
          <div className="text-xs font-bold text-gray-500 uppercase flex items-center justify-between">
            <span>Claimed Online</span>
            <ShieldCheck size={16} className="text-gray-400" />
          </div>
          <div className="text-3xl font-black text-gray-800 mt-2">{stats.claimedOnline}</div>
          <div className="text-[11px] text-gray-400 mt-1">Used on website checkout</div>
        </div>

        <div 
          onClick={() => setActiveTab('ALL')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === 'ALL' 
              ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-400/20 shadow-sm' 
              : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
          }`}
        >
          <div className="text-xs font-bold text-gray-600 uppercase flex items-center justify-between">
            <span>Total Issued Vouchers</span>
            <Gift size={16} className="text-gray-500" />
          </div>
          <div className="text-3xl font-black text-gray-900 mt-2">{stats.total}</div>
          <div className="text-[11px] text-gray-500 mt-1">All rewards generated</div>
        </div>
      </div>

      {/* Live Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Real-time Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Voucher Code, Customer Phone, or Name..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'ACTIVE'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unused / Active ({stats.active})
            </button>
            <button
              onClick={() => setActiveTab('CLAIMED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'CLAIMED'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Claimed ({stats.claimedStore + stats.claimedOnline})
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'ALL'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Vouchers ({stats.total})
            </button>
          </div>

          <button
            onClick={fetchVouchers}
            disabled={loading}
            className="p-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-100 transition self-center"
            title="Refresh List"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm font-semibold rounded-2xl border border-red-200 flex items-center gap-2">
            <XCircle size={18} className="shrink-0" />
            {errorMessage}
          </div>
        )}

        {redeemSuccess && (
          <div className="mt-4 p-4 bg-green-50 text-green-800 text-sm font-bold rounded-2xl border border-green-200 flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0 text-green-600" />
            {redeemSuccess.message}
          </div>
        )}
      </div>

      {/* Main Content: Vouchers List + Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Vouchers List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {activeTab === 'ACTIVE' ? 'Unused Vouchers Ready to Claim' : activeTab === 'CLAIMED' ? 'Redeemed Vouchers' : 'All Vouchers'} ({filteredVouchers.length})
            </h3>
            <span className="text-[11px] text-gray-400">Click any voucher to redeem</span>
          </div>

          {filteredVouchers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <Gift className="mx-auto text-gray-300 mb-3" size={40} />
              <h4 className="font-bold text-gray-800 text-base">No Vouchers Found</h4>
              <p className="text-xs text-gray-500 mt-1">
                {searchQuery ? 'Try adjusting your search keywords.' : 'No referral vouchers available in this category yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {filteredVouchers.map((v) => {
                const isClaimed = v.status === 'CLAIMED';
                const isSelected = selectedVoucher?.id === v.id || selectedVoucher?.code === v.code;

                return (
                  <div
                    key={v.id || v.code}
                    onClick={() => {
                      setSelectedVoucher(v);
                      setErrorMessage('');
                      setRedeemSuccess(null);
                    }}
                    className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand-navy bg-blue-50/40 shadow-md ring-2 ring-brand-navy/30'
                        : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm sm:text-base text-gray-900 tracking-wider bg-gray-100 px-2.5 py-1 rounded-xl">
                          {v.code}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isClaimed ? 'bg-gray-200 text-gray-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isClaimed ? 'CLAIMED' : 'READY TO CLAIM'}
                        </span>
                      </div>
                      
                      {!isClaimed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVoucher(v);
                          }}
                          className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-xl flex items-center gap-1 shadow-sm transition"
                        >
                          Redeem <ArrowRight size={12} />
                        </button>
                      )}
                    </div>

                    <div className="font-bold text-sm text-gray-900 line-clamp-1 mb-2">
                      {v.benefitTitle}
                    </div>

                    {/* Customer Info (Kis Customer Ke Pass Hai) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50/80 p-2.5 rounded-2xl text-xs text-gray-600 border border-gray-100">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase block">Voucher Holder</span>
                          <span className="font-bold text-gray-900">{v.referrerName || 'Valued Customer'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase block">Customer Phone</span>
                          <span className="font-semibold text-gray-800">{v.referrerPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Issued / Claim Info */}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 px-1">
                      <span>Issued: {new Date(v.issuedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {isClaimed ? (
                        <span className="text-amber-700 font-semibold">
                          Claimed: {v.claimedStoreLocation || 'Store'} ({new Date(v.claimedAt).toLocaleDateString('en-IN')})
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">
                          Valid Till: {new Date(v.expiresAt || (Date.now() + 60*86400000)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Voucher Details & Store Claim Action (5 cols) */}
        <div className="lg:col-span-5">
          {selectedVoucher ? (
            <div className={`bg-white rounded-3xl p-6 border shadow-sm sticky top-24 ${
              selectedVoucher.status === 'CLAIMED' ? 'border-amber-200 bg-amber-50/10' : 'border-gray-200'
            }`}>
              
              {/* Status Header */}
              <div className={`p-4 rounded-2xl mb-5 flex items-start gap-3 ${
                selectedVoucher.status === 'CLAIMED'
                  ? 'bg-amber-100/70 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100/70 text-emerald-900 border border-emerald-300'
              }`}>
                {selectedVoucher.status === 'CLAIMED' ? (
                  <AlertTriangle className="shrink-0 mt-0.5 text-amber-700" size={20} />
                ) : (
                  <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-700" size={20} />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {selectedVoucher.status === 'CLAIMED' ? 'ALREADY REDEEMED & LOCKED' : 'VALID & READY FOR STORE CLAIM'}
                  </h4>
                  <p className="text-xs mt-0.5">
                    {selectedVoucher.status === 'CLAIMED'
                      ? `Redeemed on ${new Date(selectedVoucher.claimedAt).toLocaleString('en-IN')} at ${selectedVoucher.claimedStoreLocation || 'Store'}.`
                      : 'Verify customer ID/phone and give them this benefit at billing.'}
                  </p>
                </div>
              </div>

              {/* Voucher Summary Grid */}
              <div className="space-y-3 mb-6 text-xs">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Voucher Code</span>
                  <span className="font-mono font-black text-gray-900 text-lg tracking-wider">{selectedVoucher.code}</span>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">Benefit Entitlement</span>
                  <span className="font-black text-emerald-900 text-base block">{selectedVoucher.benefitTitle}</span>
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    {selectedVoucher.benefitType === 'FREE_FRAME' 
                      ? 'Customer gets 1 Frame 100% Free (up to ₹1,500 value).'
                      : selectedVoucher.benefitType === 'PERCENT_DISCOUNT'
                      ? `Customer gets ${selectedVoucher.benefitValue}% discount on billing.`
                      : `Flat ₹${selectedVoucher.benefitValue} OFF on their bill.`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Customer Name</span>
                    <span className="font-bold text-gray-900">{selectedVoucher.referrerName || 'Customer'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Customer Phone</span>
                    <span className="font-bold text-gray-900">{selectedVoucher.referrerPhone}</span>
                  </div>
                </div>

                {selectedVoucher.referredName && (
                  <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 text-blue-900">
                    <span className="text-[10px] uppercase font-bold text-blue-500 block mb-0.5">Referred Friend</span>
                    <span className="font-semibold">{selectedVoucher.referredName} ({selectedVoucher.referredPhone || 'New User'})</span>
                  </div>
                )}
              </div>

              {/* Redemption Form when ACTIVE */}
              {selectedVoucher.status === 'ACTIVE' ? (
                <div className="border-t border-gray-100 pt-5 space-y-3.5">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="text-emerald-600" size={18} />
                    Complete In-Store Billing
                  </h4>

                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Redeeming Store</label>
                    <input 
                      type="text"
                      disabled
                      value={storeLocation}
                      className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-700 cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Store Invoice No.</label>
                      <input
                        type="text"
                        placeholder="e.g. INV-2026-901"
                        value={invoiceNo}
                        onChange={e => setInvoiceNo(e.target.value)}
                        className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Staff Name</label>
                      <input
                        type="text"
                        value={staffName}
                        onChange={e => setStaffName(e.target.value)}
                        className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleRedeemAtStore}
                    disabled={redeeming}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base py-3.5 rounded-2xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-2"
                  >
                    {redeeming ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    CONFIRM & MARK CLAIMED AT STORE
                  </button>
                  <p className="text-[11px] text-gray-400 text-center">
                    Strictly 1-time redemption. Once claimed, this code will be permanently disabled.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs text-gray-600 space-y-1.5">
                  <div className="font-bold text-gray-900 border-b pb-1">Redemption Record</div>
                  <div><strong>Claimed At Store:</strong> {selectedVoucher.claimedStoreLocation || 'Physical Branch'}</div>
                  <div><strong>Staff Member:</strong> {selectedVoucher.claimedStaffName || 'Store Manager'}</div>
                  <div><strong>Store Invoice Number:</strong> {selectedVoucher.claimedInvoiceNo || 'N/A'}</div>
                  <div><strong>Date & Time:</strong> {new Date(selectedVoucher.claimedAt).toLocaleString('en-IN')}</div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm sticky top-24">
              <Gift className="mx-auto text-gray-300 mb-3" size={48} />
              <h4 className="font-bold text-gray-800 text-base">Select a Voucher</h4>
              <p className="text-xs text-gray-500 mt-1">
                Choose any active voucher from the left list to view customer details and process store claim.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
