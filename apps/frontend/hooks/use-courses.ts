import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Course,
  CreateCourseRequest,
  UpdateCourseRequest,
} from '@/lib/types';
import { queryKeys } from './query-keys';

// Courses Hooks
export function useCourses(page = 1, limit = 20, communityId?: string) {
  return useQuery({
    queryKey: queryKeys.courses.list({ page, limit, communityId }),
    queryFn: () => apiClient.getCourses(page, limit, communityId),
  });
}

export function useCourse(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.courses.detail(id),
    queryFn: () => apiClient.getCourse(id),
    enabled: enabled && !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCourseRequest) => apiClient.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateCourseRequest) => apiClient.updateCourse(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(variables.id) });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    },
  });
}