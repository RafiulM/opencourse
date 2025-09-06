# Cloudflare R2 CORS Configuration

## Issue
The upload service is failing with CORS errors when trying to upload files directly to Cloudflare R2 using presigned URLs.

```
Access to XMLHttpRequest at 'https://...r2.cloudflarestorage.com/...' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution
Configure CORS settings on your Cloudflare R2 bucket to allow cross-origin requests from your frontend application.

## Steps to Fix

### Option 1: Using Cloudflare Dashboard
1. Log into your Cloudflare dashboard
2. Go to R2 Object Storage
3. Select your bucket (`opencourse` based on the error URL)
4. Go to Settings tab
5. Scroll down to CORS policy section
6. Add the following CORS configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-version-id"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### Option 2: Using Wrangler CLI
1. Create a `cors.json` file:
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-version-id"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

2. Apply the CORS configuration:
```bash
wrangler r2 bucket cors set opencourse --cors-file cors.json
```

### Option 3: Using AWS CLI (if R2 is S3-compatible)
```bash
aws s3api put-bucket-cors \
  --bucket opencourse \
  --cors-configuration file://cors.json \
  --endpoint-url https://your-account-id.r2.cloudflarestorage.com
```

## Important Notes

1. **Replace origins**: Update the `AllowedOrigins` array to include:
   - Your development domain (`http://localhost:3000`)
   - Your production domain(s)
   - Any staging environments

2. **Security**: In production, avoid using `"*"` for `AllowedOrigins`. Always specify exact domains.

3. **Headers**: The `AllowedHeaders: ["*"]` allows all headers, but you can be more specific:
   ```json
   "AllowedHeaders": [
     "Content-Type",
     "Content-MD5",
     "Content-Disposition",
     "x-amz-*"
   ]
   ```

4. **Methods**: The configuration includes all necessary HTTP methods for file uploads.

## Testing
After applying the CORS configuration:
1. Wait a few minutes for the changes to propagate
2. Clear your browser cache
3. Try uploading a file again
4. Check the browser's Network tab to confirm the preflight OPTIONS request succeeds

## Verification
You can verify the CORS configuration is working by:
1. Opening browser dev tools
2. Going to Network tab
3. Attempting an upload
4. Checking that the OPTIONS preflight request returns a 200 status
5. Confirming the actual PUT request succeeds

## Troubleshooting
- If still getting CORS errors, double-check the origin URL matches exactly (including protocol and port)
- Ensure there are no trailing slashes in the origin URLs
- Try adding both `http://localhost:3000` and `http://127.0.0.1:3000` if needed
- Check that the bucket name in the configuration matches your actual bucket name