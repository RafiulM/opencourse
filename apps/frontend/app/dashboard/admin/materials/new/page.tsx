'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Link as LinkIcon, FileText, Video } from "lucide-react";
import Link from "next/link";
import { useCreateCourseMaterial } from "@/hooks/use-materials";
import { useCourseModules } from "@/hooks/use-modules";
import { useCourses } from "@/hooks/use-courses";
import { CreateCourseMaterialRequest } from "@/lib/types";
import { toast } from "sonner";
import { FileUpload } from "@/components/uploads";
import { UploadProgress } from "@/lib/upload-types";

const createMaterialSchema = z.object({
  moduleId: z.string().min(1, "Module is required"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  type: z.enum(["video", "text", "file", "link"], {
    required_error: "Material type is required",
  }),
  content: z.string().max(10000, "Content too long").optional(),
  url: z.string().url("Invalid URL").optional(),
  order: z.number().min(1, "Order must be at least 1"),
  duration: z.number().min(0, "Duration must be 0 or greater").optional(),
});

type CreateMaterialForm = z.infer<typeof createMaterialSchema>;

export default function NewMaterialPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createMaterialMutation = useCreateCourseMaterial();
  const [uploadedFile, setUploadedFile] = useState<UploadProgress | null>(null);
  
  // First, get the moduleId from search params
  const moduleId = searchParams.get('moduleId') || '';
  
  // Get all courses to fetch modules for each
  const { data: coursesData } = useCourses(1, 100);
  
  // Get all modules from all courses
  const allModules: any[] = [];
  const moduleQueries = coursesData?.data?.map(course => 
    useCourseModules(course.id)
  ) || [];
  
  // Flatten all modules into a single array
  moduleQueries.forEach(query => {
    if (query.data?.data) {
      allModules.push(...query.data.data);
    }
  });

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
      title: '',
      description: '',
      type: 'text',
      content: '',
      url: '',
      order: 1,
      duration: 0,
    },
  });

  const materialType = watch("type");
  const watchedModuleId = watch("moduleId");

  const onSubmit = async (data: CreateMaterialForm) => {
    try {
      const materialData: CreateCourseMaterialRequest = {
        moduleId: data.moduleId,
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        content: data.content || undefined,
        url: data.url || undefined,
        fileUploadId: uploadedFile?.uploadId || undefined,
        order: data.order,
        duration: data.duration || undefined,
      };

      const result = await createMaterialMutation.mutateAsync(materialData);
      toast.success("Material created successfully!");
      
      // Navigate back to the module detail page
      router.push(`/dashboard/admin/modules/${data.moduleId}`);
    } catch (error) {
      toast.error("Failed to create material");
      console.error(error);
    }
  };

  const selectedModule = allModules.find(module => module.id === watchedModuleId);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link href={watchedModuleId ? `/dashboard/admin/modules/${watchedModuleId}` : "/dashboard/admin/courses"}>
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
                <SelectTrigger className={errors.moduleId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {allModules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      <div className="flex items-center space-x-2">
                        <span>{module.title}</span>
                        <span className="text-xs text-muted-foreground">
                          (Order: {module.order})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.moduleId && (
                <p className="text-sm text-red-600">{errors.moduleId.message}</p>
              )}
              {selectedModule && (
                <p className="text-sm text-muted-foreground">
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
                <p className="text-sm text-muted-foreground">
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
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Optional: Provide a brief overview of what students will learn from this material
              </p>
            </div>

            {/* Material Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Material Type *</Label>
              <Select
                value={materialType}
                onValueChange={(value: "video" | "text" | "file" | "link") => setValue("type", value)}
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
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Enter the text content for this material..."
                  rows={8}
                  {...register("content")}
                  className={errors.content ? "border-red-500" : ""}
                />
                {errors.content && (
                  <p className="text-sm text-red-600">{errors.content.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  The main content of this text material
                </p>
              </div>
            )}

            {materialType === "video" && (
              <div className="space-y-2">
                <Label htmlFor="url">Video URL *</Label>
                <Input
                  id="url"
                  placeholder="https://youtube.com/watch?v=..."
                  {...register("url")}
                  className={errors.url ? "border-red-500" : ""}
                />
                {errors.url && (
                  <p className="text-sm text-red-600">{errors.url.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Link to the video (YouTube, Vimeo, etc.)
                </p>
              </div>
            )}

            {materialType === "link" && (
              <div className="space-y-2">
                <Label htmlFor="url">External Link *</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/resource"
                  {...register("url")}
                  className={errors.url ? "border-red-500" : ""}
                />
                {errors.url && (
                  <p className="text-sm text-red-600">{errors.url.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Link to external resource
                </p>
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
                <p className="text-sm text-red-600">{errors.duration.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Optional: Estimated time to complete this material
              </p>
            </div>

            {/* File Upload for file/video types */}
            {(materialType === "file" || materialType === "video") && (
              <div className="space-y-2">
                <Label>Upload File *</Label>
                <FileUpload
                  uploadType={materialType === "video" ? "material_video" : "material_file"}
                  onUploadComplete={(upload) => {
                    setUploadedFile(upload);
                    // Auto-fill title if empty
                    if (!watch("title")) {
                      setValue("title", upload.file.name.replace(/\.[^/.]+$/, "")); // Remove extension
                    }
                  }}
                  onUploadError={(error) => {
                    toast.error(`Upload failed: ${error.message}`);
                  }}
                  associationIds={{ moduleId: watchedModuleId }}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/40 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="text-4xl">
                      {materialType === "video" ? "🎥" : "📁"}
                    </div>
                    <div className="text-lg font-medium">
                      {uploadedFile ? `✅ ${uploadedFile.file.name}` : `Upload ${materialType}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {materialType === "video" 
                        ? "MP4, WebM, MOV • Max 500MB" 
                        : "PDF, ZIP • Max 100MB"
                      }
                    </div>
                  </div>
                </FileUpload>
                <p className="text-sm text-muted-foreground">
                  Upload a {materialType} file that will be accessible to students
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-6">
              <Link href={watchedModuleId ? `/dashboard/admin/modules/${watchedModuleId}` : "/dashboard/admin/courses"}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={createMaterialMutation.isPending || isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {(createMaterialMutation.isPending || isSubmitting) ? "Creating..." : "Create Material"}
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
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Materials are the actual content pieces within a module. Each material can be a different type:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Text Content</strong> - Rich text content written directly in the editor</li>
            <li><strong>Video</strong> - Embedded videos from YouTube, Vimeo, or other platforms</li>
            <li><strong>External Link</strong> - Links to external resources or articles</li>
            <li><strong>File Upload</strong> - Documents, slides, or other files (coming soon)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}