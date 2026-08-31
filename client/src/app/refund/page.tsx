import React from 'react';

export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans text-gray-800">
      <h1 className="text-3xl font-black text-brand-navy mb-6">Cancellation & Refund Policy</h1>
      <div className="space-y-4">
        <p>Last updated: August 2026</p>
        <h2 className="text-xl font-bold mt-6">1. 14-Day Return Policy</h2>
        <p>We offer a 14-day return policy for unused frames in their original condition. Prescription lenses are custom-made and cannot be refunded unless there is a manufacturing defect.</p>
        
        <h2 className="text-xl font-bold mt-6">2. Cancellations</h2>
        <p>You may cancel your order within 24 hours of placing it. After 24 hours, the production of your custom lenses begins, and cancellation may not be possible or may incur a fee.</p>
        
        <h2 className="text-xl font-bold mt-6">3. Refund Process</h2>
        <p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund. Approved refunds will be processed within 5-7 business days to your original method of payment.</p>
      </div>
    </div>
  );
}
