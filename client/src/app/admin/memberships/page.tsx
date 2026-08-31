"use client";

import React, { useState, useEffect } from 'react';
import { Crown, Edit, Plus, Save, Trash2, IndianRupee } from 'lucide-react';

interface MembershipPlan {
  id: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  price: number;
  durationMonths: number;
  benefits: string[];
  benefitsJson?: {
    discountPercent?: number;
    freeShipping?: boolean;
    bogoOffer?: boolean;
  };
}

export default function MembershipsAdminPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/memberships/plans`);
      if (res.ok) {
        let data = await res.json();
        // Fallback parse just in case backend is outdated or hasn't deployed
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

  const handleSave = async () => {
    if (!editingPlan) return;
    
    try {
      const url = editingPlan.id 
        ? `https://eyevengers-web.onrender.com/api/memberships/plans/${editingPlan.id}`
        : `https://eyevengers-web.onrender.com/api/memberships/plans`;
        
      const method = editingPlan.id ? 'PUT' : 'POST';
      
      const payload = { ...editingPlan };
      if (!payload.id) delete (payload as any).id; // Remove temporary ID for new plan

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setEditingPlan(null);
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNew = () => {
    setEditingPlan({
      id: '',
      name: 'New Plan',
      tier: 'bronze',
      price: 999,
      durationMonths: 12,
      benefits: ['Benefit 1', 'Benefit 2'],
      benefitsJson: {
        discountPercent: 0,
        freeShipping: false
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
          <p className="text-gray-500">Manage customer membership tiers and benefits</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="flex items-center gap-2 bg-brand-navy text-white px-4 py-2 rounded hover:bg-brand-navy/90 transition"
        >
          <Plus size={18} /> New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading plans...</p>
        ) : (
          plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Crown size={20} className={
                    plan.tier === 'gold' ? 'text-yellow-500' :
                    plan.tier === 'silver' ? 'text-gray-400' :
                    'text-orange-600'
                  } />
                  <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                </div>
                <button 
                  onClick={() => setEditingPlan(plan)}
                  className="text-brand-navy hover:text-brand-gold p-1"
                >
                  <Edit size={16} />
                </button>
              </div>
              <div className="p-4">
                <div className="text-2xl font-black mb-1 flex items-center">
                  <IndianRupee size={20} className="mr-1"/> {plan.price}
                </div>
                <p className="text-sm text-gray-500 mb-4">{plan.durationMonths} Months Duration</p>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase">Benefits</p>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc pl-4">
                    {plan.benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-lg font-bold">{editingPlan.id ? 'Edit Plan' : 'New Plan'}</h2>
              <button onClick={() => setEditingPlan(null)} className="text-gray-500 hover:text-red-500">
                Cancel
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input 
                  type="text" 
                  value={editingPlan.name}
                  onChange={e => setEditingPlan({...editingPlan, name: e.target.value})}
                  className="w-full border border-gray-300 rounded p-2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier Level</label>
                  <select 
                    value={editingPlan.tier}
                    onChange={e => setEditingPlan({...editingPlan, tier: e.target.value as any})}
                    className="w-full border border-gray-300 rounded p-2"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input 
                    type="number" 
                    value={editingPlan.price}
                    onChange={e => setEditingPlan({...editingPlan, price: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                <input 
                  type="number" 
                  value={editingPlan.durationMonths}
                  onChange={e => setEditingPlan({...editingPlan, durationMonths: Number(e.target.value)})}
                  className="w-full border border-gray-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                  Benefits
                  <button 
                    onClick={() => setEditingPlan({...editingPlan, benefits: [...editingPlan.benefits, 'New Benefit']})}
                    className="text-xs text-brand-navy font-bold flex items-center"
                  >
                    <Plus size={12} className="mr-1"/> Add
                  </button>
                </label>
                <div className="space-y-2">
                  {editingPlan.benefits.map((b, i) => (
                    <div key={i} className="flex gap-2">
                      <input 
                        type="text" 
                        value={b}
                        onChange={e => {
                          const newB = [...editingPlan.benefits];
                          newB[i] = e.target.value;
                          setEditingPlan({...editingPlan, benefits: newB});
                        }}
                        className="flex-1 border border-gray-300 rounded p-2 text-sm"
                      />
                      <button 
                        onClick={() => {
                          const newB = editingPlan.benefits.filter((_, idx) => idx !== i);
                          setEditingPlan({...editingPlan, benefits: newB});
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="font-bold text-purple-900 mb-3 text-sm uppercase flex items-center gap-2">
                  <Crown size={14} /> Smart Rules (Benefits Engine)
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Discount Percentage (%)</label>
                    <input 
                      type="number" 
                      value={editingPlan.benefitsJson?.discountPercent || 0}
                      onChange={e => setEditingPlan({
                        ...editingPlan, 
                        benefitsJson: { ...editingPlan.benefitsJson, discountPercent: Number(e.target.value) }
                      })}
                      className="w-20 border border-gray-300 rounded p-1 text-center"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Free Shipping</label>
                    <input 
                      type="checkbox" 
                      checked={editingPlan.benefitsJson?.freeShipping || false}
                      onChange={e => setEditingPlan({
                        ...editingPlan, 
                        benefitsJson: { ...editingPlan.benefitsJson, freeShipping: e.target.checked }
                      })}
                      className="w-5 h-5 accent-brand-navy"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-brand-navy text-white rounded font-medium flex items-center gap-2 hover:bg-brand-navy/90"
              >
                <Save size={16} /> Save Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
