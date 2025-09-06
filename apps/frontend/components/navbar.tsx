'use client';

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, BookOpen, Users, Grid3X3 } from "lucide-react";
import { useCommunities } from "@/hooks/use-communities";

export function Navbar() {
  const { data: session, isPending } = useSession();
  const { data: communitiesData } = useCommunities(1, 100); // Fetch to check if communities exist
  
  // Show skeleton while session is loading
  if (isPending) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo skeleton */}
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-muted rounded animate-pulse"></div>
              <div className="h-6 w-24 bg-muted rounded animate-pulse"></div>
            </div>

            {/* Navigation items skeleton */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2">
                  <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
                  <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
                    <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse sm:hidden"></div>
                  <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Check if user should see create community button
  // In a real app, you'd check if the authenticated user owns/manages any communities
  // For demo purposes, we'll only show "Create Community" if no communities exist at all
  // This simulates a "first user experience" where they need to create the first community
  const shouldShowCreateButton = !communitiesData?.data || communitiesData.data.length === 0;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">OpenCourse</h1>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-3">
                {/* Admin Actions */}
                <div className="hidden md:flex items-center space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/admin">
                      <Grid3X3 className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                  
                  {shouldShowCreateButton && (
                    <Button size="sm" asChild>
                      <Link href="/dashboard/admin/communities/new">
                        Create First Community
                      </Link>
                    </Button>
                  )}
                </div>

                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(session.user.name || session.user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium max-w-32 truncate">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  
                  {/* Mobile Avatar */}
                  <Avatar className="h-8 w-8 sm:hidden">
                    <AvatarFallback>
                      {getInitials(session.user.name || session.user.email || 'U')}
                    </AvatarFallback>
                  </Avatar>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign out</span>
                  </Button>
                </div>
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
  );
}