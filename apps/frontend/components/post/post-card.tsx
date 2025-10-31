"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Eye, Calendar, User } from "lucide-react"
import { Post } from "@/lib/types"
import { cn } from "@/lib/utils"
import { PostVisibilityBadge } from "./access-control"

interface PostCardProps {
  post: Post
  className?: string
}

export function PostCard({ post, className }: PostCardProps) {
  const displayName = post.author?.name || "Unknown Author"
  const authorInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const publishedDate = post.publishedAt || post.createdAt
  const timeAgo = formatDistanceToNow(new Date(publishedDate), {
    addSuffix: true,
  })

  // Get excerpt or truncate content
  const getExcerpt = () => {
    if (post.excerpt) return post.excerpt
    // Handle null/undefined content (e.g., when user is not a member and post is community view only)
    if (!post.content) return "Content is only available to community members."
    // Strip markdown and truncate
    const plainText = post.content
      .replace(/#{1,6}\s+/g, "") // Remove headers
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/`(.*?)`/g, "$1") // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "") // Remove images
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim()

    return plainText.length > 150 ? plainText.slice(0, 150) + "..." : plainText
  }

  const communitySlug = post.community?.slug ?? post.communityId

  return (
    <Link
      href={`/communities/${communitySlug}/posts/${post.slug}`}
      className={cn("block transition-transform hover:scale-[1.02]", className)}
    >
      <Card className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={post.author?.image} alt={displayName} />
                <AvatarFallback className="text-xs">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-muted-foreground truncate text-sm font-medium">
                    {displayName}
                  </p>
                  <span className="text-muted-foreground text-xs">•</span>
                  <time className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {timeAgo}
                  </time>
                </div>
                {post.community && (
                  <p className="text-muted-foreground text-xs">
                    in {post.community.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {post.isPinned && (
                <Badge variant="secondary" className="text-xs">
                  Pinned
                </Badge>
              )}
              {post.isFeatured && (
                <Badge variant="default" className="text-xs">
                  Featured
                </Badge>
              )}
              <PostVisibilityBadge
                visibility={post.visibility}
                className="text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold leading-tight">
            {post.title}
          </h3>

          <p className="text-muted-foreground mb-3 line-clamp-3 text-sm">
            {getExcerpt()}
          </p>

          {post.tags && post.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{post.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{post.viewsCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{post.likesCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              <span>{post.commentsCount || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
