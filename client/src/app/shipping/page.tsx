import React from 'react';

export default function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans text-gray-800">
      <h1 className="text-3xl font-black text-brand-navy mb-6">Shipping & Delivery Policy</h1>
      <div className="space-y-4">
        <p>Last updated: August 2026</p>
        <h2 className="text-xl font-bold mt-6">1. Processing Time</h2>
        <p>All orders are processed within 1-3 business days. Prescription eyewear may take an additional 2-4 business days for lens crafting and quality checks.</p>
        
        <h2 className="text-xl font-bold mt-6">2. Shipping Rates & Delivery Estimates</h2>
        <p>Shipping charges for your order will be calculated and displayed at checkout. Standard delivery typically takes 3-7 business days within India.</p>
        
        <h2 className="text-xl font-bold mt-6">3. Free Shipping</h2>
        <p>We offer free standard shipping on orders above a certain value, as well as for our exclusive Eyevengers VIP Members (Silver, Gold, Platinum).</p>
      </div>
    </div>
  );
}
