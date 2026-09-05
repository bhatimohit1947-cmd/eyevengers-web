"use client";
import { fetchWithAuth } from '@/utils/fetchWithAuth';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle } from 'lucide-react';

type PolicyPage = {
  id: string;
  slug: string;
  title: string;
  sections?: any[];
};

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<PolicyPage[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>('privacy');
  const [activeContent, setActiveContent] = useState<string>('');
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const policySlugs = ['privacy', 'terms', 'refund', 'shipping', 'contact'];

  const fetchPolicy = async (slug: string) => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`https://eyevengers-web.onrender.com/api/cms/pages/${slug}`);
      if (res.ok) {
        const data = await res.json();
        
        // Find the PolicyText section
        const textSection = data.sections?.find((s: any) => s.sectionType === 'PolicyText');
        if (textSection) {
          setActiveSectionId(textSection.id);
          setActiveContent(textSection.configJson?.content || '');
        } else {
          setActiveSectionId('');
          setActiveContent('');
        }
      } else {
        setActiveSectionId('');
        setActiveContent('');
      }
    } catch (error) {
      console.error("Failed to fetch policy", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy(activeSlug);
  }, [activeSlug]);

  const handleSave = async () => {
    if (!activeSectionId) {
      alert("No section found to update. Make sure the database was seeded properly.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetchWithAuth(`https://eyevengers-web.onrender.com/api/cms/sections/${activeSectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configJson: { content: activeContent }
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Failed to save policy.");
      }
    } catch (error) {
      console.error("Failed to save policy", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Legal Policies</h1>
          <p className="text-gray-500 mt-1">Manage the content of your legal and policy pages.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="bg-brand-navy hover:bg-brand-navy/90 text-white font-bold py-2 px-6 rounded-lg shadow-md transition flex items-center gap-2 disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : (saveSuccess ? <CheckCircle size={18} /> : <Save size={18} />)}
          {saveSuccess ? 'Saved!' : 'Save Policy'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar tabs */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col gap-2">
          {policySlugs.map(slug => (
            <button
              key={slug}
              onClick={() => setActiveSlug(slug)}
              className={`text-left px-4 py-3 rounded-lg font-bold text-sm transition-colors ${
                activeSlug === slug 
                  ? 'bg-brand-navy text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="capitalize">{slug.replace('-', ' ')}</span> Policy
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 p-6 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <Loader2 className="animate-spin text-brand-navy" size={32} />
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-[500px]">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 capitalize">{activeSlug.replace('-', ' ')} Policy Content</h2>
                <p className="text-xs text-gray-500 mt-1">You can use basic HTML tags like &lt;h2&gt;, &lt;p&gt;, and &lt;strong&gt; for formatting.</p>
              </div>
              
              <textarea
                value={activeContent}
                onChange={(e) => setActiveContent(e.target.value)}
                className="flex-1 w-full border border-gray-300 rounded-lg p-4 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-brand-navy focus:border-brand-navy resize-none"
                placeholder={`<h1>${activeSlug} Policy</h1>\n<p>Write your policy here...</p>`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
