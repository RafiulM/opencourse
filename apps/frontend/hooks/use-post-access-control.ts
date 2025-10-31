import { useCommunityMembership } from './use-communities'
import { Post } from '@/lib/types'

export interface PostAccessControlOptions {
  post: Post | null | undefined
  communityId: string | undefined
  enabled?: boolean
}

export interface PostAccessControlResult {
  canAccess: boolean
  requiresMembership: boolean
  isMember: boolean
  isLoading: boolean
  reason?: 'public' | 'community' | 'membership_required' | 'loading'
}

/**
 * Hook to control access to posts based on visibility and community membership
 *
 * Access Rules:
 * - Public posts: Anyone can access
 * - Community posts: Only community members can access
 */
export function usePostAccessControl({
  post,
  communityId,
  enabled = true
}: PostAccessControlOptions): PostAccessControlResult {
  const {
    data: membershipData,
    isLoading: membershipLoading,
    error: membershipError
  } = useCommunityMembership(communityId || '', enabled && !!communityId)

  const isMember = membershipData?.data?.isMember || false

  // If we don't have post data yet, still loading
  if (!post) {
    return {
      canAccess: false,
      requiresMembership: false,
      isMember,
      isLoading: true,
      reason: 'loading'
    }
  }

  // Check if membership check is still loading
  if (membershipLoading) {
    return {
      canAccess: false,
      requiresMembership: false,
      isMember,
      isLoading: true,
      reason: 'loading'
    }
  }

  // Public posts can be accessed by anyone
  if (post.visibility === 'public') {
    return {
      canAccess: true,
      requiresMembership: false,
      isMember,
      isLoading: false,
      reason: 'public'
    }
  }

  // Community posts require membership
  if (post.visibility === 'community') {
    if (isMember) {
      return {
        canAccess: true,
        requiresMembership: false,
        isMember,
        isLoading: false,
        reason: 'community'
      }
    } else {
      return {
        canAccess: false,
        requiresMembership: true,
        isMember,
        isLoading: false,
        reason: 'membership_required'
      }
    }
  }

  // Default fallback - deny access
  return {
    canAccess: false,
    requiresMembership: true,
    isMember,
    isLoading: false,
    reason: 'membership_required'
  }
}