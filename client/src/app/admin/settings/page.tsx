"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    storeName: '',
    supportEmail: '',
    taxRate: 0,
    currency: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`https://eyevengers-web.onrender.com/api/admin/settings`)
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error("Error fetching settings:", err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert("Settings saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Store Settings</h2>
          <p className="text-sm text-gray-500">Configure global preferences for your store.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-4 mb-2">
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Settings size={18} className="text-gray-400" />
              General Configuration
            </h3>
            <p className="text-sm text-gray-500">Update your store's basic information</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
              <input 
                type="text" 
                required
                value={settings.storeName || ''} 
                onChange={(e) => setSettings({...settings, storeName: e.target.value})} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy outline-none transition" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input 
                type="email" 
                required
                value={settings.supportEmail || ''} 
                onChange={(e) => setSettings({...settings, supportEmail: e.target.value})} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy outline-none transition" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
              <input 
                type="number" 
                required
                value={settings.taxRate || 0} 
                onChange={(e) => setSettings({...settings, taxRate: Number(e.target.value)})} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy outline-none transition" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select 
                value={settings.currency || 'INR'} 
                onChange={(e) => setSettings({...settings, currency: e.target.value})} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy outline-none transition bg-white"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2.5 bg-brand-navy text-white rounded-lg hover:bg-blue-900 font-medium shadow-sm flex items-center gap-2 transition disabled:opacity-70"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
