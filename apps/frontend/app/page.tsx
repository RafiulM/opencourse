"use client"

import Link from "next/link"
import { useSession } from "../lib/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BookOpen, Users } from "lucide-react"
import { CommunityExplorer } from "@/components/community-explorer"
import { Navbar } from "@/components/navbar"

export default function Home() {
  const { data: session, isPending } = useSession()

  // Show skeleton while session is loading
  if (isPending) {
    return (
      <div className="bg-background min-h-screen">
        {/* Navbar skeleton */}
        <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo skeleton */}
              <div className="flex items-center space-x-2">
                <div className="bg-muted h-6 w-6 animate-pulse rounded"></div>
                <div className="bg-muted h-6 w-24 animate-pulse rounded"></div>
              </div>

              {/* Navigation items skeleton */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="hidden items-center space-x-2 md:flex">
                    <div className="bg-muted h-8 w-20 animate-pulse rounded"></div>
                    <div className="bg-muted h-8 w-32 animate-pulse rounded"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="hidden items-center space-x-2 sm:flex">
                      <div className="bg-muted h-8 w-8 animate-pulse rounded-full"></div>
                      <div className="bg-muted h-4 w-20 animate-pulse rounded"></div>
                    </div>
                    <div className="bg-muted h-8 w-8 animate-pulse rounded-full sm:hidden"></div>
                    <div className="bg-muted h-8 w-20 animate-pulse rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content skeleton */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Hero Section skeleton */}
          <div className="mb-12 space-y-6 text-center">
            <div className="bg-muted mx-auto h-16 w-3/4 animate-pulse rounded sm:h-20 lg:h-24"></div>
            <div className="bg-muted mx-auto h-4 w-1/2 animate-pulse rounded"></div>
            <div className="bg-muted mx-auto h-4 w-2/3 animate-pulse rounded"></div>
            <div className="bg-muted mx-auto h-4 w-1/3 animate-pulse rounded"></div>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <div className="bg-muted h-10 w-40 animate-pulse rounded"></div>
              <div className="bg-muted h-10 w-32 animate-pulse rounded"></div>
            </div>
          </div>

          {/* Communities Section skeleton */}
          <div className="mb-12 space-y-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="bg-muted h-10 w-full max-w-sm animate-pulse rounded sm:w-64"></div>
              <div className="flex gap-2">
                <div className="bg-muted h-10 w-32 animate-pulse rounded"></div>
                <div className="bg-muted h-10 w-32 animate-pulse rounded"></div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted h-64 animate-pulse rounded-lg"
                ></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 space-y-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Welcome to <span className="text-primary">OpenCourse</span>
          </h1>
          <p className="text-muted-foreground mx-auto max-w-3xl text-xl">
            The open source platform for discovering communities and courses.
          </p>

          {!session && (
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">Join a Community</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Communities Section */}
        <CommunityExplorer
          showHeader={false}
          showViewToggle={true}
          showCreateButton={false}
          className="mb-12"
        />
      </main>
    </div>
  )
}
