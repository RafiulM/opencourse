import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Quiz,
  CreateQuizRequest,
  UpdateQuizRequest,
} from '@/lib/types';
import { queryKeys } from './query-keys';

// Quizzes Hooks
export function useQuizzes(
  page = 1, 
  limit = 20, 
  filters: Record<string, any> = {},
  sort: string[] = []
) {
  return useQuery({
    queryKey: queryKeys.quizzes.list({ page, limit, filters, sort }),
    queryFn: () => apiClient.getQuizzes(page, limit, filters, sort),
  });
}

export function useQuiz(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.quizzes.detail(id),
    queryFn: () => apiClient.getQuiz(id),
    enabled: enabled && !!id,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateQuizRequest) => apiClient.createQuiz(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.lists() });
    },
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateQuizRequest) => apiClient.updateQuiz(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.detail(variables.id) });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.all });
    },
  });
}