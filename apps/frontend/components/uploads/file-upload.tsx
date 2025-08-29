'use client';

import React, { useState } from 'react';
import { UploadService } from '@/lib/upload-service';
import { UploadProgress, UploadType, uploadValidation } from '@/lib/upload-types';

interface FileUploadProps {
  uploadType: UploadType;
  onUploadComplete?: (upload: UploadProgress) => void;
  onUploadError?: (error: Error) => void;
  onProgress?: (upload: UploadProgress) => void;
  associationIds?: {
    communityId?: string;
    courseId?: string;
    moduleId?: string;
    materialId?: string;
  };
  accept?: string;
  children?: React.ReactNode;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  uploadType,
  onUploadComplete,
  onUploadError,
  onProgress,
  associationIds,
  accept,
  children,
  className
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(null);

    try {
      const result = await UploadService.uploadFile(
        file,
        uploadType,
        associationIds,
        (uploadProgress) => {
          setProgress(uploadProgress);
          onProgress?.(uploadProgress);
        }
      );

      onUploadComplete?.(result);
    } catch (error) {
      onUploadError?.(error as Error);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const getAcceptAttribute = () => {
    if (accept) return accept;
    
    const validation = uploadValidation[uploadType];
    return validation.allowedTypes.join(',');
  };

  return (
    <div className={className}>
      <input
        type="file"
        onChange={handleFileSelect}
        accept={getAcceptAttribute()}
        disabled={uploading}
        style={{ display: 'none' }}
        id={`file-upload-${uploadType}`}
      />
      
      <label
        htmlFor={`file-upload-${uploadType}`}
        className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {children || (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/40 transition-colors">
            {uploading ? 'Uploading...' : 'Click to upload file'}
          </div>
        )}
      </label>

      {progress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span className="truncate">{progress.file.name}</span>
            <span>{Math.round(progress.progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Status: {progress.status}
          </div>
        </div>
      )}
    </div>
  );
};