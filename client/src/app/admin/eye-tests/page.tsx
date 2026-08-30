"use client";
import React, { useState, useEffect } from 'react';
import { Settings, Calendar, Save, RefreshCw, X, Check, Edit2 } from 'lucide-react';

export default function AdminEyeTestsPage() {
  const [activeTab, setActiveTab] = useState<'settings'|'bookings'>('settings');
  const [settings, setSettings] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSettings, resBookings] = await Promise.all([
        fetch(`https://eyevengers-web.onrender.com/api/admin/eye-test/settings`).then(r => r.json()),
        fetch(`https://eyevengers-web.onrender.com/api/admin/eye-test/bookings`).then(r => r.json())
      ]);
      if (resSettings.error) {
        setSettings({ 
          store: { isAvailable: false, title: '', price: 0, description: '', features: [], imageUrl: '' }, 
          home: { isAvailable: false, title: '', price: 0, description: '', features: [], imageUrl: '' } 
        });
      } else {
        setSettings({
          store: resSettings.store || { isAvailable: false, title: '', price: 0, description: '', features: [], imageUrl: '' },
          home: resSettings.home || { isAvailable: false, title: '', price: 0, description: '', features: [], imageUrl: '' }
        });
      }
      setBookings(Array.isArray(resBookings) ? resBookings : []);
    } catch (error) {
      console.error(error);
      setSettings({ 
        store: { isAvailable: false, title: '', price: 0, description: '', features: [], imageUrl: '' }, 
        home: { isAvailable: false, title: '', price: 0, description: '', features: [], imageUrl: '' } 
      });
      setBookings([]);
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await fetch(`https://eyevengers-web.onrender.com/api/admin/eye-test/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save settings');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-brand-navy w-8 h-8" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Eye Tests & Bookings</h1>
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-bold rounded-md flex items-center transition ${activeTab === 'settings' ? 'bg-white shadow-sm text-brand-navy' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Settings size={16} className="mr-2" /> Settings
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 text-sm font-bold rounded-md flex items-center transition ${activeTab === 'bookings' ? 'bg-white shadow-sm text-brand-navy' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Calendar size={16} className="mr-2" /> Bookings
          </button>
        </div>
      </div>

      {activeTab === 'settings' && settings && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-blue-800 text-sm font-medium">
            Configure the pricing, availability, and description of the Eye Test services shown on the customer website.
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Store Settings */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Store Eye Test</h2>
                <label className="flex items-center cursor-pointer relative">
                  <input type="checkbox" className="sr-only" checked={settings.store.isAvailable} onChange={e => setSettings({...settings, store: {...settings.store, isAvailable: e.target.checked}})} />
                  <div className={`w-11 h-6 rounded-full transition-colors ${settings.store.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform mt-1 ml-1 ${settings.store.isAvailable ? 'translate-x-5' : ''}`}></div>
                  </div>
                </label>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
                  <input type="text" value={settings.store.title} onChange={e => setSettings({...settings, store: {...settings.store, title: e.target.value}})} className="w-full border border-gray-300 rounded p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Image/Video URL</label>
                  <input type="text" value={settings.store.imageUrl || ''} onChange={e => setSettings({...settings, store: {...settings.store, imageUrl: e.target.value}})} className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" value={settings.store.price} onChange={e => setSettings({...settings, store: {...settings.store, price: Number(e.target.value)}})} className="w-full border border-gray-300 rounded p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                  <textarea value={settings.store.description} onChange={e => setSettings({...settings, store: {...settings.store, description: e.target.value}})} rows={3} className="w-full border border-gray-300 rounded p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Features (Comma separated)</label>
                  <textarea value={settings.store.features.join(', ')} onChange={e => setSettings({...settings, store: {...settings.store, features: e.target.value.split(',').map(f => f.trim())}})} rows={2} className="w-full border border-gray-300 rounded p-2 text-sm" />
                </div>
              </div>
            </div>

            {/* Home Settings */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Home Eye Test</h2>
                <label className="flex items-center cursor-pointer relative">
                  <input type="checkbox" className="sr-only" checked={settings.home.isAvailable} onChange={e => setSettings({...settings, home: {...settings.home, isAvailable: e.target.checked}})} />
                  <div className={`w-11 h-6 rounded-full transition-colors ${settings.home.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform mt-1 ml-1 ${settings.home.isAvailable ? 'translate-x-5' : ''}`}></div>
                  </div>
                </label>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
                  <input type="text" value={settings.home.title} onChange={e => setSettings({...settings, home: {...settings.home, title: e.target.value}})} className="w-full border border-gray-300 rounded p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Image/Video URL</label>
                  <input type="text" value={settings.home.imageUrl || ''} onChange={e => setSettings({...settings, home: {...settings.home, imageUrl: e.target.value}})} className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" value={settings.home.price} onChange={e => setSettings({...settings, home: {...settings.home, price: Number(e.target.value)}})} className="w-full border border-gray-300 rounded p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                  <textarea value={settings.home.description} onChange={e => setSettings({...settings, home: {...settings.home, description: e.target.value}})} rows={3} className="w-full border border-gray-300 rounded p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Features (Comma separated)</label>
                  <textarea value={settings.home.features.join(', ')} onChange={e => setSettings({...settings, home: {...settings.home, features: e.target.value.split(',').map(f => f.trim())}})} rows={2} className="w-full border border-gray-300 rounded p-2 text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={handleSaveSettings} disabled={saving} className="bg-brand-navy text-white px-6 py-3 rounded-lg font-bold flex items-center shadow-lg hover:bg-blue-900 transition disabled:opacity-70">
              {saving ? <RefreshCw className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Location/Address</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">No bookings found.</td>
                  </tr>
                ) : (
                  bookings.map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-mono text-gray-500 font-medium">{booking.id}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${booking.type === 'home' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                          {booking.type === 'home' ? 'Home Visit' : 'Store Visit'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{booking.name}</div>
                        <div className="text-gray-500 text-xs">{booking.phone}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-700">{booking.date}</div>
                        <div className="text-gray-500 text-xs">{booking.time}</div>
                      </td>
                      <td className="p-4 text-gray-600 max-w-[200px] truncate" title={booking.location}>
                        {booking.location}
                      </td>
                      <td className="p-4">
                        <select
                          className={`text-xs font-bold border rounded px-2 py-1 ${
                            booking.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                            booking.status === 'Confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            booking.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}
                          value={booking.status}
                          onChange={async (e) => {
                            try {
                              const res = await fetch(`https://eyevengers-web.onrender.com/api/admin/eye-test/bookings/${booking.id}/status`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: e.target.value })
                              });
                              if (res.ok) {
                                fetchData();
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
