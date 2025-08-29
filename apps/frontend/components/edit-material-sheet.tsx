'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { useUpdateCourseMaterial } from "@/hooks/use-materials";
import { CourseMaterial } from "@/lib/types";
import { toast } from "sonner";
import { UpdateCourseMaterialRequest } from "@/lib/types";
import { Link as LinkIcon, FileText, Video } from "lucide-react";

const updateMaterialSchema = z.object({
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

type UpdateMaterialForm = z.infer<typeof updateMaterialSchema>;

interface EditMaterialSheetProps {
  material?: CourseMaterial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMaterialSheet({ material, open, onOpenChange }: EditMaterialSheetProps) {
  const updateMaterialMutation = useUpdateCourseMaterial();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateMaterialForm>({
    resolver: zodResolver(updateMaterialSchema),
    defaultValues: {
      title: material?.title || "",
      description: material?.description || "",
      type: (material?.type as "video" | "text" | "file" | "link") || "text",
      content: material?.content || "",
      url: material?.url || "",
      order: material?.order || 1,
      duration: material?.duration || 0,
    },
  });

  const materialType = watch("type");

  const onSubmit = async (data: UpdateMaterialForm) => {
    if (!material) return;
    
    setIsSubmitting(true);
    
    try {
      const materialData: UpdateCourseMaterialRequest = {
        id: material.id,
        moduleId: material.moduleId,
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        content: data.content || undefined,
        url: data.url || undefined,
        order: data.order,
        duration: data.duration || undefined,
      };

      await updateMaterialMutation.mutateAsync(materialData);
      toast.success("Material updated successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update material");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset({
        title: material?.title || "",
        description: material?.description || "",
        type: (material?.type as "video" | "text" | "file" | "link") || "text",
        content: material?.content || "",
        url: material?.url || "",
        order: material?.order || 1,
        duration: material?.duration || 0,
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Material</SheetTitle>
          <SheetDescription>
            Make changes to this material. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
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

          <div className="grid gap-6 md:grid-cols-2">
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

          {(materialType === "video" || materialType === "link") && (
            <div className="space-y-2">
              <Label htmlFor="url">
                {materialType === "video" ? "Video URL *" : "External Link *"}
              </Label>
              <Input
                id="url"
                placeholder={materialType === "video" ? "https://youtube.com/watch?v=..." : "https://example.com/resource"}
                {...register("url")}
                className={errors.url ? "border-red-500" : ""}
              />
              {errors.url && (
                <p className="text-sm text-red-600">{errors.url.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {materialType === "video" 
                  ? "Link to the video (YouTube, Vimeo, etc.)" 
                  : "Link to external resource"}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMaterialMutation.isPending || isSubmitting}
            >
              {updateMaterialMutation.isPending || isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}