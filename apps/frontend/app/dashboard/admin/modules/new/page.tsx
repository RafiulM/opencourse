'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
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
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useCreateCourseModule } from "@/hooks/use-modules";
import { useCourses } from "@/hooks/use-courses";
import { CreateCourseModuleRequest } from "@/lib/types";
import { toast } from "sonner";

const createModuleSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  order: z.number().min(1, "Order must be at least 1"),
});

type CreateModuleForm = z.infer<typeof createModuleSchema>;

function NewModulePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createModuleMutation = useCreateCourseModule();
  const { data: coursesData } = useCourses(1, 100);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateModuleForm>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: {
      courseId: searchParams.get('courseId') || '',
      title: '',
      description: '',
      order: 1,
    },
  });

  const courseId = watch("courseId");

  const onSubmit = async (data: CreateModuleForm) => {
    try {
      const moduleData: CreateCourseModuleRequest = {
        courseId: data.courseId,
        title: data.title,
        description: data.description || undefined,
        order: data.order,
      };

      const result = await createModuleMutation.mutateAsync(moduleData);
      toast.success("Module created successfully!");
      
      // Navigate back to the course detail page
      router.push(`/dashboard/admin/courses/${data.courseId}`);
    } catch (error) {
      toast.error("Failed to create module");
      console.error(error);
    }
  };

  const selectedCourse = coursesData?.data?.find(course => course.id === courseId);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link href={courseId ? `/dashboard/admin/courses/${courseId}` : "/dashboard/admin/courses"}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {courseId ? "Back to Course" : "Back to Courses"}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Module</CardTitle>
          <CardDescription>
            Add a new content module to organize course materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Course Selection */}
            <div className="space-y-2">
              <Label htmlFor="courseId">Course *</Label>
              <Select
                value={courseId}
                onValueChange={(value) => setValue("courseId", value)}
              >
                <SelectTrigger className={errors.courseId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {coursesData?.data?.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center space-x-2">
                        <span>{course.title}</span>
                        <span className="text-xs text-muted-foreground">
                          ({course.slug})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.courseId && (
                <p className="text-sm text-red-600">{errors.courseId.message}</p>
              )}
              {selectedCourse && (
                <p className="text-sm text-muted-foreground">
                  Adding module to: <strong>{selectedCourse.title}</strong>
                </p>
              )}
            </div>

            {/* Module Information */}
            <div className="grid gap-6 md:grid-cols-2">
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
              <Link href={courseId ? `/dashboard/admin/courses/${courseId}` : "/dashboard/admin/courses"}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={createModuleMutation.isPending || isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {(createModuleMutation.isPending || isSubmitting) ? "Creating..." : "Create Module"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Modules</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Modules help organize your course content into logical sections. Each module can contain multiple materials such as videos, documents, and assignments.
          </p>
          <p>
            <strong>Tips:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Use descriptive titles that clearly indicate what the module covers</li>
            <li>Order modules from basic to advanced concepts</li>
            <li>Keep modules focused on a single topic or learning objective</li>
            <li>Add a description to help students understand what they'll learn</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewModulePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewModulePageContent />
    </Suspense>
  );
}