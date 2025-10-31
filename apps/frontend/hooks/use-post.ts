import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { Post } from "@/lib/types"
import { queryKeys } from "./query-keys"

export function usePostBySlug(
  slug: string,
  communityId?: string,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.posts.bySlug(slug, communityId),
    queryFn: () => apiClient.getPostBySlug(slug, communityId),
    enabled: enabled && !!slug,
    select: (response) => response.data,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication and access errors
      const isAuthError =
        error?.code === "AUTHENTICATION_REQUIRED" ||
        error?.code === "ACCESS_DENIED" ||
        error?.details?.originalError ===
          "Authentication required for community posts" ||
        (error?.type === "DATABASE_ERROR" &&
          error?.details?.originalError ===
            "Authentication required for community posts")

      if (isAuthError) {
        return false
      }
      return failureCount < 1
    },
  })
}
