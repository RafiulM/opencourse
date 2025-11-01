import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { Post } from "@/lib/types"
import { isMembershipRequiredError } from "@/lib/membership-access"
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
      if (isMembershipRequiredError(error)) {
        return false
      }
      return failureCount < 1
    },
  })
}
