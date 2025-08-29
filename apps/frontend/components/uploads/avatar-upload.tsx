'use client';

import React, { useState } from 'react';
import { FileUpload } from './file-upload';
import { UploadProgress } from '@/lib/upload-types';
import { User } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarUpdate?: (avatarUrl: string, uploadId: string) => void;
  userId?: string;
  communityId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarUpdate,
  userId,
  communityId,
  size = 'md',
  className = ''
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const uploadType = communityId ? 'community_avatar' : 'user_avatar';
  const associationIds = communityId ? { communityId } : {};

  const handleUploadComplete = (upload: UploadProgress) => {
    setError(null);
    if (upload.publicUrl) {
      setPreviewUrl(upload.publicUrl);
      onAvatarUpdate?.(upload.publicUrl, upload.uploadId);
    }
  };

  const handleUploadError = (error: Error) => {
    setError(error.message);
    setPreviewUrl(null);
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <FileUpload
        uploadType={uploadType}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        associationIds={associationIds}
        accept="image/jpeg,image/png,image/webp"
      >
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-muted-foreground/25 hover:border-muted-foreground/40 cursor-pointer transition-colors`}>
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <User className="w-1/2 h-1/2 text-muted-foreground" />
            </div>
          )}
        </div>
      </FileUpload>

      {error && (
        <p className="text-destructive text-sm text-center">{error}</p>
      )}
      
      <p className="text-xs text-muted-foreground text-center">
        Click to upload new avatar<br />
        Max 1MB, JPG/PNG/WebP
      </p>
    </div>
  );
};