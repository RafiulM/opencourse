"use client"

import type { ElementType } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  Lock,
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
import { PostCard } from "@/components/post/post-card"
import { useCommunityBySlug, useCommunityPreviewBySlug } from "@/hooks/use-communities"
import { useCourses } from "@/hooks/use-courses"
import { useCommunityPosts } from "@/hooks/use-posts"
import { CommunityHeader } from "./community-header"

interface CommunityPageClientProps {
  communitySlug: string
}

export function CommunityPageClient({ communitySlug }: CommunityPageClientProps) {
  const router = useRouter()

  const {
    data: communityData,
    isLoading: communityLoading,
    error: communityError,
  } = useCommunityBySlug(communitySlug)

  const {
    data: communityPreviewData,
    isLoading: previewLoading,
  } = useCommunityPreviewBySlug(communitySlug, {
    enabled: !!communityError,
  })

  const communityFromPrimary = communityData?.data
  const communityFromPreview = communityPreviewData?.data
  const community = communityFromPrimary ?? communityFromPreview
  const resolvedCommunityId = community?.id
  const resolvedSlug = community?.slug ?? communitySlug
  const isPreview = !communityFromPrimary && !!communityFromPreview
  const isPrivateCommunity =
    community?.privacy === "private" || community?.privacy === "invite_only"
  const shouldRestrictContent = Boolean(isPreview && isPrivateCommunity)
  const shouldFetchCommunityContent = Boolean(
    resolvedCommunityId && communityFromPrimary
  )
  const handleRequestToJoin = () => {
    router.push(`/communities/${resolvedSlug}?request=join`)
  }

  const {
    data: coursesData,
    isLoading: coursesLoading,
    error: coursesError,
  } = useCourses(
    1,
    6,
    resolvedCommunityId
      ? { communityId: resolvedCommunityId, isPublished: true }
      : {},
    ["createdAt:desc"],
    { enabled: shouldFetchCommunityContent }
  )

  const courses = coursesData?.data ?? []

  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
  } = useCommunityPosts(
    resolvedCommunityId ?? "",
    {
      page: 1,
      pageSize: 3,
      filters: {
        isPublished: true,
      },
      sort: [{ field: "publishedAt", order: "desc" }],
    },
    { enabled: shouldFetchCommunityContent }
  )

  const posts = postsData?.data?.posts ?? []

  const isCommunityLoading =
    communityLoading || (communityError ? previewLoading : false)

  if (isCommunityLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-48 rounded-lg bg-muted" />
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted" />
              <div className="space-y-3">
                <div className="h-8 w-56 rounded bg-muted" />
                <div className="h-4 w-72 rounded bg-muted" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-48 rounded-lg bg-muted" />
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
        <CommunityHeader
          community={community}
          showRequestToJoin={shouldRestrictContent}
          onRequestToJoin={shouldRestrictContent ? handleRequestToJoin : undefined}
        />

        <div className="mt-10 space-y-12">
          {shouldRestrictContent ? (
            <EmptyState
              icon={Lock}
              title="This community is private"
              description="Request to join to view posts and courses."
            />
          ) : (
            <>
              <section className="space-y-4">
                <SectionHeading
                  title="Recent Posts"
                  description="Latest updates, discussions, and announcements from this community."
                  href={`/communities/${resolvedSlug}/posts`}
                />

                {postsLoading ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <PostSkeleton key={index} />
                    ))}
                  </div>
                ) : postsError ? (
                  <EmptyState
                    icon={FileText}
                    title="Unable to load posts"
                    description="There was an issue fetching recent posts for this community."
                  />
                ) : posts.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No posts yet"
                    description="Stay tuned! Once posts are published, they will appear here."
                  />
                )}
              </section>

              <section className="space-y-4">
                <SectionHeading
                  title="Recent Courses"
                  description="Explore the newest learning paths created by community instructors."
                  href={`/communities/${resolvedSlug}/courses`}
                />

                {coursesLoading ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <CourseSkeleton key={index} />
                    ))}
                  </div>
                ) : coursesError ? (
                  <EmptyState
                    icon={BookOpen}
                    title="Unable to load courses"
                    description="There was an issue fetching the latest courses for this community."
                  />
                ) : courses.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                      <Card
                        key={course.id}
                        className="transition-shadow hover:shadow-lg"
                      >
                        <CardHeader>
                          <CardTitle className="line-clamp-2 text-lg">
                            {course.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-3">
                            {course.description || "No description available."}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Difficulty: {course.difficulty || "Beginner"}</span>
                            <span>{course.duration ? `${course.duration}h` : "Self-paced"}</span>
                          </div>
                          <Button asChild className="w-full">
                            <Link
                              href={`/communities/${resolvedSlug}/courses/${course.id}`}
                            >
                              View course
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="No courses yet"
                    description="Courses published to this community will show up here."
                  />
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function SectionHeading({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" asChild>
        <Link href={href}>
          View more
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType
  title: string
  description: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function PostSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
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
