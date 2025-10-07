"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import {
  Heart,
  MessageCircle,
  Eye,
  Calendar,
  User
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Post } from "@/lib/types"
import { cn } from "@/lib/utils"

interface PostViewProps {
  post: Post
  className?: string
}

export function PostView({ post, className }: PostViewProps) {
  const displayName = post.author?.name || "Unknown Author"
  const authorInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const publishedDate = post.publishedAt || post.createdAt
  const timeAgo = formatDistanceToNow(new Date(publishedDate), { addSuffix: true })
  const fullDate = new Date(publishedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className={cn("max-w-4xl mx-auto space-y-8", className)}>
      {/* Post Title */}
      <h1 className="text-3xl font-bold mb-4 leading-tight">
        {post.title}
      </h1>

      {/* Author and Meta Info */}
      <div className="flex items-center justify-between gap-4 pb-6 border-b">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={post.author?.image} alt={displayName} />
            <AvatarFallback className="text-xs">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-foreground truncate">
                {displayName}
              </p>
              {post.author && (
                <Badge variant="outline" className="text-xs">
                  Author
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <time className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {fullDate}
              </time>
              <span>•</span>
              <span>{timeAgo}</span>
              {post.community && (
                <>
                  <span>•</span>
                  <span>in {post.community.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
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
          <Badge variant="outline" className="text-xs capitalize">
            {post.postType}
          </Badge>
        </div>
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground pb-6 border-b">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>{post.viewsCount || 0} views</span>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          <span>{post.likesCount || 0} likes</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentsCount || 0} comments</span>
        </div>
      </div>

      {/* Post Content */}
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children, ...props }) => (
              <h1 className="text-2xl font-bold mt-8 mb-4 first:mt-0" {...props}>
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 className="text-xl font-semibold mt-6 mb-3" {...props}>
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 className="text-lg font-medium mt-4 mb-2" {...props}>
                {children}
              </h3>
            ),
            p: ({ children, ...props }) => (
              <p className="mb-4 leading-7" {...props}>
                {children}
              </p>
            ),
            ul: ({ children, ...props }) => (
              <ul className="mb-4 ml-6 list-disc space-y-1" {...props}>
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="mb-4 ml-6 list-decimal space-y-1" {...props}>
                {children}
              </ol>
            ),
            blockquote: ({ children, ...props }) => (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4" {...props}>
                {children}
              </blockquote>
            ),
            code: ({ inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <pre className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 overflow-x-auto mb-4">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm" {...props}>
                  {children}
                </code>
              )
            },
            a: ({ children, href, ...props }) => (
              <a
                href={href}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            ),
            img: ({ src, alt, ...props }) => (
              <img
                src={src}
                alt={alt}
                className="rounded-md max-w-full h-auto my-4"
                {...props}
              />
            ),
            table: ({ children, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props}>
                  {children}
                </table>
              </div>
            ),
            th: ({ children, ...props }) => (
              <th className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-left font-semibold" {...props}>
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2" {...props}>
                {children}
              </td>
            ),
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {/* Comments Section */}
      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4">
          Comments ({post.commentsCount || 0})
        </h3>

        {post.allowComments ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Comments are coming soon!</p>
            <p className="text-sm">You'll be able to discuss this post here once our comment system is ready.</p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Comments are disabled for this post.</p>
          </div>
        )}
      </div>
    </div>
  )
}