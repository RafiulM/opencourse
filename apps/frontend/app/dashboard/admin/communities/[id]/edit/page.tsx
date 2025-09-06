'use client';

import { use } from "react"
import { notFound } from "next/navigation"
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Loader2, ArrowLeft } from "lucide-react";
import { UpdateCommunityRequest } from "@/lib/types";
import { useCommunity, useUpdateCommunity } from "@/hooks/use-communities";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AvatarUpload, BannerUpload } from "@/components/uploads";

const updateCommunitySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug too long")
    .regex(/^[a-zA-Z0-9-_]+$/, "Slug can only contain letters, numbers, hyphens, and underscores"),
  description: z.string().max(500, "Description too long").optional(),
  domain: z.string().max(100, "Domain too long").optional(),
  privacy: z.enum(["public", "private", "invite_only"]),
});

type UpdateCommunityForm = z.infer<typeof updateCommunitySchema>;

interface EditCommunityPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditCommunityPage({ params }: EditCommunityPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: communityResponse, isLoading, error } = useCommunity(id)
  const updateCommunityMutation = useUpdateCommunity();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploadId, setAvatarUploadId] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerUploadId, setBannerUploadId] = useState<string | null>(null);
  const [currentPrivacy, setCurrentPrivacy] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCommunityForm>({
    resolver: zodResolver(updateCommunitySchema),
  });

  const community = communityResponse?.data

  useEffect(() => {
    if (community) {
      console.log("Resetting form with community data:", community);
      console.log("Privacy value:", community.privacy);
      setCurrentPrivacy(community.privacy);
      reset({
        name: community.name,
        slug: community.slug,
        description: community.description || "",
        domain: community.domain || "",
        privacy: community.privacy,
      });
      setAvatarUrl(null);
      setAvatarUploadId(null);
      setBannerUrl(null);
      setBannerUploadId(null);
    }
  }, [community, reset]);

  const onSubmit = async (data: UpdateCommunityForm) => {
    if (!community) return;

    try {
      const updateData: UpdateCommunityRequest = {
        id: community.id,
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        domain: data.domain || undefined,
        privacy: data.privacy,
        avatar: avatarUrl || undefined,
        avatarUploadId: avatarUploadId || undefined,
        banner: bannerUrl || undefined,
        bannerUploadId: bannerUploadId || undefined,
      };

      await updateCommunityMutation.mutateAsync(updateData);
      toast.success("Community updated successfully");
      router.push(`/dashboard/admin/communities/${community.id}`);
    } catch (error) {
      console.error("Update community error:", error);
      toast.error("Failed to update community");
    }
  };

  if (error) {
    if (error.message.includes('404')) {
      notFound()
    }
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading community: {error.message}</p>
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

  if (!community) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/admin/communities/${community.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Community
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Community</h1>
            <p className="text-muted-foreground">Make changes to your community settings</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
             {/* Community Avatar */}
             <div className="space-y-4">
               <h3 className="text-lg font-medium">Community Avatar</h3>
               <div className="flex justify-center">
                 <AvatarUpload
                   currentAvatarUrl={community.avatar}
                   onAvatarUpdate={(url, uploadId) => {
                     setAvatarUrl(url);
                     setAvatarUploadId(uploadId);
                   }}
                   communityId={community.id}
                   size="lg"
                 />
               </div>
             </div>

             {/* Community Banner */}
             <div className="space-y-4">
               <h3 className="text-lg font-medium">Community Banner</h3>
               <BannerUpload
                 currentBannerUrl={community.banner}
                 onBannerUpdate={(url, uploadId) => {
                   setBannerUrl(url);
                   setBannerUploadId(uploadId);
                 }}
                 communityId={community.id}
               />
             </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Community Name</Label>
                  <Input
                    id="name"
                    placeholder="Community name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="community-slug"
                    {...register("slug")}
                  />
                  {errors.slug && (
                    <p className="text-sm text-red-600">{errors.slug.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    This will be used in the community URL: /c/{watch("slug") || "your-slug"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your community..."
                  rows={3}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Custom Domain</Label>
                <Input
                  id="domain"
                  placeholder="yourdomain.com (optional)"
                  {...register("domain")}
                />
                {errors.domain && (
                  <p className="text-sm text-red-600">{errors.domain.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Optional: Use a custom domain for your community
                </p>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Privacy Settings</h3>
              
               <div className="space-y-2">
                 <Label htmlFor="privacy">Privacy Level</Label>
                 <Select
                   value={currentPrivacy}
                   onValueChange={(value: "public" | "private" | "invite_only") => {
                     setCurrentPrivacy(value);
                     setValue("privacy", value);
                   }}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select privacy level" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="public">
                       <div className="flex flex-col items-start">
                         <span>Public</span>
                         <span className="text-xs text-muted-foreground">
                           Anyone can find and join
                         </span>
                       </div>
                     </SelectItem>
                     <SelectItem value="private">
                       <div className="flex flex-col items-start">
                         <span>Private</span>
                         <span className="text-xs text-muted-foreground">
                           Only members can see content
                         </span>
                       </div>
                     </SelectItem>
                     <SelectItem value="invite_only">
                       <div className="flex flex-col items-start">
                         <span>Invite Only</span>
                         <span className="text-xs text-muted-foreground">
                           Members must be invited
                         </span>
                       </div>
                     </SelectItem>
                   </SelectContent>
                 </Select>
                 {errors.privacy && (
                   <p className="text-sm text-red-600">{errors.privacy.message}</p>
                 )}
               </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/admin/communities/${community.id}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || updateCommunityMutation.isPending}
              >
                {(isSubmitting || updateCommunityMutation.isPending) && (
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