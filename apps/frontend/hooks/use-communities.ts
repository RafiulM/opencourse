import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Community,
  CreateCommunityRequest,
  UpdateCommunityRequest,
} from '@/lib/types';
import { queryKeys } from './query-keys';

// Communities Hooks
export function useCommunities(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.communities.list({ page, limit }),
    queryFn: () => apiClient.getCommunities(page, limit),
  });
}

export function useCommunity(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.communities.detail(id),
    queryFn: () => apiClient.getCommunity(id),
    enabled: enabled && !!id,
  });
}

export function useCreateCommunity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCommunityRequest) => apiClient.createCommunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.lists() });
    },
  });
}

export function useUpdateCommunity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateCommunityRequest) => apiClient.updateCommunity(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.detail(variables.id) });
    },
  });
}

export function useDeleteCommunity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteCommunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.all });
    },
  });
}