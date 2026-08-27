"use client";
import React, { useState, useEffect } from 'react';
import { ShoppingBag, ChevronRight, CheckCircle2, Clock, Glasses } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const router = useRouter();
  const { isLoggedIn, user, openLoginModal } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    
    if (!isLoggedIn) {
      router.push('/');
      setTimeout(() => openLoginModal(), 500);
      return;
    }

    const fetchOrders = async () => {
      try {
        let apiOrders: any[] = [];
        try {
          const res = await fetch('/api/orders');
          if (res.ok) apiOrders = await res.json();
        } catch (e) {}

        const storedOrders = JSON.parse(localStorage.getItem('eyevengers_mock_orders') || '[]');
        
        // Merge API and local orders
        const map = new Map();
        apiOrders.forEach((o: any) => map.set(o.id, o));
        storedOrders.forEach((o: any) => map.set(o.id, { ...map.get(o.id), ...o }));
        
        const mergedOrders = Array.from(map.values());

        const userOrders = mergedOrders.filter((o: any) => 
          o.userId === user?.id || 
          (user?.phone && o.details?.userPhone === user.phone)
        );
        
        // Sort by newest first
        userOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setOrders(userOrders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [hydrated, isLoggedIn, user, router, openLoginModal]);

  if (!hydrated || !isLoggedIn) return null;

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-3xl font-black text-brand-navy mb-2">No Orders Yet</h1>
        <p className="text-gray-500 mb-8 max-w-md">You haven't placed any orders yet. Start exploring our collections.</p>
        <Link href="/" className="bg-brand-navy text-white px-8 py-3 rounded-full font-bold">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-black text-brand-navy mb-8">My Orders</h1>
      
      <div className="space-y-6">
        {orders.map((order) => {
          const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          });

          return (
            <div key={order.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium mb-0.5">Order Placed</p>
                    <p className="font-bold text-gray-900">{date}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium mb-0.5">Total</p>
                    <p className="font-bold text-gray-900">₹{order.amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium mb-0.5">Order #</p>
                    <p className="font-bold text-gray-900">{order.id}</p>
                  </div>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                    ['Order Confirmed', 'Preparing'].includes(order.status) ? 'bg-blue-100 text-blue-700' :
                    ['Shipped', 'In Transit'].includes(order.status) ? 'bg-purple-100 text-purple-700' :
                    order.status === 'Out for Delivery' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status === 'Delivered' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
                <div className="w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                  <Glasses className="w-10 h-10 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{order.details?.frame || 'Eyeglasses'}</h3>
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <p><span className="font-medium">Lens Category:</span> {order.details?.lensCategory || 'Frame Only'}</p>
                    {order.details?.lensProduct && <p><span className="font-medium">Lens Product:</span> {order.details.lensProduct}</p>}
                    <p><span className="font-medium">Payment:</span> {order.paymentMethod.toUpperCase()} ({order.paymentStatus})</p>
                  </div>
                  
                  {order.details?.power && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
                      <strong>Eye Power Applied:</strong>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>RE: SPH {order.details.power.reSph}, CYL {order.details.power.reCyl}</div>
                        <div>LE: SPH {order.details.power.leSph}, CYL {order.details.power.leCyl}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
