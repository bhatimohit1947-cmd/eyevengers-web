"use client";

import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, User, X, ShoppingBag, Heart, ShoppingCart } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerStats, setCustomerStats] = useState({ orders: 0, cartItems: 0, wishlistItems: 0 });

  const loadCustomerStats = (customerId: string) => {
    try {
      // Load orders
      const storedOrders = JSON.parse(localStorage.getItem('eyevengers_mock_orders') || '[]');
      const userOrders = storedOrders.filter((o: any) => o.userId === customerId);

      // Load cart
      const cartStorageStr = localStorage.getItem('eyevengers-multi-cart');
      let cartCount = 0;
      if (cartStorageStr) {
        const cartState = JSON.parse(cartStorageStr).state;
        const userCart = cartState?.cartsByUser?.[customerId];
        cartCount = userCart?.totalCount || 0;
      }

      // Load wishlist
      const wishlistStorageStr = localStorage.getItem('eyevengers-multi-wishlist');
      let wishlistCount = 0;
      if (wishlistStorageStr) {
        const wishlistState = JSON.parse(wishlistStorageStr).state;
        const userWishlist = wishlistState?.wishlistsByUser?.[customerId];
        wishlistCount = userWishlist?.length || 0;
      }

      setCustomerStats({
        orders: userOrders.length,
        cartItems: cartCount,
        wishlistItems: wishlistCount
      });
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  };

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    loadCustomerStats(customer.id);
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/customers');
        const mockCustomers = await res.json();
        
        const formatted = Array.isArray(mockCustomers) ? mockCustomers.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          joinedAt: c.createdAt || new Date().toISOString()
        })) : [];
        
        setCustomers(formatted);
      } catch (err) {
        console.error("Error loading mock customers:", err);
      }
    };
    
    fetchCustomers();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <p className="text-sm text-gray-500">View and manage customer profiles and activity.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search customers by name, phone or email..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-brand-navy text-sm"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-white text-gray-700 uppercase font-bold sticky top-0 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Joined At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((customer) => {
                const date = new Date(customer.joinedAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                });

                return (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                          <User size={16} />
                        </div>
                        <span className="font-medium text-gray-900">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{customer.phone}</td>
                    <td className="px-6 py-4">{customer.email || '-'}</td>
                    <td className="px-6 py-4">{date}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleViewCustomer(customer)}
                        className="p-1.5 text-gray-400 hover:text-brand-navy hover:bg-blue-50 rounded transition flex items-center gap-1 text-xs font-medium ml-auto"
                      >
                        <Eye size={16} /> View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-white">
          <div>Showing 1 to {customers.length} of {customers.length} customers</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>

      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in zoom-in-95 overflow-hidden">
            <div className="border-b border-gray-100 p-6 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-xl">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-sm text-gray-500">Customer ID: {selectedCustomer.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Contact Details</h4>
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Phone</span>
                  <span className="text-gray-900 font-bold">+91 {selectedCustomer.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Email</span>
                  <span className="text-gray-900 font-bold">{selectedCustomer.email || 'Not provided'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Joined</span>
                  <span className="text-gray-900 font-bold">
                    {new Date(selectedCustomer.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Activity Summary</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                  <ShoppingBag size={24} className="mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-black text-blue-900">{customerStats.orders}</p>
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mt-1">Orders</p>
                </div>
                <div className="bg-pink-50 rounded-xl p-4 text-center border border-pink-100">
                  <Heart size={24} className="mx-auto text-pink-600 mb-2" />
                  <p className="text-2xl font-black text-pink-900">{customerStats.wishlistItems}</p>
                  <p className="text-xs font-bold text-pink-700 uppercase tracking-wider mt-1">Wishlist</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                  <ShoppingCart size={24} className="mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-black text-purple-900">{customerStats.cartItems}</p>
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mt-1">In Cart</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end">
               <button onClick={() => setSelectedCustomer(null)} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-colors">
                 Close
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
