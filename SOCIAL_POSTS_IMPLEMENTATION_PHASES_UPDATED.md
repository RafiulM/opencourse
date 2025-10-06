# Social Posts Implementation Phases (Updated)

## Overview
This document outlines a phased approach to implementing the social posts feature, based on the actual application routing structure. The implementation follows the existing pattern where all admin/CRUD functions are under `/dashboard/admin/` routes, while `/communities/[id]/` routes are for public-facing content.

## Current Application Structure Analysis

### Admin Dashboard Routes (`/dashboard/admin/`)
```
app/dashboard/admin/
├── page.tsx                    # Admin dashboard home
├── layout.tsx                  # Admin layout
├── communities/
│   ├── page.tsx               # Communities list
│   ├── [id]/page.tsx          # Community details
│   ├── [id]/edit/page.tsx     # Edit community
│   └── new/page.tsx           # Create community
├── courses/
│   ├── page.tsx               # Courses list
│   ├── [id]/page.tsx          # Course details
│   ├── [id]/edit/page.tsx     # Edit course
│   └── new/page.tsx           # Create course
├── modules/
│   ├── page.tsx               # Modules list
│   ├── [id]/page.tsx          # Module details
│   ├── [id]/edit/page.tsx     # Edit module
│   └── new/page.tsx           # Create module
└── materials/
    ├── page.tsx               # Materials list
    ├── [id]/page.tsx          # Material details
    ├── [id]/edit/page.tsx     # Edit material
    └── new/page.tsx           # Create material
```

### Public Community Routes (`/communities/[id]/`)
```
app/communities/[id]/
├── page.tsx                    # Community home (public view)
├── courses/
│   └── [courseId]/page.tsx    # Course detail (public view)
└── courses/                   # Additional course routes
```

---

## Phase 1: Admin Dashboard CRUD (Week 1-2)

### Objective
Establish complete admin management capabilities for posts and comments within the existing dashboard structure.

### 🎯 Phase Goals
- Admins can view, create, edit, and delete posts across all communities
- Admins can moderate all comments and manage user content
- Complete backend API integration with frontend
- Follow existing dashboard patterns and layouts

### 📋 Tasks & Implementation

#### 1.1 Admin Posts Management
**New Files to Create**:
```
app/dashboard/admin/posts/
├── page.tsx                   # Posts list (follow communities pattern)
├── [id]/page.tsx             # Post details (follow courses pattern)
├── [id]/edit/page.tsx        # Edit post (follow communities pattern)
└── new/page.tsx              # Create post (follow communities pattern)
```

**Components to Create**:
```typescript
// components/admin/posts/PostsManagement.tsx
interface PostsManagementProps {
  // Follow existing admin component patterns
}

// components/admin/posts/PostTable.tsx
interface PostTableProps {
  posts: Post[];
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onTogglePublish: (post: Post) => void;
  onToggleFeature: (post: Post) => void;
  onTogglePin: (post: Post) => void;
}
```

**Features**:
- View all posts across communities
- Filter by community, author, post type, status
- Search posts by title and content
- Sort by date, engagement, status
- Bulk actions (publish, unpublish, delete, feature, pin)
- Quick actions dropdown
- Pagination with configurable page sizes

#### 1.2 Admin Comments Management
**New Files to Create**:
```
app/dashboard/admin/comments/
├── page.tsx                   # Comments moderation list
└── [id]/page.tsx             # Comment details with context
```

**Components to Create**:
```typescript
// components/admin/comments/CommentsManagement.tsx
interface CommentsManagementProps {
  // Follow existing admin component patterns
}

// components/admin/comments/CommentTable.tsx
interface CommentTableProps {
  comments: Comment[];
  onApprove: (comment: Comment) => void;
  onReject: (comment: Comment) => void;
  onDelete: (comment: Comment) => void;
  onReply: (comment: Comment) => void;
}
```

**Features**:
- View all comments with reported status
- Filter by status (all, reported, approved, rejected)
- Search comments by content
- View comment context (post and parent comment)
- Bulk moderation actions
- Reply to comments
- Delete offensive content

#### 1.3 Update Admin Dashboard Home
**File**: `app/dashboard/admin/page.tsx`

**Changes Required**:
- Add "Posts" to management sections (follow Communities/Courses pattern)
- Add "Comments" to management sections
- Add post/comment statistics to stats cards
- Add quick actions for post creation
- Add recent post/comment activity

**Add to Management Sections**:
```typescript
// Add to existing management sections grid
<Card>
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      Posts
      <Link href="/dashboard/admin/posts">
        <Button variant="outline" size="sm">
          View All
        </Button>
      </Link>
    </CardTitle>
    <CardDescription>
      Manage social posts across communities
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Recent posts list */}
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      Comments
      <Link href="/dashboard/admin/comments">
        <Button variant="outline" size="sm">
          Moderate
        </Button>
      </Link>
    </CardTitle>
    <CardDescription>
      Moderate user comments
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Recent comments needing moderation */}
  </CardContent>
</Card>
```

#### 1.4 Update Admin Layout Navigation
**File**: `app/dashboard/admin/layout.tsx`

**Changes Required**:
- Add "Posts" to admin navigation (follow existing pattern)
- Add "Comments" to admin navigation
- Update navigation icons and labels

#### 1.5 State Management Setup
**File**: `hooks/use-admin-posts.ts` & `hooks/use-admin-comments.ts`

**Admin Posts Hooks**:
```typescript
export function useAdminPosts(filters: AdminPostFilters = {}) {
  return useQuery({
    queryKey: queryKeys.posts.adminList(filters),
    queryFn: () => apiClient.getAdminPosts(filters),
  });
}

export function useCreateAdminPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdminPostRequest) => apiClient.createAdminPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.adminLists() });
    },
  });
}

export function useBulkPostActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ action, postIds }: { action: string; postIds: string[] }) =>
      apiClient.bulkPostActions(action, postIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.adminLists() });
    },
  });
}
```

### 🔧 API Client Extensions
**File**: `lib/api-client.ts` (Add admin methods)

```typescript
// Admin-specific methods - follow existing pattern
async getAdminPosts(filters: AdminPostFilters = {}): Promise<PostListResponse> {
  // Add admin-specific filters and permissions
}

async createAdminPost(data: CreateAdminPostRequest): Promise<ApiResponse<Post>> {
  // Allow admins to create posts in any community
}

async getAdminPost(id: string): Promise<ApiResponse<Post>> {
  return this.request<ApiResponse<Post>>(`/dashboard/admin/posts/${id}`);
}

async updateAdminPost(data: UpdateAdminPostRequest): Promise<ApiResponse<Post>> {
  return this.request<ApiResponse<Post>>(`/dashboard/admin/posts/${data.id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async deleteAdminPost(id: string): Promise<ApiResponse<void>> {
  return this.request<ApiResponse<void>>(`/dashboard/admin/posts/${id}`, {
    method: 'DELETE',
  });
}

async bulkPostActions(action: string, postIds: string[]): Promise<ApiResponse<void>> {
  // Bulk operations for admin management
}

async getAdminComments(filters: AdminCommentFilters = {}): Promise<CommentListResponse> {
  // Admin view of all comments with moderation status
}

async moderateComments(commentIds: string[], action: string): Promise<ApiResponse<void>> {
  // Bulk comment moderation
}
```

---

## Phase 2: Public Community Posts Feed (Week 3-4)

### Objective
Implement community-level post viewing and interaction for regular users.

### 🎯 Phase Goals
- Community members can view posts within their communities
- Basic post interaction features (view, like, comment)
- Community moderators can manage posts within their communities
- Integration with existing community pages

### 📋 Tasks & Implementation

#### 2.1 Update Community Home Page
**File**: `app/communities/[id]/page.tsx` (Update existing file)

**Changes Required**:
- Add "Posts" tab to existing tabs (Courses, All Modules, About)
- Add posts section similar to existing "Courses" section
- Add post creation button for community members
- Show featured/pinned posts
- Add post statistics to community stats

**Add to Existing Tabs Structure**:
```typescript
// Update existing TabsList
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="courses">Courses</TabsTrigger>
  <TabsTrigger value="posts">Posts</TabsTrigger>
  <TabsTrigger value="modules">All Modules</TabsTrigger>
  <TabsTrigger value="about">About</TabsTrigger>
</TabsList>

// Add new TabsContent
<TabsContent value="posts" className="space-y-6">
  <CommunityPostsSection communityId={communityId} />
</TabsContent>
```

#### 2.2 Community Posts Section Component
**New Component**: `components/communities/CommunityPostsSection.tsx`

**Features**:
- Display community posts in a grid/list
- Filter by post type (all, announcements, discussions, resources)
- Sort options (newest, oldest, most liked, most commented)
- Search within community posts
- Show featured/pinned posts at top
- Load more pagination
- "Create Post" button (if user has permissions)

#### 2.3 Post Detail Page
**New File**: `app/communities/[id]/posts/[postId]/page.tsx`

**Components to Create**:
```typescript
// components/posts/PostDetail.tsx
interface PostDetailProps {
  post: Post;
  community: Community;
  onLike: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// components/posts/PostActions.tsx
interface PostActionsProps {
  post: Post;
  onLike: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onReport: () => void;
}
```

**Features**:
- Full post content display with markdown rendering
- Author information and timestamp
- Like/unlike functionality with animation
- Share functionality (copy link, social media)
- Comment count display
- View count tracking
- Edit/delete buttons (if user has permissions)
- Report post functionality

#### 2.4 Basic Comment System
**New Components**:
```typescript
// components/comments/BasicComments.tsx
interface BasicCommentsProps {
  postId: string;
  comments: Comment[];
  onReply: (parentId: string) => void;
  onLike: (commentId: string) => void;
}

// components/comments/CommentsList.tsx
interface CommentsListProps {
  postId: string;
  comments: Comment[];
  onReply: (parentId: string) => void;
  onLike: (commentId: string) => void;
}

// components/comments/CommentForm.tsx
interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSubmit: (data: CreateCommentRequest) => void;
}
```

**Features**:
- View comments on posts
- Create top-level comments
- Like/unlike comments
- Reply to comments (basic, non-threaded initially)
- Delete own comments
- Report comments
- Sort comments (newest, oldest, most liked)

#### 2.5 Create Post Modal
**New Component**: `components/posts/CreatePostModal.tsx`

**Features**:
- Title input
- Rich text editor (basic markdown)
- Post type selection
- Tags input
- File upload for attachments
- Publishing options (draft/publish)
- Preview mode

#### 2.6 Community Moderator Dashboard Integration
**File**: `app/dashboard/` (Check if community dashboard exists, or add to admin)

**Options**:
- If community dashboard exists: Add posts management there
- If not: Add community-specific post management to `/dashboard/admin/posts` with community filter

---

## Phase 3: Advanced Features & Engagement (Week 5-6)

### Objective
Implement advanced features for enhanced user engagement and content discovery.

### 🎯 Phase Goals
- Advanced comment threading system
- Rich post discovery features
- User profiles with post history
- Enhanced mobile experience

### 📋 Tasks & Implementation

#### 3.1 Advanced Comment Threading
**Update**: `components/comments/BasicComments.tsx` → `components/comments/CommentThread.tsx`

**Components to Create**:
```typescript
// components/comments/ThreadedComment.tsx
interface ThreadedCommentProps {
  comment: Comment;
  level: number;
  maxLevel: number;
  onReply: (commentId: string) => void;
  onLoadMore: (parentId: string) => void;
}

// components/comments/CommentPaginator.tsx
interface CommentPaginatorProps {
  postId: string;
  totalComments: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}
```

**Features**:
- Nested comment threading (up to 5 levels)
- Collapse/expand comment threads
- Load more replies pagination
- Reply to specific comments
- Edit own comments
- Visual hierarchy for threading

#### 3.2 Post Discovery Features
**Update**: `components/communities/CommunityPostsSection.tsx` (Add discovery features)

**Components to Create**:
```typescript
// components/posts/TrendingPosts.tsx
interface TrendingPostsProps {
  communityId?: string;
  timeframe: 'day' | 'week' | 'month';
}

// components/posts/RelatedPosts.tsx
interface RelatedPostsProps {
  currentPost: Post;
  communityId: string;
}

// components/posts/TagExplorer.tsx
interface TagExplorerProps {
  communityId?: string;
  popularTags: string[];
}
```

**Features**:
- Trending posts section
- Related posts based on tags/content
- Popular tags cloud
- Advanced search with filters
- Save search functionality
- Category-based browsing

#### 3.3 Enhanced User Profiles
**New Files to Create**:
```
app/profile/[id]/
├── posts/page.tsx             # User's post history
└── comments/page.tsx          # User's comment history
```

**Components to Create**:
```typescript
// components/profile/UserActivityFeed.tsx
interface UserActivityFeedProps {
  userId: string;
  tab: 'posts' | 'comments' | 'likes';
}

// components/profile/UserStats.tsx
interface UserStatsProps {
  userId: string;
}
```

**Features**:
- User's post history
- User's comment history
- User's liked posts
- User statistics (posts, comments, likes received)
- Contribution badges and achievements
- Activity timeline

#### 3.4 Enhanced Mobile Experience
**New Components**:
```typescript
// components/mobile/MobilePostFeed.tsx
interface MobilePostFeedProps {
  communityId: string;
}

// components/mobile/MobilePostCard.tsx
interface MobilePostCardProps {
  post: Post;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

// components/mobile/MobileCommentSection.tsx
interface MobileCommentSectionProps {
  postId: string;
  isSheetOpen: boolean;
  onClose: () => void;
}
```

**Features**:
- Pull-to-refresh on post feed
- Swipe actions for post interactions
- Bottom sheet for comments
- Mobile-optimized post creation
- Touch-friendly interactions
- Native sharing integration

#### 3.5 Rich Media Enhancements
**New Components**:
```typescript
// components/posts/RichMediaViewer.tsx
interface RichMediaViewerProps {
  attachments: PostAttachment[];
}

// components/posts/ImageGallery.tsx
interface ImageGalleryProps {
  images: PostAttachment[];
  startIndex: number;
}

// components/posts/VideoPlayer.tsx
interface VideoPlayerProps {
  attachment: PostAttachment;
  autoplay?: boolean;
}
```

**Features**:
- Image gallery with zoom/pan
- Video player with controls
- Audio player for audio attachments
- Document viewer
- Download functionality
- Lightbox mode for media

---

## Phase 4: Analytics & Optimization (Week 7-8)

### Objective
Implement analytics, optimization, and advanced features for a complete social posts experience.

### 🎯 Phase Goals
- Comprehensive analytics dashboard
- Performance optimization
- SEO improvements
- Advanced moderation tools

### 📋 Tasks & Implementation

#### 4.1 Admin Analytics Enhancement
**Update**: `app/dashboard/admin/page.tsx` (Enhance existing dashboard)

**New Files to Create**:
```
app/dashboard/admin/analytics/
├── page.tsx                  # Posts & comments analytics
└── posts/
    └── page.tsx              # Detailed post analytics
```

**Components to Create**:
```typescript
// components/analytics/PostsAnalytics.tsx
interface PostsAnalyticsProps {
  communityId?: string;
  timeframe: string;
}

// components/analytics/EngagementMetrics.tsx
interface EngagementMetricsProps {
  timeframe: string;
  filters: AnalyticsFilters;
}

// components/analytics/TrendingContent.tsx
interface TrendingContentProps {
  timeframe: string;
  contentType: 'posts' | 'comments' | 'tags';
}
```

**Features**:
- Post engagement metrics (views, likes, comments, shares)
- Content performance analytics
- User engagement trends
- Popular tags and topics
- Peak activity times

#### 4.2 Performance Optimization
**Files**: Multiple optimization updates

**Code Splitting**:
```typescript
// Dynamic imports for heavy components
const MarkdownEditor = dynamic(() => import('../components/MarkdownEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false
});

const ImageGallery = dynamic(() => import('../components/ImageGallery'), {
  loading: () => <GallerySkeleton />,
  ssr: false
});
```

**Image Optimization**:
- Implement next/image for all post images
- Add blur placeholders
- Implement responsive image loading
- Add WebP format support

#### 4.3 SEO Improvements
**Update**: `app/communities/[id]/posts/[postId]/page.tsx` (Add SEO)

**Components to Create**:
```typescript
// components/seo/PostStructuredData.tsx
interface PostStructuredDataProps {
  post: Post;
  community: Community;
}

// components/seo/PostMetaTags.tsx
interface PostMetaTagsProps {
  post: Post;
  community: Community;
}
```

**Features**:
- Structured data for posts (Article schema)
- Open Graph tags for social sharing
- Twitter Card optimization
- Canonical URLs
- Breadcrumb navigation

#### 4.4 Advanced Moderation Tools
**Update**: `app/dashboard/admin/comments/page.tsx` (Enhance existing)

**Components to Create**:
```typescript
// components/moderation/AdvancedModeration.tsx
interface AdvancedModerationProps {
  contentType: 'posts' | 'comments';
  communityId?: string;
}

// components/moderation/AutoModeration.tsx
interface AutoModerationProps {
  communityId: string;
  rules: ModerationRule[];
}
```

**Features**:
- Automated content moderation
- Custom moderation rules
- Bulk moderation actions
- Moderation history and audit log
- Spam detection
- Profanity filters

---

## Updated Route Structure

### Admin Dashboard Routes (New)
```
app/dashboard/admin/
├── posts/
│   ├── page.tsx              # Posts list (follow communities pattern)
│   ├── [id]/page.tsx         # Post details
│   ├── [id]/edit/page.tsx    # Edit post
│   └── new/page.tsx          # Create post
├── comments/
│   ├── page.tsx              # Comments moderation
│   └── [id]/page.tsx         # Comment details
└── analytics/
    ├── page.tsx              # General analytics
    └── posts/
        └── page.tsx          # Post analytics
```

### Public Community Routes (Updated)
```
app/communities/[id]/
├── page.tsx                  # Updated with posts tab
├── posts/
│   └── [postId]/page.tsx     # Post detail page
└── posts/                    # Additional post routes (future)
```

### User Profile Routes (New)
```
app/profile/[id]/
├── posts/page.tsx            # User's posts
└── comments/page.tsx         # User's comments
```

---

## Implementation Priority Adjustments

### Why This Structure Works Better

1. **Follows Existing Patterns**: Admin CRUD follows established `/dashboard/admin/` pattern
2. **Clear Separation**: Admin functions separated from public-facing features
3. **Progressive Enhancement**: Public community pages enhanced with posts feature
4. **Consistent UX**: Users experience posts as natural extension of communities

### Success Metrics by Phase

### Phase 1 Success Metrics
- Admin can manage 1000+ posts efficiently
- Comment moderation time < 30 seconds
- Dashboard load time < 2 seconds
- Zero data loss during CRUD operations

### Phase 2 Success Metrics
- Community engagement +25%
- Page load time < 3 seconds
- Mobile conversion rate > 2%
- Post creation completion rate > 80%

### Phase 3 Success Metrics
- User engagement time +40%
- Comment reply rate +25%
- Mobile session duration +30%
- Content discovery rate +50%

### Phase 4 Success Metrics
- Core Web Vitals > 75
- Organic traffic +20%
- Error rate < 1%
- Moderation efficiency +60%

This updated approach ensures the social posts feature integrates seamlessly with the existing application architecture while maintaining clear separation between admin and public-facing functionality.