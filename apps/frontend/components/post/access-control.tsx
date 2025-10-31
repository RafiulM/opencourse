import React from 'react';
import { Lock, Users, Eye, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/lib/auth';
import Link from 'next/link';

interface AccessControlProps {
  type: 'community' | 'authentication';
  communityName?: string;
  communityId?: string;
  className?: string;
}

export function PostAccessControl({
  type,
  communityName = 'this community',
  communityId,
  className = ''
}: AccessControlProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  if (type === 'authentication') {
    return (
      <Card className={`max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg">Sign In Required</CardTitle>
          <CardDescription>
            You need to be signed in to view this content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Join our community to access exclusive posts and discussions.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/sign-in">
                Sign In to View
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/sign-up">
                Create Account
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'community') {
    return (
      <Card className={`max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg">Community-Only Content</CardTitle>
          <CardDescription>
            This post is only visible to members of {communityName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAuthenticated ? (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Sign in and join {communityName} to access this exclusive content.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href="/sign-in">
                    Sign In to Join
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/sign-up">
                    Create Account
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Members Only
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Become a member of {communityName} to view this post and participate in community discussions.
              </p>
              {communityId && (
                <Button asChild className="w-full">
                  <Link href={`/communities/${communityId}`}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join {communityName}
                  </Link>
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}

interface PostVisibilityBadgeProps {
  visibility: 'public' | 'community';
  className?: string;
}

export function PostVisibilityBadge({ visibility, className = '' }: PostVisibilityBadgeProps) {
  if (visibility === 'community') {
    return (
      <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
        <Users className="h-3 w-3" />
        Community
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
      <Eye className="h-3 w-3" />
      Public
    </Badge>
  );
}