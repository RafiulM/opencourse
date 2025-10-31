"use client"

import { useEffect, useRef } from "react"
import { useSession } from "@/lib/auth"
import { useJoinCommunity } from "@/hooks/use-communities"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

interface AutoJoinHandlerProps {
  communityId: string
  communityName: string
}

export function AutoJoinHandler({ communityId, communityName }: AutoJoinHandlerProps) {
  const { data: session, isLoading: sessionLoading } = useSession()
  const searchParams = useSearchParams()
  const joinCommunity = useJoinCommunity()
  const hasProcessed = useRef(false)

  useEffect(() => {
    // Only proceed if user is authenticated, join parameter is present, and we haven't processed yet
    if (
      session &&
      !sessionLoading &&
      searchParams?.get("join") === "true" &&
      searchParams?.get("communityId") === communityId &&
      !hasProcessed.current &&
      !joinCommunity.isPending
    ) {
      hasProcessed.current = true // Mark as processed immediately

      const handleAutoJoin = async () => {
        try {
          await joinCommunity.mutateAsync(communityId)
          toast.success(`Successfully joined ${communityName}!`)

          // Clean up URL parameters
          window.history.replaceState({}, "", window.location.pathname)
        } catch (error: any) {
          // Handle specific error cases
          if (error.message?.includes("already a member") || error.message?.includes("ALREADY_MEMBER")) {
            toast.success(`You're already a member of ${communityName}!`)
          } else {
            toast.error(error.message || "Failed to join community")
          }

          // Clean up URL parameters even on error
          window.history.replaceState({}, "", window.location.pathname)
        }
      }

      handleAutoJoin()
    }
  }, [session, sessionLoading, searchParams, communityId, communityName, joinCommunity.mutateAsync, joinCommunity.isPending])

  // This component doesn't render anything
  return null
}