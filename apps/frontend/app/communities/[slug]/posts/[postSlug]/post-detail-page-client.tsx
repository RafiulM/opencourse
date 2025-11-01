"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  FileText,
  Calendar,
  Heart,
  MessageCircle,
  Eye,
  AlertCircle,
  Users,
} from "lucide-react"
import { useCommunityBySlug } from "@/hooks/use-communities"
import { usePostBySlug } from "@/hooks/use-post"
import { usePostAccessControl } from "@/hooks/use-post-access-control"
import { Navbar } from "@/components/navbar"
import { PostView } from "@/components/post/post-view"
import {
  PostErrorBoundary,
  usePostErrorHandler,
} from "@/components/post/post-error-boundary"
import { toast } from "sonner"
import { isMembershipRequiredError } from "@/lib/membership-access"

interface PostDetailPageClientProps {
  communitySlug: string
  postSlug: string
}

export function PostDetailPageClient({
  communitySlug,
  postSlug,
}: PostDetailPageClientProps) {
  const router = useRouter()
  const { data: communityData, isLoading: communityLoading } =
    useCommunityBySlug(communitySlug)
  const community = communityData?.data
  const communityId = community?.id
  const {
    data: postData,
    isLoading: postLoading,
    error: postError,
  } = usePostBySlug(postSlug, communityId, !!communityId)

  const post = postData

  // Check post access control - only run if we have post data and no authentication error
  const accessControl = usePostAccessControl({
    post,
    communityId,
    enabled: !!community && !!post && !postError,
  })

  // Handle immediate redirect for authentication errors
  useEffect(() => {
    if (postError) {
      if (isMembershipRequiredError(postError)) {
        // Show toast notification
        toast.error("You must join this community to view this post")

        // Redirect immediately to community page with join request parameter
        router.push(`/communities/${communitySlug}?request=join`)
      }
    }
  }, [postError, communitySlug, router])

  // Handle redirect for non-members (when access control determines membership is required)
  useEffect(() => {
    if (
      !accessControl.isLoading &&
      !accessControl.canAccess &&
      accessControl.requiresMembership &&
      community &&
      !postError // Don't redirect if there's already an API error
    ) {
      // Show toast notification
      toast.error("You must join this community to view this post")

      // Redirect to community page with join request parameter
      router.push(`/communities/${communitySlug}?request=join`)
    }
  }, [
    accessControl.isLoading,
    accessControl.canAccess,
    accessControl.requiresMembership,
    community,
    communitySlug,
    router,
    postError,
  ])

  // Show loading state while checking authentication or redirecting
  if (postError) {
    if (isMembershipRequiredError(postError)) {
      return (
        <div className="bg-background min-h-screen">
          <Navbar />
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-8">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-8 w-64" />
              </div>
              <Skeleton className="mb-2 h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                Redirecting to community page...
              </p>
            </div>
          </div>
        </div>
      )
    }
  }

  // Handle access control loading state
  if (accessControl.isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="mb-2 h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Handle membership-based access control
  if (!accessControl.canAccess && accessControl.requiresMembership) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link href={`/communities/${communitySlug}/posts`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Posts in {community?.name || "Community"}
              </Button>
            </Link>
          </div>

          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Community Membership Required
            </h3>
            <p className="mb-6 text-gray-600">
              You need to join this community to view this post.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href={`/communities/${communitySlug}?request=join`}>
                <Button>
                  <Users className="mr-2 h-4 w-4" />
                  Join Community
                </Button>
              </Link>
              <Link href={`/communities/${communitySlug}`}>
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (communityLoading || postLoading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="mb-2 h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">
              Community not found
            </h1>
            <p className="mb-8 text-gray-600">
              The community you're looking for doesn't exist.
            </p>
            <Link href="/communities">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Communities
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (postError || !post) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link href={`/communities/${communitySlug}/posts`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Posts in {community.name}
              </Button>
            </Link>
          </div>

          <div className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Post not found
            </h3>
            <p className="mb-6 text-gray-600">
              The post you're looking for doesn't exist or hasn't been published
              yet.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href={`/communities/${communitySlug}/posts`}>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Browse All Posts
                </Button>
              </Link>
              <Link href={`/communities/${communitySlug}`}>
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Link href={`/communities/${communitySlug}/posts`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Posts in {community.name}
            </Button>
          </Link>
        </div>

        {/* Post Content */}
        <PostErrorBoundary
          communityName={community.name}
          communityId={communityId}
        >
          <PostView post={post} />
        </PostErrorBoundary>
      </div>
    </div>
  )
}
