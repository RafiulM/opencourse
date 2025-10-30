"use client"

import Image from "next/image"
import { Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Community } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AboutCommunityDialog } from "./about-dialog"

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
  const memberCount = community.memberCount ?? 0
  const memberLabel = memberCount === 1 ? "member" : "members"

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

          <div className="space-y-4">
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
                {memberCount.toLocaleString()} {memberLabel}
              </span>
            </div>

            {community.description && (
              <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
                {community.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {showRequestToJoin && (
                <Button size="sm" onClick={onRequestToJoin} className="px-4">
                  {requestToJoinLabel}
                </Button>
              )}
              <AboutCommunityDialog
                community={community}
                trigger={
                  <Button variant="link" size="sm" className="px-0 text-primary">
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
