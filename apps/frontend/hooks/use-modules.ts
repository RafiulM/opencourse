import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  CourseModule,
  CreateCourseModuleRequest,
  UpdateCourseModuleRequest,
} from '@/lib/types';
import { queryKeys } from './query-keys';
import { useCourses } from './use-courses';

// Course Modules Hooks
export function useCourseModules(courseId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.modules.list(courseId),
    queryFn: () => apiClient.getCourseModules(courseId),
    enabled: enabled && !!courseId,
  });
}

// Hook to get all modules from all courses
export function useAllCourseModules() {
  const { data: coursesData } = useCourses(1, 100);
  
  return useQuery({
    queryKey: ['all-modules'],
    queryFn: async () => {
      if (!coursesData?.data) return [];
      
      const allModulesPromises = coursesData.data.map(course => 
        apiClient.getCourseModules(course.id)
      );
      
      const allModulesResults = await Promise.all(allModulesPromises);
      
      // Flatten all modules into a single array
      const allModules: any[] = [];
      allModulesResults.forEach(result => {
        if (result?.data) {
          allModules.push(...result.data);
        }
      });
      
      return allModules;
    },
    enabled: !!coursesData?.data,
  });
}

export function useCourseModule(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.modules.detail(id),
    queryFn: async () => {
      return await apiClient.getCourseModule(id);
    },
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