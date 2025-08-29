'use client';

import React, { useState } from 'react';
import { FileUpload } from './file-upload';
import { UploadService, UploadProgress, UploadType } from '@/lib/upload-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAuthHeaders } from '@/lib/auth-utils';
import { FileText, Video, Link as LinkIcon, Folder, CheckCircle, XCircle, Clock, Settings } from 'lucide-react';

interface MaterialUploadProps {
  moduleId: string;
  onMaterialAdded?: (material: any) => void;
  className?: string;
}

export const MaterialUpload: React.FC<MaterialUploadProps> = ({
  moduleId,
  onMaterialAdded,
  className = ''
}) => {
  const [selectedType, setSelectedType] = useState<'video' | 'file' | 'document'>('file');
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const materialTypes = [
    { key: 'file', label: 'File', icon: Folder, description: 'PDF, ZIP • Max 100MB' },
    { key: 'video', label: 'Video', icon: Video, description: 'MP4, WebM, MOV • Max 500MB' },
    { key: 'document', label: 'Document', icon: FileText, description: 'PDF, DOC, DOCX, PPT, PPTX, TXT • Max 50MB' }
  ] as const;

  const getUploadType = (): UploadType => {
    switch (selectedType) {
      case 'video': return 'material_video';
      case 'document': return 'material_document';
      default: return 'material_file';
    }
  };

  const handleUploadComplete = async (upload: UploadProgress) => {
    // Update the uploads list
    setUploads(prev => {
      const existing = prev.find(u => u.uploadId === upload.uploadId);
      if (existing) {
        return prev.map(u => u.uploadId === upload.uploadId ? upload : u);
      }
      return [...prev, upload];
    });

    // Create material record in backend
    try {
      const response = await fetch(`/api/courses/modules/${moduleId}/materials`, {
        method: 'POST',
        headers: getAuthHeaders(),
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

  const handleUploadProgress = (upload: UploadProgress) => {
    setUploads(prev => {
      const existing = prev.find(u => u.uploadId === upload.uploadId);
      if (existing) {
        return prev.map(u => u.uploadId === upload.uploadId ? upload : u);
      }
      return [...prev, upload];
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing': return <Settings className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Material type selector */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Material Type</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {materialTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.key}
                variant={selectedType === type.key ? "default" : "outline"}
                onClick={() => setSelectedType(type.key as any)}
                className="flex flex-col items-center space-y-2 p-4 h-auto"
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs opacity-70">{type.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Upload area */}
      <FileUpload
        uploadType={getUploadType()}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        onProgress={handleUploadProgress}
        associationIds={{ moduleId }}
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/40 transition-colors"
      >
        <div className="space-y-4">
          <div className="text-6xl">
            {selectedType === 'video' && <Video className="mx-auto h-16 w-16 text-muted-foreground" />}
            {selectedType === 'document' && <FileText className="mx-auto h-16 w-16 text-muted-foreground" />}
            {selectedType === 'file' && <Folder className="mx-auto h-16 w-16 text-muted-foreground" />}
          </div>
          <div className="space-y-2">
            <div className="text-lg font-medium">
              Upload {selectedType}
            </div>
            <div className="text-sm text-muted-foreground">
              {materialTypes.find(t => t.key === selectedType)?.description}
            </div>
          </div>
        </div>
      </FileUpload>

      {/* Upload progress list */}
      {uploads.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Upload Progress</h4>
          <div className="space-y-3">
            {uploads.map((upload) => (
              <div key={upload.uploadId} className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0">
                  {getStatusIcon(upload.status)}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium truncate">
                    {upload.file.name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(upload.file.size)}</span>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">
                      {upload.status}
                    </Badge>
                  </div>
                  {upload.status === 'uploading' && (
                    <div className="w-full bg-muted rounded-full h-1 mt-2">
                      <div
                        className="bg-primary h-1 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                {upload.status === 'uploading' && (
                  <div className="flex-shrink-0 text-sm text-muted-foreground">
                    {Math.round(upload.progress)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};