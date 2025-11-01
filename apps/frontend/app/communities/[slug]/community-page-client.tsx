"use client"

import type { ElementType } from "react"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, BookOpen, FileText, Lock } from "lucide-react"

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
import {
  useCommunityBySlug,
  useCommunityPreviewBySlug,
} from "@/hooks/use-communities"
import { useCourses } from "@/hooks/use-courses"
import { useCommunityPosts } from "@/hooks/use-posts"
import { CommunityHeader } from "./community-header"
import { AutoJoinHandler } from "@/components/community/auto-join-handler"
import { JoinPromptOverlay } from "@/components/community/join-prompt-overlay"

interface CommunityPageClientProps {
  communitySlug: string
}

export function CommunityPageClient({
  communitySlug,
}: CommunityPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showJoinPrompt, setShowJoinPrompt] = useState(false)

  const {
    data: communityData,
    isLoading: communityLoading,
    error: communityError,
  } = useCommunityBySlug(communitySlug)

  const { data: communityPreviewData, isLoading: previewLoading } =
    useCommunityPreviewBySlug(communitySlug, {
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

  const posts = postsData?.data ?? []

  const isCommunityLoading =
    communityLoading || (communityError ? previewLoading : false)

  // Handle join request from URL parameters
  useEffect(() => {
    if (searchParams?.get("request") === "join" && community) {
      setShowJoinPrompt(true)
    }
  }, [searchParams, community])

  if (isCommunityLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="bg-muted h-48 rounded-lg" />
            <div className="flex items-center gap-4">
              <div className="bg-muted h-16 w-16 rounded-full" />
              <div className="space-y-3">
                <div className="bg-muted h-8 w-56 rounded" />
                <div className="bg-muted h-4 w-72 rounded" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-muted h-48 rounded-lg" />
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

      {/* Community Banner - thin, constrained width */}
      {community?.banner && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className="relative w-full overflow-hidden rounded-lg">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-1/2 w-full overflow-hidden rounded-lg">
                <Image
                  src={community.banner}
                  alt={`${community.name} banner`}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Overlay gradient for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CommunityHeader
          community={community}
          showBanner={false} // Banner is now shown between navbar and community header
          showRequestToJoin={shouldRestrictContent}
          onRequestToJoin={
            shouldRestrictContent ? handleRequestToJoin : undefined
          }
        />

        {/* Auto-join handler for users redirected after login */}
        {community && (
          <AutoJoinHandler
            communityId={community.id}
            communityName={community.name}
          />
        )}

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
                          <div className="text-muted-foreground flex items-center justify-between text-sm">
                            <span>
                              Difficulty: {course.difficulty || "Beginner"}
                            </span>
                            <span>
                              {course.duration
                                ? `${course.duration}h`
                                : "Self-paced"}
                            </span>
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

      {/* Join Prompt Overlay */}
      {community && (
        <JoinPromptOverlay
          communityId={community.id}
          communityName={community.name}
          communitySlug={community.slug || communitySlug}
          isOpen={showJoinPrompt}
          onClose={() => setShowJoinPrompt(false)}
        />
      )}
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
        <h2 className="text-foreground text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
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
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <Icon className="text-muted-foreground h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
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
