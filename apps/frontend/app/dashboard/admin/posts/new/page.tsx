'use client';

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownPreviewer } from "@/components/markdown-previewer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Eye, Upload, X } from "lucide-react"
import Link from "next/link"
import { useCreateCommunityPost } from "@/hooks/use-posts"
import { useCommunities } from "@/hooks/use-communities"
import { CreatePostRequest } from "@/lib/types"
import { toast } from "sonner"
import { useSession } from "@/lib/auth"

export default function NewPostPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [formData, setFormData] = useState<CreatePostRequest>({
    title: "",
    content: "",
    excerpt: "",
    postType: "general",
    tags: [],
    allowComments: true,
    isPublished: false,
    attachments: []
  })
  const [tagInput, setTagInput] = useState("")
  const [selectedCommunityId, setSelectedCommunityId] = useState("")

  const { data: session } = useSession()
  const userId = session?.user?.id
  const { data: communitiesData } = useCommunities(1, 100, { createdBy: userId })
  const createPostMutation = useCreateCommunityPost()

  const communities = communitiesData?.data || []

  // Auto-select community from URL parameter
  useEffect(() => {
    const communityIdFromUrl = searchParams.get('communityId')
    if (communityIdFromUrl && communities.some(c => c.id === communityIdFromUrl)) {
      setSelectedCommunityId(communityIdFromUrl)
    }
  }, [searchParams, communities])

  const handleSubmit = async (publish: boolean = false) => {
    if (!selectedCommunityId) {
      toast.error("Please select a community")
      return
    }

    if (!formData.title.trim()) {
      toast.error("Title is required")
      return
    }

    if (!formData.content.trim()) {
      toast.error("Content is required")
      return
    }

    setIsSubmitting(true)
    try {
      const postData = {
        ...formData,
        isPublished: publish
      }

      await createPostMutation.mutateAsync({
        communityId: selectedCommunityId,
        data: postData
      })

      toast.success(`Post ${publish ? 'published' : 'created as draft'} successfully`)
      router.push("/dashboard/admin/posts")
    } catch (error) {
      toast.error("Failed to create post")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }))
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const renderPreview = () => {
    return (
      <div className="prose max-w-none">
        <h1>{formData.title}</h1>
        {formData.excerpt && <p className="text-muted-foreground">{formData.excerpt}</p>}
        <div className="whitespace-pre-wrap">{formData.content}</div>
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {formData.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/admin/posts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Posts
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Post</h1>
            <p className="text-muted-foreground">
              Create a new social post for any community
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsPreview(!isPreview)}
            disabled={isSubmitting}
          >
            <Eye className="mr-2 h-4 w-4" />
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Post'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
              <CardDescription>
                Create engaging content for your community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isPreview ? (
                <div className="border rounded-lg p-6 min-h-[400px]">
                  {renderPreview()}
                </div>
              ) : (
                <>
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter post title..."
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="text-lg"
                    />
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      placeholder="Brief description of the post (optional)"
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <MarkdownPreviewer
                      value={formData.content}
                      onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                      placeholder="Write your post content here (markdown supported)..."
                      className="min-h-[400px]"
                      editorClassName="min-h-[400px]"
                      previewClassName="min-h-[400px]"
                    />
                    <p className="text-sm text-muted-foreground">
                      Markdown formatting is supported. Use # for headers, * for emphasis, ** for bold, etc.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Community Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Community</CardTitle>
              <CardDescription>
                Select the community for this post
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
                <SelectTrigger>
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
            </CardContent>
          </Card>

          {/* Post Settings */}
          <Card>
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
                  value={formData.postType}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, postType: value }))}
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
                  <p className="text-sm text-muted-foreground">
                    Users can comment on this post
                  </p>
                </div>
                <Switch
                  checked={formData.allowComments}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, allowComments: checked }))
                  }
                />
              </div>

              {/* Publish Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Publish Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Post will be {formData.isPublished ? 'published' : 'saved as draft'}
                  </p>
                </div>
                <Switch
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, isPublished: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Add tags to help users discover this post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tag Input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </div>

              {/* Tags List */}
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
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
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>
                Add files to your post (coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Upload Files (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}