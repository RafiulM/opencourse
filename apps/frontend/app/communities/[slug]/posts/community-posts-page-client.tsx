"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PostCard } from "@/components/post/post-card"
import { useCommunityBySlug } from "@/hooks/use-communities"
import { useCommunityPosts } from "@/hooks/use-posts"
import { CommunityHeader } from "../community-header"

interface CommunityPostsPageClientProps {
  communitySlug: string
}

export function CommunityPostsPageClient({
  communitySlug,
}: CommunityPostsPageClientProps) {
  const [page, setPage] = useState(1)
  const pageSize = 12

  const { data: communityData, isLoading: communityLoading } =
    useCommunityBySlug(communitySlug)

  const community = communityData?.data
  const communityId = community?.id ?? ""
  const resolvedSlug = community?.slug ?? communitySlug

  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
  } = useCommunityPosts(communityId, {
    page,
    pageSize,
    filters: { isPublished: true },
    sort: [{ field: "publishedAt", order: "desc" }],
  })

  const posts = postsData?.data ?? []
  const postsTotal = postsData?.totalCount ?? posts.length

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  if (communityLoading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-52" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="space-y-3 py-6">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
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
            <h1 className="text-2xl font-bold text-foreground">
              Community not found
            </h1>
            <Link href="/communities">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to communities
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
        <Button variant="ghost" size="sm" asChild className="mb-4 w-fit">
          <Link href={`/communities/${resolvedSlug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to community
          </Link>
        </Button>

        <CommunityHeader community={community} />

        <section className="mt-10 space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                All posts
              </h2>
              <p className="text-sm text-muted-foreground">
                Showing {posts.length} of {postsTotal} published posts.
              </p>
            </div>
          </div>

          {postsLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <PostSkeleton key={index} />
              ))}
            </div>
          ) : postsError ? (
            <Card>
              <CardContent className="py-10 text-center">
                <FileText className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">
                  Unable to load posts
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  There was an error loading posts for this community.
                </p>
                <Button className="mt-4" onClick={() => handlePageChange(page)}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">
                  No posts yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Published posts will appear here once community members start sharing updates.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {postsData && postsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: postsData.totalPages }).map((_, index) => {
                  const pageNum = index + 1
                  const isCurrent = pageNum === page
                  const showButton =
                    pageNum === 1 ||
                    pageNum === postsData.totalPages ||
                    Math.abs(pageNum - page) <= 1

                  if (!showButton) {
                    if (
                      Math.abs(pageNum - page) === 2 &&
                      (pageNum === 2 || pageNum === postsData.totalPages - 1)
                    ) {
                      return (
                        <span key={pageNum} className="px-2 text-sm text-muted-foreground">
                          …
                        </span>
                      )
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
                disabled={page >= postsData.totalPages}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function PostSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="space-y-3 py-6">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-8 w-28" />
      </CardContent>
    </Card>
  )
}
