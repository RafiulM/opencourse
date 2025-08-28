import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  CourseModule,
  CreateCourseModuleRequest,
  UpdateCourseModuleRequest,
} from '@/lib/types';
import { queryKeys } from './query-keys';

// Course Modules Hooks
export function useCourseModules(courseId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.modules.list(courseId),
    queryFn: () => apiClient.getCourseModules(courseId),
    enabled: enabled && !!courseId,
  });
}

export function useCourseModule(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.modules.detail(id),
    queryFn: () => apiClient.getCourseModule(id),
    enabled: enabled && !!id,
  });
}

export function useCreateCourseModule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCourseModuleRequest) => apiClient.createCourseModule(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.list(variables.courseId) });
    },
  });
}

export function useUpdateCourseModule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateCourseModuleRequest) => apiClient.updateCourseModule(data),
    onSuccess: (_, variables) => {
      if (variables.courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.modules.list(variables.courseId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.detail(variables.id) });
    },
  });
}

export function useDeleteCourseModule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteCourseModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all });
    },
  });
}