"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CheckCircle2, MapPin, Plus, Trash2, ArrowRight } from 'lucide-react';

interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoggedIn, user, openLoginModal } = useAuthStore();
  const { items: cartItems, totalPrice, clearCart } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '', city: '', state: '', pincode: ''
  });

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/cart');
      setTimeout(() => openLoginModal(), 500);
      return;
    }
    
    // Load addresses for user from localStorage
    const loadAddresses = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('eyevengers_mock_addresses') || '[]');
        const userAddresses = stored.filter((a: Address) => a.userId === user?.id);
        setAddresses(userAddresses);
        if (userAddresses.length > 0) {
          setSelectedAddressId(userAddresses[0].id);
        }
      } catch (e) {
        console.error("Failed to parse addresses");
      }
    };

    loadAddresses();
  }, [isLoggedIn, user, router, openLoginModal]);

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const addressToSave: Address = {
      id: `ADDR-${Date.now()}`,
      userId: user.id,
      ...newAddress
    };

    const stored = JSON.parse(localStorage.getItem('eyevengers_mock_addresses') || '[]');
    stored.push(addressToSave);
    localStorage.setItem('eyevengers_mock_addresses', JSON.stringify(stored));
    
    setAddresses([...addresses, addressToSave]);
    setSelectedAddressId(addressToSave.id);
    setIsAddingAddress(false);
    setNewAddress({ street: '', city: '', state: '', pincode: '' });
  };

  const handleDeleteAddress = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const stored = JSON.parse(localStorage.getItem('eyevengers_mock_addresses') || '[]');
    const updated = stored.filter((a: Address) => a.id !== id);
    localStorage.setItem('eyevengers_mock_addresses', JSON.stringify(updated));
    
    const newAddresses = addresses.filter(a => a.id !== id);
    setAddresses(newAddresses);
    if (selectedAddressId === id) {
      setSelectedAddressId(newAddresses.length > 0 ? newAddresses[0].id : '');
    }
  };

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address");
      return;
    }
    
    setIsPlacingOrder(true);
    
    // Simulate order placement
    setTimeout(() => {
      setIsPlacingOrder(false);
      setOrderSuccess(true);
      clearCart();
    }, 1500);
  };

  if (!isLoggedIn) return null;

  if (orderSuccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <CheckCircle2 size={80} className="text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">Thank you for shopping with EYEVENGERS. Your eyewear is getting ready.</p>
        <button 
          onClick={() => router.push('/')}
          className="bg-brand-navy text-white px-8 py-3 rounded-full font-bold hover:bg-[#002b4d] transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Delivery Address */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <MapPin size={20} className="text-brand-navy" />
                  Delivery Address
                </h2>
                {!isAddingAddress && (
                  <button 
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                        <input required type="text" maxLength={6} value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value.replace(/\D/g, '')})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-brand-navy outline-none" />
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
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-start justify-between ${selectedAddressId === addr.id ? 'border-brand-navy bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-brand-navy' : 'border-gray-300'}`}>
                                {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 bg-brand-navy rounded-full" />}
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 mb-1">{user?.name}</p>
                              <p className="text-gray-600 text-sm leading-relaxed">
                                {addr.street}<br />
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                              <p className="text-sm font-medium mt-2 text-gray-900">Mobile: {user?.phone || 'Not provided'}</p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => handleDeleteAddress(addr.id, e)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden relative">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{item.title}</p>
                        <p className="text-gray-500 text-xs">Qty: {item.qty}</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">₹{item.price * item.qty}</p>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-100 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total Payable</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>
              
              <button 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || cartItems.length === 0}
                className="w-full bg-brand-navy text-white font-bold text-base rounded-xl py-4 hover:bg-[#002b4d] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? 'Processing...' : 'Place Order'}
                {!isPlacingOrder && <ArrowRight size={20} />}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
