import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { LeaderboardEntry } from '@/lib/types';
import { queryKeys } from './query-keys';

// Leaderboard Hooks
export function useCommunityLeaderboard(
  communityId: string,
  page = 1, 
  limit = 20, 
  filters: Record<string, any> = {},
  sort: string[] = []
) {
  return useQuery({
    queryKey: queryKeys.leaderboards.communityList(communityId, { page, limit, filters, sort }),
    queryFn: () => apiClient.getCommunityLeaderboard(communityId, page, limit, filters, sort),
    enabled: !!communityId,
  });
}

export function useCourseLeaderboard(
  courseId: string,
  page = 1, 
  limit = 20, 
  filters: Record<string, any> = {},
  sort: string[] = []
) {
  return useQuery({
    queryKey: queryKeys.leaderboards.courseList(courseId, { page, limit, filters, sort }),
    queryFn: () => apiClient.getCourseLeaderboard(courseId, page, limit, filters, sort),
    enabled: !!courseId,
  });
}