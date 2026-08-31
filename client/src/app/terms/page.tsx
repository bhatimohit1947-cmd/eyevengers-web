import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans text-gray-800">
      <h1 className="text-3xl font-black text-brand-navy mb-6">Terms & Conditions</h1>
      <div className="space-y-4">
        <p>Last updated: August 2026</p>
        <h2 className="text-xl font-bold mt-6">1. Agreement to Terms</h2>
        <p>By accessing our website, you agree to be bound by these Terms of Service and to use the site in accordance with these Terms.</p>
        
        <h2 className="text-xl font-bold mt-6">2. Products and Services</h2>
        <p>We reserve the right to modify or discontinue any product at any time without notice. We are not liable to you or any third party for any modification, price change, suspension, or discontinuance of the service.</p>
        
        <h2 className="text-xl font-bold mt-6">3. Accuracy of Billing and Account Information</h2>
        <p>We reserve the right to refuse any order you place with us. You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store.</p>
      </div>
    </div>
  );
}
