'use client';

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Save, Plus, X } from "lucide-react"
import Link from "next/link"
import { useCreateCourse } from "@/hooks/use-courses"
import { useCommunities } from "@/hooks/use-communities"
import { CreateCourseRequest } from "@/lib/types"
import { toast } from "sonner"
import { useSession } from "@/lib/auth"

const createCourseSchema = z.object({
  communityId: z.string().min(1, "Community is required"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  slug: z.string()
    .min(1, "Slug is required")
    .max(100, "Slug too long")
    .regex(/^[a-zA-Z0-9-_]+$/, "Slug can only contain letters, numbers, hyphens, and underscores"),
  description: z.string().max(1000, "Description too long").optional(),
  thumbnail: z.string().url("Invalid URL").optional().or(z.literal("")),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Price must be a valid number"),
  duration: z.number().min(1, "Duration must be at least 1 minute").optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  prerequisites: z.array(z.string().min(1, "Prerequisite cannot be empty")),
  learningOutcomes: z.array(z.string().min(1, "Learning outcome cannot be empty")),
})

type CreateCourseForm = z.infer<typeof createCourseSchema>

export default function NewCoursePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const createCourseMutation = useCreateCourse()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const { data: communitiesData } = useCommunities(1, 100, { createdBy: userId })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateCourseForm>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      communityId: searchParams.get('communityId') || '',
      title: '',
      slug: '',
      description: '',
      thumbnail: '',
      price: '0',
      duration: undefined,
      difficulty: undefined,
      prerequisites: [],
      learningOutcomes: [],
    },
  })

  const { fields: prerequisiteFields, append: appendPrerequisite, remove: removePrerequisite } = useFieldArray({
    control,
    name: "prerequisites",
  });

  const { fields: outcomeFields, append: appendOutcome, remove: removeOutcome } = useFieldArray({
    control,
    name: "learningOutcomes",
  });

  const communityId = watch("communityId")
  const difficulty = watch("difficulty")

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (title: string) => {
    setValue("title", title)
    if (!watch("slug")) {
      setValue("slug", generateSlug(title))
    }
  }

  const onSubmit = async (data: CreateCourseForm) => {
    try {
      const courseData: CreateCourseRequest = {
        communityId: data.communityId,
        title: data.title,
        slug: data.slug,
        description: data.description || undefined,
        thumbnail: data.thumbnail || undefined,
        price: data.price,
        duration: data.duration,
        difficulty: data.difficulty,
        prerequisites: data.prerequisites.filter(p => p.trim()),
        learningOutcomes: data.learningOutcomes.filter(o => o.trim()),
      }

      const result = await createCourseMutation.mutateAsync(courseData)
      toast.success("Course created successfully!")
      router.push(`/dashboard/admin/courses/${result.data?.id}`)
    } catch (error) {
      toast.error("Failed to create course")
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link href="/dashboard/admin/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
          <CardDescription>
            Set up a new course for your community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="communityId">Community *</Label>
                  <Select
                    value={communityId}
                    onValueChange={(value) => setValue("communityId", value)}
                  >
                    <SelectTrigger className={errors.communityId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select a community" />
                    </SelectTrigger>
                    <SelectContent>
                      {communitiesData?.data?.map((community) => (
                        <SelectItem key={community.id} value={community.id}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.communityId && (
                    <p className="text-sm text-red-600">{errors.communityId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., React Development Fundamentals"
                    {...register("title")}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="react-development-fundamentals"
                    {...register("slug")}
                    className={errors.slug ? "border-red-500" : ""}
                  />
                  {errors.slug && (
                    <p className="text-sm text-red-600">{errors.slug.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    This will be used in the course URL: /courses/{watch("slug") || "your-slug"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    placeholder="https://example.com/image.jpg (optional)"
                    {...register("thumbnail")}
                    className={errors.thumbnail ? "border-red-500" : ""}
                  />
                  {errors.thumbnail && (
                    <p className="text-sm text-red-600">{errors.thumbnail.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn in this course..."
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Course Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Course Details</h3>
              
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("price")}
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600">{errors.price.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Set to 0 for a free course
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    placeholder="60"
                    {...register("duration", { valueAsNumber: true })}
                  />
                  {errors.duration && (
                    <p className="text-sm text-red-600">{errors.duration.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={difficulty || "none"}
                    onValueChange={(value: "beginner" | "intermediate" | "advanced" | "none") =>
                      setValue("difficulty", value === "none" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Prerequisites */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Prerequisites</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendPrerequisite("")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Prerequisite
                </Button>
              </div>
              
              <div className="space-y-3">
                {prerequisiteFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Input
                      placeholder={`Prerequisite ${index + 1}`}
                      {...register(`prerequisites.${index}`)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePrerequisite(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {prerequisiteFields.length === 0 && (
                  <p className="text-sm text-muted-foreground">No prerequisites added. Click "Add Prerequisite" to add requirements for this course.</p>
                )}
              </div>
            </div>

            {/* Learning Outcomes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Learning Outcomes</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendOutcome("")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Outcome
                </Button>
              </div>
              
              <div className="space-y-3">
                {outcomeFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Input
                      placeholder={`Learning outcome ${index + 1}`}
                      {...register(`learningOutcomes.${index}`)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOutcome(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {outcomeFields.length === 0 && (
                  <p className="text-sm text-muted-foreground">No learning outcomes added. Click "Add Outcome" to specify what students will learn.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-6">
              <Link href="/dashboard/admin/courses">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={createCourseMutation.isPending || isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {(createCourseMutation.isPending || isSubmitting) ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}