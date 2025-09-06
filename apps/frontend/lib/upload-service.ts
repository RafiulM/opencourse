import { getAuthHeaders } from './auth-utils';
import {
  uploadValidation,
  UploadType,
  UploadProgress,
  PresignedUrlResponse
} from './upload-types';

export class UploadService {
  private static readonly API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL + "/api/uploads";

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

  // Get all upload validation rules
  static async getValidationRules(): Promise<any[]> {
    try {
      const response = await fetch(`${this.API_BASE}/validation-rules`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get validation rules');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ [UploadService] Failed to get validation rules:', error);
      // Fallback to frontend validation rules
      return Object.entries(uploadValidation).map(([type, rules]) => ({
        uploadType: type,
        maxSizeBytes: rules.maxSize,
        maxSizeMB: Math.round(rules.maxSize / (1024 * 1024)),
        maxSizeFormatted: `${Math.round(rules.maxSize / (1024 * 1024))}MB`,
        allowedTypes: rules.allowedTypes,
        maxDimensions: rules.maxDimensions
      }));
    }
  }

  // Get maximum allowed file size for a specific upload type
  static async getMaxFileSize(uploadType: UploadType): Promise<number> {
    try {
      const response = await fetch(`${this.API_BASE}/max-file-size/${uploadType}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get maximum file size');
      }

      const result = await response.json();
      return result.data.maxSizeBytes;
    } catch (error) {
      console.error('❌ [UploadService] Failed to get max file size:', error);
      // Fallback to frontend validation rules
      return uploadValidation[uploadType].maxSize;
    }
  }

  // Validate file size against backend limits
  static async validateFileSize(uploadType: UploadType, fileSize: number): Promise<{ isValid: boolean; error?: string }> {
    try {
      const maxSize = await this.getMaxFileSize(uploadType);
      
      if (fileSize > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return { 
          isValid: false, 
          error: `File size must be less than ${maxSizeMB}MB for ${uploadType}` 
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('❌ [UploadService] Failed to validate file size:', error);
      // Fallback to frontend validation
      return this.validateFileSizeFrontend(uploadType, fileSize);
    }
  }

  // Frontend-only file size validation (fallback)
  private static validateFileSizeFrontend(uploadType: UploadType, fileSize: number): { isValid: boolean; error?: string } {
    const rules = uploadValidation[uploadType];
    if (!rules) {
      return { isValid: false, error: `Invalid upload type: ${uploadType}` };
    }

    if (fileSize > rules.maxSize) {
      const maxSizeMB = Math.round(rules.maxSize / (1024 * 1024));
      return { 
        isValid: false, 
        error: `File size must be less than ${maxSizeMB}MB for ${uploadType}` 
      };
    }

    return { isValid: true };
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
    console.log('🔄 [UploadService] Getting presigned URL:', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadType,
      associationIds
    });

    const requestBody = {
      fileName: file.name,
      mimeType: file.type,
      uploadType,
      fileSize: file.size,
      ...associationIds
    };

    console.log('📤 [UploadService] Sending request to backend:', {
      url: `${this.API_BASE}/presigned-url`,
      body: requestBody
    });

    const response = await fetch(`${this.API_BASE}/presigned-url`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 [UploadService] Backend response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [UploadService] Failed to get presigned URL:', error);
      throw new Error(error.error || 'Failed to get presigned URL');
    }

    const result = await response.json();
    console.log('✅ [UploadService] Presigned URL received:', {
      uploadId: result.data.uploadId,
      hasPresignedUrl: !!result.data.presignedUrl,
      hasPublicUrl: !!result.data.publicUrl,
      expiresAt: result.data.expiresAt
    });

    return result.data;
  }

  // Step 2: Upload file directly to R2
  static async uploadToR2(
    file: File,
    presignedUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    console.log('🚀 [UploadService] Starting R2 upload:', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      presignedUrlLength: presignedUrl.length
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            console.log(`📊 [UploadService] Upload progress: ${progress.toFixed(1)}% (${event.loaded}/${event.total} bytes)`);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        console.log('📥 [UploadService] R2 upload response:', {
          status: xhr.status,
          statusText: xhr.statusText,
          responseHeaders: xhr.getAllResponseHeaders()
        });

        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('✅ [UploadService] R2 upload completed successfully');
          resolve();
        } else {
          console.error('❌ [UploadService] R2 upload failed:', {
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText
          });
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', (event) => {
        console.error('❌ [UploadService] R2 upload network error', event);
        
        // Check if this might be a CORS error
        if (xhr.status === 0 && xhr.readyState === 4) {
          reject(new Error('Upload failed: CORS error - please check R2 bucket CORS configuration'));
        } else {
          reject(new Error('Upload failed: Network error'));
        }
      });

      xhr.addEventListener('timeout', () => {
        console.error('⏰ [UploadService] R2 upload timeout');
        reject(new Error('Upload failed: Timeout'));
      });

      xhr.open('PUT', presignedUrl);
      xhr.timeout = 300000; // 5 minutes timeout
      
      // Set content type header
      xhr.setRequestHeader('Content-Type', file.type);
      
      xhr.send(file);
    });
  }

  // Step 3: Mark upload as completed
  static async completeUpload(uploadId: string, fileSize: number, metadata?: Record<string, any>): Promise<any> {
    console.log('🏁 [UploadService] Completing upload:', {
      uploadId,
      fileSize,
      metadata
    });

    const requestBody = {
      fileSize,
      metadata: metadata || {}
    };

    console.log('📤 [UploadService] Sending completion request:', {
      url: `${this.API_BASE}/${uploadId}/complete`,
      body: requestBody
    });

    const response = await fetch(`${this.API_BASE}/${uploadId}/complete`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 [UploadService] Completion response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [UploadService] Failed to complete upload:', error);
      throw new Error(error.error || 'Failed to complete upload');
    }

    const result = await response.json();
    console.log('✅ [UploadService] Upload completed successfully:', {
      uploadId: result.data.id,
      status: result.data.status,
      r2Url: result.data.r2Url
    });
    return result.data;
  }

  // Mark upload as failed
  static async failUpload(uploadId: string, error: string): Promise<void> {
    console.log('💥 [UploadService] Marking upload as failed:', {
      uploadId,
      error
    });

    const response = await fetch(`${this.API_BASE}/${uploadId}/fail`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error })
    });

    console.log('📥 [UploadService] Fail upload response status:', response.status);

    if (!response.ok) {
      const errorResponse = await response.json();
      console.error('❌ [UploadService] Failed to mark upload as failed:', errorResponse);
    } else {
      console.log('✅ [UploadService] Upload marked as failed successfully');
    }
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
    console.log('🎯 [UploadService] Starting complete upload flow:', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadType,
      associationIds
    });

    // Validate file
    const validationError = this.validateFile(file, uploadType);
    if (validationError) {
      console.error('❌ [UploadService] File validation failed:', validationError);
      throw new Error(validationError);
    }

    // Validate image dimensions if applicable
    const dimensionError = await this.validateImageDimensions(file, uploadType);
    if (dimensionError) {
      console.error('❌ [UploadService] Image dimension validation failed:', dimensionError);
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
      console.error('💥 [UploadService] Upload flow failed:', error);
      uploadProgress.status = 'failed';
      onProgress?.(uploadProgress);

      if (uploadProgress.uploadId) {
        console.log('🔄 [UploadService] Marking upload as failed in backend');
        await this.failUpload(uploadProgress.uploadId, (error as Error).message);
      }

      // Provide helpful error messages for common issues
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('CORS')) {
        throw new Error(
          'Upload failed due to CORS configuration. Please ensure your R2 bucket has proper CORS settings configured. ' +
          'See R2_CORS_SETUP.md for detailed instructions.'
        );
      }

      throw error;
    }
  }

  // Get download URL for private files
  static async getDownloadUrl(uploadId: string, expiresIn: number = 3600): Promise<string> {
    const response = await fetch(`${this.API_BASE}/${uploadId}/download?expiresIn=${expiresIn}`, {
      credentials: 'include'
    });

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
      credentials: 'include'
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
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get upload stats');
    }

    const result = await response.json();
    return result.data;
  }
}