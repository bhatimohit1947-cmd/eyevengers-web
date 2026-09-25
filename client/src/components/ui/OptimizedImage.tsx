"use client";

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  fallbackText?: string;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  quality = 85,
  loading,
  fallbackText,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // If no source or error occurred, show clean SVG placeholder
  if (!src || hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full'} ${className}`}>
        <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {fallbackText && <span className="text-xs text-gray-400 ml-2">{fallbackText}</span>}
      </div>
    );
  }

  // Common styles to eliminate "cut-cut me / row-by-row" scanning:
  // Decodes asynchronously and transitions smoothly once fully ready in memory
  const transitionClass = priority 
    ? 'transition-opacity duration-300' 
    : 'transition-opacity duration-500 ease-out';
  const opacityClass = isLoaded ? 'opacity-100' : 'opacity-0';

  if (fill) {
    return (
      <>
        {/* Subtle shimmer skeleton while image is loading in background */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse pointer-events-none" />
        )}
        <Image
          src={src}
          alt={alt || "Eyevengers"}
          fill
          priority={priority}
          loading={priority ? undefined : (loading || 'lazy')}
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          quality={quality}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} ${transitionClass} ${opacityClass}`}
        />
      </>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse pointer-events-none" />
      )}
      <Image
        src={src}
        alt={alt || "Eyevengers"}
        width={width || 1920}
        height={height || 800}
        priority={priority}
        loading={priority ? undefined : (loading || 'lazy')}
        sizes={sizes || '100vw'}
        quality={quality}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} ${transitionClass} ${opacityClass}`}
      />
    </div>
  );
}
