'use client';

import { use } from "react"
import { notFound } from "next/navigation"
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Globe,
  Lock,
  UserCheck,
  Calendar,
  Shield,
  BookOpen,
  FileText,
  MessageSquare,
  Plus,
  MoreHorizontal,
  Eye
} from "lucide-react"
import Link from "next/link"
import { useCommunity, useDeleteCommunity } from "@/hooks/use-communities"
import { useCourses } from "@/hooks/use-courses"
import { useCommunityPosts, useDeletePost, useTogglePinPost, useToggleFeaturePost, usePublishPost } from "@/hooks/use-posts"
import { Community } from "@/lib/types"
import { Post } from "@/lib/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CommunityDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()

  // Query state for active tab
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsString.withDefault('courses')
  )

  const { data: communityResponse, isLoading, error } = useCommunity(id)
  const { data: coursesResponse } = useCourses(1, 20, { communityId: id })
  const { data: postsResponse } = useCommunityPosts(id, { page: 1, pageSize: 10 })
  const deleteCommunityMutation = useDeleteCommunity()

  // Posts mutations
  const deletePostMutation = useDeletePost()
  const togglePinMutation = useTogglePinPost()
  const toggleFeatureMutation = useToggleFeaturePost()
  const publishMutation = usePublishPost()

  if (error) {
    if (error.message.includes('404')) {
      notFound()
    }
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading community: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const community = communityResponse?.data
  if (!community) {
    notFound()
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${community.name}"? This action cannot be undone.`)) {
      try {
        await deleteCommunityMutation.mutateAsync(community.id)
        toast.success("Community deleted successfully")
        router.push("/dashboard/admin/communities")
      } catch (error) {
        toast.error("Failed to delete community")
      }
    }
  }

  // Post action handlers
  const handleDeletePost = async (post: Post) => {
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

  const getPrivacyIcon = (privacy: Community['privacy']) => {
    switch (privacy) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-600" />
      case 'private':
        return <Lock className="h-4 w-4 text-red-600" />
      case 'invite_only':
        return <UserCheck className="h-4 w-4 text-yellow-600" />
      default:
        return <Globe className="h-4 w-4 text-gray-600" />
    }
  }

  const getPrivacyBadge = (privacy: Community['privacy']) => {
    const variants = {
      public: "default",
      private: "destructive",
      invite_only: "secondary"
    } as const

    return (
      <Badge variant={variants[privacy]} className="capitalize">
        {privacy.replace('_', ' ')}
      </Badge>
    )
  }

  const getPostTypeIcon = (type: Post['postType']) => {
    switch (type) {
      case 'announcement':
        return <FileText className="h-4 w-4 text-blue-600" />
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

  // Render functions for each tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Community Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                {community.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <CardTitle className="text-2xl">{community.name}</CardTitle>
                <CardDescription className="text-lg">
                  /{community.slug}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge variant={community.isVerified ? "default" : "outline"}>
                <Shield className="mr-1 h-3 w-3" />
                {community.isVerified ? "Verified" : "Unverified"}
              </Badge>
              <div className="flex items-center space-x-2">
                {getPrivacyIcon(community.privacy)}
                {getPrivacyBadge(community.privacy)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {community.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{community.description}</p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Members</p>
                  <p className="text-2xl font-bold">{community.memberCount}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Courses</p>
                  <p className="text-2xl font-bold">{coursesResponse?.data?.length || 0}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Posts</p>
                  <p className="text-2xl font-bold">{postsResponse?.data?.pagination?.totalItems || 0}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(community.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {community.domain && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Custom Domain</h3>
                  <p className="text-muted-foreground">{community.domain}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCoursesTab = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Courses</CardTitle>
            <CardDescription>
              Courses available in this community
            </CardDescription>
          </div>
          <Link href={`/dashboard/admin/courses/new?communityId=${community.id}`}>
            <Button>
              <BookOpen className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {coursesResponse?.data?.length === 0 ? (
          <div className="text-center py-6">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No courses</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating a new course for this community.
            </p>
            <div className="mt-6">
              <Link href={`/dashboard/admin/courses/new?communityId=${community.id}`}>
                <Button>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrollments</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coursesResponse?.data?.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                          {course.title?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-muted-foreground">
                            /{course.slug}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={course.isPublished ? "default" : "secondary"}>
                          {course.isPublished ? "Published" : "Draft"}
                        </Badge>
                        {course.isFeatured && (
                          <Badge variant="outline">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        {course.enrollmentCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {course.price === "0" ? "Free" : `$${course.price}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(course.createdAt).toLocaleDateString()}
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
                          <Link href={`/dashboard/admin/courses/${course.id}`}>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/dashboard/admin/courses/${course.id}/edit`}>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderPostsTab = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Posts</CardTitle>
            <CardDescription>
              Social posts in this community
            </CardDescription>
          </div>
          <Link href={`/dashboard/admin/posts/new?communityId=${community.id}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Post
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {postsResponse?.data?.posts?.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No posts</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating a new post for this community.
            </p>
            <div className="mt-6">
              <Link href={`/dashboard/admin/posts/new?communityId=${community.id}`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Post
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postsResponse?.data?.posts?.map((post) => (
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
                        {post.isPinned && <FileText className="h-4 w-4 text-blue-600" />}
                        {post.isFeatured && <FileText className="h-4 w-4 text-yellow-600" />}
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
                          <Link href={`/communities/${community.id}/posts/${post.id}`}>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/dashboard/admin/posts/${post.id}/edit`}>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleTogglePublish(post)}
                            disabled={publishMutation.isPending}
                          >
                            {post.isPublished ? 'Unpublish' : 'Publish'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTogglePin(post)}
                            disabled={togglePinMutation.isPending}
                          >
                            {post.isPinned ? 'Unpin' : 'Pin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleFeature(post)}
                            disabled={toggleFeatureMutation.isPending}
                          >
                            {post.isFeatured ? 'Unfeature' : 'Feature'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeletePost(post)}
                            disabled={deletePostMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/admin/communities">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Communities
            </Button>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={community.isActive ? "default" : "secondary"}>
            {community.isActive ? "Active" : "Inactive"}
          </Badge>
          <Link href={`/dashboard/admin/communities/${community.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteCommunityMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Overview Section - Always Visible */}
      {renderOverviewTab()}

      {/* Tabs for Courses and Posts */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">
            Courses
          </TabsTrigger>
          <TabsTrigger value="posts">
            Posts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          {renderCoursesTab()}
        </TabsContent>

        <TabsContent value="posts">
          {renderPostsTab()}
        </TabsContent>
      </Tabs>

    </div>
  )
}