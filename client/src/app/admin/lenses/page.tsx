"use client";
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import React, { useState, useEffect } from 'react';
import { Glasses, Save, Plus, Trash2, RefreshCw } from 'lucide-react';

export default function AdminLensesPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetchWithAuth(`https://eyevengers-web.onrender.com/api/admin/lenses/settings?t=${Date.now()}`);
      const data = await res.json();
      if (data.error) {
        setSettings({ categories: [], products: [] });
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error(error);
      setSettings({ categories: [], products: [] });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchWithAuth(`https://eyevengers-web.onrender.com/api/admin/lenses/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      alert('Lens pricing saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save settings');
    }
    setSaving(false);
  };

  const handleAddProduct = () => {
    setSettings({
      ...settings,
      products: [
        ...settings.products,
        { id: `L-${Date.now()}`, categoryId: 'single', name: 'New Lens', features: ['Feature 1'], basePrice: 0 }
      ]
    });
  };

  const handleDeleteProduct = (id: string) => {
    setSettings({
      ...settings,
      products: settings.products.filter((p: any) => p.id !== id)
    });
  };

  const updateProduct = (id: string, field: string, value: any) => {
    setSettings({
      ...settings,
      products: settings.products.map((p: any) => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  const updateCategoryLimit = (id: string, field: string, value: any) => {
    setSettings({
      ...settings,
      categories: settings.categories.map((c: any) => c.id === id ? { ...c, [field]: value } : c)
    });
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-brand-navy w-8 h-8" /></div>;

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center">
            <Glasses className="mr-2 text-brand-navy" /> Advanced Lens Pricing & Limits
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage power limits per category and configure specific lens products.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-brand-navy text-white px-6 py-2.5 rounded-lg font-bold flex items-center shadow-md hover:bg-blue-900 transition disabled:opacity-70">
          {saving ? <RefreshCw className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />} Save Changes
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Category Power Limits */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6 sticky top-6">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Power Limits per Category</h2>
            <div className="space-y-6">
              {settings?.categories?.filter((c:any) => c.hasPowerInput).map((category: any) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-bold text-brand-navy text-sm mb-3 uppercase tracking-wider">{category.name}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Normal Power Limit (±)</label>
                      <div className="relative">
                        <input 
                          type="number" step="0.25"
                          value={category.normalLimit} 
                          onChange={e => updateCategoryLimit(category.id, 'normalLimit', Number(e.target.value))} 
                          className="w-full border border-gray-300 rounded p-2 pl-8 text-sm focus:ring-2 focus:ring-brand-navy" 
                        />
                        <span className="absolute left-3 top-2 text-gray-400 font-bold">±</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">High Power Surcharge (₹)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={category.highPowerSurcharge} 
                          onChange={e => updateCategoryLimit(category.id, 'highPowerSurcharge', Number(e.target.value))} 
                          className="w-full border border-gray-300 rounded p-2 pl-8 text-sm focus:ring-2 focus:ring-brand-navy" 
                        />
                        <span className="absolute left-3 top-2 text-gray-400 font-bold">₹</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lens Products Manager */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-gray-800">Lens Products</h2>
              <button onClick={handleAddProduct} className="text-sm font-bold text-brand-navy flex items-center hover:underline">
                <Plus size={16} className="mr-1" /> Add Product
              </button>
            </div>

            <div className="space-y-4">
              {settings?.products?.map((product: any) => (
                <div key={product.id} className="border border-gray-200 rounded-xl p-5 flex gap-4 bg-white hover:border-gray-300 transition">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Product Name</label>
                        <input type="text" value={product.name} onChange={e => updateProduct(product.id, 'name', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-brand-navy outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                        <select 
                          value={product.categoryId} 
                          onChange={e => updateProduct(product.id, 'categoryId', e.target.value)} 
                          className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-brand-navy bg-gray-50 outline-none"
                        >
                          {settings?.categories?.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Features (comma separated)</label>
                        <input 
                          type="text" 
                          value={product.features.join(', ')} 
                          onChange={e => updateProduct(product.id, 'features', e.target.value.split(',').map(s=>s.trim()))} 
                          className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-brand-navy outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Base Price (₹)</label>
                        <input type="number" value={product.basePrice} onChange={e => updateProduct(product.id, 'basePrice', Number(e.target.value))} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-brand-navy outline-none" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center pl-4 border-l border-gray-100">
                    <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Product">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
}
