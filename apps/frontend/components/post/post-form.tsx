"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { MarkdownEditor } from "@/components/markdown-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export type PostType = "general" | "announcement" | "discussion" | "resource"

export interface PostFormData {
  title: string
  content: string
  excerpt: string
  postType?: PostType
  visibility?: "community" | "public"
  allowComments?: boolean
  isPublished?: boolean
  tags?: string[]
  communityId?: string
  communityName?: string
  tagInput?: string
}

interface PostFormProps {
  data: PostFormData
  onChange: (data: Partial<PostFormData>) => void
  disabled?: boolean
  className?: string
  errors?: {
    title?: string
    content?: string
    community?: string
  }
  communities?: Array<{ id: string; name: string }>
  showCommunity?: boolean
}

export function PostForm({
  data,
  onChange,
  disabled = false,
  className,
  errors,
  communities = [],
  showCommunity = false
}: PostFormProps) {
  const handleAddTag = () => {
    const tagInput = data.tagInput || ""
    if (tagInput.trim() && !data.tags?.includes(tagInput.trim())) {
      onChange({
        tags: [...(data.tags || []), tagInput.trim()],
        tagInput: ""
      })
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({
      tags: (data.tags || []).filter((tag) => tag !== tagToRemove)
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Post Content</CardTitle>
        <CardDescription>
          Create engaging content for your community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Community Selection - Only show on new post */}
        {showCommunity && (
          <div className="space-y-2">
            <Label>Community *</Label>
            <Select
              value={data.communityId || ""}
              onValueChange={(value) => onChange({ communityId: value })}
            >
              <SelectTrigger className={errors?.community ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a community" />
              </SelectTrigger>
              <SelectContent>
                {communities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.community && (
              <p className="text-sm text-red-500">{errors.community}</p>
            )}
          </div>
        )}

        {/* Community Display - Only show on edit post */}
        {!showCommunity && data.communityName && (
          <div className="space-y-2">
            <Label>Community</Label>
            <p className="text-muted-foreground">{data.communityName}</p>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="Enter post title..."
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            disabled={disabled}
            className={`text-lg ${errors?.title ? "border-red-500" : ""}`}
          />
          {errors?.title && (
            <p className="text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            placeholder="Brief description of the post (optional)"
            value={data.excerpt}
            onChange={(e) => onChange({ excerpt: e.target.value })}
            disabled={disabled}
            rows={3}
          />
        </div>

        {/* Post Type and Tags - Same Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Post Type */}
          <div className="space-y-2">
            <Label>Post Type</Label>
            <Select
              value={data.postType || "general"}
              onValueChange={(value: PostType) => onChange({ postType: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="discussion">Discussion</SelectItem>
                <SelectItem value="resource">Resource</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add a tag..."
                value={data.tagInput || ""}
                onChange={(e) => onChange({ tagInput: e.target.value })}
                onKeyPress={handleKeyPress}
                disabled={disabled}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={disabled}
              >
                Add
              </Button>
            </div>
            {data.tags && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Viewing Permission and Allow Comments - Same Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visibility */}
          <div className="space-y-2">
            <Label>Viewing Permission</Label>
            <Select
              value={data.visibility || "community"}
              onValueChange={(value: "community" | "public") =>
                onChange({ visibility: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="community">Community Only</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">
              {data.visibility === "public"
                ? "Anyone can view this post"
                : "Only community members can view this post"}
            </p>
          </div>

          {/* Allow Comments */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Comments</Label>
              <p className="text-muted-foreground text-sm">
                Users can comment on this post
              </p>
            </div>
            <Switch
              checked={data.allowComments ?? true}
              onCheckedChange={(allowComments) => onChange({ allowComments })}
            />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content">Content *</Label>
          <div className={errors?.content ? "border border-red-500 rounded-md" : ""}>
            <MarkdownEditor
              id="content"
              value={data.content}
              onChange={(content) => onChange({ content })}
              placeholder="Write your post content here..."
            />
          </div>
          {errors?.content && (
            <p className="text-sm text-red-500">{errors.content}</p>
          )}
          <p className="text-muted-foreground text-sm">
            Use the toolbar to format your post with headers, lists,
            links, code blocks, and live preview.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}