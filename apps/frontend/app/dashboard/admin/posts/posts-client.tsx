'use client';

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  Heart,
  Pin,
  Star,
  FileText,
  Megaphone,
  Users,
  Calendar,
  ToggleLeft,
  ToggleRight
} from "lucide-react"
import Link from "next/link"
import { usePosts, useDeletePost, useTogglePinPost, useToggleFeaturePost, usePublishPost } from "@/hooks/use-posts"
import { Post } from "@/lib/types"
import { toast } from "sonner"

export default function PostsPage() {
  const [search, setSearch] = useState("")
  const [postType, setPostType] = useState<string>("all")
  const [publishedStatus, setPublishedStatus] = useState<string>("all")
  const [page, setPage] = useState(1)
  const limit = 10

  const normalizedPage = useMemo(() => {
    if (!Number.isFinite(page)) return 1
    const floored = Math.floor(page)
    return floored > 0 ? floored : 1
  }, [page])

  const handlePageChange = useCallback((updater: number | ((current: number) => number)) => {
    setPage((current) => {
      const next = typeof updater === "function" ? updater(current) : updater
      if (!Number.isFinite(next)) return 1
      const floored = Math.floor(next)
      return floored > 0 ? floored : 1
    })
  }, [])

  useEffect(() => {
    handlePageChange(1)
  }, [postType, publishedStatus, search, handlePageChange])

  const filters = {
    ...(postType !== "all" && { postType }),
    ...(publishedStatus !== "all" && { isPublished: publishedStatus === "published" }),
  }

  const { data, isLoading, error } = usePosts({
    page: normalizedPage,
    pageSize: limit,
    filters,
    ...(search && { search })
  })

  const rawResponse = data?.data as any
  const posts = rawResponse?.posts ?? rawResponse?.data ?? []
  const rawPagination = rawResponse?.pagination ?? rawResponse
  const totalItems = rawPagination?.totalItems ?? rawPagination?.totalCount ?? posts.length ?? 0
  const totalPagesRaw = rawPagination?.totalPages ?? 0
  const currentPage = rawPagination?.currentPage ?? normalizedPage
  const pageSize = rawPagination?.pageSize ?? limit
  const showEmptyState = !isLoading && posts.length === 0

  const errorMessage = useMemo(() => {
    if (!error) return ""
    if (error instanceof Error) {
      const jsonStart = error.message.indexOf("{")
      if (jsonStart !== -1) {
        try {
          const parsed = JSON.parse(error.message.slice(jsonStart))
          return parsed?.error?.message || error.message
        } catch (parseError) {
          return error.message
        }
      }
      return error.message
    }
    return "Failed to load posts"
  }, [error])

  const deletePostMutation = useDeletePost()
  const togglePinMutation = useTogglePinPost()
  const toggleFeatureMutation = useToggleFeaturePost()
  const publishMutation = usePublishPost()

  const handleDelete = async (post: Post) => {
    if (confirm(`Are you sure you want to delete "${post.title}"? This action cannot be undone.`)) {
      try {
        await deletePostMutation.mutateAsync(post.id)
        toast.success("Post deleted successfully")
      } catch (error) {
        toast.error("Failed to delete post")
      }
    }
  }

  const handleTogglePin = async (post: Post) => {
    try {
      await togglePinMutation.mutateAsync(post.id)
      toast.success(`Post ${post.isPinned ? 'unpinned' : 'pinned'} successfully`)
    } catch (error) {
      toast.error("Failed to update pin status")
    }
  }

  const handleToggleFeature = async (post: Post) => {
    try {
      await toggleFeatureMutation.mutateAsync(post.id)
      toast.success(`Post ${post.isFeatured ? 'unfeatured' : 'featured'} successfully`)
    } catch (error) {
      toast.error("Failed to update featured status")
    }
  }

  const handleTogglePublish = async (post: Post) => {
    try {
      await publishMutation.mutateAsync(post.id)
      toast.success(`Post ${post.isPublished ? 'unpublished' : 'published'} successfully`)
    } catch (error) {
      toast.error("Failed to update publish status")
    }
  }

  const getPostTypeIcon = (type: Post['postType']) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-blue-600" />
      case 'discussion':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case 'resource':
        return <FileText className="h-4 w-4 text-purple-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getPostTypeBadge = (type: Post['postType']) => {
    const variants = {
      announcement: "default",
      discussion: "secondary",
      resource: "outline",
      general: "secondary"
    } as const

    return (
      <Badge variant={variants[type] || "secondary"} className="capitalize">
        {type}
      </Badge>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading posts: {errorMessage}</p>
        </CardContent>
      </Card>
    )
  }

  const totalPages = totalPagesRaw || (totalItems > 0 ? Math.max(1, Math.ceil(totalItems / pageSize)) : 0)
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems)
  const disableNext = totalPages === 0 ? true : currentPage >= totalPages

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Posts Management</CardTitle>
              <CardDescription>
                Create and manage social posts across all communities
              </CardDescription>
            </div>
            <Link href="/dashboard/admin/posts/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Post
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Post Type Filter */}
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Post Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="discussion">Discussion</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                </SelectContent>
              </Select>

              {/* Published Status Filter */}
              <Select value={publishedStatus} onValueChange={setPublishedStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Post</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Community</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        Loading posts...
                      </TableCell>
                    </TableRow>
                  ) : showEmptyState ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold">No posts yet</h3>
                            <p className="text-sm text-muted-foreground">
                              Create your first post to start engaging your communities.
                            </p>
                          </div>
                          <Link href="/dashboard/admin/posts/new">
                            <Button>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Post
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="max-w-md">
                            <div className="font-medium line-clamp-1">{post.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {post.excerpt || post.content?.substring(0, 100)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getPostTypeIcon(post.postType)}
                            {getPostTypeBadge(post.postType)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                              {post.community?.name?.charAt(0).toUpperCase() || 'C'}
                            </div>
                            <div className="text-sm">
                              {post.community?.name || 'Unknown'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {post.author?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="text-sm">
                              {post.author?.name || 'Unknown'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Heart className="mr-1 h-3 w-3" />
                              {post.likesCount}
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="mr-1 h-3 w-3" />
                              {post.commentsCount}
                            </div>
                            <div className="flex items-center">
                              <Eye className="mr-1 h-3 w-3" />
                              {post.viewsCount}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {post.isPinned && <Pin className="h-4 w-4 text-blue-600" />}
                            {post.isFeatured && <Star className="h-4 w-4 text-yellow-600" />}
                            <Badge variant={post.isPublished ? "default" : "secondary"}>
                              {post.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/communities/${post.community?.slug || post.communityId}/posts/${post.id}`}
                                  className="flex items-center"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/admin/posts/${post.id}/edit`}
                                  className="flex items-center"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleTogglePublish(post)}
                                disabled={publishMutation.isPending}
                              >
                                {post.isPublished ? (
                                  <>
                                    <ToggleLeft className="mr-2 h-4 w-4" />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="mr-2 h-4 w-4" />
                                    Publish
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleTogglePin(post)}
                                disabled={togglePinMutation.isPending}
                              >
                                <Pin className="mr-2 h-4 w-4" />
                                {post.isPinned ? 'Unpin' : 'Pin'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleFeature(post)}
                                disabled={toggleFeatureMutation.isPending}
                              >
                                <Star className="mr-2 h-4 w-4" />
                                {post.isFeatured ? 'Unfeature' : 'Feature'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(post)}
                                disabled={deletePostMutation.isPending}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {startItem} to {endItem} of {totalItems} posts
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange((prev) => prev - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange((prev) => prev + 1)}
                    disabled={disableNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}