'use client';

import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface ImageDisplayProps {
  src?: string;
  alt: string;
  fallback?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  src,
  alt,
  fallback = '/images/placeholder.png',
  className = '',
  loading = 'lazy'
}) => {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [isLoading, setIsLoading] = useState(!!src);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

  if (hasError && imgSrc === fallback) {
    return (
      <div className={`relative bg-muted flex items-center justify-center ${className}`}>
        <ImageIcon className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      )}
    </div>
  );
};