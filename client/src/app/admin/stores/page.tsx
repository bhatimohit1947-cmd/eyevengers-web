"use client";
import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Map as MapIcon, Phone, RefreshCw } from 'lucide-react';

export default function AdminStoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [newStore, setNewStore] = useState({
    name: '',
    address: '',
    phone: '',
    mapLink: ''
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/admin/stores?t=${Date.now()}`);
      const data = await res.json();
      setStores(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStore.name || !newStore.address) return alert('Name and address are required');
    
    setAdding(true);
    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/admin/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore)
      });
      const data = await res.json();
      setStores([...stores, data]);
      setNewStore({ name: '', address: '', phone: '', mapLink: '' });
    } catch (error) {
      console.error(error);
      alert('Failed to add store');
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this store?')) return;
    try {
      await fetch(`https://eyevengers-web.onrender.com/api/admin/stores/${id}`, { method: 'DELETE' });
      setStores(stores.filter(s => s.id !== id));
    } catch (error) {
      console.error(error);
      alert('Failed to delete store');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-brand-navy w-8 h-8" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center">
            <MapPin className="mr-2 text-brand-navy" /> Physical Stores
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your retail locations for the store locator and eye test booking.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Add New Store Form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-1 text-brand-navy" /> Add New Store
            </h2>
            <form onSubmit={handleAddStore} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Store Name</label>
                <input type="text" value={newStore.name} onChange={e=>setNewStore({...newStore, name: e.target.value})} className="w-full border border-gray-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-brand-navy focus:border-brand-navy outline-none transition" placeholder="e.g. Eyevengers CP, Delhi" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Address</label>
                <textarea value={newStore.address} onChange={e=>setNewStore({...newStore, address: e.target.value})} rows={3} className="w-full border border-gray-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-brand-navy focus:border-brand-navy outline-none transition" placeholder="Shop no, Building, Street, City, Pincode" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input type="tel" value={newStore.phone} onChange={e=>setNewStore({...newStore, phone: e.target.value})} className="w-full border border-gray-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-brand-navy focus:border-brand-navy outline-none transition" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Google Maps URL</label>
                <input type="url" value={newStore.mapLink} onChange={e=>setNewStore({...newStore, mapLink: e.target.value})} className="w-full border border-gray-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-brand-navy focus:border-brand-navy outline-none transition" placeholder="https://maps.google.com/..." />
              </div>
              <button type="submit" disabled={adding} className="w-full bg-brand-navy text-white font-bold py-3 rounded-lg flex items-center justify-center hover:bg-blue-900 transition shadow-md disabled:opacity-70 mt-2">
                {adding ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Add Store'}
              </button>
            </form>
          </div>
        </div>

        {/* Store List */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
                  <th className="p-4">Store Details</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Map Link</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {stores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">No stores added yet.</td>
                  </tr>
                ) : (
                  stores.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50/50 transition group">
                      <td className="p-4">
                        <div className="font-bold text-gray-900 mb-1">{store.name}</div>
                        <div className="text-gray-500 text-xs max-w-xs">{store.address}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center text-gray-600 text-xs">
                          <Phone className="w-3 h-3 mr-1" /> {store.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        {store.mapLink ? (
                          <a href={store.mapLink} target="_blank" rel="noreferrer" className="text-brand-navy hover:underline flex items-center text-xs font-bold">
                            <MapIcon className="w-3 h-3 mr-1" /> View Map
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">No link</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDelete(store.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}
