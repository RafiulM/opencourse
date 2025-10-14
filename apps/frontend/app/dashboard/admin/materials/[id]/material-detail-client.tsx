'use client';

import { use } from "react";
import { notFound } from "next/navigation";
import { parseAsBoolean, useQueryState } from "nuqs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  FileText,
  Calendar,
  Link as LinkIcon,
  Video,
  Play
} from "lucide-react";
import Link from "next/link";
import { useCourseMaterial, useDeleteCourseMaterial } from "@/hooks/use-materials";
import { useCourseModule } from "@/hooks/use-modules";
import { useCourse } from "@/hooks/use-courses";
import { CourseMaterial } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EditMaterialSheet } from "@/components/edit-material-sheet";

interface MaterialDetailPageClientProps {
  id: string;
}

export default function MaterialDetailPageClient({ id }: MaterialDetailPageClientProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useQueryState('edit', parseAsBoolean.withDefault(false));
  const { data: materialResponse, isLoading, error } = useCourseMaterial(id);
  const { data: moduleResponse } = useCourseModule(materialResponse?.data?.moduleId || '', !!materialResponse?.data?.moduleId);
  const { data: courseResponse } = useCourse(moduleResponse?.data?.courseId || '', !!moduleResponse?.data?.courseId);
  const deleteMaterial = useDeleteCourseMaterial();

  if (error) {
    if (error.message.includes('404')) {
      notFound();
    }
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading material: {error.message}</p>
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

  const material = materialResponse?.data;
  if (!material) {
    notFound();
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${material.title}"? This action cannot be undone.`)) {
      try {
        await deleteMaterial.mutateAsync(material.id);
        toast.success("Material deleted successfully");
        router.push(`/dashboard/admin/modules/${material.moduleId}`);
      } catch (error) {
        toast.error("Failed to delete material");
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'link':
        return <LinkIcon className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/admin/modules/${material.moduleId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Module
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
            disabled={deleteMaterial.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Material Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                {material.title?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <CardTitle className="text-2xl">{material.title}</CardTitle>
                </div>
                <CardDescription className="text-lg">
                  Material #{material.order}
                </CardDescription>
                {moduleResponse?.data && (
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <FileText className="mr-1 h-4 w-4" />
                    {moduleResponse.data.title}
                  </div>
                )}
                {courseResponse?.data && (
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <FileText className="mr-1 h-4 w-4" />
                    {courseResponse.data.title}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                {getTypeIcon(material.type)}
                <span className="capitalize">{material.type}</span>
              </Badge>
              {material.duration && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{material.duration} min</span>
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {material.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{material.description}</p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Order</p>
                  <p className="text-2xl font-bold">#{material.order}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(material.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm capitalize">{material.type}</p>
                </div>
              </div>
            </div>

            {/* Material Content */}
            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Content</h3>
              {material.type === "text" && material.content ? (
                <div className="prose max-w-none bg-muted p-4 rounded-lg">
                  <div className="whitespace-pre-wrap">{material.content}</div>
                </div>
              ) : material.type === "video" && material.url ? (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="aspect-video bg-black rounded flex items-center justify-center">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground truncate">
                    {material.url}
                  </p>
                </div>
              ) : material.type === "link" && material.url ? (
                <div className="bg-muted p-4 rounded-lg">
                  <Link
                    href={material.url}
                    target="_blank"
                    className="flex items-center space-x-2 text-blue-600 hover:underline"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>Open External Link</span>
                  </Link>
                  <p className="mt-2 text-sm text-muted-foreground truncate">
                    {material.url}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No content available for this material type.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Material Sheet */}
      <EditMaterialSheet
        material={material}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}