'use client';

import { useState } from "react"
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
  Users,
  Clock,
  DollarSign,
  Star 
} from "lucide-react"
import Link from "next/link"
import { useCourses, useDeleteCourse } from "@/hooks/use-courses"
import { useCommunities } from "@/hooks/use-communities"
import { Course } from "@/lib/types"
import { toast } from "sonner"

export default function CoursesPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedCommunity, setSelectedCommunity] = useState<string>("all")
  const limit = 10

  const { data: communitiesData } = useCommunities(1, 100) // Get all communities for filter
  const { data, isLoading, error } = useCourses(page, limit, selectedCommunity === "all" ? undefined : selectedCommunity)
  const deleteCourseMutation = useDeleteCourse()

  const handleDelete = async (course: Course) => {
    if (confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) {
      try {
        await deleteCourseMutation.mutateAsync(course.id)
        toast.success("Course deleted successfully")
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading courses: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Courses Management</CardTitle>
              <CardDescription>
                Create and manage course content
              </CardDescription>
            </div>
            <Link href="/dashboard/admin/courses/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Course
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Communities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Communities</SelectItem>
                  {communitiesData?.data?.map((community) => (
                    <SelectItem key={community.id} value={community.id}>
                      {community.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Community</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        Loading courses...
                      </TableCell>
                    </TableRow>
                  ) : data?.data?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        No courses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data
                      ?.filter(course => 
                        search === "" || 
                        course.title.toLowerCase().includes(search.toLowerCase()) ||
                        course.slug.toLowerCase().includes(search.toLowerCase())
                      )
                      ?.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                                {course.title?.charAt(0).toUpperCase() || 'C'}
                              </div>
                              <div>
                                <div className="font-medium flex items-center">
                                  {course.title}
                                  {course.isFeatured && (
                                    <Star className="ml-2 h-4 w-4 text-yellow-500 fill-current" />
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  /{course.slug}
                                </div>
                                {course.duration && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Clock className="mr-1 h-3 w-3" />
                                    {course.duration} min
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {communitiesData?.data?.find(c => c.id === course.communityId)?.name || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                              {course.price === "0" ? "Free" : `$${course.price}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            {course.difficulty && (
                              <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                                {course.difficulty}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                              {course.enrollmentCount}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={course.isPublished ? "default" : "secondary"}>
                              {course.isPublished ? "Published" : "Draft"}
                            </Badge>
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
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(course)}
                                  disabled={deleteCourseMutation.isPending}
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
            {data?.pagination && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.pagination.total)} of{" "}
                  {data.pagination.total} courses
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.pagination.totalPages}
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