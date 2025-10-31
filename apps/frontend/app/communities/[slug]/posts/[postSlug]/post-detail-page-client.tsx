"use client"

import Link from "next/link"
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
} from "lucide-react"
import { useCommunityBySlug } from "@/hooks/use-communities"
import { usePostBySlug } from "@/hooks/use-post"
import { Navbar } from "@/components/navbar"
import { PostView } from "@/components/post/post-view"
import { PostErrorBoundary, usePostErrorHandler } from "@/components/post/post-error-boundary"

interface PostDetailPageClientProps {
  communitySlug: string
  postSlug: string
}

export function PostDetailPageClient({ communitySlug, postSlug }: PostDetailPageClientProps) {
  const { data: communityData, isLoading: communityLoading } =
    useCommunityBySlug(communitySlug)
  const community = communityData?.data
  const communityId = community?.id
  const { handlePostError } = usePostErrorHandler()
  const {
    data: postData,
    isLoading: postLoading,
    error: postError,
  } = usePostBySlug(postSlug, communityId, !!communityId)

  const post = postData

  // Handle visibility-based access errors
  if (postError) {
    const errorComponent = handlePostError(postError, community?.name, communityId)
    if (errorComponent) {
      return (
        <div className="bg-background min-h-screen">
          <Navbar />
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6">
              <Link href={`/communities/${communitySlug}/posts`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Posts in {community?.name || 'Community'}
                </Button>
              </Link>
            </div>
            {errorComponent}
          </div>
        </div>
      )
    }
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
