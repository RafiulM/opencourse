# Tech Spec: Community Posts Frontend

**Author:** Gemini
**Date:** 2025-10-07
**Status:** Proposed

## 1. Overview

This document outlines the technical implementation for a new feature on the frontend that allows users to view social posts within a specific community. Users will be able to browse a list of posts belonging to a community and read the full content of individual posts. This feature will be read-only for regular users; post creation and management remain in the admin dashboard.

## 2. Key Features

- **Post List:** Display a paginated list of all published posts for a given community.
- **Post Detail View:** Display the full content of a single post, including title, author details, and metadata.
- **Markdown Rendering:** Post content will be rendered from Markdown to support rich text formatting.
- **Engagement Metrics:** Display view, like, and comment counts.
- **Responsive Design:** The layout will be responsive and work on mobile and desktop devices.

## 3. Data Models & Schema

The frontend will use the existing TypeScript types defined in `apps/frontend/lib/types.ts`. The primary data model is `Post`, which is based on the backend `posts` table schema located in `apps/backend/src/db/schema/posts.ts`.

### `Post` Interface (inferred)

```typescript
interface Post {
  id: string
  communityId: string
  authorId: string
  title: string
  content: string // Markdown content
  excerpt?: string
  isPublished: boolean
  isPinned: boolean
  isFeatured: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  slug: string
  tags: string[]
  postType: "general" | "announcement" | "discussion" | "resource"
  allowComments: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
  author?: {
    id: string
    name: string
    image?: string
  }
  community?: {
    id: string
    name: string
    slug: string
  }
  attachments?: any[] // Type to be defined when attachments are implemented
}
```

## 4. File Structure

The following new files and components will be created:

```
apps/frontend/
├── app/
│   └── communities/
│       └── [id]/
│           └── posts/
│               ├── page.tsx         // (New) List of posts for the community
│               └── [slug]/
│                   └── page.tsx     // (New) Single post detail page
└── components/
    └── post/
        ├── post-card.tsx        // (New) Component for displaying a post in a list
        └── post-view.tsx        // (New) Component for displaying full post content
```

## 5. Component Breakdown

This feature will be built using existing `shadcn/ui` components to ensure visual consistency.

### 5.1. `CommunityPostsPage` (`/communities/[id]/posts/page.tsx`)

- **Purpose:** Displays a list of posts for the community.
- **Data:** Fetches the community ID from the URL and uses the `usePosts` hook to fetch a paginated list of posts, filtered by `communityId`.
- **UI:**
  - Renders a title like "Posts in [Community Name]".
  - Displays a list of `PostCard` components.
  - Includes pagination controls to navigate through pages of posts.
  - If no posts are found, a message indicating "No posts in this community yet" will be shown.

### 5.2. `PostDetailPage` (`/communities/[id]/posts/[slug]/page.tsx`)

- **Purpose:** Displays the full content of a single post.
- **Data:** Fetches the `id` (community) and `slug` (post) from the URL parameters. It will use the `usePosts` hook with `communityId` and `slug` filters to fetch the specific post.
- **UI:**
  - Renders the `PostView` component with the fetched post data.
  - Handles loading and error states. If the post is not found, it will display a "Post not found" message.

### 5.3. `PostCard` (`/components/post/post-card.tsx`)

- **Props:** `{ post: Post }`
- **Purpose:** A reusable component to display a post summary in a list.
- **UI:**
  - Uses `Card` component from `shadcn/ui`.
  - Displays the post title, author's avatar and name, and the publication date (`publishedAt` or `createdAt`).
  - Shows the post `excerpt` or a truncated version of the `content`.
  - Renders `Badge` components for each item in the `tags` array.
  - Displays engagement statistics (likes, comments, views) with icons.
  - The entire card will be a `<Link>` to the post's detail page: `/communities/[communityId]/posts/[slug]`.

### 5.4. `PostView` (`/components/post/post-view.tsx`)

- **Props:** `{ post: Post }`
- **Purpose:** Renders the full, detailed view of a post.
- **UI:**
  - Displays the post `title` prominently.
  - Shows author information (avatar, name) and publication date.
  - Renders the main `content` from Markdown. A library like `react-markdown` will be used for this.
  - Displays `Badge` components for tags.
  - Shows engagement stats.
  - A section for comments will be included, with a placeholder message if the comment feature is not yet implemented (e.g., "Comments are coming soon").

## 6. Data Fetching

- **`usePosts` Hook:** The existing hook from `apps/frontend/hooks/use-posts.ts` will be the primary tool for data fetching.
  - **For Post List:** `usePosts({ page, pageSize, filters: { communityId: params.id, isPublished: true } })`
  - **For Single Post:** `usePosts({ filters: { communityId: params.id, slug: params.slug }, pageSize: 1 })`. The component will then extract the single post from the returned array.

## 7. Routing

- **`/communities/[id]/posts`:** The page listing all posts for the community with the corresponding `id`.
- **`/communities/[id]/posts/[slug]`:** The detail page for a single post, identified by its `slug` within that community.

## 8. Markdown Rendering

To render the post content, the project will use a Markdown rendering library. `react-markdown` combined with `remark-gfm` (for GitHub Flavored Markdown) is recommended if not already present in the project's dependencies. This will handle standard markdown syntax, tables, links, etc.

## 9. Out of Scope (for this iteration)

- **User Interactions:** Creating posts, comments, and likes.
- **Post Attachments:** Displaying or interacting with post attachments.
- **Admin Actions:** Editing, deleting, pinning, or featuring posts from this public view.
