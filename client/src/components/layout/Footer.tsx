"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

const footerLinks = [
  {
    title: 'Eyeglasses',
    links: ['Men', 'Women', 'Kids', 'Fastrack', 'Rimless', 'Titanium']
  },
  {
    title: 'Sunglasses',
    links: ['Men', 'Women', 'Kids', 'Aviator', 'Wayfarer', 'Polarized']
  },
  {
    title: 'Contact Lenses',
    links: ['Bausch & Lomb', 'Alcon', 'Acuvue', 'Color Lenses']
  }
];

export function Footer() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (title: string) => {
    setExpandedSection(expandedSection === title ? null : title);
  };

  return (
    <footer className="bg-brand-light pt-8 pb-24 md:pb-8 px-4 text-sm">
      <div className="max-w-7xl mx-auto">
        
        {/* Accordions for mobile, Grid for desktop */}
        <div className="md:grid md:grid-cols-4 md:gap-8 border-b border-gray-200 pb-8 mb-6">
          
          <div className="mb-6 md:mb-0">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Buy Eyewear from Eyevengers</h3>
            <p className="text-gray-600 mb-4 text-xs leading-relaxed">
              Eyevengers is India's leading eyewear destination. Shop from a wide range of eyeglasses, sunglasses, and contact lenses for men, women, and kids.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title} className="border-t border-gray-200 md:border-t-0 py-4 md:py-0">
              <button 
                className="flex items-center justify-between w-full md:cursor-default"
                onClick={() => toggleSection(section.title)}
              >
                <h4 className="font-bold text-gray-900">{section.title}</h4>
                <div className="md:hidden text-gray-500">
                  {expandedSection === section.title ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              
              <ul className={`mt-4 space-y-2 overflow-hidden transition-all md:block ${
                expandedSection === section.title ? 'block' : 'hidden'
              }`}>
                {section.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-gray-600 hover:text-brand-navy">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6">
          
          <div className="flex flex-col space-y-3 w-full md:w-auto">
            <h4 className="font-bold text-gray-900">Can we Help?</h4>
            <button className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-full py-2 px-4 hover:border-brand-navy transition w-full md:w-auto font-medium">
              <MessageCircle size={18} />
              Chat With Us
            </button>
          </div>

          <div className="flex flex-col space-y-3">
            <h4 className="font-bold text-gray-900">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-blue-600 transition shadow-sm font-bold text-xs">
                FB
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-pink-600 transition shadow-sm font-bold text-xs">
                IG
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-blue-400 transition shadow-sm font-bold text-xs">
                X
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 pt-6 border-t border-gray-200">
          <p>© 2026 Eyevengers. All Rights Reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0 flex-wrap justify-center">
            <Link href="/terms" className="hover:text-gray-900">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
            <Link href="/refund" className="hover:text-gray-900">Refund Policy</Link>
            <Link href="/shipping" className="hover:text-gray-900">Shipping Policy</Link>
            <Link href="/contact" className="hover:text-gray-900">Contact Us</Link>
          </div>
          <p className="mt-4 md:mt-0">Version 1.0.0</p>
        </div>

      </div>
    </footer>
  );
}
