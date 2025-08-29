import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Upload } from '@/lib/types';
import { queryKeys } from './query-keys';

// Upload Hooks
export function useUploads(
  page = 1, 
  limit = 20, 
  filters: Record<string, any> = {},
  sort: string[] = []
) {
  return useQuery({
    queryKey: queryKeys.uploads.list({ page, limit, filters, sort }),
    queryFn: () => apiClient.getUploads(page, limit, filters, sort),
  });
}

export function useUpload(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.uploads.detail(id),
    queryFn: () => apiClient.getUpload(id),
    enabled: enabled && !!id,
  });
}

export function useCreateUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createUpload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.uploads.lists() });
    },
  });
}

export function useUpdateUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.updateUpload(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.uploads.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.uploads.detail(variables.id) });
    },
  });
}

export function useDeleteUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteUpload(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.uploads.all });
    },
  });
}