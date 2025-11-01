"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Eye,
  Users,
  Calendar,
  ArrowRight,
  TrendingUp
} from "lucide-react"
import { PostCard } from "./post-card"
import { usePosts } from "@/hooks/use-posts"
import { VisibilityFilter } from "./visibility-filter"
import type { VisibilityFilter as VisibilityFilterType } from "./visibility-filter"

interface PublicPostsExplorerProps {
  showHeader?: boolean
  showViewToggle?: boolean
  maxPosts?: number
  className?: string
  title?: string
  description?: string
}

export function PublicPostsExplorer({
  showHeader = true,
  showViewToggle = true,
  maxPosts = 6,
  className = "",
  title = "Discover Public Posts",
  description = "Explore public posts from all communities"
}: PublicPostsExplorerProps) {
  const [page, setPage] = useState(1)
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilterType>('public')
  const pageSize = maxPosts

  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
  } = usePosts({
    page,
    pageSize,
    filters: {
      isPublished: true,
      ...(visibilityFilter !== 'all' && { visibility: visibilityFilter })
    },
    sort: [{ field: "publishedAt", order: "desc" }],
  })

  const posts = postsData?.data ?? []
  const postsTotal = postsData?.totalCount ?? posts.length

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  // Only show pagination controls if we're not limiting to a small number of posts
  const showPagination = maxPosts >= 12

  if (showHeader) {
    return (
      <section className={`space-y-6 ${className}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {title}
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Public
              </Badge>
            </h2>
            <p className="text-muted-foreground">
              {description}
            </p>
          </div>

          {showViewToggle && (
            <div className="flex items-center gap-3">
              <VisibilityFilter
                currentFilter={visibilityFilter}
                onFilterChange={setVisibilityFilter}
                className="shrink-0"
              />
              <Button variant="outline" size="sm" asChild>
                <Link href="/explore/posts">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        <PublicPostsContent
          posts={posts}
          postsLoading={postsLoading}
          postsError={postsError}
          postsTotal={postsTotal}
          showPagination={showPagination}
                    page={page}
          handlePageChange={handlePageChange}
          maxPosts={maxPosts}
        />
      </section>
    )
  }

  return (
    <PublicPostsContent
      posts={posts}
      postsLoading={postsLoading}
      postsError={postsError}
      postsTotal={postsTotal}
      showPagination={showPagination}
            page={page}
      handlePageChange={handlePageChange}
      maxPosts={maxPosts}
      className={className}
    />
  )
}

interface PublicPostsContentProps {
  posts: any[]
  postsLoading: boolean
  postsError: any
  postsTotal: number
  showPagination: boolean
  pagination?: any
  page: number
  handlePageChange: (page: number) => void
  maxPosts: number
  className?: string
}

function PublicPostsContent({
  posts,
  postsLoading,
  postsError,
  postsTotal,
  showPagination,
  pagination,
  page,
  handlePageChange,
  maxPosts,
  className = ""
}: PublicPostsContentProps) {
  if (postsLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(maxPosts, 6) }).map((_, index) => (
            <PostSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  if (postsError) {
    return (
      <Card className={className}>
        <CardContent className="py-10 text-center">
          <FileText className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Unable to load posts</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            There was an error loading public posts. Please try again later.
          </p>
          <Button className="mt-4" onClick={() => handlePageChange(page)}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No public posts yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Public posts from communities will appear here once members start sharing content with everyone.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, maxPosts).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {showPagination && pagination && pagination.totalPages > 1 && (
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
            {Array.from({ length: Math.min(pagination.totalPages, 7) }).map((_, index) => {
              let pageNum = index + 1

              // Adjust page numbers for pagination with many pages
              if (pagination.totalPages > 7) {
                if (page <= 4) {
                  pageNum = index + 1
                } else if (page >= pagination.totalPages - 3) {
                  pageNum = pagination.totalPages - 6 + index
                } else {
                  pageNum = page - 3 + index
                }
              }

              const isCurrent = pageNum === page

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
            disabled={page >= pagination.totalPages}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function PostSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6 mb-3" />
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
        </div>
      </CardContent>
    </Card>
  )
}