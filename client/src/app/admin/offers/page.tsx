"use client";
import { fetchWithAuth } from '@/utils/fetchWithAuth';

import React, { useState, useEffect, Suspense } from 'react';
import { Plus, Tag, Settings, Save, AlertCircle, Calendar, BarChart3, TrendingUp, DollarSign, Link as LinkIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Offer {
  id?: string;
  name: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  scope: 'smart_rules' | 'global' | 'product' | 'category' | 'brand';
  targetCategories?: string[];
  targetBrands?: string[];
  targetIds?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  status: 'active' | 'paused' | 'expired';
  startDatetime?: string;
  endDatetime?: string;
  
  // Enh 1: Coupons
  requiresCoupon: boolean;
  couponCode: string;
  
  // Enh 2: Limits
  totalRedemptionCap: number | null;
  perCustomerLimit: number | null;
  newCustomersOnly: boolean;
  minCartValue: number | null;
  
  // Enh 3: Stacking
  stackingBehavior: 'best_price_wins' | 'stack_with_membership' | 'offer_overrides_membership' | 'not_applicable_to_members';
}

function OffersAdminContent() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'analytics'>('edit');
  const [analytics, setAnalytics] = useState<any>(null);
  const [usages, setUsages] = useState<any[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  useEffect(() => {
    fetchWithAuth(`https://eyevengers-web.onrender.com/api/offers`)
      .then(r => r.json())
      .then(data => {
        setOffers(data);
        if (editId) {
          const toEdit = data.find((o: any) => o.id === editId);
          if (toEdit) setSelectedOffer(toEdit);
        }
      });

    fetchWithAuth(`https://eyevengers-web.onrender.com/api/admin/products`)
      .then(r => r.json())
      .then(products => {
        const brands = Array.from(new Set(products.map((p: any) => p.brand).filter((b: any) => b && b !== 'Generic'))) as string[];
        setAvailableBrands(brands);
      })
      .catch(err => console.error("Failed to load products for brands", err));
  }, [editId]);

  useEffect(() => {
    if (selectedOffer?.id && activeTab === 'analytics') {
      fetchWithAuth(`https://eyevengers-web.onrender.com/api/offers/${selectedOffer.id}/analytics`)
        .then(r => r.json())
        .then(data => setAnalytics(data));
    }
    
    if (selectedOffer?.id && activeTab === 'edit') {
      fetchWithAuth(`https://eyevengers-web.onrender.com/api/offers/${selectedOffer.id}/usages`)
        .then(r => r.json())
        .then(data => setUsages(data));
    } else {
      setUsages([]);
    }
  }, [selectedOffer?.id, activeTab]);

  const handleSave = async () => {
    if (!selectedOffer) return;
    
    // Status warning if pausing with active links
    if (selectedOffer.status === 'paused' && usages.length > 0) {
      const confirmPause = window.confirm(
        `This offer is linked in ${usages.length} places (e.g., ${usages[0].sectionType}). Pausing it will make these link to nothing — update them first or continue anyway?`
      );
      if (!confirmPause) return;
    }

    // Auto uppercase coupon
    if (selectedOffer.requiresCoupon && selectedOffer.couponCode) {
      selectedOffer.couponCode = selectedOffer.couponCode.toUpperCase();
    }

    const method = selectedOffer.id ? 'PUT' : 'POST';
    const url = selectedOffer.id 
      ? `https://eyevengers-web.onrender.com/api/offers/${selectedOffer.id}` 
      : `https://eyevengers-web.onrender.com/api/offers`;

    const res = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedOffer)
    });
    
    const saved = await res.json();
    
    if (method === 'POST') {
      setOffers([...offers, saved]);
    } else {
      setOffers(offers.map(o => o.id === saved.id ? saved : o));
    }
    
    alert('Saved successfully!');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Left List */}
      <div className="w-1/3 border-r border-gray-200 pr-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Offers & Campaigns</h2>
          <button 
            onClick={() => setSelectedOffer({ 
              name: '', discountType: 'percentage', discountValue: 10, status: 'active',
              scope: 'smart_rules', targetCategories: [], targetBrands: [], minPrice: null, maxPrice: null, targetIds: [],
              startDatetime: new Date().toISOString().slice(0, 16), 
              endDatetime: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
              requiresCoupon: false, couponCode: '', totalRedemptionCap: null, perCustomerLimit: 1,
              newCustomersOnly: false, minCartValue: null, stackingBehavior: 'best_price_wins'
            })}
            className="p-2 bg-brand-navy text-white rounded hover:bg-blue-900"
          >
            <Plus size={20} />
          </button>
        </div>

        <Link href="/admin/offers/calendar" className="mb-4 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2 rounded-lg font-bold hover:bg-blue-100 transition">
          <Calendar size={18} /> View Calendar
        </Link>

        <div className="overflow-y-auto space-y-3 flex-1">
          {offers.map(o => (
            <div 
              key={o.id} 
              onClick={() => setSelectedOffer(o)}
              className={`p-4 rounded-xl border cursor-pointer transition ${selectedOffer?.id === o.id ? 'border-brand-navy bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{o.name}</h3>
                <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${o.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{o.status}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Tag size={14} />
                {o.discountValue}{o.discountType === 'percentage' ? '%' : '₹'} OFF
                {o.requiresCoupon && <span className="ml-2 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs font-mono">{o.couponCode}</span>}
              </div>
              
              {/* Enhancement 2: Usage Limits Progress Bar in List */}
              {o.totalRedemptionCap !== null && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Usage</span>
                    <span className="font-medium text-gray-700">{(o as any).redemptionCount} / {o.totalRedemptionCap}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-brand-navy h-1.5 rounded-full" style={{ width: `${Math.min(100, ((o as any).redemptionCount / o.totalRedemptionCap) * 100)}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Editor */}
      <div className="w-2/3 pl-6 overflow-y-auto">
        {selectedOffer ? (
          <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center pb-4 border-b">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold">{selectedOffer.id ? 'Edit Offer' : 'Create Offer'}</h2>
                {selectedOffer.id && (
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('edit')} className={`px-3 py-1 text-sm font-bold rounded-md ${activeTab === 'edit' ? 'bg-white shadow' : 'text-gray-500'}`}>Edit</button>
                    <button onClick={() => setActiveTab('analytics')} className={`px-3 py-1 text-sm font-bold rounded-md flex items-center gap-1 ${activeTab === 'analytics' ? 'bg-white shadow' : 'text-gray-500'}`}><BarChart3 size={14}/> Analytics</button>
                  </div>
                )}
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700">
                <Save size={18} /> Save Offer
              </button>
            </div>

            {activeTab === 'edit' ? (
              <div className="space-y-8">
                {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 flex items-center gap-2"><Settings size={18}/> Basic Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer Name</label>
                  <input type="text" value={selectedOffer.name} onChange={e => setSelectedOffer({...selectedOffer, name: e.target.value})} className="w-full border rounded-lg p-2" />
                  
                  {selectedOffer.id && (
                    <div className="mt-2 text-xs text-gray-500 flex flex-col gap-1">
                      <p>Offer ID: <span className="font-mono bg-gray-100 px-1 rounded">{selectedOffer.id}</span></p>
                      <p>Banner Link (Gold): <span className="font-mono bg-blue-50 text-blue-700 px-1 rounded">/membership?offerId={selectedOffer.id}&buy=gold</span></p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={selectedOffer.status} onChange={e => setSelectedOffer({...selectedOffer, status: e.target.value as any})} className="w-full border rounded-lg p-2">
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select value={selectedOffer.discountType} onChange={e => setSelectedOffer({...selectedOffer, discountType: e.target.value as any})} className="w-full border rounded-lg p-2">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                  <input type="number" value={selectedOffer.discountValue} onChange={e => setSelectedOffer({...selectedOffer, discountValue: Number(e.target.value)})} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="datetime-local" value={selectedOffer.startDatetime ? selectedOffer.startDatetime.slice(0,16) : ''} onChange={e => setSelectedOffer({...selectedOffer, startDatetime: e.target.value})} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="datetime-local" value={selectedOffer.endDatetime ? selectedOffer.endDatetime.slice(0,16) : ''} onChange={e => setSelectedOffer({...selectedOffer, endDatetime: e.target.value})} className="w-full border rounded-lg p-2" />
                </div>
              </div>
            </div>

            {/* Smart Rules Scope Builder */}
            <div className="space-y-4 bg-purple-50 p-5 rounded-xl border border-purple-200 mt-6">
              <h3 className="font-bold text-purple-900 flex items-center gap-2">🎯 Smart Rules Target Scope</h3>
              <p className="text-sm text-purple-700">Any product matching ALL these conditions will automatically get the discount.</p>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-900 mb-1">Target Categories (Leave empty for All)</label>
                  <div className="flex flex-wrap gap-2">
                    {['Eyeglasses', 'Sunglasses', 'Kids', 'Contact Lenses', 'Eyevengers Special'].map(cat => {
                      const isSelected = selectedOffer.targetCategories?.includes(cat);
                      return (
                        <button 
                          key={cat}
                          onClick={() => {
                            const current = selectedOffer.targetCategories || [];
                            setSelectedOffer({
                              ...selectedOffer,
                              targetCategories: isSelected ? current.filter(c => c !== cat) : [...current, cat]
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition ${isSelected ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-100'}`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-900 mb-1">Target Brands (Leave empty for All)</label>
                  {availableBrands.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableBrands.map(brand => {
                        const isSelected = selectedOffer.targetBrands?.includes(brand);
                        return (
                          <button 
                            key={brand}
                            onClick={() => {
                              const current = selectedOffer.targetBrands || [];
                              setSelectedOffer({
                                ...selectedOffer,
                                targetBrands: isSelected ? current.filter(b => b !== brand) : [...current, brand]
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition ${isSelected ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-100'}`}
                          >
                            {brand}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No brands found. Add products with brands first.</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-purple-900 mb-1">Minimum Price (₹)</label>
                    <input type="number" placeholder="No Min" value={selectedOffer.minPrice || ''} onChange={e => setSelectedOffer({...selectedOffer, minPrice: e.target.value ? Number(e.target.value) : null})} className="w-full border-purple-300 rounded-lg p-2" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-purple-900 mb-1">Maximum Price (₹)</label>
                    <input type="number" placeholder="No Max" value={selectedOffer.maxPrice || ''} onChange={e => setSelectedOffer({...selectedOffer, maxPrice: e.target.value ? Number(e.target.value) : null})} className="w-full border-purple-300 rounded-lg p-2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Enh 1: Coupons */}
            <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">🎫 Coupon Code Rules</h3>
              <div className="flex items-center gap-3 mb-4">
                <input type="checkbox" id="reqCoupon" checked={selectedOffer.requiresCoupon} onChange={e => setSelectedOffer({...selectedOffer, requiresCoupon: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="reqCoupon" className="font-medium">Require a coupon code to apply this discount</label>
              </div>
              {selectedOffer.requiresCoupon && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                  <input type="text" placeholder="e.g. RAKHI15" value={selectedOffer.couponCode} onChange={e => setSelectedOffer({...selectedOffer, couponCode: e.target.value.toUpperCase()})} className="w-full max-w-xs border border-blue-300 ring-2 ring-blue-50 uppercase rounded-lg p-2 font-mono" />
                </div>
              )}
            </div>

            {/* Enh 2: Usage Limits */}
            <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">🛡️ Usage Limits</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Redemption Cap</label>
                  <input type="number" placeholder="Unlimited" value={selectedOffer.totalRedemptionCap || ''} onChange={e => setSelectedOffer({...selectedOffer, totalRedemptionCap: e.target.value ? Number(e.target.value) : null})} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Per-Customer Limit</label>
                  <input type="number" placeholder="Unlimited" value={selectedOffer.perCustomerLimit || ''} onChange={e => setSelectedOffer({...selectedOffer, perCustomerLimit: e.target.value ? Number(e.target.value) : null})} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Cart Value (₹)</label>
                  <input type="number" placeholder="None" value={selectedOffer.minCartValue || ''} onChange={e => setSelectedOffer({...selectedOffer, minCartValue: e.target.value ? Number(e.target.value) : null})} className="w-full border rounded-lg p-2" />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="newCust" checked={selectedOffer.newCustomersOnly} onChange={e => setSelectedOffer({...selectedOffer, newCustomersOnly: e.target.checked})} className="w-4 h-4" />
                  <label htmlFor="newCust" className="font-medium">New Customers Only</label>
                </div>
              </div>
            </div>

            {/* Enh 3: Stacking Behavior */}
            <div className="space-y-4 bg-blue-50 p-5 rounded-xl border border-blue-200">
              <h3 className="font-bold text-blue-900 flex items-center gap-2">🥞 Stacking Behavior (Membership Interaction)</h3>
              <div>
                <select value={selectedOffer.stackingBehavior} onChange={e => setSelectedOffer({...selectedOffer, stackingBehavior: e.target.value as any})} className="w-full border-blue-300 rounded-lg p-2 font-medium">
                  <option value="best_price_wins">Best Price Wins (Customer gets whichever discount is larger)</option>
                  <option value="stack_with_membership">Stack with Membership (Combine both discounts)</option>
                  <option value="offer_overrides_membership">Offer Overrides Membership (Ignore membership tier)</option>
                  <option value="not_applicable_to_members">Not Applicable to Members (Gold members excluded)</option>
                </select>
                <p className="text-sm text-blue-700 mt-2 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  Determines how this offer interacts with the user's Gold Membership 10% discount.
                </p>
              </div>
            </div>

            {/* Enh 7: Usages Read-Only Panel */}
            {usages.length > 0 && (
              <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><LinkIcon size={18}/> Used In</h3>
                <p className="text-sm text-gray-500 mb-3">This offer is currently linked to the following sections on the Homepage:</p>
                <div className="space-y-2">
                  {usages.map((usage, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{usage.sectionType}</p>
                        <p className="text-xs text-gray-500">{usage.location}</p>
                      </div>
                      <Link href="/admin/homepage" className="text-brand-navy text-xs font-bold hover:underline">
                        Edit Section
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            </div>
            ) : (
              <div className="space-y-6">
                {analytics ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white border rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-500 font-bold mb-1">Impressions</p>
                        <h3 className="text-2xl font-bold text-gray-900">{analytics.funnel.impressions.toLocaleString()}</h3>
                      </div>
                      <div className="bg-white border rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-500 font-bold mb-1">Clicks (CTR)</p>
                        <h3 className="text-2xl font-bold text-gray-900">{analytics.funnel.clicks.toLocaleString()} <span className="text-sm text-green-600">({analytics.funnel.ctr})</span></h3>
                      </div>
                      <div className="bg-white border rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-500 font-bold mb-1">Conversion Rate</p>
                        <h3 className="text-2xl font-bold text-gray-900">{analytics.funnel.conversionRate}</h3>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <h3 className="font-bold text-green-900 flex items-center gap-2 mb-4"><DollarSign size={20}/> Financial Impact</h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-green-700 mb-1">Gross Revenue</p>
                          <p className="text-xl font-bold text-green-900">₹{analytics.financials.revenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-red-600 mb-1">Total Discount Given</p>
                          <p className="text-xl font-bold text-red-700">-₹{analytics.financials.discountGiven.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-green-800 mb-1">Net Revenue</p>
                          <p className="text-xl font-bold text-green-900">₹{analytics.financials.netRevenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><TrendingUp size={20}/> Top Products Sold (With Offer)</h3>
                      <div className="space-y-4">
                        {analytics.topProducts.map((p: any, i: number) => (
                          <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                            <div>
                              <p className="font-bold text-gray-900">{p.name}</p>
                              <p className="text-sm text-gray-500">{p.unitsSold} units sold</p>
                            </div>
                            <span className="font-bold text-gray-900">₹{p.revenue.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-12">Loading analytics...</p>
                )}
              </div>
            )}

          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select an offer or create a new one to begin editing.
          </div>
        )}
      </div>
    </div>
  );
}

export default function OffersAdmin() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading offers...</div>}>
      <OffersAdminContent />
    </Suspense>
  );
}
