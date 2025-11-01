"use client"

import { useEffect, useCallback } from "react"
import { useSession } from "@/lib/auth"
import { AvatarUpload } from "@/components/uploads/avatar-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Save, Check, X, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
  useUserProfile,
  useUpdateUserProfile,
  useUpdateUserAvatar,
  useUpdateUsername,
} from "@/hooks"
import { useDebounceValue } from "usehooks-ts"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

const profileFormSchema = z.object({
  name: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be less than 100 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be no more than 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function SettingsPageClient() {
  const { data: session, isPending } = useSession()
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useUserProfile(!!session?.user?.id)
  const updateUserProfileMutation = useUpdateUserProfile()
  const updateUserAvatarMutation = useUpdateUserAvatar()
  const updateUsernameMutation = useUpdateUsername()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile?.data?.name || "",
      username: userProfile?.data?.username || "",
    },
    values: {
      name: userProfile?.data?.name || "",
      username: userProfile?.data?.username || "",
    },
  })

  // Watch username changes and debounce for validation
  const username = form.watch("username")
  const [debouncedUsername] = useDebounceValue(username, 400)

  // Query for username validation (only when username is valid and different from current)
  const {
    data: validationData,
    isLoading: isValidationLoading,
    error: validationError,
  } = useQuery({
    queryKey: ["username-validation", debouncedUsername],
    queryFn: async () => {
      // Don't validate if username is empty or unchanged
      if (
        !debouncedUsername ||
        debouncedUsername === userProfile?.data?.username
      ) {
        return null
      }

      const response = await apiClient.validateUsername(debouncedUsername)
      return response.data
    },
    enabled:
      !!debouncedUsername && debouncedUsername !== userProfile?.data?.username,
    staleTime: 1000 * 60, // Cache for 1 minute
    gcTime: 1000 * 60 * 5, // Keep in memory for 5 minutes
  })

  // Update form when user profile data changes
  useEffect(() => {
    if (userProfile?.data) {
      form.reset({
        name: userProfile.data.name || "",
        username: userProfile.data.username || "",
      })
    }
  }, [userProfile?.data, form])

  // Handle profile errors
  useEffect(() => {
    if (profileError) {
      console.error("Error fetching user profile:", profileError)
      toast.error("Failed to load user profile")
    }
  }, [profileError])

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!userProfile?.data) return

    try {
      // Update name if changed
      if (values.name !== userProfile.data.name) {
        await updateUserProfileMutation.mutateAsync({ name: values.name })
      }

      // Update username if changed
      if (values.username !== userProfile.data.username) {
        await updateUsernameMutation.mutateAsync(values.username)
      }

      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      )
    }
  }

  const handleAvatarUpdate = async (avatarUrl: string, uploadId: string) => {
    if (!userProfile?.data) return

    try {
      await updateUserAvatarMutation.mutateAsync({ avatarUrl })
      toast.success("Avatar updated successfully")
    } catch (error) {
      console.error("Error updating avatar:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to update avatar"
      )
    }
  }

  const isLoading = isPending || isProfileLoading || !userProfile?.data
  const isUpdating =
    updateUserProfileMutation.isPending ||
    updateUserAvatarMutation.isPending ||
    updateUsernameMutation.isPending

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  const user = userProfile.data!

  return (
    <div className="relative grid gap-6">
      {/* Loading Overlay */}
      {isUpdating && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-sm">Updating profile...</p>
          </div>
        </div>
      )}

      {/* Avatar Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Update your profile picture. Click on the avatar to upload a new
            one.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center space-x-6">
          <AvatarUpload
            currentAvatarUrl={user.image}
            onAvatarUpdate={handleAvatarUpdate}
            userId={user.id}
            size="lg"
            className="flex-shrink-0"
          />
          <div className="flex-1">
            <h3 className="mb-2 font-medium">Upload New Avatar</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Click on your current avatar to upload a new one. We recommend
              using a square image that's at least 400x400 pixels.
            </p>
            {updateUserAvatarMutation.isPending && (
              <div className="text-muted-foreground flex items-center text-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating avatar...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and how others see you on the
            platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onProfileSubmit)}
              className="space-y-6"
            >
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your display name"
                          {...field}
                          disabled={
                            updateUserProfileMutation.isPending ||
                            updateUsernameMutation.isPending ||
                            isValidationLoading
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => {
                    const currentUsername = userProfile?.data?.username
                    const isChecking = isValidationLoading
                    const hasError = !!validationError

                    const isValid = validationData?.isValid
                    const isAvailable = validationData?.isAvailable
                    const validationMessage = validationData?.message

                    const showValidation =
                      field.value.length > 0 &&
                      field.value !== currentUsername &&
                      (isChecking || validationData !== null || hasError)

                    const getStatusIcon = () => {
                      if (isChecking) {
                        return (
                          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                        )
                      }
                      if (hasError) {
                        return <X className="h-3 w-3 text-red-500" />
                      }
                      if (!isValid) {
                        return (
                          <AlertCircle className="h-3 w-3 text-orange-500" />
                        )
                      }
                      if (isValid && isAvailable) {
                        return <Check className="h-3 w-3 text-green-500" />
                      }
                      if (isValid && !isAvailable) {
                        return <X className="h-3 w-3 text-red-500" />
                      }
                      return null
                    }

                    const getStatusMessage = () => {
                      if (isChecking) return "Checking username..."
                      if (hasError) return "Error checking username"
                      if (validationMessage) return validationMessage
                      return null
                    }

                    const getMessageColor = () => {
                      if (isChecking) return "text-blue-500"
                      if (hasError) return "text-red-500"
                      if (!isValid) return "text-orange-500"
                      if (isValid && isAvailable) return "text-green-500"
                      if (isValid && !isAvailable) return "text-red-500"
                      return ""
                    }

                    return (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Username</FormLabel>
                          {showValidation && (
                            <div className="flex items-center gap-1">
                              {getStatusIcon()}
                              <span className={`text-xs ${getMessageColor()}`}>
                                {getStatusMessage()}
                              </span>
                            </div>
                          )}
                        </div>
                        <FormControl>
                          <Input
                            placeholder="Enter your username"
                            {...field}
                            disabled={
                              updateUserProfileMutation.isPending ||
                              updateUsernameMutation.isPending ||
                              isChecking
                            }
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-muted-foreground mt-1 text-sm">
                          This is your unique identifier. It can only contain
                          letters, numbers, underscores, and hyphens.
                        </p>
                      </FormItem>
                    )
                  }}
                />

                <div>
                  <FormLabel>Email Address</FormLabel>
                  <Input value={user.email} disabled className="bg-muted" />
                  <p className="text-muted-foreground mt-1 text-sm">
                    Your email address cannot be changed. Contact support if you
                    need to update it.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    updateUserProfileMutation.isPending ||
                    updateUsernameMutation.isPending ||
                    isValidationLoading ||
                    !form.formState.isDirty
                  }
                >
                  {updateUserProfileMutation.isPending ||
                  updateUsernameMutation.isPending ||
                  isValidationLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View your account details and activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account ID:</span>
              <span className="font-mono">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since:</span>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>{new Date(user.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
