"use client";

import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, X } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = () => {
    fetch(`https://eyevengers-web.onrender.com/api/orders`)
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error("Error fetching orders:", err));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchOrders();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500">View and manage customer orders and shipments.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search orders by ID or customer name..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-brand-navy text-sm"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <Filter size={16} /> Filter
            </button>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white">
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Processing</option>
              <option>Shipped</option>
              <option>Delivered</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-white text-gray-700 uppercase font-bold sticky top-0 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                let statusColor = 'bg-gray-100 text-gray-700';
                
                switch (order.status) {
                  case 'Pending': 
                  case 'Order Placed': statusColor = 'bg-gray-100 text-gray-700'; break;
                  case 'Order Confirmed': 
                  case 'Preparing': statusColor = 'bg-blue-100 text-blue-700'; break;
                  case 'Shipped': 
                  case 'In Transit': statusColor = 'bg-purple-100 text-purple-700'; break;
                  case 'Out for Delivery': statusColor = 'bg-orange-100 text-orange-700'; break;
                  case 'Delivered': statusColor = 'bg-green-100 text-green-700'; break;
                }

                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{order.details?.customerName || 'Guest Customer'}</div>
                      {order.details?.userPhone && order.details.userPhone !== 'N/A' && (
                        <div className="text-xs text-gray-500">{order.details.userPhone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">{date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₹{order.amount}
                      <div className="text-[10px] text-gray-400 mt-0.5">{order.paymentMethod.toUpperCase()} - {order.paymentStatus}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold outline-none cursor-pointer border-none appearance-none pr-4 ${statusColor}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Order Placed">Order Placed</option>
                        <option value="Order Confirmed">Order Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {order.status === 'Delivered' && (
                        <a 
                          href={`https://wa.me/919999999999?text=Hi!%20Your%20Eyevengers%20Order%20${order.id}%20has%20been%20Delivered.%20Hope%20you%20like%20your%20new%20glasses!`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition flex items-center gap-1 text-xs font-bold border border-green-200"
                        >
                          WhatsApp
                        </a>
                      )}
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-gray-400 hover:text-brand-navy hover:bg-blue-50 rounded transition flex items-center gap-1 text-xs font-medium"
                      >
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-white">
          <div>Showing 1 to {orders.length} of {orders.length} orders</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-in zoom-in-95">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-900">Order {selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Date</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Status</p>
                  <p className="text-sm font-medium text-brand-navy">{selectedOrder.status}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Payment Method</p>
                  <p className="text-sm font-medium text-gray-900">{selectedOrder.paymentMethod.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Payment Status</p>
                  <p className="text-sm font-medium text-gray-900">{selectedOrder.paymentStatus}</p>
                </div>
              </div>

              {selectedOrder.razorpayOrderId && (
                <div className="text-sm text-gray-600 border border-gray-200 rounded-xl p-3">
                  <p><strong>Razorpay Order ID:</strong> {selectedOrder.razorpayOrderId}</p>
                  {selectedOrder.razorpayPaymentId && (
                    <p><strong>Razorpay Payment ID:</strong> {selectedOrder.razorpayPaymentId}</p>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Product Details</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><span className="font-medium">Frame:</span> {selectedOrder.details?.frame}</p>
                  <p><span className="font-medium">Lens Category:</span> {selectedOrder.details?.lensCategory || 'Frame Only'}</p>
                  {selectedOrder.details?.lensProduct && (
                    <p><span className="font-medium">Lens Type:</span> {selectedOrder.details.lensProduct}</p>
                  )}
                </div>
              </div>

              {selectedOrder.details?.power && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Eye Power Prescription</h4>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-gray-500 font-bold">
                          <th className="pb-2">Eye</th>
                          <th className="pb-2">SPH</th>
                          <th className="pb-2">CYL</th>
                          <th className="pb-2">AXIS</th>
                          <th className="pb-2">ADD</th>
                          <th className="pb-2">PD</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-900 font-medium">
                        <tr className="border-t border-blue-100">
                          <td className="py-2 text-blue-800 font-bold">Right (OD)</td>
                          <td className="py-2">{selectedOrder.details.power.reSph || '-'}</td>
                          <td className="py-2">{selectedOrder.details.power.reCyl || '-'}</td>
                          <td className="py-2">{selectedOrder.details.power.reAxis || '-'}</td>
                          <td className="py-2">{selectedOrder.details.power.reAdd || '-'}</td>
                          <td className="py-2">{selectedOrder.details.power.rePd || '-'}</td>
                        </tr>
                        <tr className="border-t border-blue-100">
                          <td className="py-2 text-blue-800 font-bold">Left (OS)</td>
                          <td className="py-2">{selectedOrder.details.power.leSph || '-'}</td>
                          <td className="py-2">{selectedOrder.details.power.leCyl || '-'}</td>
                          <td className="py-2">{selectedOrder.details.power.leAxis || '-'}</td>
                          <td className="py-2">{selectedOrder.details.power.leAdd || '-'}</td>
                          <td className="py-2">{selectedOrder.details.power.lePd || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center font-black text-lg bg-gray-50 p-4 rounded-xl border border-gray-200">
                <span>Total Amount Paid</span>
                <span className="text-brand-navy">₹{selectedOrder.amount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
