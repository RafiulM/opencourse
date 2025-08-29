# Frontend Integration Guide for OpenCourse File Uploads

This guide shows how to integrate file uploads and retrievals with the OpenCourse backend's Cloudflare R2 storage system.

## Overview

The upload system uses a secure two-step process:
1. **Request presigned URL** from backend with file metadata
2. **Upload directly to R2** using the presigned URL
3. **Notify completion** to backend for database tracking

## Authentication Setup

All upload operations require authentication. Ensure your frontend has proper JWT token handling:

```typescript
// utils/auth.ts
export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};
```

## Upload Types and File Validation

```typescript
// types/uploads.ts
export type UploadType = 
  | 'community_avatar' 
  | 'community_banner' 
  | 'course_thumbnail' 
  | 'module_thumbnail'
  | 'material_video' 
  | 'material_file' 
  | 'material_document'
  | 'user_avatar';

export interface FileValidationRules {
  maxSize: number; // bytes
  allowedTypes: string[]; // MIME types
  maxDimensions?: { width: number; height: number }; // for images
}

export const uploadValidation: Record<UploadType, FileValidationRules> = {
  community_avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxDimensions: { width: 800, height: 800 }
  },
  community_banner: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxDimensions: { width: 1920, height: 600 }
  },
  course_thumbnail: {
    maxSize: 3 * 1024 * 1024, // 3MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxDimensions: { width: 1200, height: 675 }
  },
  module_thumbnail: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxDimensions: { width: 800, height: 450 }
  },
  user_avatar: {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxDimensions: { width: 400, height: 400 }
  },
  material_video: {
    maxSize: 500 * 1024 * 1024, // 500MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime']
  },
  material_file: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['application/pdf', 'application/zip', 'application/x-zip-compressed']
  },
  material_document: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ]
  }
};
```

## Core Upload Service

```typescript
// services/uploadService.ts
import { getAuthHeaders, uploadValidation } from '../utils';

export interface UploadProgress {
  uploadId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  file: File;
  publicUrl?: string;
}

export interface PresignedUrlResponse {
  uploadId: string;
  presignedUrl: string;
  r2Key: string;
  publicUrl: string;
  expiresAt: string;
}

export class UploadService {
  private static readonly API_BASE = '/api/uploads';

  // Validate file before upload
  static validateFile(file: File, uploadType: UploadType): string | null {
    const rules = uploadValidation[uploadType];
    
    // Check file size
    if (file.size > rules.maxSize) {
      const maxSizeMB = Math.round(rules.maxSize / (1024 * 1024));
      return `File size must be less than ${maxSizeMB}MB`;
    }
    
    // Check file type
    if (!rules.allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed for ${uploadType}`;
    }
    
    return null; // Valid file
  }

  // Validate image dimensions (call after file is selected)
  static async validateImageDimensions(file: File, uploadType: UploadType): Promise<string | null> {
    const rules = uploadValidation[uploadType];
    if (!rules.maxDimensions || !file.type.startsWith('image/')) {
      return null;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = rules.maxDimensions!;
        if (img.width > width || img.height > height) {
          resolve(`Image dimensions must be ${width}x${height} pixels or smaller`);
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve('Invalid image file');
      img.src = URL.createObjectURL(file);
    });
  }

  // Step 1: Get presigned upload URL
  static async getPresignedUrl(
    file: File, 
    uploadType: UploadType,
    associationIds?: {
      communityId?: string;
      courseId?: string;
      moduleId?: string;
      materialId?: string;
    }
  ): Promise<PresignedUrlResponse> {
    const response = await fetch(`${this.API_BASE}/presigned-url`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        uploadType,
        ...associationIds
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get presigned URL');
    }

    const result = await response.json();
    return result.data;
  }

  // Step 2: Upload file directly to R2
  static async uploadToR2(
    file: File, 
    presignedUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed: Network error'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload failed: Timeout'));
      });

      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.timeout = 300000; // 5 minutes timeout
      xhr.send(file);
    });
  }

  // Step 3: Mark upload as completed
  static async completeUpload(uploadId: string, fileSize: number, metadata?: Record<string, any>): Promise<any> {
    const response = await fetch(`${this.API_BASE}/${uploadId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        fileSize,
        metadata: metadata || {}
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete upload');
    }

    const result = await response.json();
    return result.data;
  }

  // Mark upload as failed
  static async failUpload(uploadId: string, error: string): Promise<void> {
    await fetch(`${this.API_BASE}/${uploadId}/fail`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ error })
    });
  }

  // Complete upload flow
  static async uploadFile(
    file: File,
    uploadType: UploadType,
    associationIds?: {
      communityId?: string;
      courseId?: string;
      moduleId?: string;
      materialId?: string;
    },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadProgress> {
    // Validate file
    const validationError = this.validateFile(file, uploadType);
    if (validationError) {
      throw new Error(validationError);
    }

    // Validate image dimensions if applicable
    const dimensionError = await this.validateImageDimensions(file, uploadType);
    if (dimensionError) {
      throw new Error(dimensionError);
    }

    let uploadProgress: UploadProgress = {
      uploadId: '',
      progress: 0,
      status: 'uploading',
      file,
    };

    try {
      // Step 1: Get presigned URL
      onProgress?.(uploadProgress);
      const presignedData = await this.getPresignedUrl(file, uploadType, associationIds);
      
      uploadProgress.uploadId = presignedData.uploadId;
      uploadProgress.publicUrl = presignedData.publicUrl || undefined;
      onProgress?.(uploadProgress);

      // Step 2: Upload to R2
      await this.uploadToR2(file, presignedData.presignedUrl, (progress) => {
        uploadProgress.progress = progress;
        onProgress?.(uploadProgress);
      });

      // Step 3: Complete upload
      uploadProgress.status = 'processing';
      onProgress?.(uploadProgress);

      const completedUpload = await this.completeUpload(uploadProgress.uploadId, file.size, {
        originalName: file.name,
        lastModified: file.lastModified
      });

      uploadProgress.status = 'completed';
      uploadProgress.progress = 100;
      uploadProgress.publicUrl = completedUpload.r2Url || undefined;
      onProgress?.(uploadProgress);

      return uploadProgress;

    } catch (error) {
      uploadProgress.status = 'failed';
      onProgress?.(uploadProgress);
      
      if (uploadProgress.uploadId) {
        await this.failUpload(uploadProgress.uploadId, error.message);
      }
      
      throw error;
    }
  }

  // Get download URL for private files
  static async getDownloadUrl(uploadId: string, expiresIn: number = 3600): Promise<string> {
    const response = await fetch(`${this.API_BASE}/${uploadId}/download?expiresIn=${expiresIn}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get download URL');
    }

    const result = await response.json();
    return result.data.downloadUrl;
  }

  // Get user's uploads
  static async getUserUploads(uploadType?: UploadType, limit = 50, offset = 0): Promise<any[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (uploadType) {
      params.append('uploadType', uploadType);
    }

    const response = await fetch(`${this.API_BASE}/my?${params}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get uploads');
    }

    const result = await response.json();
    return result.data;
  }

  // Get upload statistics
  static async getUploadStats(): Promise<any> {
    const response = await fetch(`${this.API_BASE}/stats`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get upload stats');
    }

    const result = await response.json();
    return result.data;
  }
}
```

## React Upload Component Examples

### 1. Simple File Upload Component

```tsx
// components/FileUpload.tsx
import React, { useState } from 'react';
import { UploadService, UploadProgress, UploadType } from '../services/uploadService';

interface FileUploadProps {
  uploadType: UploadType;
  onUploadComplete?: (upload: UploadProgress) => void;
  onUploadError?: (error: Error) => void;
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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400">
            {uploading ? 'Uploading...' : 'Click to upload file'}
          </div>
        )}
      </label>

      {progress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{progress.file.name}</span>
            <span>{Math.round(progress.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Status: {progress.status}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 2. Avatar Upload Component

```tsx
// components/AvatarUpload.tsx
import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { UploadProgress } from '../services/uploadService';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarUpdate?: (avatarUrl: string, uploadId: string) => void;
  userId?: string;
  communityId?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarUpdate,
  userId,
  communityId,
  size = 'md'
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
    <div className="flex flex-col items-center space-y-2">
      <FileUpload
        uploadType={uploadType}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        associationIds={associationIds}
        accept="image/jpeg,image/png,image/webp"
      >
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-300 hover:border-gray-400 cursor-pointer transition-colors`}>
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <svg className="w-1/2 h-1/2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </FileUpload>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
      
      <p className="text-xs text-gray-500 text-center">
        Click to upload new avatar<br />
        Max 1MB, JPG/PNG/WebP
      </p>
    </div>
  );
};
```

### 3. Course Material Upload Component

```tsx
// components/MaterialUpload.tsx
import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { UploadService, UploadProgress, UploadType } from '../services/uploadService';

interface MaterialUploadProps {
  moduleId: string;
  onMaterialAdded?: (material: any) => void;
}

export const MaterialUpload: React.FC<MaterialUploadProps> = ({
  moduleId,
  onMaterialAdded
}) => {
  const [selectedType, setSelectedType] = useState<'video' | 'file' | 'document'>('file');
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const getUploadType = (): UploadType => {
    switch (selectedType) {
      case 'video': return 'material_video';
      case 'document': return 'material_document';
      default: return 'material_file';
    }
  };

  const handleUploadComplete = async (upload: UploadProgress) => {
    // Update the uploads list
    setUploads(prev => prev.map(u => 
      u.uploadId === upload.uploadId ? upload : u
    ));

    // Create material record in backend
    try {
      const response = await fetch('/api/courses/modules/${moduleId}/materials', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: upload.file.name,
          type: selectedType,
          fileUploadId: upload.uploadId,
          order: 0 // You might want to calculate this
        })
      });

      if (response.ok) {
        const result = await response.json();
        onMaterialAdded?.(result.data);
      }
    } catch (error) {
      console.error('Failed to create material record:', error);
    }
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload failed:', error);
  };

  return (
    <div className="space-y-4">
      {/* Material type selector */}
      <div className="flex space-x-4">
        {[
          { key: 'file', label: 'File', icon: '📁' },
          { key: 'video', label: 'Video', icon: '🎥' },
          { key: 'document', label: 'Document', icon: '📄' }
        ].map((type) => (
          <button
            key={type.key}
            onClick={() => setSelectedType(type.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              selectedType === type.key
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Upload area */}
      <FileUpload
        uploadType={getUploadType()}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        associationIds={{ moduleId }}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
      >
        <div className="space-y-2">
          <div className="text-4xl">
            {selectedType === 'video' ? '🎥' : selectedType === 'document' ? '📄' : '📁'}
          </div>
          <div className="text-lg font-medium text-gray-900">
            Upload {selectedType}
          </div>
          <div className="text-sm text-gray-500">
            {selectedType === 'video' && 'MP4, WebM, MOV • Max 500MB'}
            {selectedType === 'document' && 'PDF, DOC, DOCX, PPT, PPTX, TXT • Max 50MB'}
            {selectedType === 'file' && 'PDF, ZIP • Max 100MB'}
          </div>
        </div>
      </FileUpload>

      {/* Upload progress list */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Recent Uploads</h4>
          {uploads.map((upload) => (
            <div key={upload.uploadId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {upload.status === 'completed' && '✅'}
                {upload.status === 'failed' && '❌'}
                {upload.status === 'uploading' && '⏳'}
                {upload.status === 'processing' && '⚙️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {upload.file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(upload.file.size / (1024 * 1024)).toFixed(2)} MB • {upload.status}
                </p>
              </div>
              <div className="flex-shrink-0">
                {upload.status === 'uploading' && (
                  <div className="text-sm text-gray-500">
                    {Math.round(upload.progress)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## File Display Components

### 1. Image Display Component

```tsx
// components/ImageDisplay.tsx
import React, { useState } from 'react';

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

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    if (imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

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
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      )}
    </div>
  );
};
```

### 2. Video Player Component

```tsx
// components/VideoPlayer.tsx
import React, { useState, useEffect } from 'react';
import { UploadService } from '../services/uploadService';

interface VideoPlayerProps {
  uploadId?: string;
  publicUrl?: string;
  title?: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  uploadId,
  publicUrl,
  title,
  className = ''
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(publicUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (uploadId && !publicUrl) {
      loadVideoUrl();
    }
  }, [uploadId, publicUrl]);

  const loadVideoUrl = async () => {
    if (!uploadId) return;

    setLoading(true);
    setError(null);

    try {
      const url = await UploadService.getDownloadUrl(uploadId, 3600); // 1 hour expiry
      setVideoUrl(url);
    } catch (error) {
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
        <div className="text-gray-400">Loading video...</div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className={`bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">📹</div>
          <div className="text-gray-600 text-sm">{error || 'Video not available'}</div>
          {error && uploadId && (
            <button
              onClick={loadVideoUrl}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <video
      src={videoUrl}
      controls
      className={`w-full h-full ${className}`}
      title={title}
    >
      Your browser does not support the video tag.
    </video>
  );
};
```

### 3. File Download Component

```tsx
// components/FileDownload.tsx
import React, { useState } from 'react';
import { UploadService } from '../services/uploadService';

interface FileDownloadProps {
  uploadId?: string;
  publicUrl?: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  className?: string;
}

export const FileDownload: React.FC<FileDownloadProps> = ({
  uploadId,
  publicUrl,
  fileName,
  fileSize,
  mimeType,
  className = ''
}) => {
  const [downloading, setDownloading] = useState(false);

  const getFileIcon = () => {
    if (!mimeType) return '📄';
    
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📕';
    if (mimeType.includes('zip')) return '📦';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('powerpoint')) return '📊';
    
    return '📄';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async () => {
    if (downloading) return;

    setDownloading(true);

    try {
      let downloadUrl = publicUrl;
      
      if (!downloadUrl && uploadId) {
        downloadUrl = await UploadService.getDownloadUrl(uploadId, 3600);
      }

      if (downloadUrl) {
        // Create temporary link to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${className}`}>
      <div className="flex-shrink-0 text-2xl">
        {getFileIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {fileName}
        </p>
        {fileSize && (
          <p className="text-sm text-gray-500">
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading || (!publicUrl && !uploadId)}
        className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {downloading ? 'Downloading...' : 'Download'}
      </button>
    </div>
  );
};
```

## Usage Examples

### Community Banner Upload

```tsx
// In a community settings component
import { FileUpload } from './components/FileUpload';

const CommunitySettings = ({ community, onUpdate }) => {
  const handleBannerUpload = (upload) => {
    // Update community with new banner
    onUpdate({
      ...community,
      banner: upload.publicUrl,
      bannerUploadId: upload.uploadId
    });
  };

  return (
    <div>
      <h3>Community Banner</h3>
      {community.banner && (
        <img src={community.banner} alt="Current banner" className="w-full h-32 object-cover mb-4" />
      )}
      <FileUpload
        uploadType="community_banner"
        associationIds={{ communityId: community.id }}
        onUploadComplete={handleBannerUpload}
      />
    </div>
  );
};
```

### Course Thumbnail Selection

```tsx
// In course creation/edit form
const CourseForm = ({ course, onSave }) => {
  const [formData, setFormData] = useState(course);

  const handleThumbnailUpload = (upload) => {
    setFormData({
      ...formData,
      thumbnail: upload.publicUrl,
      thumbnailUploadId: upload.uploadId
    });
  };

  return (
    <form onSubmit={onSave}>
      {/* Other course fields */}
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Thumbnail
        </label>
        <FileUpload
          uploadType="course_thumbnail"
          associationIds={{ courseId: course?.id }}
          onUploadComplete={handleThumbnailUpload}
        >
          <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            {formData.thumbnail ? (
              <img src={formData.thumbnail} alt="Thumbnail" className="max-h-full max-w-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2">🖼️</div>
                <div className="text-gray-600">Click to upload thumbnail</div>
              </div>
            )}
          </div>
        </FileUpload>
      </div>
    </form>
  );
};
```

## Error Handling Best Practices

```typescript
// utils/errorHandling.ts
export const handleUploadError = (error: Error) => {
  console.error('Upload error:', error);

  // Show user-friendly error messages
  if (error.message.includes('File size')) {
    return 'File is too large. Please choose a smaller file.';
  }
  
  if (error.message.includes('File type')) {
    return 'File type not supported. Please choose a different file format.';
  }
  
  if (error.message.includes('dimensions')) {
    return 'Image dimensions are too large. Please resize the image.';
  }
  
  if (error.message.includes('Network')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (error.message.includes('timeout')) {
    return 'Upload timed out. Please try again with a smaller file.';
  }

  return 'Upload failed. Please try again.';
};
```

## Environment Configuration

```typescript
// config/upload.ts
export const uploadConfig = {
  apiBase: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  maxRetries: 3,
  chunkSize: 1024 * 1024, // 1MB chunks for large files
  
  // File size limits (in bytes)
  maxFileSizes: {
    image: 5 * 1024 * 1024, // 5MB
    video: 500 * 1024 * 1024, // 500MB
    document: 50 * 1024 * 1024, // 50MB
    archive: 100 * 1024 * 1024, // 100MB
  },

  // Supported formats
  supportedFormats: {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    archive: ['application/zip', 'application/x-zip-compressed']
  }
};
```

This integration guide provides everything needed to implement file uploads and retrievals in your frontend application. The components are modular and can be customized based on your UI framework (React, Vue, etc.) and styling preferences.