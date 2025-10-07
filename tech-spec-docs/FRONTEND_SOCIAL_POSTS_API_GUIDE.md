# Frontend Integration Guide - Social Posts Feature

## Overview
This document provides comprehensive API integration details for frontend developers implementing the social posts feature. It includes all available endpoints, request/response formats, authentication requirements, and usage examples.

## Base URL
```
https://your-api-domain.com/api
```

## Authentication
Most endpoints require authentication using Bearer tokens in the Authorization header:
```
Authorization: Bearer <user-token>
```

## Content Types
- `application/json` for JSON data
- `multipart/form-data` for file uploads

---

## Posts API

### 1. Get Posts (Admin/Global Feed)
**Endpoint**: `GET /posts`

**Description**: Retrieve posts across all communities (admin/moderator use)

**Authentication**: Required

**Query Parameters**:
```typescript
{
  page?: number;           // Default: 1
  pageSize?: number;       // Default: 20, Max: 100
  communityId?: string;    // Filter by community ID
  authorId?: string;       // Filter by author ID
  postType?: 'general' | 'announcement' | 'discussion' | 'resource';
  isPublished?: boolean;   // Filter by published status
  search?: string;         // Search in title, content, excerpt
  sort?: string;           // Format: "field:order", Default: "createdAt:desc"
  sortOptions?: string[];  // Multiple sort options as comma-separated values
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "uuid",
        "title": "Post Title",
        "content": "Post content in markdown",
        "excerpt": "Brief excerpt",
        "slug": "post-slug",
        "postType": "general",
        "isPublished": true,
        "isPinned": false,
        "isFeatured": false,
        "allowComments": true,
        "likesCount": 42,
        "commentsCount": 15,
        "viewsCount": 150,
        "attachments": [
          {
            "id": "uuid",
            "uploadId": "uuid",
            "type": "image",
            "title": "Image Title",
            "description": "Image description",
            "caption": "Image caption",
            "order": 1,
            "isPrimary": true,
            "upload": {
              "id": "uuid",
              "filename": "image.jpg",
              "originalName": "original.jpg",
              "mimeType": "image/jpeg",
              "size": 1024000,
              "url": "https://cdn.example.com/image.jpg",
              "thumbnailUrl": "https://cdn.example.com/thumb.jpg"
            }
          }
        ],
        "tags": ["tag1", "tag2"],
        "author": {
          "id": "uuid",
          "name": "Author Name",
          "email": "author@example.com",
          "image": "https://cdn.example.com/avatar.jpg"
        },
        "community": {
          "id": "uuid",
          "name": "Community Name",
          "slug": "community-slug",
          "avatarUrl": "https://cdn.example.com/community.jpg"
        },
        "userInteraction": {
          "liked": false,
          "canEdit": false,
          "canDelete": false,
          "canModerate": false
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "publishedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Posts retrieved successfully"
}
```

### 2. Get Post by ID
**Endpoint**: `GET /posts/{id}`

**Description**: Retrieve a specific post by ID

**Authentication**: Optional (required for view count increment)

**Path Parameters**:
- `id`: Post ID (UUID)

**Response**: Same structure as individual post in the list above

### 3. Create Post (in Community)
**Endpoint**: `POST /communities/{communityId}/posts`

**Description**: Create a new post in a specific community

**Authentication**: Required

**Path Parameters**:
- `communityId`: Community ID (UUID)

**Request Body**:
```json
{
  "title": "string (required)",
  "content": "string (markdown, required)",
  "excerpt": "string (optional)",
  "slug": "string (optional, auto-generated if not provided)",
  "postType": "general | announcement | discussion | resource (default: general)",
  "tags": ["string"] (optional),
  "allowComments": true (default: true),
  "isPublished": false (default: false, creates draft),
  "attachments": [
    {
      "uploadId": "uuid (required)",
      "type": "image | video | file | audio | document (required)",
      "title": "string (optional)",
      "description": "string (optional)",
      "caption": "string (optional)",
      "order": "number (required)",
      "isPrimary": false (default: false)
    }
  ] (optional)
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Post object (same structure as in GET endpoints)
  },
  "message": "Post created successfully"
}
```

### 4. Update Post
**Endpoint**: `PUT /posts/{id}`

**Description**: Update an existing post (author/community moderator only)

**Authentication**: Required

**Path Parameters**:
- `id`: Post ID (UUID)

**Request Body**: Same structure as create post, but all fields are optional

**Response**: Same as create post

### 5. Delete Post
**Endpoint**: `DELETE /posts/{id}`

**Description**: Delete a post (author/community admin only)

**Authentication**: Required

**Path Parameters**:
- `id`: Post ID (UUID)

**Response**:
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

### 6. Publish Post
**Endpoint**: `POST /posts/{id}/publish`

**Description**: Publish a draft post

**Authentication**: Required

**Path Parameters**:
- `id`: Post ID (UUID)

**Response**: Same as update post

### 7. Toggle Pin Post
**Endpoint**: `POST /posts/{id}/pin`

**Description**: Pin or unpin a post (community moderator only)

**Authentication**: Required

**Path Parameters**:
- `id`: Post ID (UUID)

**Response**:
```json
{
  "success": true,
  "data": {
    "isPinned": true
  },
  "message": "Post pinned successfully"
}
```

### 8. Toggle Feature Post
**Endpoint**: `POST /posts/{id}/feature`

**Description**: Feature or unfeature a post (community admin only)

**Authentication**: Required

**Path Parameters**:
- `id`: Post ID (UUID)

**Response**:
```json
{
  "success": true,
  "data": {
    "isFeatured": true
  },
  "message": "Post featured successfully"
}
```

### 9. Toggle Like Post
**Endpoint**: `POST /posts/{id}/like`

**Description**: Like or unlike a post

**Authentication**: Required

**Path Parameters**:
- `id`: Post ID (UUID)

**Response**:
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likesCount": 43
  },
  "message": "Post liked successfully"
}
```

### 10. Get Post Likes
**Endpoint**: `GET /posts/{id}/likes`

**Description**: Get users who liked a post (with pagination)

**Authentication**: Optional

**Path Parameters**:
- `id`: Post ID (UUID)

**Query Parameters**:
```typescript
{
  page?: number;        // Default: 1
  pageSize?: number;    // Default: 20
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "likes": [
      {
        "user": {
          "id": "uuid",
          "name": "User Name",
          "email": "user@example.com",
          "image": "https://cdn.example.com/avatar.jpg"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "totalCount": 43,
    "totalPages": 3,
    "currentPage": 1,
    "pageSize": 20
  },
  "message": "Post likes retrieved successfully"
}
```

---

## Community Posts API

### 1. Get Community Posts
**Endpoint**: `GET /communities/{communityId}/posts`

**Description**: Retrieve posts from a specific community

**Authentication**: Optional

**Path Parameters**:
- `communityId`: Community ID (UUID)

**Query Parameters**:
```typescript
{
  page?: number;           // Default: 1
  pageSize?: number;       // Default: 20
  authorId?: string;       // Filter by author ID
  postType?: 'general' | 'announcement' | 'discussion' | 'resource';
  isPinned?: boolean;      // Filter by pinned status
  isFeatured?: boolean;    // Filter by featured status
  tags?: string;           // Comma-separated tags
  search?: string;         // Search in title, content, excerpt
  sort?: string;           // Format: "field:order", Default: "createdAt:desc"
}
```

**Response**: Same as global posts API

### 2. Get Featured Community Posts
**Endpoint**: `GET /communities/{communityId}/posts/featured`

**Description**: Get featured posts from a community

**Authentication**: Optional

**Path Parameters**:
- `communityId`: Community ID (UUID)

**Query Parameters**:
```typescript
{
  page?: number;        // Default: 1
  pageSize?: number;    // Default: 10
}
```

**Response**: Same as community posts API

### 3. Get Pinned Community Posts
**Endpoint**: `GET /communities/{communityId}/posts/pinned`

**Description**: Get pinned posts from a community

**Authentication**: Optional

**Path Parameters**:
- `communityId`: Community ID (UUID)

**Query Parameters**:
```typescript
{
  page?: number;        // Default: 1
  pageSize?: number;    // Default: 10
}
```

**Response**: Same as community posts API

### 4. Get Community Announcements
**Endpoint**: `GET /communities/{communityId}/posts/announcements`

**Description**: Get announcement posts from a community

**Authentication**: Optional

**Path Parameters**:
- `communityId`: Community ID (UUID)

**Query Parameters**:
```typescript
{
  page?: number;        // Default: 1
  pageSize?: number;    // Default: 10
}
```

**Response**: Same as community posts API

---

## Comments API

### 1. Get Comments for Post
**Endpoint**: `GET /posts/{postId}/comments`

**Description**: Get comments for a post (with threading support)

**Authentication**: Optional

**Path Parameters**:
- `postId`: Post ID (UUID)

**Query Parameters**:
```typescript
{
  page?: number;           // Default: 1
  pageSize?: number;       // Default: 20
  sortBy?: 'createdAt' | 'likesCount' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  includeReplies?: boolean; // Default: true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "uuid",
        "content": "Comment content",
        "postId": "uuid",
        "authorId": "uuid",
        "parentId": null,         // null for top-level comments
        "isEdited": false,
        "isDeleted": false,
        "isReported": false,
        "reportsCount": 0,
        "likesCount": 5,
        "repliesCount": 3,
        "author": {
          "id": "uuid",
          "name": "Author Name",
          "email": "author@example.com",
          "image": "https://cdn.example.com/avatar.jpg"
        },
        "userInteraction": {
          "liked": false,
          "canEdit": false,
          "canDelete": false,
          "canModerate": false
        },
        "replies": [
          // Nested comment objects with same structure
        ],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 50,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Comments retrieved successfully"
}
```

### 2. Create Comment
**Endpoint**: `POST /posts/{postId}/comments`

**Description**: Create a new comment on a post

**Authentication**: Required

**Path Parameters**:
- `postId`: Post ID (UUID)

**Request Body**:
```json
{
  "content": "string (required, max 2000 chars)",
  "parentId": "uuid (optional, for replies)"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Comment object (same structure as in GET endpoints)
  },
  "message": "Comment created successfully"
}
```

### 3. Update Comment
**Endpoint**: `PUT /comments/{id}`

**Description**: Update a comment (author only)

**Authentication**: Required

**Path Parameters**:
- `id`: Comment ID (UUID)

**Request Body**:
```json
{
  "content": "string (required, max 2000 chars)"
}
```

**Response**: Same as create comment

### 4. Delete Comment
**Endpoint**: `DELETE /comments/{id}`

**Description**: Delete a comment (author/community admin only)

**Authentication**: Required

**Path Parameters**:
- `id`: Comment ID (UUID)

**Response**:
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

### 5. Toggle Like Comment
**Endpoint**: `POST /comments/{id}/like`

**Description**: Like or unlike a comment

**Authentication**: Required

**Path Parameters**:
- `id`: Comment ID (UUID)

**Response**:
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likesCount": 6
  },
  "message": "Comment liked successfully"
}
```

### 6. Report Comment
**Endpoint**: `POST /comments/{id}/report`

**Description**: Report a comment for moderation

**Authentication**: Required

**Path Parameters**:
- `id`: Comment ID (UUID)

**Request Body**:
```json
{
  "reason": "string (optional, max 500 chars)"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Comment reported successfully"
}
```

### 7. Moderate Comment
**Endpoint**: `POST /comments/{id}/moderate`

**Description**: Moderate a reported comment (community admin only)

**Authentication**: Required

**Path Parameters**:
- `id`: Comment ID (UUID)

**Request Body**:
```json
{
  "action": "delete | restore | clear_report",
  "reason": "string (optional, for audit trail)"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Updated comment object
  },
  "message": "Comment moderated successfully"
}
```

### 8. Reply to Comment
**Endpoint**: `POST /comments/{id}/reply`

**Description**: Reply to a specific comment

**Authentication**: Required

**Path Parameters**:
- `id`: Parent comment ID (UUID)

**Request Body**:
```json
{
  "content": "string (required, max 2000 chars)"
}
```

**Response**: Same as create comment

---

## Error Response Format

All endpoints may return error responses in this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (optional)"
  }
}
```

### Common Error Codes:
- `UNAUTHORIZED` (401): User not authenticated
- `FORBIDDEN` (403): User lacks permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid input data
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

### Example Error Response:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required and must be between 1 and 200 characters",
    "details": "Field: title, Value: ''"
  }
}
```

---

## Usage Examples

### Example 1: Creating a Post with Attachments

```javascript
// First upload files (if any)
const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  },
  body: formData
});
const uploadData = await uploadResponse.json();

// Then create the post
const postData = {
  title: "My Amazing Post",
  content: "# Hello World\n\nThis is **markdown** content!",
  excerpt: "A brief description of my post",
  postType: "discussion",
  tags: ["javascript", "web-development"],
  attachments: uploadData.uploads.map((upload, index) => ({
    uploadId: upload.id,
    type: upload.type.startsWith('image/') ? 'image' : 'file',
    title: upload.originalName,
    order: index,
    isPrimary: index === 0
  })),
  isPublished: true
};

const postResponse = await fetch(`/api/communities/${communityId}/posts`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(postData)
});
```

### Example 2: Loading Community Posts with Filters

```javascript
const loadPosts = async (communityId, filters = {}) => {
  const params = new URLSearchParams({
    page: filters.page || 1,
    pageSize: filters.pageSize || 20,
    ...(filters.postType && { postType: filters.postType }),
    ...(filters.search && { search: filters.search }),
    ...(filters.tags && { tags: filters.tags.join(',') }),
    ...(filters.sort && { sort: filters.sort })
  });

  const response = await fetch(`/api/communities/${communityId}/posts?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

### Example 3: Implementing Comment Threading

```javascript
const loadComments = async (postId, page = 1) => {
  const response = await fetch(`/api/posts/${postId}/comments?page=${page}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  // Process comments to build thread structure
  const comments = data.data.comments;
  const topLevelComments = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  // Attach replies to their parent comments
  topLevelComments.forEach(comment => {
    comment.replies = replies.filter(r => r.parentId === comment.id);
  });

  return topLevelComments;
};
```

---

## Rate Limiting

API endpoints may be rate-limited to prevent abuse. Typical limits:
- Post creation: 5 per minute per user
- Comment creation: 20 per minute per user
- Like/unlike actions: 100 per minute per user
- Read operations: 1000 per minute per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

---

## File Upload Integration

Posts support file attachments through the existing upload system:

1. Upload files to `/api/upload` (multipart/form-data)
2. Use returned upload IDs in post creation/update
3. Supported attachment types: `image`, `video`, `file`, `audio`, `document`
4. Multiple attachments per post supported
5. Each attachment can be marked as primary (for display purposes)

For more details on file uploads, refer to the existing upload API documentation.