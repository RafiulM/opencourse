"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  ArrowLeft,
  Save,
  Link as LinkIcon,
  FileText,
  Video,
  Upload,
} from "lucide-react"
import Link from "next/link"
import { useCreateCourseMaterial } from "@/hooks/use-materials"
import { useAllCourseModules } from "@/hooks/use-modules"
import { CreateCourseMaterialRequest } from "@/lib/types"
import { toast } from "sonner"
import { FileUpload } from "@/components/uploads"
import { UploadProgress } from "@/lib/upload-types"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const createMaterialSchema = z
  .object({
    moduleId: z.string().min(1, "Module is required"),
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    description: z.string().max(1000, "Description too long").optional(),
    type: z.enum(["video", "text", "file", "link"]).refine((val) => val, {
      message: "Material type is required",
    }),
    content: z.string().max(10000, "Content too long").optional(),
    url: z
      .string()
      .refine((val) => !val || /^https?:\/\/.+/.test(val), {
        message: "Invalid URL format",
      })
      .optional(),
    order: z.number().min(1, "Order must be at least 1"),
    duration: z.number().min(0, "Duration must be 0 or greater").optional(),
  })
  .refine(
    (data) => {
      // For video type, either URL or file upload is required
      if (data.type === "video") {
        return true // We'll handle this validation in the component
      }
      return true
    },
    {
      message: "For video materials, either a URL or file upload is required",
    }
  )

type CreateMaterialForm = z.infer<typeof createMaterialSchema>

export default function NewMaterialPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const createMaterialMutation = useCreateCourseMaterial()
  const [uploadedFile, setUploadedFile] = useState<UploadProgress | null>(null)
  const [isVideoUpload, setIsVideoUpload] = useState(false)

  // First, get the moduleId from search params
  const moduleId = searchParams.get("moduleId") || ""

  // Get all modules from all courses using the new hook
  const { data: allModules = [] } = useAllCourseModules()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateMaterialForm>({
    resolver: zodResolver(createMaterialSchema),
    defaultValues: {
      moduleId: moduleId,
      title: "",
      description: "",
      type: "text",
      content: "",
      url: "",
      order: 1,
      duration: 0,
    },
  })

  const materialType = watch("type")
  const watchedModuleId = watch("moduleId")

  // Reset uploaded file when material type changes
  useEffect(() => {
    if (materialType !== "video" && materialType !== "file") {
      setUploadedFile(null)
    }
  }, [materialType])

  // Reset uploaded file when switching video modes
  useEffect(() => {
    if (materialType === "video") {
      setUploadedFile(null)
    }
  }, [isVideoUpload, materialType])

  const onSubmit = async (data: CreateMaterialForm) => {
    try {
      // Validate video material requirements
      if (data.type === "video") {
        if (isVideoUpload && !uploadedFile) {
          toast.error("Please upload a video file or switch to URL mode")
          return
        }
        if (!isVideoUpload && !data.url) {
          toast.error("Please provide a video URL or switch to upload mode")
          return
        }
      }

      const materialData: CreateCourseMaterialRequest = {
        moduleId: data.moduleId,
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        content: data.content || undefined,
        url: isVideoUpload ? undefined : data.url || undefined,
        metadata: uploadedFile?.uploadId
          ? { fileUploadId: uploadedFile.uploadId }
          : undefined,
        order: data.order,
        duration: data.duration || undefined,
      }

      const result = await createMaterialMutation.mutateAsync(materialData)
      toast.success("Material created successfully!")

      // Navigate back to the module detail page
      router.push(`/dashboard/admin/modules/${data.moduleId}`)
    } catch (error) {
      toast.error("Failed to create material")
      console.error(error)
    }
  }

  const selectedModule = allModules.find(
    (module) => module.id === watchedModuleId
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link
          href={
            watchedModuleId
              ? `/dashboard/admin/modules/${watchedModuleId}`
              : "/dashboard/admin/courses"
          }
        >
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {watchedModuleId ? "Back to Module" : "Back to Courses"}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Material</CardTitle>
          <CardDescription>
            Add a new content material to a module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Module Selection */}
            <div className="space-y-2">
              <Label htmlFor="moduleId">Module *</Label>
              <Select
                value={watchedModuleId}
                onValueChange={(value) => setValue("moduleId", value)}
              >
                <SelectTrigger
                  className={errors.moduleId ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {allModules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      <div className="flex items-center space-x-2">
                        <span>{module.title}</span>
                        <span className="text-muted-foreground text-xs">
                          (Order: {module.order})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.moduleId && (
                <p className="text-sm text-red-600">
                  {errors.moduleId.message}
                </p>
              )}
              {selectedModule && (
                <p className="text-muted-foreground text-sm">
                  Adding material to: <strong>{selectedModule.title}</strong>
                </p>
              )}
            </div>

            {/* Material Information */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Material Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to React Components"
                  {...register("title")}
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Order *</Label>
                <Input
                  id="order"
                  type="number"
                  min="1"
                  placeholder="1"
                  {...register("order", { valueAsNumber: true })}
                  className={errors.order ? "border-red-500" : ""}
                />
                {errors.order && (
                  <p className="text-sm text-red-600">{errors.order.message}</p>
                )}
                <p className="text-muted-foreground text-sm">
                  The order in which this material appears in the module
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this material covers..."
                rows={4}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
              <p className="text-muted-foreground text-sm">
                Optional: Provide a brief overview of what students will learn
                from this material
              </p>
            </div>

            {/* Material Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Material Type *</Label>
              <Select
                value={materialType}
                onValueChange={(value: "video" | "text" | "file" | "link") =>
                  setValue("type", value)
                }
              >
                <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select material type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Text Content</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center space-x-2">
                      <Video className="h-4 w-4" />
                      <span>Video</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="link">
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="h-4 w-4" />
                      <span>External Link</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="file">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>File Upload</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Type-specific fields */}
            {materialType === "text" && (
              <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="content"
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Content *</span>
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Enter the text content for this material..."
                    rows={8}
                    {...register("content")}
                    className={errors.content ? "border-red-500" : ""}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-600">
                      {errors.content.message}
                    </p>
                  )}
                </div>
                <div className="flex items-start space-x-3 rounded-md bg-blue-50 p-3 dark:bg-blue-950/20">
                  <div className="text-blue-600 dark:text-blue-400">💡</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Rich text content:</p>
                    <p>
                      Write engaging content that students can read and learn
                      from
                    </p>
                  </div>
                </div>
              </div>
            )}

            {materialType === "video" && (
              <div className="space-y-6">
                {/* Video Source Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Video Source</Label>
                  <ToggleGroup
                    type="single"
                    value={isVideoUpload ? "upload" : "url"}
                    onValueChange={(value) => {
                      if (value === "upload") {
                        setIsVideoUpload(true)
                      } else if (value === "url") {
                        setIsVideoUpload(false)
                      }
                    }}
                    className="bg-background grid w-full grid-cols-2 rounded-lg border"
                  >
                    <ToggleGroupItem
                      value="url"
                      className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground flex items-center space-x-2 px-6 py-4"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span>Video URL</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="upload"
                      className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground flex items-center space-x-2 px-6 py-4"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload File</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <p className="text-muted-foreground text-sm">
                    Choose how you want to provide the video content
                  </p>
                </div>

                {/* URL Input */}
                {!isVideoUpload && (
                  <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="url"
                        className="flex items-center space-x-2"
                      >
                        <LinkIcon className="h-4 w-4" />
                        <span>Video URL *</span>
                      </Label>
                      <Input
                        id="url"
                        placeholder="https://youtube.com/watch?v=..."
                        {...register("url")}
                        className={errors.url ? "border-red-500" : ""}
                      />
                      {errors.url && (
                        <p className="text-sm text-red-600">
                          {errors.url.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-start space-x-3 rounded-md bg-blue-50 p-3 dark:bg-blue-950/20">
                      <div className="text-blue-600 dark:text-blue-400">💡</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-medium">Supported platforms:</p>
                        <p>
                          YouTube, Vimeo, Loom, and other video hosting services
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Upload */}
                {isVideoUpload && (
                  <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <Upload className="h-4 w-4" />
                        <span>Upload Video File *</span>
                      </Label>
                      <FileUpload
                        uploadType="material_video"
                        onUploadComplete={(upload) => {
                          setUploadedFile(upload)
                          // Auto-fill title if empty
                          if (!watch("title")) {
                            setValue(
                              "title",
                              upload.file.name.replace(/\.[^/.]+$/, "")
                            ) // Remove extension
                          }
                        }}
                        onUploadError={(error) => {
                          toast.error(`Upload failed: ${error.message}`)
                        }}
                        associationIds={{ moduleId: watchedModuleId }}
                        className="border-muted-foreground/25 hover:border-muted-foreground/40 rounded-lg border-2 border-dashed p-6 text-center transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="text-4xl">🎥</div>
                          <div className="text-lg font-medium">
                            {uploadedFile
                              ? `✅ ${uploadedFile.file.name}`
                              : "Upload Video"}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            MP4, WebM, MOV • Max 500MB
                          </div>
                        </div>
                      </FileUpload>
                    </div>
                    <div className="flex items-start space-x-3 rounded-md bg-green-50 p-3 dark:bg-green-950/20">
                      <div className="text-green-600 dark:text-green-400">
                        📋
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        <p className="font-medium">File requirements:</p>
                        <p>MP4, WebM, or MOV format • Maximum size: 500MB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {materialType === "link" && (
              <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label htmlFor="url" className="flex items-center space-x-2">
                    <LinkIcon className="h-4 w-4" />
                    <span>External Link *</span>
                  </Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/resource"
                    {...register("url")}
                    className={errors.url ? "border-red-500" : ""}
                  />
                  {errors.url && (
                    <p className="text-sm text-red-600">{errors.url.message}</p>
                  )}
                </div>
                <div className="flex items-start space-x-3 rounded-md bg-purple-50 p-3 dark:bg-purple-950/20">
                  <div className="text-purple-600 dark:text-purple-400">🔗</div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    <p className="font-medium">External resources:</p>
                    <p>
                      Link to articles, documentation, or other learning
                      materials
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                placeholder="0"
                {...register("duration", { valueAsNumber: true })}
                className={errors.duration ? "border-red-500" : ""}
              />
              {errors.duration && (
                <p className="text-sm text-red-600">
                  {errors.duration.message}
                </p>
              )}
              <p className="text-muted-foreground text-sm">
                Optional: Estimated time to complete this material
              </p>
            </div>

            {/* File Upload for file type only */}
            {materialType === "file" && (
              <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Upload File *</span>
                  </Label>
                  <FileUpload
                    uploadType="material_file"
                    onUploadComplete={(upload) => {
                      setUploadedFile(upload)
                      // Auto-fill title if empty
                      if (!watch("title")) {
                        setValue(
                          "title",
                          upload.file.name.replace(/\.[^/.]+$/, "")
                        ) // Remove extension
                      }
                    }}
                    onUploadError={(error) => {
                      toast.error(`Upload failed: ${error.message}`)
                    }}
                    associationIds={{ moduleId: watchedModuleId }}
                    className="border-muted-foreground/25 hover:border-muted-foreground/40 rounded-lg border-2 border-dashed p-6 text-center transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="text-4xl">📁</div>
                      <div className="text-lg font-medium">
                        {uploadedFile
                          ? `✅ ${uploadedFile.file.name}`
                          : "Upload File"}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        PDF, ZIP • Max 100MB
                      </div>
                    </div>
                  </FileUpload>
                </div>
                <div className="flex items-start space-x-3 rounded-md bg-amber-50 p-3 dark:bg-amber-950/20">
                  <div className="text-amber-600 dark:text-amber-400">📋</div>
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-medium">File requirements:</p>
                    <p>
                      PDF, ZIP, or other document formats • Maximum size: 100MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-6">
              <Link
                href={
                  watchedModuleId
                    ? `/dashboard/admin/modules/${watchedModuleId}`
                    : "/dashboard/admin/courses"
                }
              >
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={createMaterialMutation.isPending || isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {createMaterialMutation.isPending || isSubmitting
                  ? "Creating..."
                  : "Create Material"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Materials</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            Materials are the actual content pieces within a module. Each
            material can be a different type:
          </p>
          <ul className="ml-4 list-inside list-disc space-y-1">
            <li>
              <strong>Text Content</strong> - Rich text content written directly
              in the editor
            </li>
            <li>
              <strong>Video</strong> - Choose between uploading a video file or
              providing a URL to YouTube, Vimeo, or other platforms
            </li>
            <li>
              <strong>External Link</strong> - Links to external resources or
              articles
            </li>
            <li>
              <strong>File Upload</strong> - Documents, slides, or other files
              (PDF, ZIP, etc.)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
