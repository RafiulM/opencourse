'use client';

import React, { useState } from 'react';
import { FileUpload } from './file-upload';
import { UploadProgress } from '@/lib/upload-types';
import { ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CourseThumbnailUploadProps {
  currentThumbnailUrl?: string;
  onThumbnailUpdate?: (thumbnailUrl: string, uploadId: string) => void;
  courseId?: string;
  className?: string;
}

export const CourseThumbnailUpload: React.FC<CourseThumbnailUploadProps> = ({
  currentThumbnailUrl,
  onThumbnailUpdate,
  courseId,
  className = ''
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (upload: UploadProgress) => {
    setError(null);
    if (upload.publicUrl) {
      setPreviewUrl(upload.publicUrl);
      onThumbnailUpdate?.(upload.publicUrl, upload.uploadId);
    }
  };

  const handleUploadError = (error: Error) => {
    setError(error.message);
    setPreviewUrl(null);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onThumbnailUpdate?.('', '');
  };

  const displayUrl = previewUrl || currentThumbnailUrl;

  return (
    <div className={`space-y-4 ${className}`}>
      {displayUrl ? (
        <div className="relative">
          <div className="w-full aspect-video rounded-lg overflow-hidden border-2 border-muted-foreground/25">
            <img
              src={displayUrl}
              alt="Course thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <FileUpload
          uploadType="course_thumbnail"
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          associationIds={courseId ? { courseId } : {}}
          accept="image/jpeg,image/png,image/webp"
        >
          <div className="w-full aspect-video border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center hover:border-muted-foreground/40 cursor-pointer transition-colors">
            <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              Click to upload course thumbnail
            </p>
            <p className="text-xs text-muted-foreground/70 text-center mt-1">
              Max 3MB, JPG/PNG/WebP, 1200x675px recommended
            </p>
          </div>
        </FileUpload>
      )}

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}
      
      {!displayUrl && (
        <p className="text-xs text-muted-foreground">
          You can also paste a URL in the thumbnail field above
        </p>
      )}
    </div>
  );
};