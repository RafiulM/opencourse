/**
 * Example usage of Social Posts API client
 * This file demonstrates how to use the newly integrated social posts API
 */

import { apiClient } from './api-client';
import {
  CreatePostRequest,
  UpdatePostRequest,
  CreateCommentRequest,
  PostQueryOptions,
  CommentQueryOptions
} from './types';

// Example: Creating a new post in a community
export async function createExamplePost(communityId: string) {
  const postData: CreatePostRequest = {
    title: "Welcome to Our Community!",
    content: "# Welcome\n\nThis is our first community post with **markdown** support!\n\n## Features\n- Social posts\n- Comments\n- File attachments\n- Markdown support",
    excerpt: "Our first community post with markdown support",
    postType: "announcement",
    tags: ["welcome", "announcement", "community"],
    allowComments: true,
    isPublished: true,
    attachments: [
      {
        uploadId: "upload-id-here",
        type: "image",
        title: "Community Logo",
        description: "Our awesome community logo",
        caption: "Welcome to our community!",
        order: 1,
        isPrimary: true
      }
    ]
  };

  try {
    const response = await apiClient.createCommunityPost(communityId, postData);
    console.log('Post created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create post:', error);
    throw error;
  }
}

// Example: Getting community posts with filters
export async function getCommunityPostsExample(communityId: string) {
  const options: PostQueryOptions = {
    page: 1,
    pageSize: 10,
    filters: {
      postType: "announcement",
      isPublished: true
    },
    sort: [
      { field: "createdAt", order: "desc" }
    ]
  };

  try {
    const response = await apiClient.getCommunityPosts(communityId, options);
    console.log('Community posts:', response.data.posts);
    console.log('Pagination:', response.data.pagination);
    return response.data;
  } catch (error) {
    console.error('Failed to get community posts:', error);
    throw error;
  }
}

// Example: Getting featured posts
export async function getFeaturedPostsExample(communityId: string) {
  try {
    const response = await apiClient.getFeaturedCommunityPosts(communityId, 1, 5);
    console.log('Featured posts:', response.data.posts);
    return response.data;
  } catch (error) {
    console.error('Failed to get featured posts:', error);
    throw error;
  }
}

// Example: Liking a post
export async function likePostExample(postId: string) {
  try {
    const response = await apiClient.toggleLikePost(postId);
    console.log('Post like status:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to like post:', error);
    throw error;
  }
}

// Example: Creating a comment
export async function createCommentExample(postId: string) {
  const commentData: CreateCommentRequest = {
    content: "This is a great post! Thanks for sharing."
  };

  try {
    const response = await apiClient.createComment(postId, commentData);
    console.log('Comment created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create comment:', error);
    throw error;
  }
}

// Example: Getting comments with threading
export async function getCommentsExample(postId: string) {
  const options: CommentQueryOptions = {
    page: 1,
    pageSize: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
    includeReplies: true
  };

  try {
    const response = await apiClient.getComments(postId, options);
    console.log('Comments:', response.data.comments);

    // Process threaded comments
    const topLevelComments = response.data.comments.filter(comment => !comment.parentId);
    const replies = response.data.comments.filter(comment => comment.parentId);

    // Build thread structure
    const threadedComments = topLevelComments.map(comment => ({
      ...comment,
      replies: replies.filter(reply => reply.parentId === comment.id)
    }));

    console.log('Threaded comments:', threadedComments);
    return threadedComments;
  } catch (error) {
    console.error('Failed to get comments:', error);
    throw error;
  }
}

// Example: Updating a post
export async function updatePostExample(postId: string) {
  const updateData: UpdatePostRequest = {
    id: postId,
    title: "Updated Post Title",
    content: "# Updated Content\n\nThis post has been updated with new information.",
    isPublished: true
  };

  try {
    const response = await apiClient.updatePost(updateData);
    console.log('Post updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to update post:', error);
    throw error;
  }
}

// Example: Getting post likes
export async function getPostLikesExample(postId: string) {
  try {
    const response = await apiClient.getPostLikes(postId, 1, 10);
    console.log('Post likes:', response.data.likes);
    console.log('Total likes:', response.data.totalCount);
    return response.data;
  } catch (error) {
    console.error('Failed to get post likes:', error);
    throw error;
  }
}

// Example: Using the React Query hooks (in a React component)
/*
import { useCommunityPosts, useCreateCommunityPost, useToggleLikePost } from '@/hooks';
import { useState } from 'react';

function CommunityPostsComponent({ communityId }: { communityId: string }) {
  const [page, setPage] = useState(1);

  // Get community posts
  const { data: postsData, isLoading, error } = useCommunityPosts(communityId, {
    page,
    pageSize: 10,
    filters: { isPublished: true },
    sort: [{ field: 'createdAt', order: 'desc' }]
  });

  // Create new post mutation
  const createPostMutation = useCreateCommunityPost();

  // Like post mutation
  const likePostMutation = useToggleLikePost();

  const handleCreatePost = async (postData: CreatePostRequest) => {
    await createPostMutation.mutateAsync({ communityId, data: postData });
  };

  const handleLikePost = async (postId: string) => {
    await likePostMutation.mutateAsync(postId);
  };

  if (isLoading) return <div>Loading posts...</div>;
  if (error) return <div>Error loading posts</div>;

  return (
    <div>
      <h1>Community Posts</h1>
      {postsData?.posts.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.excerpt}</p>
          <button onClick={() => handleLikePost(post.id)}>
            {post.userInteraction?.liked ? 'Unlike' : 'Like'} ({post.likesCount})
          </button>
        </div>
      ))}
    </div>
  );
}
*/

// Export all example functions
export {
  apiClient,
  CreatePostRequest,
  UpdatePostRequest,
  CreateCommentRequest,
  PostQueryOptions,
  CommentQueryOptions
};