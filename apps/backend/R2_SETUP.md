# Cloudflare R2 Setup Guide for OpenCourse

This guide will help you configure Cloudflare R2 object storage for your OpenCourse platform with optimal public/private access patterns.

## Prerequisites

1. Cloudflare account with R2 enabled
2. Wrangler CLI installed: `npm install -g wrangler`
3. Authenticate Wrangler: `wrangler auth login`

## Strategy Overview

We support two strategies for organizing your files:

### Strategy 1: Single Bucket with Path-Based Access (Recommended)
- One bucket with `public/` and `private/` prefixes
- Simpler to manage and configure
- Use custom domain for public files

### Strategy 2: Separate Public/Private Buckets  
- Dedicated buckets for public and private content
- More granular control but more complex setup

## Setup Instructions

### Option 1: Single Bucket Setup (Recommended)

#### 1. Create the Main Bucket

```bash
wrangler r2 bucket create opencourse-storage
```

#### 2. Set Up Custom Domain (Required for Public Access)

1. Go to Cloudflare Dashboard → R2 Object Storage → Manage Bucket → Settings
2. Click "Add Custom Domain"
3. Enter your domain (e.g., `cdn.yourdomain.com` or `storage.yourdomain.com`)
4. Follow DNS setup instructions
5. Enable "Allow public read access" for the domain

#### 3. Configure CORS Policy

Create `cors-policy.json`:

```json
[
  {
    "AllowedOrigins": [
      "https://yourdomain.com",
      "https://www.yourdomain.com", 
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Location"],
    "MaxAgeSeconds": 3600
  }
]
```

Apply the CORS policy:
```bash
wrangler r2 bucket cors put opencourse-storage --file cors-policy.json
```

#### 4. Environment Variables

```env
# R2 Configuration
R2_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET=opencourse-storage
R2_PUBLIC_DOMAIN=https://cdn.yourdomain.com

# Optional: Leave these empty for single bucket strategy
# R2_PUBLIC_BUCKET=
# R2_PRIVATE_BUCKET=
```

### Option 2: Separate Buckets Setup

#### 1. Create Both Buckets

```bash
# Public bucket for avatars, thumbnails, banners
wrangler r2 bucket create opencourse-public

# Private bucket for course materials, videos  
wrangler r2 bucket create opencourse-private
```

#### 2. Configure Public Bucket Domain

1. Set up custom domain for the public bucket only
2. Enable "Allow public read access" for public bucket domain
3. Do NOT set up custom domain for private bucket

#### 3. Apply CORS to Both Buckets

```bash
wrangler r2 bucket cors put opencourse-public --file cors-policy.json
wrangler r2 bucket cors put opencourse-private --file cors-policy.json  
```

#### 4. Environment Variables

```env
# R2 Configuration - Separate Buckets
R2_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET=opencourse-storage  # Fallback bucket
R2_PUBLIC_BUCKET=opencourse-public
R2_PRIVATE_BUCKET=opencourse-private
R2_PUBLIC_DOMAIN=https://cdn.yourdomain.com
```

## File Organization

### Single Bucket Structure
```
opencourse-storage/
├── public/
│   ├── community_avatar/
│   │   └── user123/
│   │       └── 1699123456-abc12345-profile.jpg
│   ├── community_banner/
│   ├── course_thumbnail/
│   ├── module_thumbnail/
│   └── user_avatar/
└── private/
    ├── material_video/
    │   └── user123/
    │       └── 1699123456-def67890-lecture.mp4
    ├── material_file/
    └── material_document/
```

### Separate Buckets Structure
```
opencourse-public/
├── community_avatar/
├── community_banner/
├── course_thumbnail/
├── module_thumbnail/
└── user_avatar/

opencourse-private/
├── material_video/
├── material_file/  
└── material_document/
```

## Access Patterns

### Public Files (Thumbnails, Avatars, Banners)
- **Direct Public URLs**: `https://cdn.yourdomain.com/public/community_avatar/user123/image.jpg`
- **No Authentication Required**: Perfect for displaying in web apps
- **CDN Cached**: Fast delivery worldwide

### Private Files (Course Materials, Videos)
- **Presigned URLs Only**: Temporary signed URLs for access
- **Authentication Required**: Must be logged in and enrolled
- **Time-Limited**: URLs expire after specified time (default 1 hour)
- **No Direct Access**: Cannot be accessed without valid signature

## Security Configuration

### 1. R2 API Tokens
Create a custom API token with minimal permissions:

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Create Custom Token:
   - **Permissions**: 
     - `Cloudflare R2:Edit` for your buckets
   - **Account Resources**: 
     - Include your account
   - **Zone Resources**: 
     - Include your domain (for custom domain)

### 2. Bucket Policies (Optional - Advanced)

For separate buckets, you can set bucket policies:

Public bucket policy (allows public read):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow", 
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::opencourse-public/*"
    }
  ]
}
```

## Testing Your Setup

### 1. Test Upload Functionality

```bash
# Test presigned URL generation
curl -X POST http://localhost:8000/api/uploads/presigned-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-avatar.jpg",
    "mimeType": "image/jpeg", 
    "uploadType": "user_avatar"
  }'
```

### 2. Test Public Access

After uploading a public file, verify direct access:
```bash
curl -I https://cdn.yourdomain.com/public/user_avatar/user123/test-avatar.jpg
```

Should return `200 OK` for public files.

### 3. Test Private Access

Private files should only be accessible via presigned URLs:
```bash
# This should fail (403 Forbidden)
curl -I https://your-bucket.r2.cloudflarestorage.com/private/material_video/user123/video.mp4

# This should work (using presigned URL from API)
curl -I "https://your-bucket.r2.cloudflarestorage.com/private/material_video/user123/video.mp4?X-Amz-Algorithm=..."
```

## Performance Optimization

### 1. Enable Cloudflare Caching
- Public files are automatically cached by Cloudflare CDN
- Set appropriate cache headers in your application

### 2. Use WebP for Images
- Configure your upload validation to prefer WebP format
- Better compression and quality than JPEG/PNG

### 3. Video Optimization
- Consider using Cloudflare Stream for video content
- Implement progressive video loading

## Monitoring and Analytics

### 1. R2 Analytics
- Monitor in Cloudflare Dashboard → R2 Object Storage → Analytics
- Track requests, bandwidth, and storage usage

### 2. Custom Metrics
- Implement upload success/failure tracking
- Monitor response times for presigned URL generation

## Cost Optimization

### 1. Lifecycle Policies
- Set up automatic deletion of failed uploads after 24 hours
- Archive old course materials to cheaper storage classes

### 2. CDN Optimization  
- Leverage Cloudflare's global CDN for public files
- Reduce bandwidth costs through caching

## Troubleshooting

### Common Issues

1. **403 Forbidden on Public Files**
   - Verify custom domain is properly configured
   - Check bucket permissions and public access settings

2. **CORS Errors**
   - Verify CORS policy includes your frontend domains
   - Check preflight request handling

3. **Presigned URL Generation Fails**  
   - Verify R2 credentials and permissions
   - Check bucket names and endpoint URL

4. **Upload Timeout**
   - Increase presigned URL expiry time for large files
   - Implement chunked/multipart uploads for large videos

### Debug Commands

```bash
# Test R2 access
wrangler r2 object list opencourse-storage

# Check CORS configuration
wrangler r2 bucket cors get opencourse-storage

# Test bucket permissions
aws s3 ls s3://opencourse-storage --endpoint-url https://<account-id>.r2.cloudflarestorage.com
```

This setup provides a robust, scalable file storage solution for your OpenCourse platform with proper security boundaries between public and private content.