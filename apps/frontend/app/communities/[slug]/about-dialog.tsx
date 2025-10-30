"use client"

import { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Users, BookOpen, FileText, Shield, CalendarDays, Globe } from "lucide-react"
import { Community } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface AboutCommunityDialogProps {
  community: Community
  coursesCount?: number
  postsCount?: number
  trigger?: ReactNode
}

export function AboutCommunityDialog({
  community,
  coursesCount,
  postsCount,
  trigger,
}: AboutCommunityDialogProps) {
  const createdAt = community.createdAt
    ? new Date(community.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : undefined

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            About
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>About {community.name}</DialogTitle>
          {community.description && (
            <DialogDescription>{community.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatPreview
              icon={<Users className="h-4 w-4" />}
              label="Members"
              value={community.memberCount?.toLocaleString() ?? "—"}
            />
            {coursesCount !== undefined && (
              <StatPreview
                icon={<BookOpen className="h-4 w-4" />}
                label="Courses"
                value={coursesCount.toLocaleString()}
              />
            )}
            {postsCount !== undefined && (
              <StatPreview
                icon={<FileText className="h-4 w-4" />}
                label="Posts"
                value={postsCount.toLocaleString()}
              />
            )}
            <StatPreview
              icon={<Shield className="h-4 w-4" />}
              label="Privacy"
              value={formatPrivacy(community.privacy)}
            />
            {community.domain && (
              <StatPreview
                icon={<Globe className="h-4 w-4" />}
                label="Domain"
                value={community.domain}
              />
            )}
            {createdAt && (
              <StatPreview
                icon={<CalendarDays className="h-4 w-4" />}
                label="Created"
                value={createdAt}
              />
            )}
          </div>

          {(community.settings?.guidelines || community.settings?.welcomeMessage) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Community Info
              </h3>
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {community.settings?.welcomeMessage && <p>{community.settings.welcomeMessage}</p>}
                {community.settings?.guidelines && <p>{community.settings.guidelines}</p>}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {formatPrivacy(community.privacy)}
            </Badge>
            {community.isVerified && <Badge>Verified</Badge>}
            {community.domain && (
              <Badge variant="secondary">{community.domain}</Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatPreview({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground tracking-wide">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}

function formatPrivacy(value: Community["privacy"]) {
  return value.replace(/_/g, " ")
}
