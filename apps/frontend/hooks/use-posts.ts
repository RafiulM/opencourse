import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Post,
  PostQueryOptions,
  CreatePostRequest,
  UpdatePostRequest,
} from '@/lib/types';
import { queryKeys } from './query-keys';

// Global Posts Hooks (Admin/Mod use)
export function usePosts(options: PostQueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.posts.list(options),
    queryFn: () => apiClient.getPosts(options),
  });
}

export function usePost(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.posts.detail(id),
    queryFn: () => apiClient.getPost(id),
    enabled: enabled && !!id,
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePostRequest) => apiClient.updatePost(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
    },
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.publishPost(id),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
    },
  });
}

export function useTogglePinPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.togglePinPost(id),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.communityLists() });
    },
  });
}

export function useToggleFeaturePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.toggleFeaturePost(id),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.communityLists() });
    },
  });
}

export function useToggleLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.toggleLikePost(id),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.likes(postId, {}) });
    },
  });
}

export function usePostLikes(id: string, page = 1, pageSize = 20, enabled = true) {
  return useQuery({
    queryKey: queryKeys.posts.likes(id, { page, pageSize }),
    queryFn: () => apiClient.getPostLikes(id, page, pageSize),
    enabled: enabled && !!id,
  });
}

// Community Posts Hooks
export function useCommunityPosts(communityId: string, options: Omit<PostQueryOptions, 'filters'> & { filters?: Omit<PostQueryOptions['filters'], 'communityId'> } = {}) {
  return useQuery({
    queryKey: queryKeys.posts.communityList(communityId, options),
    queryFn: () => apiClient.getCommunityPosts(communityId, options),
    enabled: !!communityId,
  });
}

export function useCreateCommunityPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, data }: { communityId: string; data: CreatePostRequest }) =>
      apiClient.createCommunityPost(communityId, data),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.communityLists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.communityList(communityId, {}) });
    },
  });
}

export function useFeaturedCommunityPosts(communityId: string, page = 1, pageSize = 10, enabled = true) {
  return useQuery({
    queryKey: queryKeys.posts.featured(communityId, { page, pageSize }),
    queryFn: () => apiClient.getFeaturedCommunityPosts(communityId, page, pageSize),
    enabled: enabled && !!communityId,
  });
}

export function usePinnedCommunityPosts(communityId: string, page = 1, pageSize = 10, enabled = true) {
  return useQuery({
    queryKey: queryKeys.posts.pinned(communityId, { page, pageSize }),
    queryFn: () => apiClient.getPinnedCommunityPosts(communityId, page, pageSize),
    enabled: enabled && !!communityId,
  });
}

export function useCommunityAnnouncements(communityId: string, page = 1, pageSize = 10, enabled = true) {
  return useQuery({
    queryKey: queryKeys.posts.announcements(communityId, { page, pageSize }),
    queryFn: () => apiClient.getCommunityAnnouncements(communityId, page, pageSize),
    enabled: enabled && !!communityId,
  });
}