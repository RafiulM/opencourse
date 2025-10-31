"use client"

import { useState } from "react"
import Image from "next/image"
import { Users, Loader2, Edit } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Community } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AboutCommunityDialog } from "./about-dialog"
import { useCommunityMembership, useJoinCommunity, useLeaveCommunity } from "@/hooks/use-communities"
import { useSession } from "@/lib/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface CommunityHeaderProps {
  community: Community
  className?: string
  showBanner?: boolean
  showRequestToJoin?: boolean
  onRequestToJoin?: () => void
  requestToJoinLabel?: string
}

export function CommunityHeader({
  community,
  className,
  showBanner = true,
  showRequestToJoin = false,
  onRequestToJoin,
  requestToJoinLabel = "Request to Join",
}: CommunityHeaderProps) {
  const { data: session, isPending: sessionLoading } = useSession()
  const router = useRouter()
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)

  const memberCount = community.memberCount ?? 0
  const memberLabel = memberCount === 1 ? "member" : "members"

  // Check membership status
  const {
    data: membership,
    isLoading: membershipLoading
  } = useCommunityMembership(
    community.id,
    !!session && !sessionLoading
  )

  const joinCommunity = useJoinCommunity()
  const leaveCommunity = useLeaveCommunity()

  const isMember = membership?.data?.isMember || false
  const userRole = membership?.data?.role

  const handleJoinClick = async () => {
    if (!session) {
      // Redirect to login with return URL that includes join action
      const currentPath = window.location.pathname
      const returnUrl = encodeURIComponent(`${currentPath}?join=true&communityId=${community.id}`)
      router.push(`/login?returnUrl=${returnUrl}`)
      return
    }

    try {
      await joinCommunity.mutateAsync(community.id)
      toast.success(`Successfully joined ${community.name}!`)
    } catch (error: any) {
      toast.error(error.message || "Failed to join community")
    }
  }

  const handleLeaveClick = () => {
    setIsLeaveDialogOpen(true)
  }

  const confirmLeaveClick = async () => {
    try {
      await leaveCommunity.mutateAsync(community.id)
      toast.success(`Successfully left ${community.name}`)
      setIsLeaveDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to leave community")
    }
  }

  // Determine button text and action based on community privacy and membership status
  const getJoinButtonProps = () => {
    if (isMember) {
      return {
        text: "Joined",
        variant: "secondary" as const,
        onClick: handleLeaveClick,
        disabled: false,
        showDropdown: true
      }
    }

    switch (community.privacy) {
      case "public":
        return {
          text: "Join Community",
          variant: "default" as const,
          onClick: handleJoinClick,
          disabled: false,
          showDropdown: false
        }
      case "private":
      case "invite_only":
        return {
          text: "Request to Join",
          variant: "outline" as const,
          onClick: handleJoinClick,
          disabled: false,
          showDropdown: false
        }
      default:
        return {
          text: "Join Community",
          variant: "default" as const,
          onClick: handleJoinClick,
          disabled: false,
          showDropdown: false
        }
    }
  }

  const joinButtonProps = getJoinButtonProps()
  const isJoinLoading = joinCommunity.isPending || leaveCommunity.isPending

  return (
    <section className={cn("space-y-6", className)}>
      {showBanner && community.banner && (
        <div className="aspect-[16/5] w-full overflow-hidden rounded-lg">
          <Image
            src={community.banner}
            alt={`${community.name} banner`}
            width={1600}
            height={600}
            className="h-full w-full object-cover"
            priority
          />
        </div>
      )}

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 items-start gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border bg-background">
            {community.avatar ? (
              <Image
                src={community.avatar}
                alt={`${community.name} avatar`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <Users className="h-10 w-10 text-primary" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {community.name}
              </h1>
              <Badge variant="outline" className="capitalize">
                {formatPrivacy(community.privacy)}
              </Badge>
              {community.isVerified && <Badge>Verified</Badge>}
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-xl text-foreground">
                {memberCount.toLocaleString()}{" "}
                <span className="text-base text-muted-foreground">{memberLabel}</span>
              </span>
            </div>

            {community.description && (
              <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
                {community.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-4">
              {/* Join Community Button - hidden for owners */}
              {membershipLoading ? (
                <Button size="default" variant="outline" disabled className="px-6 py-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </Button>
              ) : (
                userRole !== "owner" && (
                  <>
                    {isMember ? (
                      <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="default"
                            variant={joinButtonProps.variant}
                            disabled={isJoinLoading || joinButtonProps.disabled}
                            className="px-6 py-2"
                          >
                            {isJoinLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Leaving...
                              </>
                            ) : (
                              joinButtonProps.text
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Leave Community</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to leave {community.name}? You might lose access to community posts, courses, and member-only content.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={confirmLeaveClick}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={isJoinLoading}
                            >
                              {isJoinLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Leaving...
                                </>
                              ) : (
                                "Leave Community"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        size="default"
                        variant={joinButtonProps.variant}
                        onClick={joinButtonProps.onClick}
                        disabled={isJoinLoading || joinButtonProps.disabled}
                        className="px-6 py-2"
                      >
                        {isJoinLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          joinButtonProps.text
                        )}
                      </Button>
                    )}
                  </>
                )
              )}

              {/* Legacy Request to Join Button (for custom use cases) */}
              {showRequestToJoin && !membershipLoading && !isMember && (
                <Button size="default" onClick={onRequestToJoin} className="px-6 py-2">
                  {requestToJoinLabel}
                </Button>
              )}

              {/* Edit Community Button - only for owners */}
              {membershipLoading ? (
                <Button size="default" variant="outline" disabled className="px-6 py-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </Button>
              ) : (
                userRole === "owner" && (
                  <Button asChild size="default" variant="outline" className="px-6 py-2">
                    <Link href={`/dashboard/admin/communities/${community.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Community
                    </Link>
                  </Button>
                )
              )}

              <AboutCommunityDialog
                community={community}
                trigger={
                  <Button variant="link" size="default" className="px-0 text-primary">
                    About
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function formatPrivacy(value: Community["privacy"]) {
  return value.replace(/_/g, " ")
}
