'use client';

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Loader2 } from "lucide-react";
import { Community, UpdateCommunityRequest } from "@/lib/types";
import { useUpdateCommunity } from "@/hooks/use-communities";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/uploads";
import { useState } from "react";

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

interface EditCommunitySheetProps {
  community: Community | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCommunitySheet({
  community,
  open,
  onOpenChange,
}: EditCommunitySheetProps) {
  const updateCommunityMutation = useUpdateCommunity();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploadId, setAvatarUploadId] = useState<string | null>(null);

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

  const privacy = watch("privacy");

  useEffect(() => {
    if (community) {
      reset({
        name: community.name,
        slug: community.slug,
        description: community.description || "",
        domain: community.domain || "",
        privacy: community.privacy,
      });
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
      };

      await updateCommunityMutation.mutateAsync(updateData);
      toast.success("Community updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Update community error:", error);
      toast.error("Failed to update community");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit Community</SheetTitle>
            <SheetDescription>
              Make changes to your community settings. Click save when you're done.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 py-6">
            {/* Community Avatar */}
            <div className="space-y-2">
              <Label>Community Avatar</Label>
              <div className="flex justify-center">
                <AvatarUpload
                  currentAvatarUrl={community?.avatar}
                  onAvatarUpdate={(url, uploadId) => {
                    setAvatarUrl(url);
                    setAvatarUploadId(uploadId);
                  }}
                  communityId={community?.id}
                  size="lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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

            <div className="space-y-2">
              <Label htmlFor="privacy">Privacy</Label>
              <Select
                value={privacy}
                onValueChange={(value: "public" | "private" | "invite_only") =>
                  setValue("privacy", value)
                }
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

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}