import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Comment,
  CommentQueryOptions,
  CreateCommentRequest,
  UpdateCommentRequest,
  ReportCommentRequest,
  ModerateCommentRequest,
  CreateReplyRequest,
} from '@/lib/types';
import { queryKeys } from './query-keys';

// Comments Hooks
export function useComments(postId: string, options: CommentQueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.comments.list(postId, options),
    queryFn: () => apiClient.getComments(postId, options),
    enabled: !!postId,
  });
}

export function useComment(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.comments.detail(id),
    queryFn: () => apiClient.getComment(id),
    enabled: enabled && !!id,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: CreateCommentRequest }) =>
      apiClient.createComment(postId, data),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(postId, {}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCommentRequest) => apiClient.updateComment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.lists() });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.lists() });
    },
  });
}

export function useToggleLikeComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.toggleLikeComment(id),
    onSuccess: (_, commentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.detail(commentId) });
    },
  });
}

export function useReportComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReportCommentRequest }) =>
      apiClient.reportComment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.detail(id) });
    },
  });
}

export function useModerateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ModerateCommentRequest }) =>
      apiClient.moderateComment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.lists() });
    },
  });
}

export function useCreateReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: CreateReplyRequest }) =>
      apiClient.createReply(commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.lists() });
    },
  });
}