"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownEditor } from "@/components/markdown-editor"

export interface PostFormData {
  title: string
  content: string
  excerpt: string
}

interface PostFormProps {
  data: PostFormData
  onChange: (data: Partial<PostFormData>) => void
  disabled?: boolean
  className?: string
}

export function PostForm({ data, onChange, disabled = false, className }: PostFormProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Post Content</CardTitle>
        <CardDescription>
          Create engaging content for your community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="Enter post title..."
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            disabled={disabled}
            className="text-lg"
          />
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

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content">Content *</Label>
          <MarkdownEditor
            id="content"
            value={data.content}
            onChange={(content) => onChange({ content })}
            placeholder="Write your post content here..."
          />
          <p className="text-muted-foreground text-sm">
            Use the toolbar to format your post with headers, lists,
            links, code blocks, and live preview.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}