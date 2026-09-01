"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingCart, IndianRupee, Crown } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [members, setMembers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Membership Customers
    fetch(`https://eyevengers-web.onrender.com/api/memberships/customers`)
      .then(res => res.json())
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    // Fetch Orders
    fetch(`https://eyevengers-web.onrender.com/api/orders`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Sort newest first
          data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(data);
        }
      })
      .catch(err => console.error(err));

    // Fetch Customers
    fetch(`https://eyevengers-web.onrender.com/api/admin/customers`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCustomers(data);
      })
      .catch(err => console.error(err));
  }, []);

  // Compute Stats
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const formattedRevenue = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalRevenue);
  
  const stats = [
    { label: 'Total Revenue', value: formattedRevenue, icon: IndianRupee, color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Orders', value: orders.length.toString(), icon: ShoppingCart, color: 'bg-green-100 text-green-600' },
    { label: 'Active Customers', value: customers.length.toString(), icon: Users, color: 'bg-purple-100 text-purple-600' },
    { label: 'Conversion Rate', value: '3.2%', icon: TrendingUp, color: 'bg-orange-100 text-orange-600' },
  ];

  const updateMembershipStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/memberships/customers/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setMembers(members.map(m => m.id === id ? { ...m, status: newStatus } : m));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id || order._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-4 font-medium text-gray-900 truncate max-w-[150px]">#{order.id || order._id}</td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-gray-900">{order.details?.customerName || order.address?.name || 'Guest User'}</div>
                  </td>
                  <td className="px-4 py-4">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-4 font-medium">₹{order.amount || 0}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
                      order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status || 'Processing'}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Membership Customers */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Crown size={20} className="text-yellow-600" /> Membership Customers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Customer</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3 rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <p className="font-bold text-gray-900">{member.name}</p>
                    <p className="text-xs">{member.email}</p>
                  </td>
                  <td className="px-4 py-4 uppercase font-bold text-xs tracking-wider">
                    {member.tier}
                  </td>
                  <td className="px-4 py-4 text-gray-900 font-medium">
                    {member.planName || member.planId.replace('_', ' ').toUpperCase()}
                  </td>
                  <td className="px-4 py-4">
                    {format(new Date(member.startDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={member.status}
                      onChange={(e) => updateMembershipStatus(member.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold outline-none cursor-pointer border-none appearance-none pr-4 ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' :
                        member.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="expired">Expired</option>
                    </select>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6">No membership customers found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
