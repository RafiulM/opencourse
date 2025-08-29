'use client';

import React, { useState } from 'react';
import { UploadService } from '@/lib/upload-service';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  File
} from 'lucide-react';

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
    if (!mimeType) return File;
    
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType === 'application/pdf') return FileText;
    if (mimeType.includes('zip')) return Archive;
    if (mimeType.includes('word')) return FileText;
    if (mimeType.includes('powerpoint')) return FileText;
    
    return File;
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

  const FileIcon = getFileIcon();

  return (
    <div className={`flex items-center space-x-3 p-4 border border-muted rounded-lg hover:bg-muted/50 transition-colors ${className}`}>
      <div className="flex-shrink-0">
        <FileIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium truncate">
          {fileName}
        </p>
        {fileSize && (
          <p className="text-xs text-muted-foreground">
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>

      <Button
        onClick={handleDownload}
        disabled={downloading || (!publicUrl && !uploadId)}
        variant="outline"
        size="sm"
        className="flex-shrink-0"
      >
        <Download className="h-4 w-4 mr-2" />
        {downloading ? 'Downloading...' : 'Download'}
      </Button>
    </div>
  );
};