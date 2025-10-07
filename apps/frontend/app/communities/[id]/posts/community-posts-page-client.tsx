"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  FileText,
  Calendar,
  Heart,
  MessageCircle,
  Eye,
  Filter,
  Grid3X3,
  List,
  ChevronRight,
} from "lucide-react"
import { useCommunity } from "@/hooks/use-communities"
import { useCommunityPosts } from "@/hooks/use-posts"
import { Navbar } from "@/components/navbar"
import { PostCard } from "@/components/post/post-card"
import { Post } from "@/lib/types"

interface CommunityPostsPageClientProps {
  communityId: string
}

export function CommunityPostsPageClient({ communityId }: CommunityPostsPageClientProps) {
  const [page, setPage] = useState(1)
  const pageSize = 12

  const { data: communityData, isLoading: communityLoading } = useCommunity(communityId)
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError
  } = useCommunityPosts(communityId, {
    page,
    pageSize,
    filters: {
      isPublished: true,
    },
    sort: [
      { field: 'publishedAt', order: 'desc' }
    ]
  })

  const community = communityData?.data
  const posts = postsData?.data || []
  const pagination = postsData

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  if (communityLoading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Community not found</h1>
            <p className="text-gray-600 mb-8">The community you're looking for doesn't exist.</p>
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

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href={`/communities/${communityId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to {community.name}
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Posts in {community.name}
              </h1>
              <p className="text-gray-600">
                {posts.length > 0
                  ? `${pagination?.totalCount || posts.length} post${(pagination?.totalCount || posts.length) !== 1 ? 's' : ''} published`
                  : "No posts published yet"
                }
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {community.privacy}
              </Badge>
              {community.isVerified && (
                <Badge variant="default">Verified</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {postsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : postsError ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unable to load posts
                </h3>
                <p className="text-gray-600 mb-4">
                  There was an error loading the posts for this community.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No posts in this community yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Be the first to publish a post in {community.name}!
                </p>
                <Link href={`/communities/${communityId}`}>
                  <Button>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Community
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((post: Post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {[...Array(pagination.totalPages || 1)].map((_, i) => {
                    const pageNum = i + 1
                    const isCurrent = pageNum === page
                    const isNearCurrent = Math.abs(pageNum - page) <= 1
                    const isFirstOrLast = pageNum === 1 || pageNum === (pagination.totalPages || 1)

                    if (!isNearCurrent && !isFirstOrLast) {
                      if (pageNum === 2 || pageNum === (pagination.totalPages || 1) - 1) {
                        return <span key={pageNum} className="px-2">...</span>
                      }
                      return null
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isCurrent}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= (pagination.totalPages || 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}