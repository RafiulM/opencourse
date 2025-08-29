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