"use client"

import Link from "next/link"
import { useSession, signOut } from "../lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, BookOpen } from "lucide-react"

export default function Home() {
  const { data: session } = useSession()
  console.log("home session", session)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">OpenCourse</h1>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(session.user.name || session.user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      Welcome, {session.user.name || session.user.email}!
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" asChild>
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Welcome to{" "}
              <span className="text-primary">OpenCourse</span>
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-muted-foreground">
              Your platform for online learning and course management. Discover, learn, and grow with our comprehensive course library.
            </p>
          </div>

          {session ? (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Welcome back!</CardTitle>
                <CardDescription>
                  Ready to continue your learning journey?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="flex-1 max-w-xs">
                    Browse Courses
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1 max-w-xs">
                    My Learning
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Button size="lg" asChild>
                <Link href="/signup" className="inline-flex items-center px-8 py-3 text-lg">
                  Get started
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Join thousands of learners already on OpenCourse
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
