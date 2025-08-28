import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  CourseMaterial,
  CreateCourseMaterialRequest,
  UpdateCourseMaterialRequest,
} from '@/lib/types';
import { queryKeys } from './query-keys';

// Course Materials Hooks
export function useCourseMaterials(moduleId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.materials.list(moduleId),
    queryFn: () => apiClient.getCourseMaterials(moduleId),
    enabled: enabled && !!moduleId,
  });
}

export function useCourseMaterial(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.materials.detail(id),
    queryFn: () => apiClient.getCourseMaterial(id),
    enabled: enabled && !!id,
  });
}

export function useCreateCourseMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCourseMaterialRequest) => apiClient.createCourseMaterial(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.list(variables.moduleId) });
    },
  });
}

export function useUpdateCourseMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateCourseMaterialRequest) => apiClient.updateCourseMaterial(data),
    onSuccess: (_, variables) => {
      if (variables.moduleId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.materials.list(variables.moduleId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.detail(variables.id) });
    },
  });
}

export function useDeleteCourseMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteCourseMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}