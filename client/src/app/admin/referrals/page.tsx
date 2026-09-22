"use client";

import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Users, 
  CheckCircle2, 
  Store, 
  Globe, 
  Clock, 
  Save, 
  RefreshCw,
  TrendingUp,
  Percent
} from 'lucide-react';

export default function AdminReferralsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form config state
  const [campaignName, setCampaignName] = useState('');
  const [rewardType, setRewardType] = useState('FREE_FRAME');
  const [rewardValue, setRewardValue] = useState(100);
  const [rewardTitle, setRewardTitle] = useState('');
  const [friendWelcomeDiscount, setFriendWelcomeDiscount] = useState(200);
  const [minOrderValue, setMinOrderValue] = useState(999);
  const [validityDays, setValidityDays] = useState(60);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/referral?action=admin-all');
      const json = await res.json();
      if (json.success) {
        setData(json);
        setCampaignName(json.config?.campaignName || '');
        setRewardType(json.config?.rewardType || 'FREE_FRAME');
        setRewardValue(json.config?.rewardValue ?? 100);
        setRewardTitle(json.config?.rewardTitle || '');
        setFriendWelcomeDiscount(json.config?.friendWelcomeDiscount ?? 200);
        setMinOrderValue(json.config?.minOrderValue ?? 999);
        setValidityDays(json.config?.validityDays ?? 60);
      }
    } catch (err) {
      console.error("Failed to load referral admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-config',
          config: {
            campaignName,
            rewardType,
            rewardValue: Number(rewardValue),
            rewardTitle: rewardTitle || (rewardType === 'FREE_FRAME' ? 'FREE Eyevengers Frame' : `${rewardValue}% OFF on Next Order`),
            friendWelcomeDiscount: Number(friendWelcomeDiscount),
            minOrderValue: Number(minOrderValue),
            validityDays: Number(validityDays)
          }
        })
      });
      const result = await res.json();
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Gift size={14} /> Growth Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Refer & Earn Campaign Control
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure dynamic referral benefits, view top referrers, and monitor online & in-store claims.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition flex items-center gap-2 self-start"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Stats
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold uppercase text-gray-400 mb-1 flex items-center gap-1.5">
            <Users size={14} /> Total Referrers
          </div>
          <div className="text-2xl font-black text-gray-900">{data?.stats?.totalUsersWithCode ?? 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold uppercase text-gray-400 mb-1 flex items-center gap-1.5">
            <Gift size={14} /> Vouchers Issued
          </div>
          <div className="text-2xl font-black text-brand-navy">{data?.stats?.totalVouchersIssued ?? 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-green-500">
          <div className="text-xs font-bold uppercase text-green-700 mb-1 flex items-center gap-1.5">
            <Store size={14} /> Claimed At Shop
          </div>
          <div className="text-2xl font-black text-green-700">{data?.stats?.totalClaimedAtStore ?? 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold uppercase text-blue-700 mb-1 flex items-center gap-1.5">
            <Globe size={14} /> Claimed Online
          </div>
          <div className="text-2xl font-black text-blue-700">{data?.stats?.totalClaimedOnline ?? 0}</div>
        </div>
      </div>

      {/* Campaign Settings Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="text-brand-navy" size={20} />
          Current Referral Offer Settings
        </h2>

        {saveSuccess && (
          <div className="mb-4 p-3.5 bg-green-50 text-green-800 text-xs font-bold rounded-xl border border-green-200 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Referral campaign settings saved and live immediately!
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-700 block mb-1">Campaign Display Title</label>
            <input
              type="text"
              required
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              className="w-full text-sm font-semibold p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Active Offer Benefit</label>
            <select
              value={rewardType}
              onChange={e => {
                const newType = e.target.value;
                setRewardType(newType);
                if (newType === 'FREE_FRAME') {
                  setRewardTitle('FREE Eyevengers Frame');
                  setRewardValue(100);
                } else if (newType === 'PERCENT_DISCOUNT') {
                  setRewardTitle('30% OFF on Next Order');
                  setRewardValue(30);
                } else if (newType === 'FLAT_DISCOUNT') {
                  setRewardTitle('Flat ₹500 OFF');
                  setRewardValue(500);
                } else if (newType === 'COMBO_BENEFIT') {
                  setRewardTitle('FREE Frame + 30% OFF on Lenses');
                  setRewardValue(30);
                }
              }}
              className="w-full text-sm font-semibold p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy"
            >
              <option value="FREE_FRAME">Free Frame (100% OFF on Frame)</option>
              <option value="PERCENT_DISCOUNT">Percentage Discount (e.g. 30% OFF)</option>
              <option value="FLAT_DISCOUNT">Flat Amount Discount (₹ OFF)</option>
              <option value="COMBO_BENEFIT">Multi / Combo (Free Frame + 30% OFF)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Custom Reward Title (Customer Screen)</label>
            <input
              type="text"
              required
              value={rewardTitle}
              onChange={e => setRewardTitle(e.target.value)}
              placeholder="e.g. FREE Eyevengers Frame or 30% OFF"
              className="w-full text-sm font-semibold p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Discount Value (% or ₹)</label>
            <input
              type="number"
              value={rewardValue}
              onChange={e => setRewardValue(Number(e.target.value))}
              className="w-full text-sm font-semibold p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Friend Welcome Discount (₹)</label>
            <input
              type="number"
              value={friendWelcomeDiscount}
              onChange={e => setFriendWelcomeDiscount(Number(e.target.value))}
              className="w-full text-sm font-semibold p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Voucher Validity (Days)</label>
            <input
              type="number"
              value={validityDays}
              onChange={e => setValidityDays(Number(e.target.value))}
              className="w-full text-sm font-semibold p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          <div className="sm:col-span-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-navy text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-blue-900 transition flex items-center gap-2 shadow-md"
            >
              {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
              Save Referral Campaign Settings
            </button>
          </div>
        </form>
      </div>

      {/* Live Customer Referral Codes & Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Users className="text-brand-navy" size={20} />
          Active Customer Referral Codes & Live Status
        </h2>
        <p className="text-xs text-gray-500 mb-5">Each registered customer gets a unique referral code. Track their codes, friends referred, and live benefit status here.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Referral Code</th>
                <th className="py-3 px-4">Referral Link</th>
                <th className="py-3 px-4 text-center">Friends Referred</th>
                <th className="py-3 px-4 text-center">Active Benefits</th>
                <th className="py-3 px-4 text-center">Claimed Rewards</th>
                <th className="py-3 px-4 text-right">Benefit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.users?.map((u: any) => {
                const hasActive = (u.activeRewards || 0) > 0;
                const hasClaimed = (u.claimedRewards || 0) > 0;
                return (
                  <tr key={u.id || u.phone} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{u.name}</div>
                      <div className="text-gray-400 text-[10px]">{u.phone}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-navy bg-blue-50/40 rounded-lg">
                      {u.referralCode}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500 max-w-[200px] truncate">
                      https://www.eyevengers.com/?ref={u.referralCode}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-800">
                      {u.totalReferred || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-green-600">
                      {u.activeRewards || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-500">
                      {u.claimedRewards || 0}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {hasActive ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                          <CheckCircle2 size={11} /> LIVE BENEFIT ACTIVE
                        </span>
                      ) : hasClaimed ? (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                          CLAIMED
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px] font-medium">Ready (Share Code)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Issued Vouchers & Redemption Log */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="text-brand-navy" size={20} />
          Complete Vouchers & In-Store Claims Log
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Referrer Customer</th>
                <th className="py-3 px-4">Referred Friend</th>
                <th className="py-3 px-4">Benefit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Claim Details (Store / Online)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.vouchers?.map((v: any) => {
                const isClaimed = v.status === 'CLAIMED';
                return (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{v.code}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-800">{v.referrerName}</div>
                      <div className="text-gray-400 text-[10px]">{v.referrerPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{v.referredName || 'N/A'}</div>
                      <div className="text-gray-400 text-[10px]">{v.referredPhone || ''}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{v.benefitTitle}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isClaimed ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-800'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      {isClaimed ? (
                        <div>
                          <div className="font-bold text-brand-navy flex items-center gap-1">
                            {v.claimedChannel === 'STORE' ? <Store size={12} /> : <Globe size={12} />}
                            {v.claimedChannel === 'STORE' ? (v.claimedStoreLocation || 'Shop Claim') : 'Online Order'}
                          </div>
                          <div className="text-gray-400 text-[10px]">
                            {new Date(v.claimedAt).toLocaleDateString('en-IN')} by {v.claimedStaffName || 'Staff'} (Inv: {v.claimedInvoiceNo || 'N/A'})
                          </div>
                        </div>
                      ) : (
                        <span className="text-green-600 font-medium">Ready for In-Store or Online claim</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
