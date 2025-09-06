'use client';

import { use } from "react"
import { notFound } from "next/navigation"
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X, ArrowLeft } from "lucide-react";
import { UpdateCourseRequest } from "@/lib/types";
import { useCourse, useUpdateCourse } from "@/hooks/use-courses";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CourseThumbnailUpload } from "@/components/uploads/course-thumbnail-upload";

const updateCourseSchema = z.object({
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
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
});

type UpdateCourseForm = z.infer<typeof updateCourseSchema>;

interface EditCoursePageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditCoursePage({ params }: EditCoursePageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: courseResponse, isLoading, error } = useCourse(id)
  const updateCourseMutation = useUpdateCourse();
  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCourseForm>({
    resolver: zodResolver(updateCourseSchema),
  });

  const { fields: prerequisiteFields, append: appendPrerequisite, remove: removePrerequisite } = useFieldArray({
    control,
    name: "prerequisites",
  });

  const { fields: outcomeFields, append: appendOutcome, remove: removeOutcome } = useFieldArray({
    control,
    name: "learningOutcomes",
  });

  const difficulty = watch("difficulty");
  const isPublished = watch("isPublished");
  const isFeatured = watch("isFeatured");

  const course = courseResponse?.data

  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        slug: course.slug,
        description: course.description || "",
        thumbnail: course.thumbnail || "",
        price: course.price,
        duration: course.duration,
        difficulty: course.difficulty as "beginner" | "intermediate" | "advanced" | undefined,
        prerequisites: course.prerequisites || [],
        learningOutcomes: course.learningOutcomes || [],
        isPublished: course.isPublished,
        isFeatured: course.isFeatured,
      });
      setUploadedThumbnailUrl("");
    }
  }, [course, reset]);

  const onSubmit = async (data: UpdateCourseForm) => {
    if (!course) return;

    try {
      const finalThumbnailUrl = uploadedThumbnailUrl || data.thumbnail || undefined;
      
      const updateData: UpdateCourseRequest = {
        id: course.id,
        title: data.title,
        slug: data.slug,
        description: data.description || undefined,
        thumbnail: finalThumbnailUrl,
        price: data.price,
        duration: data.duration,
        difficulty: data.difficulty,
        prerequisites: data.prerequisites.filter(p => p.trim()),
        learningOutcomes: data.learningOutcomes.filter(o => o.trim()),
        isPublished: data.isPublished,
        isFeatured: data.isFeatured,
      };

      await updateCourseMutation.mutateAsync(updateData);
      toast.success("Course updated successfully");
      router.push(`/dashboard/admin/courses/${course.id}`);
    } catch (error) {
      console.error("Update course error:", error);
      toast.error("Failed to update course");
    }
  };

  const handleThumbnailUpdate = (thumbnailUrl: string, uploadId: string) => {
    setUploadedThumbnailUrl(thumbnailUrl);
    setValue("thumbnail", thumbnailUrl);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setValue("title", title);
    if (!watch("slug") || watch("slug") === generateSlug(course?.title || "")) {
      setValue("slug", generateSlug(title));
    }
  };

  if (error) {
    if (error.message.includes('404')) {
      notFound()
    }
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading course: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!course) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/admin/courses/${course.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Course</h1>
            <p className="text-muted-foreground">Make changes to your course settings</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Course title"
                    {...register("title")}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="course-slug"
                    {...register("slug")}
                  />
                  {errors.slug && (
                    <p className="text-sm text-red-600">{errors.slug.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your course..."
                  rows={3}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Course Thumbnail</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <CourseThumbnailUpload
                      currentThumbnailUrl={uploadedThumbnailUrl || watch("thumbnail")}
                      onThumbnailUpdate={handleThumbnailUpdate}
                      courseId={course.id}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail-url" className="text-sm text-muted-foreground">
                      Or paste URL:
                    </Label>
                    <Input
                      id="thumbnail-url"
                      placeholder="https://example.com/image.jpg"
                      {...register("thumbnail")}
                    />
                    {errors.thumbnail && (
                      <p className="text-sm text-red-600">{errors.thumbnail.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Course Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Course Details</h3>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("price")}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600">{errors.price.message}</p>
                  )}
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
                  <Label htmlFor="difficulty">Difficulty</Label>
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
                <h3 className="text-lg font-medium">Prerequisites</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendPrerequisite("")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
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
                  <p className="text-sm text-muted-foreground">No prerequisites added</p>
                )}
              </div>
            </div>

            {/* Learning Outcomes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Learning Outcomes</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendOutcome("")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
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
                  <p className="text-sm text-muted-foreground">No learning outcomes added</p>
                )}
              </div>
            </div>

            {/* Publishing Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Publishing Options</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublished"
                    checked={isPublished}
                    onCheckedChange={(checked) => setValue("isPublished", !!checked)}
                  />
                  <Label htmlFor="isPublished">Published</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFeatured"
                    checked={isFeatured}
                    onCheckedChange={(checked) => setValue("isFeatured", !!checked)}
                  />
                  <Label htmlFor="isFeatured">Featured</Label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/admin/courses/${course.id}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || updateCourseMutation.isPending}
              >
                {(isSubmitting || updateCourseMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}