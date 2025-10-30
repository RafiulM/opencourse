"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCommunityBySlug } from "@/hooks/use-communities"
import { useCourses } from "@/hooks/use-courses"
import { CommunityHeader } from "../community-header"

interface CommunityCoursesPageClientProps {
  communitySlug: string
}

export function CommunityCoursesPageClient({
  communitySlug,
}: CommunityCoursesPageClientProps) {
  const [page, setPage] = useState(1)
  const pageSize = 9

  const { data: communityData, isLoading: communityLoading } =
    useCommunityBySlug(communitySlug)

  const community = communityData?.data
  const communityId = community?.id ?? ""
  const resolvedSlug = community?.slug ?? communitySlug

  const {
    data: coursesData,
    isLoading: coursesLoading,
    error: coursesError,
  } = useCourses(
    page,
    pageSize,
    communityId
      ? { communityId, isPublished: true }
      : {},
    ["createdAt:desc"],
    { enabled: !!communityId }
  )

  const courses = coursesData?.data ?? []
  const coursesPagination = coursesData?.pagination
  const coursesTotal = coursesPagination?.total ?? courses.length
  const currentPage = coursesPagination?.page ?? page

  const startIndex = courses.length > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endIndex = courses.length > 0 ? startIndex + courses.length - 1 : 0

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
                Courses
              </h2>
              <p className="text-sm text-muted-foreground">
                {courses.length > 0
                  ? `Showing ${startIndex}-${endIndex} of ${coursesTotal} published courses.`
                  : "No published courses yet."
                }
              </p>
            </div>
          </div>

          {coursesLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <CourseSkeleton key={index} />
              ))}
            </div>
          ) : coursesError ? (
            <Card>
              <CardContent className="py-10 text-center">
                <BookOpen className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">
                  Unable to load courses
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  There was an error loading courses for this community.
                </p>
                <Button className="mt-4" onClick={() => handlePageChange(page)}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">
                  No courses yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Once instructors publish courses for this community, they will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-lg">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {course.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Difficulty: {course.difficulty || "Beginner"}</span>
                      <span>{course.duration ? `${course.duration}h` : "Self-paced"}</span>
                    </div>
                    <Button asChild className="w-full">
                      <Link href={`/communities/${resolvedSlug}/courses/${course.id}`}>
                        View course
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {coursesPagination && coursesPagination.totalPages > 1 && (
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
                {Array.from({ length: coursesPagination.totalPages }).map((_, index) => {
                  const pageNum = index + 1
                  const isCurrent = pageNum === page
                  const showButton =
                    pageNum === 1 ||
                    pageNum === coursesPagination.totalPages ||
                    Math.abs(pageNum - page) <= 1

                  if (!showButton) {
                    if (
                      Math.abs(pageNum - page) === 2 &&
                      (pageNum === 2 || pageNum === coursesPagination.totalPages - 1)
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
                disabled={page >= (coursesPagination.totalPages ?? 1)}
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

function CourseSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}
