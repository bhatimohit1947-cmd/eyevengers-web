"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function PolicyRenderer({ slug, title }: { slug: string, title: string }) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await fetch(`https://eyevengers-web.onrender.com/api/cms/pages/${slug}`);
        if (res.ok) {
          const data = await res.json();
          const textSection = data.sections?.find((s: any) => s.sectionType === 'PolicyText');
          if (textSection && textSection.configJson?.content) {
            setContent(textSection.configJson.content);
          } else {
            setContent(`<p>No content found for ${title}.</p>`);
          }
        } else {
          setContent(`<p>Failed to load ${title}.</p>`);
        }
      } catch (error) {
        setContent(`<p>Error loading ${title}.</p>`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicy();
  }, [slug, title]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans text-gray-800 min-h-[500px]">
      <h1 className="text-3xl font-black text-brand-navy mb-8">{title}</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-brand-navy" size={40} />
        </div>
      ) : (
        <div 
          className="prose prose-gray max-w-none prose-headings:text-brand-navy prose-h2:mt-8 prose-h2:mb-4 prose-p:mb-4"
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      )}
    </div>
  );
}
