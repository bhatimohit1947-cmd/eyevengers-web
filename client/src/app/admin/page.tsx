"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingCart, IndianRupee, Crown } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/memberships/customers`)
      .then(res => res.json())
      .then(data => setMembers(data))
      .catch(err => console.error(err));
  }, []);
  const stats = [
    { label: 'Total Revenue', value: '₹2,45,000', icon: IndianRupee, color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Orders', value: '142', icon: ShoppingCart, color: 'bg-green-100 text-green-600' },
    { label: 'Active Customers', value: '890', icon: Users, color: 'bg-purple-100 text-purple-600' },
    { label: 'Conversion Rate', value: '3.2%', icon: TrendingUp, color: 'bg-orange-100 text-orange-600' },
  ];

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
              {[1, 2, 3, 4].map((item) => (
                <tr key={item} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-4 font-medium text-gray-900">#ORD-2026-{8430 + item}</td>
                  <td className="px-4 py-4">Rahul Sharma</td>
                  <td className="px-4 py-4">Aug 14, 2026</td>
                  <td className="px-4 py-4">₹1,500</td>
                  <td className="px-4 py-4">
                    <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      Processing
                    </span>
                  </td>
                </tr>
              ))}
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
                    {member.planId.replace('_', ' ').toUpperCase()}
                  </td>
                  <td className="px-4 py-4">
                    {format(new Date(member.startDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-4 py-4">
                    <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {member.status}
                    </span>
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
