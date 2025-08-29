"use client"

import Link from "next/link"
import { useSession } from "../lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users } from "lucide-react"
import { CommunityExplorer } from "@/components/community-explorer"
import { Navbar } from "@/components/navbar"

export default function Home() {
  const { data: session } = useSession()
  console.log("home session", session)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Welcome to{" "}
            <span className="text-primary">OpenCourse</span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-muted-foreground">
            Your platform for discovering and joining learning communities. Browse communities below, each offering specialized courses, resources, and collaborative learning experiences.
          </p>

          {!session && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Join a Community
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">
                  Sign In
                </Link>
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

        {/* Features Section */}
        {session && (
          <section className="mt-20 grid gap-8 md:grid-cols-2 max-w-2xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>Manage Content</CardTitle>
                <CardDescription>
                  Access your admin dashboard to manage courses, modules, and materials.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/admin">
                    Go to Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">🎓</span>
                </div>
                <CardTitle>Learning Journey</CardTitle>
                <CardDescription>
                  Track your progress and continue building amazing learning experiences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/admin">
                    View Progress
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  )
}
