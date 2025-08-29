'use client';

import React, { useState, useEffect } from 'react';
import { UploadService } from '@/lib/upload-service';
import { Button } from '@/components/ui/button';
import { Video, RefreshCw } from 'lucide-react';

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
      <div className={`bg-muted animate-pulse flex items-center justify-center rounded-lg ${className}`}>
        <div className="text-center space-y-2">
          <Video className="h-12 w-12 text-muted-foreground mx-auto" />
          <div className="text-muted-foreground text-sm">Loading video...</div>
        </div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className={`bg-muted border border-muted-foreground/20 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center space-y-3">
          <Video className="h-12 w-12 text-muted-foreground mx-auto" />
          <div className="text-muted-foreground text-sm">{error || 'Video not available'}</div>
          {error && uploadId && (
            <Button
              onClick={loadVideoUrl}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <video
      src={videoUrl}
      controls
      className={`w-full h-full rounded-lg ${className}`}
      title={title}
      preload="metadata"
    >
      Your browser does not support the video tag.
    </video>
  );
};