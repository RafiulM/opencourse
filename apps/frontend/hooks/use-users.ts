import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  User,
  UpdateUserProfileRequest,
  UpdateAvatarRequest,
} from '@/lib/types';
import { queryKeys } from './query-keys';

// User Profile Hooks
export function useUserProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: () => apiClient.getUserProfile(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserProfileRequest) =>
      apiClient.updateUserProfile(data),
    onSuccess: (updatedUser) => {
      // Update the user profile cache
      queryClient.setQueryData(queryKeys.users.profile(), updatedUser);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });

      // Also update the session data if available
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    onError: (error) => {
      console.error('Failed to update user profile:', error);
    },
  });
}

export function useUpdateUserAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateAvatarRequest) =>
      apiClient.updateUserAvatar(data),
    onSuccess: (updatedUser) => {
      // Update the user profile cache
      queryClient.setQueryData(queryKeys.users.profile(), updatedUser);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });

      // Also update the session data if available
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    onError: (error) => {
      console.error('Failed to update user avatar:', error);
    },
  });
}

export function useUpdateUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) => apiClient.updateUsername(username),
    onSuccess: (updatedUser) => {
      // Update the user profile cache
      queryClient.setQueryData(queryKeys.users.profile(), updatedUser);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });

      // Also update the session data if available
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    onError: (error) => {
      console.error('Failed to update username:', error);
    },
  });
}

export function useCheckUsernameAvailability() {
  return useMutation({
    mutationFn: (username: string) => apiClient.checkUsernameAvailability(username),
    onError: (error) => {
      console.error('Failed to check username availability:', error);
    },
  });
}

