# Upload Components Usage Guide

This guide shows how to use the file upload system integrated with the OpenCourse backend's R2 storage.

## Available Components

### 1. FileUpload (Base Component)
Basic file upload component for any file type.

```tsx
import { FileUpload } from '@/components/uploads';

<FileUpload
  uploadType="course_thumbnail"
  onUploadComplete={(upload) => {
    console.log('Upload complete:', upload.publicUrl);
  }}
  onUploadError={(error) => {
    console.error('Upload failed:', error.message);
  }}
  associationIds={{ courseId: 'course-id' }}
  className="border-2 border-dashed p-4"
>
  <div>Click to upload</div>
</FileUpload>
```

### 2. AvatarUpload
Specialized component for avatar uploads with circular preview.

```tsx
import { AvatarUpload } from '@/components/uploads';

<AvatarUpload
  currentAvatarUrl={user.avatar}
  onAvatarUpdate={(avatarUrl, uploadId) => {
    // Update user profile with new avatar
    updateUser({ avatar: avatarUrl, avatarUploadId: uploadId });
  }}
  userId={user.id}
  size="lg"
/>
```

### 3. MaterialUpload
Multi-type file upload for course materials with progress tracking.

```tsx
import { MaterialUpload } from '@/components/uploads';

<MaterialUpload
  moduleId="module-id"
  onMaterialAdded={(material) => {
    console.log('New material created:', material);
  }}
/>
```

## Display Components

### 1. ImageDisplay
Safe image display with fallback and loading states.

```tsx
import { ImageDisplay } from '@/components/uploads';

<ImageDisplay
  src={course.thumbnail}
  alt="Course thumbnail"
  className="w-full h-48 rounded-lg"
  fallback="/images/course-placeholder.png"
/>
```

### 2. VideoPlayer
Video player with private file support.

```tsx
import { VideoPlayer } from '@/components/uploads';

<VideoPlayer
  uploadId="video-upload-id"
  title="Lesson 1: Introduction"
  className="w-full aspect-video"
/>
```

### 3. FileDownload
Download component for files with proper icons.

```tsx
import { FileDownload } from '@/components/uploads';

<FileDownload
  uploadId="file-upload-id"
  fileName="course-syllabus.pdf"
  fileSize={1024000}
  mimeType="application/pdf"
/>
```

## Upload Types

- `community_avatar` - Community profile picture (2MB, 800x800px)
- `community_banner` - Community banner image (5MB, 1920x600px) 
- `course_thumbnail` - Course cover image (3MB, 1200x675px)
- `module_thumbnail` - Module cover image (2MB, 800x450px)
- `user_avatar` - User profile picture (1MB, 400x400px)
- `material_video` - Course video content (500MB, MP4/WebM/MOV)
- `material_file` - General files (100MB, PDF/ZIP)
- `material_document` - Documents (50MB, PDF/DOC/DOCX/PPT/PPTX/TXT)

## Example Implementations

### Course Creation Form
```tsx
import { useState } from 'react';
import { FileUpload } from '@/components/uploads';

function CourseForm() {
  const [thumbnailUpload, setThumbnailUpload] = useState(null);

  return (
    <form>
      <div>
        <label>Course Thumbnail</label>
        <FileUpload
          uploadType="course_thumbnail"
          onUploadComplete={(upload) => {
            setThumbnailUpload(upload);
          }}
          associationIds={{ courseId: course?.id }}
        >
          <div className="border-2 border-dashed p-8 text-center">
            {thumbnailUpload ? (
              <img src={thumbnailUpload.publicUrl} alt="Thumbnail" />
            ) : (
              <div>Upload course thumbnail</div>
            )}
          </div>
        </FileUpload>
      </div>
    </form>
  );
}
```

### Material Display
```tsx
import { VideoPlayer, FileDownload } from '@/components/uploads';

function MaterialDisplay({ material }) {
  if (material.type === 'video') {
    return (
      <VideoPlayer
        uploadId={material.fileUploadId}
        title={material.title}
        className="w-full aspect-video rounded-lg"
      />
    );
  }

  if (material.type === 'file') {
    return (
      <FileDownload
        uploadId={material.fileUploadId}
        fileName={material.title}
        fileSize={material.fileSize}
        mimeType={material.mimeType}
      />
    );
  }

  return <div>Unsupported material type</div>;
}
```

## Error Handling

```tsx
import { handleUploadError } from '@/lib/upload-error-handling';

<FileUpload
  uploadType="material_file"
  onUploadError={(error) => {
    const userMessage = handleUploadError(error);
    toast.error(userMessage);
  }}
/>
```

## Integration with Forms

The upload components integrate seamlessly with react-hook-form:

```tsx
import { useForm } from 'react-hook-form';
import { FileUpload } from '@/components/uploads';

function MaterialForm() {
  const { setValue, watch } = useForm();
  const [uploadedFile, setUploadedFile] = useState(null);

  return (
    <FileUpload
      uploadType="material_file"
      onUploadComplete={(upload) => {
        setUploadedFile(upload);
        // Auto-fill form fields
        setValue('title', upload.file.name);
        setValue('fileUploadId', upload.uploadId);
      }}
    />
  );
}
```

All components are fully typed with TypeScript and follow the design patterns established in the codebase.