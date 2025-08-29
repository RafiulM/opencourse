import { getAuthHeaders } from './auth-utils';
import { 
  uploadValidation, 
  UploadType, 
  UploadProgress, 
  PresignedUrlResponse 
} from './upload-types';

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
        await this.failUpload(uploadProgress.uploadId, (error as Error).message);
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