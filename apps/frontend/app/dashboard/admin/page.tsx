'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Building2, 
  BookOpen, 
  Users, 
  FileText,
  Plus,
  TrendingUp,
  Clock,
  AlertCircle 
} from "lucide-react"
import { useCommunities } from "@/hooks/use-communities"
import { useCourses } from "@/hooks/use-courses"
import { useQuizzes } from "@/hooks/use-quizzes"
import { useContentStats } from "@/hooks/use-content-stats"

export default function AdminDashboard() {
  const { data: communitiesData } = useCommunities(1, 100) // Get all communities for accurate count
  const { data: coursesData } = useCourses(1, 100) // Get all courses for accurate count
  const { data: quizzesData } = useQuizzes(1, 100) // Get all quizzes for content count
  const { totalModules, totalMaterials, totalContentItems, isLoading } = useContentStats()

  // Calculate total students from communities
  const totalStudents = communitiesData?.data?.reduce((sum, community) => 
    sum + (community.memberCount || 0), 0) || 0

  // Calculate total content items
  const totalQuizzes = quizzesData?.data?.length || 0
  const contentItemsCount = totalContentItems + totalQuizzes

  const stats = [
    {
      title: "Total Communities",
      value: communitiesData?.pagination?.total || 0,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Total Courses",
      value: coursesData?.pagination?.total || 0,
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Active Students",
      value: totalStudents.toLocaleString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Content Items",
      value: isLoading ? "..." : contentItemsCount.toLocaleString(),
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ]

  const quickActions = [
    {
      title: "Create Community",
      description: "Start a new learning community",
      href: "/dashboard/admin/communities/new",
      icon: Building2,
      color: "text-blue-600"
    },
    {
      title: "Create Course",
      description: "Add a new course to a community",
      href: "/dashboard/admin/courses/new",
      icon: BookOpen,
      color: "text-green-600"
    },
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      href: "/dashboard/admin/users",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "View Analytics",
      description: "Check platform performance",
      href: "/dashboard/admin/analytics",
      icon: TrendingUp,
      color: "text-orange-600"
    }
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                >
                  <action.icon className={`mr-3 h-5 w-5 ${action.color}`} />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest changes across the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New community created</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Course published</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">User reported issue</p>
                <p className="text-xs text-muted-foreground">6 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Quiz completed</p>
                <p className="text-xs text-muted-foreground">8 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid gap-6 md:grid-cols-3">
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
            <CardDescription>
              Manage learning communities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {communitiesData?.data?.slice(0, 3).map((community) => (
                <div key={community.id} className="flex items-center justify-between">
                  <span className="text-sm">{community.name}</span>
                  <Badge variant="outline">{community.memberCount} members</Badge>
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
            <CardDescription>
              Manage course content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {coursesData?.data?.slice(0, 3).map((course) => (
                <div key={course.id} className="flex items-center justify-between">
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
              System Health
              <Badge variant="outline" className="text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Healthy
              </Badge>
            </CardTitle>
            <CardDescription>
              Platform status overview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Response Time</span>
              <span className="text-sm text-green-600">45ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Status</span>
              <span className="text-sm text-green-600">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage Usage</span>
              <span className="text-sm text-yellow-600">67%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}