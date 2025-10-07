"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Save, Upload } from "lucide-react"
import Link from "next/link"
import { useCreateCommunityPost } from "@/hooks/use-posts"
import { useCommunities } from "@/hooks/use-communities"
import { CreatePostRequest } from "@/lib/types"
import { toast } from "sonner"
import { useSession } from "@/lib/auth"
import { PostForm, PostSettings, PostType, TagManager } from "@/components/post"

export default function NewPostPage() {
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
    isPublished: false,
    attachments: [],
  })
  const [selectedCommunityId, setSelectedCommunityId] = useState("")

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
        isPublished: publish,
      }

      await createPostMutation.mutateAsync({
        communityId: selectedCommunityId,
        data: postData,
      })

      toast.success(
        `Post ${publish ? "published" : "created as draft"} successfully`
      )
      router.push("/dashboard/admin/posts")
    } catch (error) {
      toast.error("Failed to create post")
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <PostForm
            data={{
              title: formData.title,
              content: formData.content,
              excerpt: formData.excerpt || "",
            }}
            onChange={(updates) =>
              setFormData((prev) => ({ ...prev, ...updates }))
            }
            disabled={isSubmitting}
          />
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
              <Select
                value={selectedCommunityId}
                onValueChange={setSelectedCommunityId}
              >
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
          <PostSettings
            postType={formData.postType as PostType}
            onPostTypeChange={(postType) =>
              setFormData((prev) => ({ ...prev, postType }))
            }
            allowComments={!!formData.allowComments}
            onAllowCommentsChange={(allowComments) =>
              setFormData((prev) => ({ ...prev, allowComments }))
            }
            isPublished={!!formData.isPublished}
            onIsPublishedChange={(isPublished) =>
              setFormData((prev) => ({ ...prev, isPublished }))
            }
          />

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Add tags to help users discover this post
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TagManager
                tags={formData.tags}
                onTagsChange={(tags) =>
                  setFormData((prev) => ({ ...prev, tags }))
                }
              />
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
