"use client";

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Package, LogIn, Stethoscope, Clock } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/admin/notifications`);
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`https://eyevengers-web.onrender.com/api/admin/notifications/${id}/read`, {
        method: 'PUT'
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const filteredNotifications = filter === 'All' 
    ? notifications 
    : notifications.filter(n => n.category === filter);

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'Order': return <Package className="text-blue-500" size={20} />;
      case 'Login': return <LogIn className="text-green-500" size={20} />;
      case 'Eye Test': return <Stethoscope className="text-purple-500" size={20} />;
      default: return <Bell className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <Bell size={24} className="text-brand-navy" />
            Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with the latest activities</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['All', 'Order', 'Eye Test', 'Login'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              filter === cat 
                ? 'bg-brand-navy text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Bell size={48} className="mb-4 opacity-50" />
            <p className="font-medium text-lg text-gray-500">No notifications found.</p>
            <p className="text-sm">Activities related to {filter} will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-5 flex gap-4 transition-colors ${notification.is_read ? 'bg-white' : 'bg-blue-50/50'}`}
              >
                <div className="mt-1 flex-shrink-0 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                  {getIconForCategory(notification.category)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-bold ${notification.is_read ? 'text-gray-800' : 'text-brand-navy'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap ml-4">
                      <Clock size={12} />
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {notification.category}
                    </span>
                    
                    {!notification.is_read && (
                      <button 
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <CheckCircle size={14} /> Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
