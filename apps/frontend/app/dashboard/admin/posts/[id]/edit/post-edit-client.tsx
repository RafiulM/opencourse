"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { useUpdatePost, usePost } from "@/hooks/use-posts"
import { UpdatePostRequest } from "@/lib/types"
import { toast } from "sonner"
import { PostForm, PostType } from "@/components/post"

interface EditPostPageClientProps {
  id: string
}

export default function EditPostPageClient({ id }: EditPostPageClientProps) {
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [formData, setFormData] = useState<UpdatePostRequest>({
    id: id,
    title: "",
    content: "",
    excerpt: "",
    postType: "general",
    tags: [],
    allowComments: true,
    visibility: "community",
    isPublished: false,
    attachments: [],
  })

  const { data: postData, isLoading: isLoadingPost } = usePost(id, true)
  const updatePostMutation = useUpdatePost()

  const post = postData?.data

  // Initialize form data when post is loaded
  useEffect(() => {
    if (post) {
      setFormData({
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || "",
        postType: post.postType,
        tags: post.tags || [],
        allowComments: post.allowComments,
        visibility: post.visibility || "community",
        isPublished: post.isPublished,
        attachments: post.attachments || [],
      })
    }
  }, [post])

  const handleSubmit = async (publish: boolean = false) => {
    if (!formData.title?.trim()) {
      toast.error("Title is required")
      return
    }

    if (!formData.content?.trim()) {
      toast.error("Content is required")
      return
    }

    setIsSubmitting(true)
    try {
      const postData = {
        ...formData,
        isPublished: publish,
      }

      await updatePostMutation.mutateAsync(postData)
      toast.success(`Post ${publish ? "published" : "updated"} successfully`)
      router.push("/dashboard/admin/posts")
    } catch (error) {
      toast.error("Failed to update post")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderPreview = () => {
    return (
      <div className="prose max-w-none">
        <h1>{formData.title}</h1>
        {formData.excerpt && (
          <p className="text-muted-foreground">{formData.excerpt}</p>
        )}
        <div className="whitespace-pre-wrap">{formData.content}</div>
        {formData.tags && formData.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (isLoadingPost) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/admin/posts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Posts
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">Post not found</p>
          </CardContent>
        </Card>
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
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsPreview(!isPreview)}
            disabled={isSubmitting}
          >
            <Eye className="mr-2 h-4 w-4" />
            {isPreview ? "Edit" : "Preview"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
          <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
            {isSubmitting ? "Publishing..." : "Publish Post"}
          </Button>
        </div>
      </div>

  {/* Full-width Editor */}
      <div className="space-y-6">
        {isPreview ? (
          <div className="min-h-[400px] rounded-lg border bg-background p-6">
            {renderPreview()}
          </div>
        ) : (
          <PostForm
            data={{
              title: formData.title || "",
              content: formData.content || "",
              excerpt: formData.excerpt || "",
              postType: formData.postType as PostType,
              visibility: formData.visibility || "community",
              allowComments: formData.allowComments,
              isPublished: formData.isPublished,
              tags: formData.tags,
              communityName: post.community?.name,
            }}
            onChange={(updates) =>
              setFormData((prev) => ({ ...prev, ...updates }))
            }
            disabled={isSubmitting}
          />
        )}
      </div>
    </div>
  )
}
