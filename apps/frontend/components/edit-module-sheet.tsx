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
import { useUpdateCourseModule } from "@/hooks/use-modules";
import { CourseModule } from "@/lib/types";
import { toast } from "sonner";
import { UpdateCourseModuleRequest } from "@/lib/types";

const updateModuleSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  order: z.number().min(1, "Order must be at least 1"),
});

type UpdateModuleForm = z.infer<typeof updateModuleSchema>;

interface EditModuleSheetProps {
  module?: CourseModule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditModuleSheet({ module, open, onOpenChange }: EditModuleSheetProps) {
  const updateModuleMutation = useUpdateCourseModule();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateModuleForm>({
    resolver: zodResolver(updateModuleSchema),
    defaultValues: {
      title: module?.title || "",
      description: module?.description || "",
      order: module?.order || 1,
    },
  });

  const onSubmit = async (data: UpdateModuleForm) => {
    if (!module) return;
    
    setIsSubmitting(true);
    
    try {
      const moduleData: UpdateCourseModuleRequest = {
        id: module.id,
        courseId: module.courseId,
        title: data.title,
        description: data.description || undefined,
        order: data.order,
      };

      await updateModuleMutation.mutateAsync(moduleData);
      toast.success("Module updated successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update module");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset({
        title: module?.title || "",
        description: module?.description || "",
        order: module?.order || 1,
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit Module</SheetTitle>
          <SheetDescription>
            Make changes to this module. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Module Title *</Label>
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
                The order in which this module appears in the course
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this module covers..."
              rows={4}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Optional: Provide a brief overview of what students will learn in this module
            </p>
          </div>

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
              disabled={updateModuleMutation.isPending || isSubmitting}
            >
              {updateModuleMutation.isPending || isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}