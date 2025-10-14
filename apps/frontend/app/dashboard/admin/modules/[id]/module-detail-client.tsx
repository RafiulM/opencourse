'use client';

import { use } from "react";
import { notFound } from "next/navigation";
import { parseAsBoolean, useQueryState } from "nuqs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Clock,
  DollarSign,
  Star,
  BookOpen,
  FileText,
  Calendar,
  MoreHorizontal,
  Eye,
  Play,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useCourseModule, useDeleteCourseModule } from "@/hooks/use-modules";
import { useCourseMaterials } from "@/hooks/use-materials";
import { useCourse } from "@/hooks/use-courses";
import { CourseModule } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EditModuleSheet } from "@/components/edit-module-sheet";

interface ModuleDetailPageClientProps {
  id: string;
}

export default function ModuleDetailPageClient({ id }: ModuleDetailPageClientProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useQueryState('edit', parseAsBoolean.withDefault(false));
  const { data: moduleResponse, isLoading, error } = useCourseModule(id);
  const { data: materialsResponse } = useCourseMaterials(id);
  const { data: courseResponse } = useCourse(moduleResponse?.data?.courseId || '', !!moduleResponse?.data?.courseId);
  const deleteModule = useDeleteCourseModule();

  if (error) {
    if (error.message.includes('404')) {
      notFound();
    }
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading module: {error.message}</p>
        </CardContent>
      </Card>
    );
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
    );
  }

  const module = moduleResponse?.data;

  if (!module) {
    notFound();
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${module.title}"? This action cannot be undone.`)) {
      try {
        await deleteModule.mutateAsync(module.id);
        toast.success("Module deleted successfully");
        router.push(`/dashboard/admin/courses/${module.courseId}`);
      } catch (error) {
        toast.error("Failed to delete module");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/admin/courses/${module.courseId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setEditOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteModule.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Module Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                {module.title?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <CardTitle className="text-2xl">{module.title}</CardTitle>
                </div>
                <CardDescription className="text-lg">
                  Module #{module.order}
                </CardDescription>
                {courseResponse?.data && (
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <BookOpen className="mr-1 h-4 w-4" />
                    {courseResponse.data.title}
                  </div>
                )}
              </div>
            </div>
            <Badge variant="outline">
              {materialsResponse?.data?.length || 0} materials
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {module.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{module.description}</p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Order</p>
                  <p className="text-2xl font-bold">#{module.order}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Materials</p>
                  <p className="text-2xl font-bold">{materialsResponse?.data?.length || 0}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(module.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Materials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Module Materials</CardTitle>
              <CardDescription>
                Content materials for this module
              </CardDescription>
            </div>
            <Link href={`/dashboard/admin/materials/new?moduleId=${module.id}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {materialsResponse?.data?.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No materials</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating a new material for this module.
              </p>
              <div className="mt-6">
                <Link href={`/dashboard/admin/materials/new?moduleId=${module.id}`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Material
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialsResponse?.data
                    ?.sort((a, b) => a.order - b.order)
                    ?.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                              {material.title?.charAt(0).toUpperCase() || 'M'}
                            </div>
                            <div>
                              <div className="font-medium">{material.title}</div>
                              {material.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {material.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {material.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{material.order}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            {material.duration ? `${material.duration} min` : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(material.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/dashboard/admin/materials/${material.id}`}>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/dashboard/admin/materials/${material.id}/edit`}>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              </Link>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Module Sheet */}
      <EditModuleSheet
        module={module}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}