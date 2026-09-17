"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface ImageUploadProps {
  value: string; // Comma separated URLs for multiple
  onChange: (url: string) => void;
  label?: string;
  multiple?: boolean;
}

export function ImageUpload({ value, onChange, label, multiple = false }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUrls = value ? value.split(',').map(u => u.trim()).filter(Boolean) : [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetchWithAuth(`https://eyevengers-web.onrender.com/api/upload/image`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (multiple) {
          onChange(value ? `${value}, ${data.url}` : data.url);
        } else {
          onChange(data.url);
        }
      } else {
        alert("Upload failed. Make sure 'media' bucket exists in Supabase and is public.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Something went wrong during upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newUrls = currentUrls.filter((_, idx) => idx !== indexToRemove);
    onChange(newUrls.join(', '));
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      
      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition ${mode === 'upload' ? 'bg-white shadow-sm text-brand-navy' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <Upload size={14} /> Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode('link')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition ${mode === 'link' ? 'bg-white shadow-sm text-brand-navy' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <LinkIcon size={14} /> Paste Link
        </button>
      </div>

      {mode === 'link' ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy text-sm"
          placeholder={multiple ? "https://example.com/img1.jpg, https://.../img2.jpg" : "https://example.com/image.jpg"}
        />
      ) : (
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*,video/mp4,video/webm" 
            className="hidden" 
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-brand-navy">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-sm font-medium">Uploading...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 bg-brand-light/50 rounded-full flex items-center justify-center mb-3">
                <Upload size={20} className="text-brand-navy" />
              </div>
              <p className="text-sm font-medium text-gray-900">Click to upload image or video</p>
              <p className="text-xs text-gray-500 mt-1">Supported: JPG, PNG, WEBP, MP4</p>
            </>
          )}
        </div>
      )}

      {/* Previews */}
      {currentUrls.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-2">
          {currentUrls.map((url, idx) => (
            <div key={idx} className="relative group w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
              {url.match(/\.(mp4|webm)$/i) ? (
                <video src={url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/80?text=Error'; }} />
              )}
              <button 
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
