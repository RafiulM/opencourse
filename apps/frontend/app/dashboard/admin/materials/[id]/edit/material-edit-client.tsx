'use client';

import { use } from "react";
import { useRouter } from "next/navigation";
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
import { useCourseMaterial, useUpdateCourseMaterial } from "@/hooks/use-materials";
import { UpdateCourseMaterialRequest } from "@/lib/types";
import { toast } from "sonner";
import { useState } from "react";

interface EditMaterialPageClientProps {
  id: string;
}

export default function EditMaterialPageClient({ id }: EditMaterialPageClientProps) {
  const router = useRouter();
  const { data: materialResponse, isLoading } = useCourseMaterial(id);
  const updateMaterialMutation = useUpdateCourseMaterial();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const material = materialResponse?.data;

  const [formData, setFormData] = useState({
    title: material?.title || "",
    description: material?.description || "",
    type: material?.type || "text",
    content: material?.content || "",
    url: material?.url || "",
    order: material?.order || 1,
    duration: material?.duration || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      type: value
    }));
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setFormData(prev => ({
      ...prev,
      order: value
    }));
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      duration: value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (formData.order < 1) {
      newErrors.order = "Order must be at least 1";
    }

    if (formData.type === "video" || formData.type === "link") {
      if (!formData.url.trim()) {
        newErrors.url = `${formData.type === "video" ? "Video URL" : "External link"} is required`;
      } else if (!isValidUrl(formData.url)) {
        newErrors.url = "Invalid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!material || !validateForm()) return;

    setIsSubmitting(true);

    try {
      const materialData: UpdateCourseMaterialRequest = {
        id: material.id,
        moduleId: material.moduleId,
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type as "video" | "text" | "file" | "link",
        content: (formData.type === "text" ? formData.content : undefined) || undefined,
        url: (formData.type === "video" || formData.type === "link" ? formData.url : undefined) || undefined,
        order: formData.order,
        duration: formData.duration || undefined,
      };

      await updateMaterialMutation.mutateAsync(materialData);
      toast.success("Material updated successfully!");
      router.push(`/dashboard/admin/materials/${material.id}`);
    } catch (error) {
      toast.error("Failed to update material");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    );
  }

  if (!material) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Material not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link href={`/dashboard/admin/materials/${material.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Material
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Material</CardTitle>
          <CardDescription>
            Make changes to this material
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Material Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Introduction to React Components"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="order">Order *</Label>
                <Input
                  id="order"
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={handleOrderChange}
                  placeholder="1"
                  className={errors.order ? "border-red-500" : ""}
                />
                {errors.order && (
                  <p className="text-sm text-red-600">{errors.order}</p>
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
                  value={formData.duration}
                  onChange={handleDurationChange}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Estimated time to complete this material
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what this material covers..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Optional: Provide a brief overview of what students will learn from this material
              </p>
            </div>

            {/* Material Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Material Type *</Label>
              <Select
                value={formData.type}
                onValueChange={handleSelectChange}
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
                <p className="text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            {/* Type-specific fields */}
            {formData.type === "text" && (
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Enter the text content for this material..."
                  rows={8}
                  className={errors.content ? "border-red-500" : ""}
                />
                {errors.content && (
                  <p className="text-sm text-red-600">{errors.content}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  The main content of this text material
                </p>
              </div>
            )}

            {(formData.type === "video" || formData.type === "link") && (
              <div className="space-y-2">
                <Label htmlFor="url">
                  {formData.type === "video" ? "Video URL *" : "External Link *"}
                </Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder={formData.type === "video" ? "https://youtube.com/watch?v=..." : "https://example.com/resource"}
                  className={errors.url ? "border-red-500" : ""}
                />
                {errors.url && (
                  <p className="text-sm text-red-600">{errors.url}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {formData.type === "video"
                    ? "Link to the video (YouTube, Vimeo, etc.)"
                    : "Link to external resource"}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-6">
              <Link href={`/dashboard/admin/materials/${material.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={updateMaterialMutation.isPending || isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {(updateMaterialMutation.isPending || isSubmitting) ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}