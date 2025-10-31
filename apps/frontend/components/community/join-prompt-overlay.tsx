"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft } from "lucide-react"
import { useJoinCommunity } from "@/hooks/use-communities"
import { useSession } from "@/lib/auth"
import { toast } from "sonner"

interface JoinPromptOverlayProps {
  communityId: string
  communityName: string
  communitySlug: string
  isOpen: boolean
  onClose: () => void
}

export function JoinPromptOverlay({
  communityId,
  communityName,
  communitySlug,
  isOpen,
  onClose,
}: JoinPromptOverlayProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const joinCommunity = useJoinCommunity()
  const { data: session, isPending: sessionLoading } = useSession()

  // Handle joining community
  const handleJoinCommunity = async () => {
    // Check if user is authenticated
    if (!session && !sessionLoading) {
      // Redirect to login with return URL that includes join action
      const currentPath = `/communities/${communitySlug}`
      const returnUrl = encodeURIComponent(`${currentPath}?request=join`)
      router.push(`/login?returnUrl=${returnUrl}`)
      return
    }

    // If still loading session, wait
    if (sessionLoading) {
      return
    }

    try {
      await joinCommunity.mutateAsync(communityId)
      toast.success(`Successfully joined ${communityName}!`)
      onClose()

      // Clean up URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete("request")
      window.history.replaceState({}, "", url.toString())
    } catch (error: any) {
      // Handle authentication errors
      if (error?.code === "AUTHENTICATION_REQUIRED" || error?.status === 401) {
        // Redirect to login with return URL
        const currentPath = `/communities/${communitySlug}`
        const returnUrl = encodeURIComponent(`${currentPath}?request=join`)
        router.push(`/login?returnUrl=${returnUrl}`)
        return
      }

      // Handle specific error cases
      if (
        error.message?.includes("already a member") ||
        error.message?.includes("ALREADY_MEMBER")
      ) {
        toast.success(`You're already a member of ${communityName}!`)
        onClose()

        // Clean up URL parameters
        const url = new URL(window.location.href)
        url.searchParams.delete("request")
        window.history.replaceState({}, "", url.toString())
      } else {
        toast.error(error.message || "Failed to join community")
      }
    }
  }

  // Handle closing without joining
  const handleDecline = () => {
    onClose()

    // Clean up URL parameters
    const url = new URL(window.location.href)
    url.searchParams.delete("request")
    window.history.replaceState({}, "", url.toString())
  }

  // Auto-close if URL parameters change
  useEffect(() => {
    if (
      !searchParams?.get("request") ||
      searchParams.get("request") !== "join"
    ) {
      onClose()
    }
  }, [searchParams, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Join {communityName}
          </DialogTitle>
          <DialogDescription>
            You need to be a member of this community to view posts and
            participate in discussions.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 font-medium text-gray-900">
              What you'll get as a member:
            </h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Access to all community posts</li>
              <li>• Ability to comment and participate</li>
              <li>• Connect with other members</li>
              <li>• Stay updated with community news</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleDecline}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Maybe Later
          </Button>
          <Button
            onClick={handleJoinCommunity}
            disabled={joinCommunity.isPending || sessionLoading}
            className="w-full sm:w-auto"
          >
            <Users className="mr-2 h-4 w-4" />
            {sessionLoading
              ? "Checking..."
              : joinCommunity.isPending
                ? "Joining..."
                : "Join Community"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
