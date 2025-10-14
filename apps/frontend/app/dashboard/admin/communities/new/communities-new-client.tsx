'use client';

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useCreateCommunity } from "@/hooks/use-communities"
import { CreateCommunityRequest } from "@/lib/types"
import { toast } from "sonner"

export default function NewCommunityPageClient() {
  const router = useRouter()
  const createCommunityMutation = useCreateCommunity()

  const [formData, setFormData] = useState<CreateCommunityRequest>({
    name: "",
    slug: "",
    description: "",
    privacy: "public",
    settings: {}
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Debounced slug generation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name && !formData.slug) {
        const newSlug = generateSlug(formData.name)
        setFormData(prev => ({ ...prev, slug: newSlug }))
      }
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [formData.name])

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name
    }))
  }

  const handleSlugChange = (slug: string) => {
    setFormData(prev => ({
      ...prev,
      slug: generateSlug(slug)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Community name is required"
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required"
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      const result = await createCommunityMutation.mutateAsync(formData)
      toast.success("Community created successfully!")
      router.push(`/dashboard/admin/communities/${result.data?.id}`)
    } catch (error) {
      toast.error("Failed to create community")
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link href="/dashboard/admin/communities">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Communities
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Community</CardTitle>
          <CardDescription>
            Set up a new learning community for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Community Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Web Development Bootcamp"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="web-development-bootcamp"
                  className={errors.slug ? "border-red-500" : ""}
                />
                {errors.slug && (
                  <p className="text-sm text-red-600">{errors.slug}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  This will be used in the community URL: /communities/{formData.slug}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this community is about..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacy">Privacy Settings</Label>
              <Select
                value={formData.privacy}
                onValueChange={(value: "public" | "private" | "invite_only") =>
                  setFormData(prev => ({ ...prev, privacy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div>
                      <div className="font-medium">Public</div>
                      <div className="text-sm text-muted-foreground">Anyone can find and join</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-sm text-muted-foreground">Only invited members can access</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="invite_only">
                    <div>
                      <div className="font-medium">Invite Only</div>
                      <div className="text-sm text-muted-foreground">Visible but requires approval</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Link href="/dashboard/admin/communities">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={createCommunityMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {createCommunityMutation.isPending ? "Creating..." : "Create Community"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}