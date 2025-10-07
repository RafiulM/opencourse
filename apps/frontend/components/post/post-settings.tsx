"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type PostType = "general" | "announcement" | "discussion" | "resource"

interface PostSettingsProps {
  postType: PostType
  onPostTypeChange: (type: PostType) => void
  allowComments: boolean
  onAllowCommentsChange: (allow: boolean) => void
  isPublished: boolean
  onIsPublishedChange: (published: boolean) => void
  className?: string
}

export function PostSettings({
  postType,
  onPostTypeChange,
  allowComments,
  onAllowCommentsChange,
  isPublished,
  onIsPublishedChange,
  className
}: PostSettingsProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Post Settings</CardTitle>
        <CardDescription>
          Configure post behavior and appearance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Post Type */}
        <div className="space-y-2">
          <Label>Post Type</Label>
          <Select
            value={postType}
            onValueChange={(value: PostType) => onPostTypeChange(value)}
          >
            <SelectTrigger>
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

        {/* Allow Comments */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Allow Comments</Label>
            <p className="text-muted-foreground text-sm">
              Users can comment on this post
            </p>
          </div>
          <Switch
            checked={allowComments}
            onCheckedChange={onAllowCommentsChange}
          />
        </div>

        {/* Publish Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Publish Status</Label>
            <p className="text-muted-foreground text-sm">
              Post will be {isPublished ? "published" : "saved as draft"}
            </p>
          </div>
          <Switch
            checked={isPublished}
            onCheckedChange={onIsPublishedChange}
          />
        </div>
      </CardContent>
    </Card>
  )
}