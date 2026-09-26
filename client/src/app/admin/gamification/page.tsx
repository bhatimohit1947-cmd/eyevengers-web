"use client";

import React, { useState, useEffect } from 'react';
import { 
  GamificationConfig, 
  GameReward, 
  DEFAULT_GAMIFICATION_CONFIG, 
  GameType, 
  TargetAudience 
} from '@/types/gamification';
import { 
  Sparkles, 
  Gift, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  CheckCircle, 
  RotateCcw,
  Sliders,
  Users,
  Target,
  Percent,
  Clock
} from 'lucide-react';

export default function AdminGamificationPage() {
  const [config, setConfig] = useState<GamificationConfig>(DEFAULT_GAMIFICATION_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reward Edit Modal State
  const [editingReward, setEditingReward] = useState<GameReward | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Fetch Config
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('eyevengers_admin_token') || 'local_admin_dev_token';
      const res = await fetch('/api/gamification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'admin-get' })
      });
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (e: any) {
      setErrorMessage('Failed to load configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Save Config
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMessage('');
      const token = localStorage.getItem('eyevengers_admin_token') || 'local_admin_dev_token';
      const res = await fetch('/api/gamification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'admin-save',
          config
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage(data.error || 'Failed to save configuration');
      }
    } catch (e: any) {
      setErrorMessage('Network error while saving');
    } finally {
      setIsSaving(false);
    }
  };

  // Weight Calculation
  const totalWeight = config.rewards.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

  // Handle Reward Save
  const handleSaveReward = (reward: GameReward) => {
    let updatedRewards = [...config.rewards];
    if (isAddingNew) {
      updatedRewards.push({ ...reward, id: `rew-${Date.now()}` });
    } else {
      updatedRewards = updatedRewards.map(r => r.id === reward.id ? reward : r);
    }
    setConfig({ ...config, rewards: updatedRewards });
    setEditingReward(null);
    setIsAddingNew(false);
  };

  // Delete Reward
  const handleDeleteReward = (id: string) => {
    if (config.rewards.length <= 2) {
      alert("At least 2 rewards are required for the game to function properly.");
      return;
    }
    const updated = config.rewards.filter(r => r.id !== id);
    let updatedForced = config.forcedWinnerId;
    if (updatedForced === id) updatedForced = '';
    setConfig({ ...config, rewards: updated, forcedWinnerId: updatedForced });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold">Loading Lucky Games Configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Sparkles size={24} />
            </span>
            <h1 className="text-2xl font-black text-gray-900">
              Lucky Games & Rewards Control
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage Spinning Wheel, Mystery Boxes, Gender Targeting & Probabilities
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadConfig}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <span>All game settings and reward slices updated successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Master Toggle Banner */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Master Game Status on Website
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {config.isEnabled
              ? "Game widget is active and visible on the website."
              : "Game widget and rewards are completely hidden from visitors."}
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.isEnabled}
            onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
          <span className="ml-3 text-sm font-bold text-gray-900">
            {config.isEnabled ? "ACTIVE (ON)" : "PAUSED (OFF)"}
          </span>
        </label>
      </div>

      {/* Game Mode & Audience Targeting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Game Mode Selector */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Sliders size={20} className="text-amber-500" />
            <h3>Active Game Mode</h3>
          </div>
          <p className="text-xs text-gray-500">
            Choose which interactive game should be displayed to users.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'wheel', label: 'Spinning Wheel', icon: '🎡' },
              { id: 'mystery_box', label: 'Mystery Boxes', icon: '🎁' },
              { id: 'both', label: 'Both (User Chooses)', icon: '✨' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setConfig({ ...config, activeGame: m.id as GameType })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  config.activeGame === m.id
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-black ring-2 ring-amber-500/20 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 font-medium'
                }`}
              >
                <div className="text-2xl mb-1">{m.icon}</div>
                <div className="text-xs">{m.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Target Audience Filter */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Users size={20} className="text-blue-500" />
            <h3>Target Audience Filter</h3>
          </div>
          <p className="text-xs text-gray-500">
            Restrict this game to specific gender categories as required.
          </p>

          <select
            value={config.targetAudience}
            onChange={(e) => setConfig({ ...config, targetAudience: e.target.value as TargetAudience })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">🌍 All Customers (Male, Female, Other)</option>
            <option value="female">👩 Only Female Customers</option>
            <option value="female_other">👩 + 🌈 Female & Other Category Customers</option>
            <option value="male">👨 Only Male Customers</option>
            <option value="other">🌈 Only Other Category Customers</option>
          </select>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-xs flex items-start gap-2">
            <span className="font-bold">Notice:</span>
            <span>
              If a customer does not belong to the selected audience, they will be politely shown your custom ineligibility notice below.
            </span>
          </div>
        </div>

      </div>

      {/* Ineligibility Message & Cooldown Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Custom Ineligibility Message */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
          <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Target size={18} className="text-rose-500" />
            Custom Message for Ineligible Users
          </label>
          <p className="text-xs text-gray-500">
            This message is displayed if a customer from an excluded gender category tries to spin.
          </p>
          <textarea
            rows={3}
            value={config.ineligibilityMessage}
            onChange={(e) => setConfig({ ...config, ineligibilityMessage: e.target.value })}
            className="w-full p-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800"
            placeholder="Enter friendly explanation message..."
          />
        </div>

        {/* Cooldown Hours & Titles */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Clock size={18} className="text-amber-500" />
            <h3>Cooldown Period</h3>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Hours Between Free Spins
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={168}
                value={config.cooldownHours}
                onChange={(e) => setConfig({ ...config, cooldownHours: parseInt(e.target.value) || 24 })}
                className="w-24 px-3 py-2 border rounded-xl font-bold text-center"
              />
              <span className="text-sm text-gray-500 font-medium">hours (Default: 24h)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Banner Title
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              className="w-full px-3 py-2 text-xs border rounded-xl"
            />
          </div>
        </div>

      </div>

      {/* Algorithm & Forced Winner Override */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
              <Target size={20} className="text-amber-600" />
              Winner Control & Forced Override
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              Control whether the outcome follows probability weights or forces a specific prize.
            </p>
          </div>

          {/* Forced Winner Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900">Prize Override:</span>
            <select
              value={config.forcedWinnerId}
              onChange={(e) => setConfig({ ...config, forcedWinnerId: e.target.value })}
              className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-xs font-black text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            >
              <option value="">🎲 Random (Use Probability Weights %)</option>
              {config.rewards.map(r => (
                <option key={r.id} value={r.id}>
                  ⭐ FORCE: {r.label} ({r.couponCode || 'No Code'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {config.forcedWinnerId ? (
          <div className="p-3 rounded-xl bg-amber-200/60 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-800 shrink-0" />
            <span>
              OVERRIDE ACTIVE: 100% of participating users will win "{config.rewards.find(r => r.id === config.forcedWinnerId)?.label}" until you switch back to Random!
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-white/70 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span className="font-semibold">
              Algorithm: Each slice wins according to its assigned probability weight % below.
            </span>
            <span className={`font-black ${totalWeight === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
              Total Weight: {totalWeight}% {totalWeight === 100 ? '✓' : '(Recommended: 100%)'}
            </span>
          </div>
        )}
      </div>

      {/* Rewards Slices Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Gift size={20} className="text-amber-500" />
              Game Reward Slices ({config.rewards.length})
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              These are the prizes printed on the wheel slices and hidden inside mystery boxes.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingReward({
                id: '',
                label: '₹100 OFF',
                type: 'FLAT_DISCOUNT',
                value: 100,
                minOrder: 500,
                couponCode: 'OFF100',
                weight: 10,
                color: '#004777',
                textColor: '#ffffff',
                description: 'Flat ₹100 discount on orders'
              });
              setIsAddingNew(true);
            }}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus size={16} />
            Add New Prize
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Slice</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Min Order</th>
                <th className="py-3 px-4 text-center">Probability %</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {config.rewards.map((reward) => (
                <tr key={reward.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full border border-gray-300 shadow-sm shrink-0"
                        style={{ backgroundColor: reward.color }}
                      />
                      <div>
                        <div className="font-black text-gray-900 text-sm">{reward.label}</div>
                        <div className="text-[11px] text-gray-400">{reward.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-semibold text-[11px]">
                      {reward.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                    {reward.couponCode || '—'}
                  </td>
                  <td className="py-3.5 px-4 font-semibold">
                    {reward.minOrder > 0 ? `₹${reward.minOrder}` : 'No Minimum'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 font-black">
                      {reward.weight}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingReward({ ...reward });
                          setIsAddingNew(false);
                        }}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Prize"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteReward(reward.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Prize"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Edit / Add Reward Modal */}
      {editingReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-gray-900">
              {isAddingNew ? "Add New Game Prize" : "Edit Prize Slice"}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Prize Display Label</label>
                <input
                  type="text"
                  value={editingReward.label}
                  onChange={(e) => setEditingReward({ ...editingReward, label: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                  placeholder="e.g. ₹200 OFF"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Reward Type</label>
                  <select
                    value={editingReward.type}
                    onChange={(e) => setEditingReward({ ...editingReward, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="FLAT_DISCOUNT">Flat Discount (₹)</option>
                    <option value="PERCENT_DISCOUNT">Percentage (%)</option>
                    <option value="FREE_LENS">Free Lens</option>
                    <option value="FREE_FRAME">Free Frame</option>
                    <option value="TRY_AGAIN">Try Tomorrow</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={editingReward.value}
                    onChange={(e) => setEditingReward({ ...editingReward, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={editingReward.couponCode}
                    onChange={(e) => setEditingReward({ ...editingReward, couponCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold uppercase"
                    placeholder="e.g. LUCKY200"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={editingReward.minOrder}
                    onChange={(e) => setEditingReward({ ...editingReward, minOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Win Weight %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingReward.weight}
                    onChange={(e) => setEditingReward({ ...editingReward, weight: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Slice Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingReward.color}
                      onChange={(e) => setEditingReward({ ...editingReward, color: e.target.value })}
                      className="w-10 h-9 p-0 border rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingReward.color}
                      onChange={(e) => setEditingReward({ ...editingReward, color: e.target.value })}
                      className="flex-1 px-2 py-2 border rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={editingReward.description || ''}
                  onChange={(e) => setEditingReward({ ...editingReward, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="e.g. Flat ₹200 OFF on orders above ₹999"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setEditingReward(null)}
                className="px-4 py-2 rounded-xl text-gray-600 font-bold hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveReward(editingReward)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
