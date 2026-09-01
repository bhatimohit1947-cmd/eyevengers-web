"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingCart, IndianRupee, Crown } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [members, setMembers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [plansMap, setPlansMap] = useState<Record<string, number>>({});
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

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

    // Fetch Plans for pricing
    fetch(`https://eyevengers-web.onrender.com/api/memberships/plans`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map: Record<string, number> = {};
          data.forEach(p => map[p.id] = p.price);
          setPlansMap(map);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // Filter Data
  const filterByTime = (dateString: string) => {
    if (timeFilter === 'all') return true;
    const date = new Date(dateString);
    const now = new Date();
    
    if (timeFilter === 'today') {
      return date.toDateString() === now.toDateString();
    } else if (timeFilter === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= oneWeekAgo;
    } else if (timeFilter === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const filteredOrders = orders.filter(o => filterByTime(o.createdAt));
  const filteredMembers = members.filter(m => filterByTime(m.startDate || m.createdAt));

  // Compute Revenue Splits
  const productRevenue = filteredOrders.reduce((sum, order) => sum + (order.amount || order.totalAmount || 0), 0);
  const membershipRevenue = filteredMembers.reduce((sum, member) => sum + (plansMap[member.planId] || 0), 0);
  const totalRevenue = productRevenue + membershipRevenue;

  // Compute Order Status Breakdown
  const actualRevenue = filteredOrders.filter(o => ['Delivered', 'Completed'].includes(o.status)).reduce((sum, order) => sum + (order.amount || 0), 0);
  const pendingRevenue = filteredOrders.filter(o => ['Order Placed', 'Pending', 'Processing', 'Shipped', 'In Transit'].includes(o.status)).reduce((sum, order) => sum + (order.amount || 0), 0);
  const lostRevenue = filteredOrders.filter(o => ['Cancelled', 'Returned', 'Refunded'].includes(o.status)).reduce((sum, order) => sum + (order.amount || 0), 0);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  
  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: IndianRupee, color: 'bg-blue-100 text-blue-600' },
    { label: 'Product Sales', value: formatCurrency(productRevenue), icon: ShoppingCart, color: 'bg-green-100 text-green-600' },
    { label: 'Membership Sales', value: formatCurrency(membershipRevenue), icon: Crown, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Active Customers', value: customers.length.toString(), icon: Users, color: 'bg-purple-100 text-purple-600' },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as any)}
          className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent shadow-sm"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">This Month</option>
        </select>
      </div>
      
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

      {/* Order Status Revenue Breakdown */}
      <h3 className="text-lg font-bold text-gray-900 mt-8 mb-2">Product Revenue Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Actual Revenue (Completed)</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(actualRevenue)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Pending Revenue (In Transit)</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(pendingRevenue)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Lost Revenue (Cancelled)</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(lostRevenue)}</p>
        </div>
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
              {filteredOrders.slice(0, 5).map((order) => (
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
              {filteredOrders.length === 0 && (
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
              {filteredMembers.map((member) => (
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
              {filteredMembers.length === 0 && (
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
