"use client";

import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';

export default function AdminRedeemVoucherPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  // Redemption Form Inputs
  const [storeLocation, setStoreLocation] = useState('Eyevengers Flagship Store - Delhi');
  const [staffName, setStaffName] = useState('Store Manager');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setErrorMessage('');
    setSelectedVoucher(null);
    setRedeemSuccess(null);

    try {
      const res = await fetch(`/api/referral?action=lookup&query=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.vouchers);
        if (data.vouchers.length === 1) {
          setSelectedVoucher(data.vouchers[0]);
        }
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      setErrorMessage('Failed to connect to verification server');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemAtStore = async () => {
    if (!selectedVoucher) return;

    const confirmAction = confirm(
      `Are you sure you want to mark ${selectedVoucher.code} as CLAIMED at the store?\n\nBenefit: ${selectedVoucher.benefitTitle}\nCustomer: ${selectedVoucher.referrerName}\n\nThis action CANNOT be undone and will permanently lock the voucher.`
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
          staffName,
          invoiceNo: invoiceNo || `INV-${Date.now().toString().slice(-6)}`,
          notes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRedeemSuccess(data);
        setSelectedVoucher(data.voucher);
        // Refresh search results
        handleSearch();
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-100 text-brand-navy px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Store size={14} /> Physical Shop Staff Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            In-Store Voucher Redemption
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Verify customer referral vouchers & lock them permanently after billing at the store.
          </p>
        </div>

        {/* Store Selection */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
          <Building size={16} className="text-gray-400 ml-2" />
          <select 
            value={storeLocation}
            onChange={e => setStoreLocation(e.target.value)}
            className="text-xs font-bold text-gray-700 bg-transparent focus:outline-none pr-2 cursor-pointer"
          >
            <option value="Eyevengers Flagship Store - Delhi">Delhi Flagship Store</option>
            <option value="Eyevengers Store - Mumbai">Mumbai Branch</option>
            <option value="Eyevengers Store - Bangalore">Bangalore Store</option>
          </select>
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              required
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Voucher Code (e.g. REF-FREE-789) or Customer Phone"
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold uppercase placeholder-normal focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-navy text-white px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-blue-900 transition flex items-center justify-center gap-2 shadow-md shadow-blue-900/10"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
            Verify Code
          </button>
        </form>

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

      {/* Search Results / Voucher Details */}
      {searchResults && (
        <div className="space-y-6">
          {searchResults.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <AlertTriangle className="mx-auto text-amber-500 mb-3" size={40} />
              <h3 className="font-bold text-gray-800 text-base">No Matching Voucher Found</h3>
              <p className="text-xs text-gray-500 mt-1">Please double check the code or phone number entered.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Vouchers List */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
                  Matching Vouchers ({searchResults.length})
                </h3>
                {searchResults.map((v) => {
                  const isClaimed = v.status === 'CLAIMED';
                  const isSelected = selectedVoucher?.id === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVoucher(v);
                        setErrorMessage('');
                        setRedeemSuccess(null);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? 'border-brand-navy bg-blue-50/50 shadow-sm ring-1 ring-brand-navy'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-black text-sm text-gray-900">{v.code}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isClaimed ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-800'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-gray-700 line-clamp-1">{v.benefitTitle}</div>
                      <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
                        <span>Customer: {v.referrerName}</span>
                        <span>{v.referrerPhone}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action / Detail Card */}
              {selectedVoucher && (
                <div className="lg:col-span-2">
                  <div className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-sm ${
                    selectedVoucher.status === 'CLAIMED' ? 'border-amber-200 bg-amber-50/20' : 'border-gray-200'
                  }`}>
                    
                    {/* Status Banner */}
                    <div className={`p-4 rounded-2xl mb-6 flex items-start gap-3 ${
                      selectedVoucher.status === 'CLAIMED'
                        ? 'bg-amber-100/70 text-amber-900 border border-amber-300'
                        : 'bg-green-100/70 text-green-900 border border-green-300'
                    }`}>
                      {selectedVoucher.status === 'CLAIMED' ? (
                        <AlertTriangle className="shrink-0 mt-0.5 text-amber-700" size={20} />
                      ) : (
                        <CheckCircle2 className="shrink-0 mt-0.5 text-green-700" size={20} />
                      )}
                      <div>
                        <h4 className="font-bold text-sm">
                          {selectedVoucher.status === 'CLAIMED' ? 'ALREADY CLAIMED & LOCKED' : 'VALID & READY FOR STORE REDEMPTION'}
                        </h4>
                        <p className="text-xs mt-0.5">
                          {selectedVoucher.status === 'CLAIMED'
                            ? `This coupon was redeemed on ${new Date(selectedVoucher.claimedAt).toLocaleString('en-IN')} at "${selectedVoucher.claimedStoreLocation || 'Store'}". Single-use protection prevents any further redemption.`
                            : 'This voucher is valid for single use. Once confirmed below, it will be marked claimed immediately.'}
                        </p>
                      </div>
                    </div>

                    {/* Voucher Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 text-sm">
                      <div className="bg-gray-50 p-3.5 rounded-2xl">
                        <span className="text-[11px] uppercase font-bold text-gray-400 block mb-1">Voucher Code</span>
                        <span className="font-mono font-black text-gray-900 text-base">{selectedVoucher.code}</span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-2xl">
                        <span className="text-[11px] uppercase font-bold text-gray-400 block mb-1">Customer Name</span>
                        <span className="font-bold text-gray-800">{selectedVoucher.referrerName}</span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-2xl">
                        <span className="text-[11px] uppercase font-bold text-gray-400 block mb-1">Customer Phone</span>
                        <span className="font-bold text-gray-800">{selectedVoucher.referrerPhone}</span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-2xl col-span-2 sm:col-span-3">
                        <span className="text-[11px] uppercase font-bold text-gray-400 block mb-1">Benefit to Give Customer</span>
                        <span className="font-black text-brand-navy text-lg">{selectedVoucher.benefitTitle}</span>
                      </div>
                    </div>

                    {/* Redemption Form when ACTIVE */}
                    {selectedVoucher.status === 'ACTIVE' ? (
                      <div className="border-t border-gray-100 pt-6 space-y-4">
                        <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          <ShieldCheck className="text-green-600" size={18} />
                          Shop Claim Information
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">Store Bill / Invoice Number</label>
                            <input
                              type="text"
                              placeholder="e.g. INV-2026-891"
                              value={invoiceNo}
                              onChange={e => setInvoiceNo(e.target.value)}
                              className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">Staff / Executive Name</label>
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
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-black text-base py-4 rounded-2xl transition shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                        >
                          {redeeming ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={20} />}
                          MARK AS CLAIMED AT STORE (LOCKED)
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs text-gray-600 space-y-1">
                        <div><strong>Claimed By Staff:</strong> {selectedVoucher.claimedStaffName || 'Admin'}</div>
                        <div><strong>Store Location:</strong> {selectedVoucher.claimedStoreLocation || 'Physical Branch'}</div>
                        <div><strong>Store Invoice Number:</strong> {selectedVoucher.claimedInvoiceNo || 'N/A'}</div>
                        <div><strong>Claim Timestamp:</strong> {new Date(selectedVoucher.claimedAt).toLocaleString('en-IN')}</div>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

    </div>
  );
}
