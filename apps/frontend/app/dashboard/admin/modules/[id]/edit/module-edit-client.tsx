'use client';

import { use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useCourseModule, useUpdateCourseModule } from "@/hooks/use-modules";
import { UpdateCourseModuleRequest } from "@/lib/types";
import { toast } from "sonner";
import { useState } from "react";

interface EditModulePageClientProps {
  id: string;
}

export default function EditModulePageClient({ id }: EditModulePageClientProps) {
  const router = useRouter();
  const { data: moduleResponse, isLoading } = useCourseModule(id);
  const updateModuleMutation = useUpdateCourseModule();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const module = moduleResponse?.data;

  const [formData, setFormData] = useState({
    title: module?.title || "",
    description: module?.description || "",
    order: module?.order || 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setFormData(prev => ({
      ...prev,
      order: value
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!module || !validateForm()) return;

    setIsSubmitting(true);

    try {
      const moduleData: UpdateCourseModuleRequest = {
        id: module.id,
        courseId: module.courseId,
        title: formData.title,
        description: formData.description || undefined,
        order: formData.order,
      };

      await updateModuleMutation.mutateAsync(moduleData);
      toast.success("Module updated successfully!");
      router.push(`/dashboard/admin/modules/${module.id}`);
    } catch (error) {
      toast.error("Failed to update module");
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

  if (!module) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Module not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link href={`/dashboard/admin/modules/${module.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Module
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Module</CardTitle>
          <CardDescription>
            Make changes to this module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Module Title *</Label>
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
                  The order in which this module appears in the course
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what this module covers..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Optional: Provide a brief overview of what students will learn in this module
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-6">
              <Link href={`/dashboard/admin/modules/${module.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={updateModuleMutation.isPending || isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {(updateModuleMutation.isPending || isSubmitting) ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}