import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Post } from '@/lib/types';
import { queryKeys } from './query-keys';

export function usePostBySlug(slug: string, communityId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.posts.bySlug(slug, communityId),
    queryFn: () => apiClient.getPostBySlug(slug, communityId),
    enabled: enabled && !!slug,
    select: (response) => response.data,
    retry: (failureCount, error: any) => {
      // Don't retry on visibility-based access errors
      if (error?.code === 'AUTHENTICATION_REQUIRED' || error?.code === 'ACCESS_DENIED') {
        return false;
      }
      return failureCount < 3;
    },
  });
}