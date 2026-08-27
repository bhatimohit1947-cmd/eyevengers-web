import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { useAddressStore, Address } from '@/store/useAddressStore';
import { useAuthStore } from '@/store/useAuthStore';

interface AddressManagerProps {
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
}

export default function AddressManager({ selectedAddressId, setSelectedAddressId }: AddressManagerProps) {
  const { user } = useAuthStore();
  const { getUserAddresses, addAddress, removeAddress, setDefaultAddress, getDefaultAddress } = useAddressStore();
  
  const addresses = getUserAddresses();
  
  // Set default address initially if none is selected
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const defaultAddr = getDefaultAddress();
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else setSelectedAddressId(addresses[0].id);
    }
  }, [selectedAddressId, addresses, getDefaultAddress, setSelectedAddressId]);
  
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '', city: '', state: '', pincode: '', label: 'Home' as 'Home' | 'Work' | 'Other'
  });

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    addAddress(newAddress);
    
    setIsAddingAddress(false);
    setNewAddress({ street: '', city: '', state: '', pincode: '', label: 'Home' });
  };

  const handleDeleteAddress = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeAddress(id);
    
    // If the selected address was deleted, reset selection
    if (selectedAddressId === id) {
      const remaining = getUserAddresses().filter(a => a.id !== id);
      setSelectedAddressId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
          <MapPin size={20} className="text-brand-navy" />
          Delivery Address
        </h2>
        {!isAddingAddress && (
          <button 
            type="button"
            onClick={() => setIsAddingAddress(true)}
            className="text-brand-navy font-bold text-sm flex items-center gap-1 hover:underline"
          >
            <Plus size={16} /> Add New Address
          </button>
        )}
      </div>
      
      <div className="p-6">
        {isAddingAddress ? (
          <form onSubmit={handleSaveAddress} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Enter New Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address / Flat No.</label>
                <input required type="text" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-brand-navy outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input required type="text" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-brand-navy outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input required type="text" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-brand-navy outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input required type="text" maxLength={6} value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value.replace(/\D/g, '')})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-brand-navy outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Label</label>
                  <select value={newAddress.label} onChange={e => setNewAddress({...newAddress, label: e.target.value as 'Home' | 'Work' | 'Other'})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-brand-navy outline-none bg-white">
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="submit" className="bg-brand-navy text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#002b4d]">Save Address</button>
              <button type="button" onClick={() => setIsAddingAddress(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No saved addresses found.</p>
                <button 
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="bg-brand-navy text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#002b4d] inline-flex items-center gap-2"
                >
                  <Plus size={18} /> Add Your First Address
                </button>
              </div>
            ) : (
              addresses.map(addr => (
                <div 
                  key={addr.id} 
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-start justify-between relative overflow-hidden ${selectedAddressId === addr.id ? 'border-brand-navy bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {addr.isDefault && (
                    <div className="absolute top-0 right-0 bg-brand-navy text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                      Default
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-brand-navy' : 'border-gray-300'}`}>
                        {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 bg-brand-navy rounded-full" />}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                        {user?.name}
                        {addr.label && (
                          <span className="bg-gray-200 text-gray-700 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                            {addr.label}
                          </span>
                        )}
                      </p>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {addr.street}<br />
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-sm font-medium mt-2 text-gray-900">Mobile: {user?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 z-10">
                    <button 
                      type="button"
                      onClick={(e) => handleDeleteAddress(addr.id, e)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Address"
                    >
                      <Trash2 size={18} />
                    </button>
                    
                    {!addr.isDefault && (
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDefaultAddress(addr.id); }}
                        className="text-[10px] uppercase font-bold text-brand-navy hover:underline text-center"
                      >
                        Set Default
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
