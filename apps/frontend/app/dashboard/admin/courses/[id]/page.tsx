'use client';

import { use } from "react"
import { notFound } from "next/navigation"
import { parseAsBoolean, useQueryState } from "nuqs"
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
  Clock,
  DollarSign,
  Star,
  BookOpen,
  FileText,
  Calendar,
  MoreHorizontal,
  Eye,
  Play,
  Plus
} from "lucide-react"
import Link from "next/link"
import { useCourse, useDeleteCourse } from "@/hooks/use-courses"
import { useCourseModules } from "@/hooks/use-modules"
import { useCommunity } from "@/hooks/use-communities"
import { Course } from "@/lib/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { EditCourseSheet } from "@/components/edit-course-sheet"

interface CourseDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [editOpen, setEditOpen] = useQueryState('edit', parseAsBoolean.withDefault(false))
  const { data: courseResponse, isLoading, error } = useCourse(id)
  const { data: modulesResponse } = useCourseModules(id)
  const { data: communityResponse } = useCommunity(courseResponse?.data?.communityId || '', !!courseResponse?.data?.communityId)
  const deleteCourse = useDeleteCourse()

  if (error) {
    if (error.message.includes('404')) {
      notFound()
    }
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading course: {error.message}</p>
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

  const course = courseResponse?.data
  if (!course) {
    notFound()
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) {
      try {
        await deleteCourse.mutateAsync(course.id)
        toast.success("Course deleted successfully")
        router.push("/dashboard/admin/courses")
      } catch (error) {
        toast.error("Failed to delete course")
      }
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'text-green-600'
      case 'intermediate':
        return 'text-yellow-600'
      case 'advanced':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/admin/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setEditOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteCourse.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Course Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                {course.title?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <CardTitle className="text-2xl">{course.title}</CardTitle>
                  {course.isFeatured && (
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  )}
                </div>
                <CardDescription className="text-lg">
                  /{course.slug}
                </CardDescription>
                {communityResponse?.data && (
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <BookOpen className="mr-1 h-4 w-4" />
                    {communityResponse.data.name}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge variant={course.isPublished ? "default" : "secondary"}>
                {course.isPublished ? "Published" : "Draft"}
              </Badge>
              {course.difficulty && (
                <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                  {course.difficulty}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {course.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{course.description}</p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Price</p>
                  <p className="text-2xl font-bold">
                    {course.price === "0" ? "Free" : `$${course.price}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Enrollments</p>
                  <p className="text-2xl font-bold">{course.enrollmentCount}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Modules</p>
                  <p className="text-2xl font-bold">{modulesResponse?.data?.length || 0}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {course.duration && (
              <>
                <Separator />
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-muted-foreground">{course.duration} minutes</p>
                  </div>
                </div>
              </>
            )}

            {(course.prerequisites?.length > 0 || course.learningOutcomes?.length > 0) && (
              <>
                <Separator />
                <div className="grid gap-6 md:grid-cols-2">
                  {course.prerequisites?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Prerequisites</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {course.prerequisites.map((prereq, index) => (
                          <li key={index}>{prereq}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {course.learningOutcomes?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Learning Outcomes</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {course.learningOutcomes.map((outcome, index) => (
                          <li key={index}>{outcome}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Course Modules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Course Modules</CardTitle>
              <CardDescription>
                Content modules for this course
              </CardDescription>
            </div>
            <Link href={`/dashboard/admin/modules/new?courseId=${course.id}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Module
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {modulesResponse?.data?.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No modules</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating a new module for this course.
              </p>
              <div className="mt-6">
                <Link href={`/dashboard/admin/modules/new?courseId=${course.id}`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Module
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Materials</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modulesResponse?.data
                    ?.sort((a, b) => a.order - b.order)
                    ?.map((module) => (
                      <TableRow key={module.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                              {module.title?.charAt(0).toUpperCase() || 'M'}
                            </div>
                            <div>
                              <div className="font-medium">{module.title}</div>
                              {module.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {module.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{module.order}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                            0 {/* This would come from materials count */}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(module.createdAt).toLocaleDateString()}
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
                              <Link href={`/dashboard/admin/modules/${module.id}`}>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/dashboard/admin/modules/${module.id}/edit`}>
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

      {/* Edit Course Sheet */}
      <EditCourseSheet
        course={course}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  )
}