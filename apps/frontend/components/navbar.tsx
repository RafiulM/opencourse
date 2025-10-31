"use client"

import Link from "next/link"
import { useSession, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LogOut,
  BookOpen,
  Grid3X3,
  ChevronDown,
  Moon,
  Sun,
  Monitor,
} from "lucide-react"
import { useCommunities } from "@/hooks/use-communities"
import { useTheme } from "next-themes"

export function Navbar() {
  const { data: session, isPending } = useSession()
  const { data: communitiesData } = useCommunities(1, 100) // Fetch to check if communities exist
  const { theme, resolvedTheme, setTheme } = useTheme()
  const activeTheme = theme ?? resolvedTheme ?? "system"

  // Show skeleton while session is loading
  if (isPending) {
    return (
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
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 transition-opacity hover:opacity-80"
          >
            <BookOpen className="text-primary h-6 w-6" />
            <h1 className="text-xl font-bold">OpenCourse</h1>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-3">
                {/* Admin Actions */}
                {/* <div className="hidden items-center space-x-2 md:flex">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/admin">
                      <Grid3X3 className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                </div> */}

                {/* User Info */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-2 px-2 sm:px-3"
                      aria-label={`Open account menu for ${
                        session.user.name || session.user.email || "user"
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getInitials(
                            session.user.name || session.user.email || "U"
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
                        {session.user.name || session.user.email}
                      </span>
                      <ChevronDown className="hidden h-4 w-4 sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-60" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {session.user.name || "Account"}
                        </span>
                        {session.user.email && (
                          <span className="text-muted-foreground text-xs">
                            {session.user.email}
                          </span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Theme</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={activeTheme}
                      onValueChange={setTheme}
                    >
                      <DropdownMenuRadioItem
                        value="light"
                        className="flex items-center gap-2"
                      >
                        <Sun className="h-4 w-4" />
                        Light
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="dark"
                        className="flex items-center gap-2"
                      >
                        <Moon className="h-4 w-4" />
                        Dark
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="system"
                        className="flex items-center gap-2"
                      >
                        <Monitor className="h-4 w-4" />
                        System
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive hover:text-destructive flex items-center gap-2"
                      onSelect={(event) => {
                        event.preventDefault()
                        signOut()
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
