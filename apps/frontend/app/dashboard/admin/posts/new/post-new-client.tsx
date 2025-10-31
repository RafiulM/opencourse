"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useCreateCommunityPost } from "@/hooks/use-posts"
import { useCommunities } from "@/hooks/use-communities"
import { CreatePostRequest } from "@/lib/types"
import { toast } from "sonner"
import { useSession } from "@/lib/auth"
import { PostForm, PostType } from "@/components/post"

function NewPostPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreatePostRequest>({
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
  const [selectedCommunityId, setSelectedCommunityId] = useState("")
  const [errors, setErrors] = useState<{
    community?: string
    title?: string
    content?: string
  }>({})

  const { data: session } = useSession()
  const userId = session?.user?.id
  const { data: communitiesData } = useCommunities(1, 100, {
    createdBy: userId,
  })
  const createPostMutation = useCreateCommunityPost()

  const communities = communitiesData?.data || []

  // Auto-select community from URL parameter
  useEffect(() => {
    const communityIdFromUrl = searchParams.get("communityId")
    if (
      communityIdFromUrl &&
      communities.some((c) => c.id === communityIdFromUrl)
    ) {
      setSelectedCommunityId(communityIdFromUrl)
    }
  }, [searchParams, communities])

  // Validate form and return errors
  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!selectedCommunityId.trim()) {
      newErrors.community = "Please select a community"
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Clear specific error when user starts typing
  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (publish: boolean = false) => {
    // Validate form and show errors
    if (!validateForm()) {
      toast.error("Please fill in all required fields", {
        description: "Title, content, and community selection are required.",
        duration: 5000,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const postData = {
        ...formData,
        isPublished: publish,
      }

      await createPostMutation.mutateAsync({
        communityId: selectedCommunityId,
        data: postData,
      })

      toast.success(
        `Post ${publish ? "published" : "created as draft"} successfully`,
        {
          description: publish
            ? "Your post is now live and visible to community members."
            : "Your post has been saved as a draft and can be published later.",
          duration: 4000,
        }
      )
      router.push("/dashboard/admin/posts")
    } catch (error) {
      toast.error("Failed to create post", {
        description: "There was an error creating your post. Please try again.",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
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
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
            {isSubmitting ? "Publishing..." : "Publish Post"}
          </Button>
        </div>
      </div>

      {/* Full-width Editor */}
      <PostForm
        data={{
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt || "",
          postType: formData.postType as PostType,
          visibility: formData.visibility || "community",
          allowComments: formData.allowComments,
          isPublished: formData.isPublished,
          tags: formData.tags,
          communityId: selectedCommunityId,
        }}
        onChange={(updates) => {
          setFormData((prev) => ({ ...prev, ...updates }))
          // Update selectedCommunityId if communityId changes
          if (updates.communityId) {
            setSelectedCommunityId(updates.communityId)
            clearError('community')
          }
          // Clear errors when user starts typing
          if (updates.title) clearError('title')
          if (updates.content) clearError('content')
        }}
        disabled={isSubmitting}
        errors={{
          title: errors.title,
          content: errors.content,
          community: errors.community,
        }}
        communities={communities}
        showCommunity={true}
      />
    </div>
  )
}

export default function NewPostPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewPostPageContent />
    </Suspense>
  )
}
