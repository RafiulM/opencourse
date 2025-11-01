"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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

const POST_DRAFT_STORAGE_KEY = "post-draft"
const POST_DRAFT_COMMUNITY_STORAGE_KEY = `${POST_DRAFT_STORAGE_KEY}-community`

// Custom hook for debounced local storage saving
function useDebouncedLocalStorage<T>(key: string, value: T, delay: number = 1000) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        console.log(`Draft saved to ${key}`)
      } catch (error) {
        console.error(`Failed to save draft to ${key}:`, error)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [key, value, delay])

  const clearSavedData = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Failed to clear saved data from ${key}:`, error)
    }
  }, [key])

  return { clearSavedData }
}

// Custom hook to load saved data from local storage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Failed to load data from ${key}:`, error)
    }
  }, [key])

  return storedValue
}

function NewPostPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load initial form data from local storage if available
  const initialFormData = useLocalStorage(POST_DRAFT_STORAGE_KEY, {
    title: "",
    content: "",
    excerpt: "",
    postType: "general" as "resource" | "general" | "announcement" | "discussion",
    tags: [],
    allowComments: true,
    visibility: "community" as "community" | "public",
    isPublished: false,
    attachments: [],
  })

  const [formData, setFormData] = useState<CreatePostRequest>(initialFormData)
  const initialCommunityId = useLocalStorage(POST_DRAFT_COMMUNITY_STORAGE_KEY, "")
  const [selectedCommunityId, setSelectedCommunityId] = useState(initialCommunityId)
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

  // Use debounced local storage saving for form data and community selection
  const { clearSavedData: clearFormData } = useDebouncedLocalStorage(
    POST_DRAFT_STORAGE_KEY,
    formData
  )
  const { clearSavedData: clearCommunityData } = useDebouncedLocalStorage(
    POST_DRAFT_COMMUNITY_STORAGE_KEY,
    selectedCommunityId
  )

  // State to show when draft is being saved
  const [showSavingIndicator, setShowSavingIndicator] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    if (formData.title || formData.content || formData.excerpt) {
      setShowSavingIndicator(true)
      saveTimeoutRef.current = setTimeout(() => {
        setShowSavingIndicator(false)
      }, 1500)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [formData.title, formData.content, formData.excerpt])

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

      // Clear saved draft data after successful submission
      clearFormData()
      clearCommunityData()

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
          {showSavingIndicator && (
            <span className="text-sm text-muted-foreground mr-2">
              Draft saved...
            </span>
          )}
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
