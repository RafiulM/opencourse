"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Building2,
  BookOpen,
  Users,
  FileText,
  MessageSquare,
  Plus,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react"
import { useCommunities } from "@/hooks/use-communities"
import { useCourses } from "@/hooks/use-courses"
import { useQuizzes } from "@/hooks/use-quizzes"
import { useContentStats } from "@/hooks/use-content-stats"
import { useSession } from "@/lib/auth"
import { usePosts } from "@/hooks/use-posts"

export default function AdminDashboard() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  console.log({ session })

  const { data: communitiesData } = useCommunities(1, 100, {
    createdBy: userId,
  }) // Get user's communities for accurate count
  const { data: coursesData } = useCourses(1, 100) // Get all courses for accurate count
  const { data: quizzesData } = useQuizzes(1, 100) // Get all quizzes for content count
  const { totalModules, totalMaterials, totalContentItems, isLoading } =
    useContentStats()
  const { data: postsData } = usePosts({ page: 1, pageSize: 100 }) // Get posts for stats

  // Calculate total students from communities
  const totalStudents =
    communitiesData?.data?.reduce(
      (sum, community) => sum + (community.memberCount || 0),
      0
    ) || 0

  // Calculate total content items
  const totalQuizzes = quizzesData?.data?.length || 0
  const contentItemsCount = totalContentItems + totalQuizzes

  // Real data for posts and comments
  const totalPosts = postsData?.data?.pagination?.totalItems || 0
  const totalComments =
    postsData?.data?.posts?.reduce(
      (sum, post) => sum + (post.commentsCount || 0),
      0
    ) || 0

  // Calculate published and draft posts from real data
  const publishedPosts =
    postsData?.data?.posts?.filter((post) => post.isPublished)?.length || 0
  const draftPosts =
    postsData?.data?.posts?.filter((post) => !post.isPublished)?.length || 0

  // Note: reported comments, approved/pending/rejected comments would need a separate API endpoint
  // For now, we'll show only total comments which we have real data for

  const stats = [
    {
      title: "Total Communities",
      value: communitiesData?.pagination?.total || 0,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Courses",
      value: coursesData?.pagination?.total || 0,
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Social Posts",
      value: totalPosts.toLocaleString(),
      icon: FileText,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Comments",
      value: totalComments.toLocaleString(),
      icon: MessageSquare,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  ]

  const quickActions = [
    {
      title: "Create Community",
      description: "Start a new learning community",
      href: "/dashboard/admin/communities/new",
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Create Course",
      description: "Add a new course to a community",
      href: "/dashboard/admin/courses/new",
      icon: BookOpen,
      color: "text-green-600",
    },
    {
      title: "Create Post",
      description: "Write a new social post",
      href: "/dashboard/admin/posts/new",
      icon: FileText,
      color: "text-indigo-600",
    },
    {
      title: "Moderate Comments",
      description: "Review reported comments",
      href: "/dashboard/admin/comments",
      icon: MessageSquare,
      color: "text-pink-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Button
                variant="outline"
                className="h-auto w-full justify-start p-4"
              >
                <action.icon className={`mr-3 h-5 w-5 ${action.color}`} />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-muted-foreground text-sm">
                    {action.description}
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Management Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Communities
              <Link href="/dashboard/admin/communities">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>Manage learning communities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {communitiesData?.data?.slice(0, 3).map((community) => (
                <div
                  key={community.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm">{community.name}</span>
                  <Badge variant="outline">
                    {community.memberCount} members
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Courses
              <Link href="/dashboard/admin/courses">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>Manage course content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {coursesData?.data?.slice(0, 3).map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm">{course.title}</span>
                  <Badge variant={course.isPublished ? "default" : "secondary"}>
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Social Posts
              <Link href="/dashboard/admin/posts">
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>
              Manage social posts across communities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Posts</span>
                <Badge variant="outline">{totalPosts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Published</span>
                <Badge variant="default">{publishedPosts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Drafts</span>
                <Badge variant="secondary">{draftPosts}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Comments
              <Link href="/dashboard/admin/comments">
                <Button variant="outline" size="sm">
                  Moderate
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>Moderate user comments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Comments</span>
              <Badge variant="outline">{totalComments}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Comments moderation
              </span>
              <Badge variant="secondary">Available</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
