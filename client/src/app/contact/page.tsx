import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans text-gray-800">
      <h1 className="text-3xl font-black text-brand-navy mb-6">Contact Us</h1>
      <p className="mb-8">Have questions? We are here to help you see the world clearly.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Get in Touch</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Phone className="text-brand-navy mt-1" size={20} />
              <div>
                <p className="font-bold">Phone</p>
                <p className="text-gray-600">+91 99999 99999</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Mail className="text-brand-navy mt-1" size={20} />
              <div>
                <p className="font-bold">Email</p>
                <p className="text-gray-600">support@eyevengers.com</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="text-brand-navy mt-1" size={20} />
              <div>
                <p className="font-bold">Headquarters</p>
                <p className="text-gray-600">Eyevengers Pvt Ltd<br/>123 Vision Street, Optic City<br/>Mumbai, Maharashtra 400001<br/>India</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-brand-light p-6 rounded-xl border border-blue-100">
          <h2 className="text-xl font-bold mb-4">Send a Message</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Name</label>
              <input type="text" className="w-full p-2 border rounded" placeholder="Your Name" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Email</label>
              <input type="email" className="w-full p-2 border rounded" placeholder="Your Email" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Message</label>
              <textarea className="w-full p-2 border rounded" rows={4} placeholder="How can we help?"></textarea>
            </div>
            <button className="w-full bg-brand-navy text-white font-bold py-2 rounded">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
}
