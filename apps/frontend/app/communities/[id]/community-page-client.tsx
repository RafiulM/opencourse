"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  BookOpen,
  Users,
  Clock,
  Star,
  ChevronRight,
  FileText,
  Video,
  Link as LinkIcon,
} from "lucide-react"
import { useCommunity } from "@/hooks/use-communities"
import { useCourses } from "@/hooks/use-courses"
import { useCourseModules } from "@/hooks/use-modules"
import { Navbar } from "@/components/navbar"
import Image from "next/image"

interface CommunityPageClientProps {
  communityId: string
}

export function CommunityPageClient({ communityId }: CommunityPageClientProps) {
  const params = useParams()
  const actualCommunityId = communityId || params.id as string

  const { data: communityData, isLoading: communityLoading } =
    useCommunity(actualCommunityId)
  const { data: coursesData, isLoading: coursesLoading } = useCourses(1, 100, {
    communityId: actualCommunityId,
  })

  const community = communityData?.data
  const courses = coursesData?.data || []

  if (communityLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="bg-muted h-8 w-1/3 rounded"></div>
            <div className="bg-muted h-32 rounded"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted h-48 rounded"></div>
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-muted-foreground text-2xl font-bold">
              Community not found
            </h1>
            <Link href="/">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Community Banner */}
        {community.banner && (
          <div className="mb-8">
            <div className="aspect-[16/5] w-full overflow-hidden rounded-lg">
              <Image
                src={community.banner}
                alt={`${community.name} banner`}
                className="h-full w-full object-cover"
                width={1000}
                height={1000}
              />
            </div>
          </div>
        )}

        {/* Community Header */}
        <div className="mb-8">
          <div className="mb-6 flex items-center space-x-4">
            <div className="flex-shrink-0">
              {community.avatar ? (
                <Image
                  src={community.avatar}
                  alt={`${community.name} avatar`}
                  className="h-12 w-12 rounded-full object-cover"
                  width={64}
                  height={64}
                />
              ) : (
                <Users className="text-primary h-12 w-12" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {community.name}
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                {community.description || "Welcome to this learning community"}
              </p>
            </div>
          </div>

          <div className="text-muted-foreground flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>{courses.length} courses</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>Community</span>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="modules">All Modules</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Courses in this Community</h2>
            </div>

            {coursesLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-muted h-48 animate-pulse rounded"
                  ></div>
                ))}
              </div>
            ) : courses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Card
                    key={course.id}
                    className="transition-shadow hover:shadow-lg"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="line-clamp-2">
                          {course.title}
                        </CardTitle>
                        <Badge
                          variant={course.isPublished ? "default" : "secondary"}
                        >
                          {course.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-3">
                        {course.description || "No description available"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-muted-foreground flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration || 0}h</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4" />
                            <span className="capitalize">
                              {course.difficulty || "beginner"}
                            </span>
                          </div>
                        </div>

                        {course.price && (
                          <div className="text-primary text-lg font-bold">
                            ${course.price}
                          </div>
                        )}

                        <Link
                          href={`/communities/${actualCommunityId}/courses/${course.id}`}
                        >
                          <Button className="w-full">
                            View Course
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <h3 className="mb-2 text-lg font-medium">No courses yet</h3>
                  <p className="text-muted-foreground">
                    This community doesn't have any courses yet. Check back
                    later!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Community Posts</h2>
              <Link href={`/communities/${actualCommunityId}/posts`}>
                <Button variant="outline">
                  View All Posts
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    Community Posts
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Stay updated with the latest announcements, discussions, and resources from this community.
                  </p>
                  <Link href={`/communities/${actualCommunityId}/posts`}>
                    <Button>
                      Browse All Posts
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            <ModulesSection courses={courses} />
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About {community.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {community.description ||
                      "This community is focused on providing quality educational content and fostering a collaborative learning environment."}
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 font-medium">Community Stats</h4>
                      <div className="text-muted-foreground space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Courses:</span>
                          <span>{courses.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Published Courses:</span>
                          <span>
                            {courses.filter((c) => c.isPublished).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function ModulesSection({ courses }: { courses: any[] }) {
  const [allModules, setAllModules] = useState<any[]>([])

  // This is a simplified approach - in a real app you'd want to batch these requests
  // For now, we'll show modules for the first few courses
  const firstFewCourses = courses.slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Modules Across Courses</h2>
      </div>

      {firstFewCourses.length > 0 ? (
        <div className="space-y-6">
          {firstFewCourses.map((course) => (
            <CourseModulesSection key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-medium">No modules available</h3>
            <p className="text-muted-foreground">
              Modules will appear here once courses are created with content.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CourseModulesSection({ course }: { course: any }) {
  const { data: modulesData } = useCourseModules(course.id)
  const modules = modulesData?.data || []

  if (modules.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5" />
          <span>{course.title}</span>
        </CardTitle>
        <CardDescription>
          {modules.length} modules in this course
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {modules.map((module: any) => (
            <div
              key={module.id}
              className="flex items-center space-x-3 rounded-lg border p-3"
            >
              <div className="flex-shrink-0">
                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                  <span className="text-primary text-sm font-medium">
                    {module.order}
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-medium">{module.title}</h4>
                {module.description && (
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {module.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}