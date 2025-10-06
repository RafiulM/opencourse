# Social Posts Feature - Technical Specification

## Overview

This document outlines the technical specification for implementing a social posts feature that allows users to create and share content (text, images, videos, files) on their profile pages independently of courses. This feature will integrate with the existing upload system and leverage the current database architecture.

## Feature Requirements

### Core Functionality
- Users can create posts containing text (markdown support), images, videos, and files
- Posts are displayed on user profile pages
- Other users can like posts
- Support for multiple media attachments per post
- Public visibility (no course/community restrictions)
- Seamless integration with existing R2 upload system

### User Experience
- Create new posts with rich text editor
- Upload multiple media files per post
- View posts on user profiles
- Like/unlike posts
- Real-time like count updates
- Responsive design for mobile/desktop

## Database Schema Design

### New Tables Required

#### 1. Posts Table (`posts`)
```sql
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  communityId: uuid('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => user.id, { onDelete: 'cascade' }),

  // Content fields
  title: varchar('title', { length: 255 }),
  content: text('content'), // Main text content (markdown supported)
  excerpt: varchar('excerpt', { length: 500 }), // Auto-generated or manual excerpt

  // Visibility and engagement
  isPublished: boolean('is_published').default(true).notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(), // Pinned posts appear first
  isFeatured: boolean('is_featured').default(false).notNull(), // Featured posts in community
  viewCount: integer('view_count').default(0).notNull(),
  likeCount: integer('like_count').default(0).notNull(),
  commentCount: integer('comment_count').default(0).notNull(),

  // SEO and discovery
  slug: varchar('slug', { length: 255 }), // Community-unique slug
  tags: jsonb('tags').default([]), // Array of tag strings

  // Post type and settings
  postType: varchar('post_type', { length: 50 }).default('general'), // general, announcement, discussion, etc.
  allowComments: boolean('allow_comments').default(true).notNull(),
  isModerated: boolean('is_moderated').default(false).notNull(), // Requires moderator approval

  // Metadata
  metadata: jsonb('metadata').default({}), // Additional post metadata

  // Timestamps
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // Soft delete
}, (table) => ({
  communityIdx: index('posts_community_idx').on(table.communityId),
  authorIdx: index('posts_author_idx').on(table.authorId),
  publishedIdx: index('posts_published_idx').on(table.isPublished),
  publishedAtIdx: index('posts_published_at_idx').on(table.publishedAt),
  communitySlugUnique: uniqueIndex('posts_community_slug_unique').on(table.communityId, table.slug),
  likeCountIdx: index('posts_like_count_idx').on(table.likeCount.desc()),
  featuredIdx: index('posts_featured_idx').on(table.isFeatured.desc()),
  postTypeIdx: index('posts_post_type_idx').on(table.postType),
}));
```

#### 2. Post Attachments Table (`post_attachments`)
```sql
export const postAttachmentTypeEnum = pgEnum('post_attachment_type', [
  'image', 'video', 'file', 'audio', 'document'
]);

export const postAttachments = pgTable('post_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  uploadId: uuid('upload_id').notNull().references(() => uploads.id, { onDelete: 'cascade' }),

  // Attachment metadata
  type: postAttachmentTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }), // Optional title for the attachment
  description: text('description'), // Optional description
  caption: text('caption'), // Caption for the attachment

  // Ordering for multiple attachments
  order: integer('order').notNull().default(0),

  // Display settings
  isPrimary: boolean('is_primary').default(false).notNull(), // Primary/thumbnail attachment

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  postIdx: index('post_attachments_post_idx').on(table.postId),
  uploadIdx: index('post_attachments_upload_idx').on(table.uploadId),
  postOrderIdx: index('post_attachments_post_order_idx').on(table.postId, table.order),
  primaryIdx: index('post_attachments_primary_idx').on(table.isPrimary),
}));
```

#### 3. Post Likes Table (`post_likes`)
```sql
export const postLikes = pgTable('post_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),

  // Optional metadata about the like
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniquePostLike: uniqueIndex('post_likes_unique').on(table.postId, table.userId),
  postIdx: index('post_likes_post_idx').on(table.postId),
  userIdx: index('post_likes_user_idx').on(table.userId),
  createdAtIdx: index('post_likes_created_at_idx').on(table.createdAt.desc()),
}));
```

#### 4. Post Comments Table (`post_comments`)
```sql
export const postComments = pgTable('post_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => user.id, { onDelete: 'cascade' }),

  // Comment content
  content: text('content').notNull(), // Plain text or markdown content
  editedContent: text('edited_content'), // Stores previous versions for edit history

  // Thread structure for nested comments
  parentId: uuid('parent_id').references(() => postComments.id, { onDelete: 'cascade' }), // For replies
  level: integer('level').default(0).notNull(), // Nesting level (0 = top-level comment)

  // Moderation and status
  isEdited: boolean('is_edited').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(), // Soft delete
  isReported: boolean('is_reported').default(false).notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(), // Pinned comments appear first

  // Engagement metrics
  likeCount: integer('like_count').default(0).notNull(),
  replyCount: integer('reply_count').default(0).notNull(),

  // Moderation metadata
  moderatedBy: text('moderated_by').references(() => user.id), // Who moderated this comment
  moderatedAt: timestamp('moderated_at', { withTimezone: true }),
  moderationReason: text('moderation_reason'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  postIdx: index('post_comments_post_idx').on(table.postId),
  authorIdx: index('post_comments_author_idx').on(table.authorId),
  parentIdx: index('post_comments_parent_idx').on(table.parentId),
  levelIdx: index('post_comments_level_idx').on(table.level),
  pinnedIdx: index('post_comments_pinned_idx').on(table.isPinned.desc()),
  likeCountIdx: index('post_comments_like_count_idx').on(table.likeCount.desc()),
  createdAtIdx: index('post_comments_created_at_idx').on(table.createdAt.asc()), // Oldest first by default
  deletedIdx: index('post_comments_deleted_idx').on(table.isDeleted),
}));
```

#### 5. Comment Likes Table (`comment_likes`)
```sql
export const commentLikes = pgTable('comment_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  commentId: uuid('comment_id').notNull().references(() => postComments.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),

  // Optional metadata about the like
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueCommentLike: uniqueIndex('comment_likes_unique').on(table.commentId, table.userId),
  commentIdx: index('comment_likes_comment_idx').on(table.commentId),
  userIdx: index('comment_likes_user_idx').on(table.userId),
  createdAtIdx: index('comment_likes_created_at_idx').on(table.createdAt.desc()),
}));
```

#### 6. Update Upload Type Enum
Extend the existing `uploadTypeEnum` in `uploads.ts`:
```typescript
export const uploadTypeEnum = pgEnum('upload_type', [
  'community_avatar',
  'community_banner',
  'course_thumbnail',
  'module_thumbnail',
  'material_video',
  'material_file',
  'material_document',
  'user_avatar',
  'post_attachment' // New type for post attachments
]);
```

### Database Relations
```typescript
// Posts relations
export const postsRelations = relations(posts, ({ one, many }) => ({
  community: one(communities, {
    fields: [posts.communityId],
    references: [communities.id],
  }),
  author: one(user, {
    fields: [posts.authorId],
    references: [user.id],
  }),
  attachments: many(postAttachments),
  likes: many(postLikes),
  comments: many(postComments),
}));

// Post attachments relations
export const postAttachmentsRelations = relations(postAttachments, ({ one }) => ({
  post: one(posts, {
    fields: [postAttachments.postId],
    references: [posts.id],
  }),
  upload: one(uploads, {
    fields: [postAttachments.uploadId],
    references: [uploads.id],
  }),
}));

// Post likes relations
export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(user, {
    fields: [postLikes.userId],
    references: [user.id],
  }),
}));

// Post comments relations
export const postCommentsRelations = relations(postComments, ({ one, many }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  author: one(user, {
    fields: [postComments.authorId],
    references: [user.id],
  }),
  parent: one(postComments, {
    fields: [postComments.parentId],
    references: [postComments.id],
    relationName: 'commentReplies',
  }),
  replies: many(postComments, { relationName: 'commentReplies' }),
  likes: many(commentLikes),
  moderatedByUser: one(user, {
    fields: [postComments.moderatedBy],
    references: [user.id],
  }),
}));

// Comment likes relations
export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(postComments, {
    fields: [commentLikes.commentId],
    references: [postComments.id],
  }),
  user: one(user, {
    fields: [commentLikes.userId],
    references: [user.id],
  }),
}));

// Update communities relations
export const communitiesRelations = relations(communities, ({ one, many }) => ({
  // ... existing relations
  posts: many(posts),
}));

// Update user relations
export const usersRelations = relations(user, ({ many }) => ({
  // ... existing relations
  posts: many(posts),
  postLikes: many(postLikes),
  comments: many(postComments),
  commentLikes: many(commentLikes),
  moderatedComments: many(postComments, {
    fields: [postComments.moderatedBy],
    references: [user.id],
  }),
}));
```

## API Design

### Endpoints

#### Post Management
- `POST /api/communities/:communityId/posts` - Create new post in community
- `GET /api/communities/:communityId/posts` - Get community posts (with pagination, filtering)
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post (author/community moderator only)
- `DELETE /api/posts/:id` - Delete post (author/community admin only)
- `POST /api/posts/:id/publish` - Publish draft post
- `POST /api/posts/:id/pin` - Pin/unpin post (community moderator only)
- `POST /api/posts/:id/feature` - Feature/unfeature post (community admin only)

#### Post Attachments
- `POST /api/posts/:id/attachments` - Add attachment to post
- `DELETE /api/posts/:id/attachments/:attachmentId` - Remove attachment
- `PUT /api/posts/:id/attachments/:attachmentId` - Update attachment metadata

#### Post Engagement
- `POST /api/posts/:id/like` - Like post
- `DELETE /api/posts/:id/like` - Unlike post
- `GET /api/posts/:id/likes` - Get post likes (with pagination)

#### Comment Management
- `POST /api/posts/:postId/comments` - Create comment on post
- `GET /api/posts/:postId/comments` - Get comments for post (with pagination, threading)
- `GET /api/comments/:id` - Get specific comment
- `PUT /api/comments/:id` - Update comment (author only)
- `DELETE /api/comments/:id` - Delete comment (author/admin/moderator only)
- `POST /api/comments/:id/pin` - Pin/unpin comment (author/admin/moderator only)
- `POST /api/comments/:id/report` - Report comment for moderation
- `POST /api/comments/:id/moderate` - Moderate comment (admin/moderator only)

#### Comment Replies
- `POST /api/comments/:commentId/replies` - Reply to comment
- `GET /api/comments/:commentId/replies` - Get replies to comment (with pagination)

#### Comment Engagement
- `POST /api/comments/:id/like` - Like comment
- `DELETE /api/comments/:id/like` - Unlike comment
- `GET /api/comments/:id/likes` - Get comment likes (with pagination)

#### Community-Specific Endpoints
- `GET /api/communities/:communityId/posts` - Get community posts
- `GET /api/communities/:communityId/posts/featured` - Get featured community posts
- `GET /api/communities/:communityId/posts/pinned` - Get pinned community posts
- `GET /api/communities/:communityId/posts/announcements` - Get community announcements

#### User-Specific Endpoints
- `GET /api/users/:userId/posts` - Get user's posts
- `GET /api/users/:userId/posts/communities/:communityId` - Get user's posts in specific community
- `GET /api/users/:userId/liked-posts` - Get posts liked by user
- `GET /api/users/:userId/comments` - Get user's comments
- `GET /api/users/:userId/liked-comments` - Get comments liked by user

### Request/Response Schemas

#### Create Post Request
```typescript
interface CreatePostRequest {
  communityId: string; // Required community association
  title?: string;
  content?: string; // Markdown content
  excerpt?: string;
  postType?: 'general' | 'announcement' | 'discussion' | 'resource';
  tags?: string[];
  allowComments?: boolean;
  attachments?: Array<{
    uploadId: string;
    type: 'image' | 'video' | 'file' | 'audio' | 'document';
    title?: string;
    description?: string;
    caption?: string;
    order?: number;
    isPrimary?: boolean;
  }>;
  isPublished?: boolean;
}
```

#### Post Response
```typescript
interface PostResponse {
  id: string;
  communityId: string;
  community: {
    id: string;
    name: string;
    slug: string;
  };
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  title?: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  postType: 'general' | 'announcement' | 'discussion' | 'resource';
  tags: string[];
  isPublished: boolean;
  isPinned: boolean;
  isFeatured: boolean;
  allowComments: boolean;
  isModerated: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  attachments: PostAttachmentResponse[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
```

#### Create Comment Request
```typescript
interface CreateCommentRequest {
  content: string; // Plain text or markdown
  parentId?: string; // For replies to other comments
}
```

#### Comment Response
```typescript
interface CommentResponse {
  id: string;
  postId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  content: string;
  editedContent?: string;
  parentId?: string;
  level: number;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  isReported: boolean;
  likeCount: number;
  replyCount: number;
  replies?: CommentResponse[]; // For nested threading
  moderatedBy?: {
    id: string;
    name: string;
  };
  moderatedAt?: string;
  moderationReason?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Service Layer Design

### PostService
```typescript
class PostService {
  // Create new post with attachments in community
  async createPost(authorId: string, communityId: string, data: CreatePostRequest): Promise<PostResponse>

  // Get community posts with filtering and pagination
  async getCommunityPosts(communityId: string, options: PostQueryOptions): Promise<PaginatedResponse<PostResponse>>

  // Get posts across communities (admin/moderator use)
  async getPosts(options: PostQueryOptions): Promise<PaginatedResponse<PostResponse>>

  // Get single post by ID
  async getPostById(id: string): Promise<PostResponse | null>

  // Update post (author/community moderator only)
  async updatePost(id: string, userId: string, data: UpdatePostRequest): Promise<PostResponse>

  // Delete post (author/community admin only)
  async deletePost(id: string, userId: string): Promise<void>

  // Like/unlike post
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }>

  // Pin/unpin post (community moderator only)
  async togglePinPost(id: string, userId: string): Promise<{ isPinned: boolean }>

  // Feature/unfeature post (community admin only)
  async toggleFeaturePost(id: string, userId: string): Promise<{ isFeatured: boolean }>

  // Get user's posts
  async getUserPosts(userId: string, options: PostQueryOptions): Promise<PaginatedResponse<PostResponse>>

  // Get user's posts in specific community
  async getUserPostsInCommunity(userId: string, communityId: string, options: PostQueryOptions): Promise<PaginatedResponse<PostResponse>>

  // Get user's liked posts
  async getUserLikedPosts(userId: string, options: PostQueryOptions): Promise<PaginatedResponse<PostResponse>>

  // Increment view count
  async incrementViewCount(postId: string): Promise<void>

  // Check user permissions for post actions
  async checkPostPermissions(postId: string, userId: string): Promise<{
    canEdit: boolean;
    canDelete: boolean;
    canModerate: boolean;
    canAdmin: boolean;
  }>
}
```

### PostAttachmentService
```typescript
class PostAttachmentService {
  // Add attachment to post
  async addAttachment(postId: string, data: AddAttachmentRequest): Promise<PostAttachmentResponse>

  // Remove attachment from post
  async removeAttachment(postId: string, attachmentId: string): Promise<void>

  // Update attachment metadata
  async updateAttachment(attachmentId: string, data: UpdateAttachmentRequest): Promise<PostAttachmentResponse>

  // Reorder attachments
  async reorderAttachments(postId: string, attachmentOrders: Array<{ id: string; order: number }>): Promise<void>
}
```

### CommentService
```typescript
class CommentService {
  // Create new comment
  async createComment(postId: string, authorId: string, data: CreateCommentRequest): Promise<CommentResponse>

  // Get comments for post with threading
  async getPostComments(postId: string, options: CommentQueryOptions): Promise<PaginatedResponse<CommentResponse>>

  // Get single comment by ID
  async getCommentById(id: string): Promise<CommentResponse | null>

  // Update comment (author only)
  async updateComment(id: string, userId: string, data: UpdateCommentRequest): Promise<CommentResponse>

  // Delete comment (author/admin/moderator only)
  async deleteComment(id: string, userId: string, role?: string): Promise<void>

  // Like/unlike comment
  async toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; likeCount: number }>

  // Pin/unpin comment (author/admin/moderator only)
  async togglePinComment(id: string, userId: string, role?: string): Promise<{ isPinned: boolean }>

  // Report comment for moderation
  async reportComment(id: string, reporterId: string, reason?: string): Promise<void>

  // Moderate comment (admin/moderator only)
  async moderateComment(
    id: string,
    moderatorId: string,
    action: 'delete' | 'restore' | 'clear_report',
    reason?: string
  ): Promise<CommentResponse>

  // Get replies to comment
  async getCommentReplies(commentId: string, options: CommentQueryOptions): Promise<PaginatedResponse<CommentResponse>>

  // Get user's comments
  async getUserComments(userId: string, options: CommentQueryOptions): Promise<PaginatedResponse<CommentResponse>>

  // Get user's liked comments
  async getUserLikedComments(userId: string, options: CommentQueryOptions): Promise<PaginatedResponse<CommentResponse>>

  // Get reported comments for moderation
  async getReportedComments(options: CommentQueryOptions): Promise<PaginatedResponse<CommentResponse>>
}
```

## File Upload Integration

### Upload Flow for Posts
1. Client uploads files to R2 via existing upload service with `uploadType: 'post_attachment'`
2. Upload service returns upload record with metadata
3. When creating post, include upload IDs in attachments array
4. Post service creates post and associated attachment records

### File Type Support
- **Images**: JPEG, PNG, GIF, WebP (automatic thumbnails)
- **Videos**: MP4, WebM, MOV (thumbnail generation)
- **Documents**: PDF, DOC, DOCX, PPT, PPTX (preview generation)
- **Audio**: MP3, WAV, OGG
- **Files**: Any file type with proper metadata

### File Size Limits
- Images: 10MB
- Videos: 500MB
- Documents: 50MB
- Other files: 100MB

## Frontend Integration Points

### Components Needed
- `CommunityPostEditor` - Rich text editor with community context
- `CommunityPostFeed` - Community posts feed with filtering
- `PostCard` - Display post in feed/grid
- `PostDetail` - Full post view
- `PostAttachments` - Handle media display
- `LikeButton` - Like/unlike functionality
- `UserProfilePosts` - User's posts section
- `CommunityFeaturedPosts` - Featured posts in community
- `CommunityAnnouncements` - Community announcements section
- `CommentSection` - Comments display and management
- `CommentForm` - Create/edit comment form
- `CommentItem` - Individual comment display
- `CommentThread` - Nested comment threading
- `CommentModeration` - Admin moderation tools
- `CommentReactions` - Comment likes and reactions

### State Management
- Community posts feed state
- Individual post state
- User posts state
- Community-specific post states
- Like states (optimistic updates)
- Comments state (threaded)
- Comment pagination and infinite scroll
- Real-time comment updates (WebSocket optional)
- Moderation queue state
- Community permission states

## Security Considerations

### Access Control
- Only post authors can edit/delete their posts
- Community moderators can pin/unpin posts in their communities
- Community admins can feature/unfeature posts and delete posts
- Only authenticated users can like posts and comments
- Public read access to published posts and comments (based on community privacy)
- Soft delete for posts and comments (retains URLs)
- Role-based permissions (author, community admin, community moderator, global admin)
- Community membership verification for post creation
- Post type restrictions (e.g., only admins can create announcements)

### Content Moderation
- Content validation for markdown input in posts and comments
- File type validation for uploads
- Size limits enforced
- Rate limiting for post creation, likes, and comments
- Comment reporting system
- Moderation queue for reported content
- Automated spam detection (optional)
- Comment filtering and word blocking

### Privacy
- User control over post visibility
- Option to unpublish posts
- Attachment access control

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried fields (including communityId)
- Pagination for large result sets
- Efficient join queries for post with attachments and comments
- Caching for popular posts and comment threads
- Community-specific caching strategies
- Optimized threading queries for nested comments
- Comment count denormalization for performance
- Community feed optimization with sorting by pinned/featured status

### File Delivery
- CDN integration for media files
- Lazy loading for attachments
- Responsive image delivery
- Video streaming optimization

### Comment Performance
- Efficient threading algorithms for nested comments
- Comment pagination with infinite scroll
- Real-time updates via WebSockets (optional)
- Comment caching strategies
- Optimized like count aggregation

## Implementation Phases

### Phase 1: Core Functionality
- Database schema implementation with community linking
- Basic CRUD operations for community posts
- Community membership verification
- File upload integration
- Simple community post display
- Basic post types (general, announcement)

### Phase 2: Engagement Features
- Like/unlike functionality for posts and comments
- View counting
- Community-specific user profiles integration
- Basic search/filtering within communities
- Comment threading and pagination
- Comment likes
- Community post pinning and featuring

### Phase 3: Advanced Features
- Rich text editor for posts and comments
- Advanced media handling
- Community tagging system
- Community-specific SEO optimization
- Analytics integration with community insights
- Comment moderation tools
- Real-time updates (WebSockets)
- Community announcement system

### Phase 4: Performance & Scaling
- Caching implementation for community feeds
- CDN optimization
- Advanced search across communities
- Content recommendations within communities
- Performance optimization for high-volume comment threads
- Advanced moderation features
- Community analytics dashboard

## Migration Strategy

### Database Migration
```sql
-- Create new tables
CREATE TABLE posts (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  -- ... other fields
);
CREATE TABLE post_attachments (...);
CREATE TABLE post_likes (...);
CREATE TABLE post_comments (...);
CREATE TABLE comment_likes (...);

-- Update upload type enum
ALTER TYPE upload_type ADD VALUE 'post_attachment';

-- Create indexes with community focus
CREATE INDEX posts_community_idx ON posts(community_id);
CREATE INDEX posts_community_published_idx ON posts(community_id, is_published);
CREATE INDEX posts_community_pinned_idx ON posts(community_id, is_pinned DESC);
CREATE UNIQUE INDEX posts_community_slug_unique ON posts(community_id, slug);

-- Add comment count to posts (for performance)
ALTER TABLE posts ADD COLUMN comment_count integer DEFAULT 0;

-- Create triggers for updating comment counts
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comment_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Add post count to communities (for stats)
ALTER TABLE communities ADD COLUMN post_count integer DEFAULT 0;

CREATE TRIGGER trigger_update_community_post_count
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_community_post_count();
```

### Code Changes
- Add new schema files to `apps/backend/src/db/schema/`
- Update schema exports to include comment schemas and community relations
- Add new services (CommentService) and routes with community context
- Update upload validation to include post attachments
- Add middleware for comment moderation and rate limiting
- Update PostService to include community permission checking
- Add community membership verification middleware
- Update community service to handle posts count
- Add community-specific post filtering and sorting

## Testing Strategy

### Unit Tests
- Service layer functionality (PostService, CommentService)
- Database operations and relations
- Validation logic for posts and comments
- File upload integration
- Comment threading algorithms
- Moderation logic

### Integration Tests
- API endpoint testing for all community post and comment routes
- Database relationships and cascading deletes with community context
- File upload flow with attachments
- Like/unlike functionality for posts and comments
- Comment threading and pagination
- Moderation workflow
- Community permission testing
- Community membership verification

### End-to-End Tests
- Complete community post creation flow with comments
- User interaction scenarios within communities
- Community moderation workflow testing
- File upload scenarios with multiple attachments
- Performance testing with high comment volume in communities
- Cross-community permission testing
- Real-time updates (if implemented)

## Monitoring & Analytics

### Metrics to Track
- Post creation rate per community
- Like engagement rate (posts and comments) by community
- File upload success/failure
- Popular content trends within communities
- User activity patterns across communities
- Comment engagement metrics
- Thread depth and interaction patterns
- Moderation queue volume and resolution time
- Report frequency and false positive rates
- Real-time engagement (if implemented)
- Community health metrics (posts per member, engagement rates)
- Cross-community participation patterns

### Error Handling
- Comprehensive error logging for posts and comments
- Graceful degradation for file uploads and comment submission
- User-friendly error messages with internationalization support
- Retry mechanisms for failed operations
- Comment thread error recovery
- Moderation action audit trails
- Rate limiting and spam prevention fallbacks

This specification provides a comprehensive foundation for implementing community-based social posts with full commenting functionality while maintaining consistency with the existing codebase architecture and leveraging the current upload system. The system is designed to integrate seamlessly with your existing community structure, providing rich social interaction features including post types, moderation tools, nested threading, and community-specific engagement tracking. This creates a robust platform for community-driven content sharing and discussion.