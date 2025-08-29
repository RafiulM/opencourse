import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Enrollment } from '@/lib/types';
import { queryKeys } from './query-keys';

// Enrollment Hooks
export function useEnrollments(
  page = 1, 
  limit = 20, 
  filters: Record<string, any> = {},
  sort: string[] = []
) {
  return useQuery({
    queryKey: queryKeys.enrollments.list({ page, limit, filters, sort }),
    queryFn: () => apiClient.getEnrollments(page, limit, filters, sort),
  });
}

export function useEnrollment(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.enrollments.detail(id),
    queryFn: () => apiClient.getEnrollment(id),
    enabled: enabled && !!id,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createEnrollment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.lists() });
    },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.updateEnrollment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.detail(variables.id) });
    },
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteEnrollment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
    },
  });
}