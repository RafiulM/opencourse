"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Users,
  ChevronRight,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  ChevronLeft,
  MoreHorizontal,
  Image as ImageIcon,
} from "lucide-react"
import { useCommunities } from "@/hooks/use-communities"
import { Community } from "@/lib/types"
import { useQueryState } from "nuqs"
import { useDebounceValue } from "usehooks-ts"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface CommunityExplorerProps {
  title?: string
  description?: string
  showHeader?: boolean
  showViewToggle?: boolean
  showCreateButton?: boolean
  limit?: number
  className?: string
}

type PrivacyFilter = "all" | "public" | "private" | "invite_only"
type ViewMode = "grid" | "list"

const ITEMS_PER_PAGE = 12

export function CommunityExplorer({
  title = "Explore Communities",
  description = "Discover learning communities that match your interests",
  showHeader = true,
  showViewToggle = true,
  showCreateButton = false,
  limit,
  className = "",
}: CommunityExplorerProps) {
  // State management with URL persistence
  const [currentPage, setCurrentPage] = useQueryState("page", {
    defaultValue: 1,
    parse: (value) => parseInt(value, 10) || 1,
  })

  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
    parse: (value) => value || "",
  })

  // Debounced search query to reduce API calls
  const [debouncedSearchQuery] = useDebounceValue(searchQuery, 500)

  const [privacyFilter, setPrivacyFilter] = useQueryState<PrivacyFilter>(
    "privacy",
    {
      defaultValue: "all",
      parse: (value) =>
        ["all", "public", "private", "invite_only"].includes(value)
          ? (value as PrivacyFilter)
          : "all",
    }
  )

  const [sort, setSort] = useQueryState<string>("sort", {
    defaultValue: "name",
    parse: (value) => value || "name",
  })

  const [viewMode, setViewMode] = useQueryState<ViewMode>("view", {
    defaultValue: "grid",
    parse: (value) =>
      ["grid", "list"].includes(value) ? (value as ViewMode) : "grid",
  })

  // Fetch communities with pagination, filters, and sorting
  const pageSize = limit || ITEMS_PER_PAGE

  // Build filters object using debounced search
  const apiFilters = {
    ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
    ...(privacyFilter !== "all" && { privacy: privacyFilter }),
  }

  // Build sort array
  const sortArray = sort ? [sort] : []

  const { data: communitiesData, isLoading } = useCommunities(
    currentPage,
    pageSize,
    apiFilters,
    sortArray
  )

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case "public":
        return "🌍"
      case "private":
        return "🔒"
      case "invite_only":
        return "📩"
      default:
        return "🏠"
    }
  }

  // Show searching message when debouncing
  if (isLoading && searchQuery !== debouncedSearchQuery) {
    return (
      <div className={`space-y-6 ${className}`}>
        {showHeader && (
          <div className="space-y-2">
            <div className="bg-muted h-8 w-1/3 animate-pulse rounded"></div>
            <div className="bg-muted h-4 w-2/3 animate-pulse rounded"></div>
          </div>
        )}
        <div className="text-muted-foreground text-sm">
          Searching for "{searchQuery}"...
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-2">{description}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          {/* Search */}
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              type="text"
              placeholder="Search communities..."
              value={searchQuery} // Use non-debounced value for immediate feedback
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Reset to first page when search changes
              }}
              className="pl-10"
            />
          </div>

          {/* Privacy Filter */}
          <Select
            value={privacyFilter}
            onValueChange={(value) => {
              setPrivacyFilter(value as PrivacyFilter)
              setCurrentPage(1) // Reset to first page when filter changes
            }}
          >
            <SelectTrigger className="w-32">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="public">🌍 Public</SelectItem>
              <SelectItem value="private">🔒 Private</SelectItem>
              <SelectItem value="invite_only">📩 Invite Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value)
              setCurrentPage(1) // Reset to first page when sort changes
            }}
          >
            <SelectTrigger className="w-32">
              <SortAsc className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="-createdAt">Newest</SelectItem>
              <SelectItem value="createdAt">Oldest</SelectItem>
              <SelectItem value="-memberCount">Most Members</SelectItem>
              <SelectItem value="memberCount">Least Members</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle and Actions */}
        <div className="flex items-center gap-2">
          {/* Clear Filters Button */}
          {(searchQuery || privacyFilter !== "all" || sort !== "name") && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setPrivacyFilter("all")
                setSort("name")
                setCurrentPage(1)
              }}
            >
              Clear filters
            </Button>
          )}

          {showViewToggle && (
            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}

          {showCreateButton && (
            <Button asChild>
              <Link href="/dashboard/admin/communities/new">
                Create Community
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <div>
          {communitiesData?.pagination?.total === 0
            ? "No communities found"
            : `Showing ${communitiesData?.data?.length || 0} of ${communitiesData?.pagination?.total || 0} communities`}
          {searchQuery && ` for "${searchQuery}"`}
        </div>
        <div>
          Page {currentPage} of {communitiesData?.pagination?.totalPages || 1}
        </div>
      </div>

      {/* Loading Skeleton for Community Cards */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: pageSize / 2 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted h-48 animate-pulse rounded-lg"
            ></div>
          ))}
        </div>
      )}

      {/* Communities Grid/List */}
      {!isLoading &&
      communitiesData?.data &&
      communitiesData.data.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
          }
        >
          {communitiesData.data.map((community) => (
            <Card
              key={community.id}
              className={`group cursor-pointer pt-0 transition-all duration-200 hover:shadow-lg ${
                viewMode === "list" ? "flex flex-row items-center" : ""
              }`}
            >
              <Link
                href={`/communities/${community.id}`}
                className={viewMode === "list" ? "flex w-full" : ""}
              >
                {/* Banner Image */}
                {viewMode === "grid" && (
                  <div className="h-32 w-full overflow-hidden rounded-t-lg">
                    {community.banner ? (
                      <Image
                        src={community.banner}
                        alt={`${community.name} banner`}
                        className="h-full w-full object-cover"
                        width={100}
                        height={100}
                      />
                    ) : (
                      <div className="bg-muted flex h-full w-full items-center justify-center">
                        <ImageIcon className="text-muted-foreground h-8 w-8" />
                      </div>
                    )}
                  </div>
                )}

                <CardHeader
                  className={cn(viewMode === "list" ? "flex-1" : "", "pt-4")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center space-x-3">
                      <div className="flex-shrink-0">
                        {community.avatar ? (
                          <img
                            src={community.avatar}
                            alt={`${community.name} avatar`}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="text-primary h-8 w-8" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="group-hover:text-primary truncate text-lg transition-colors">
                          {community.name}
                        </CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {getPrivacyIcon(community.privacy)}{" "}
                            {community.privacy.replace("_", " ")}
                          </Badge>
                          {community.memberCount !== undefined && (
                            <span className="text-muted-foreground text-xs">
                              {community.memberCount} members
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
                    </div>
                  </div>
                </CardHeader>

                {viewMode === "grid" && (
                  <CardContent>
                    <CardDescription className="line-clamp-3">
                      {community.description ||
                        "Discover courses and learning materials in this community."}
                    </CardDescription>
                    <div className="text-muted-foreground mt-3 flex items-center justify-between text-sm">
                      <span>Community</span>
                      <span className="group-hover:text-primary flex items-center transition-colors">
                        Explore <ChevronRight className="ml-1 h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                )}

                {viewMode === "list" && community.description && (
                  <CardContent className="flex-1">
                    <CardDescription className="line-clamp-2">
                      {community.description}
                    </CardDescription>
                  </CardContent>
                )}
              </Link>
            </Card>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-12">
          <Users className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <h3 className="mb-2 text-xl font-semibold">
            {searchQuery ? "No communities found" : "No communities yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? `No communities match your search for "${searchQuery}". Try adjusting your search terms.`
              : `Communities will appear here once they're created. Check back soon!`}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setPrivacyFilter("all")
                setSort("name")
              }}
            >
              Clear all
            </Button>
          )}
        </div>
      ) : null}

      {/* Pagination */}
      {!limit &&
      communitiesData?.pagination?.totalPages &&
      communitiesData.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center space-x-1">
            {/* Page numbers */}
            {Array.from(
              { length: Math.min(5, communitiesData.pagination.totalPages) },
              (_, i) => {
                let pageNum
                if (communitiesData.pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (
                  currentPage >=
                  communitiesData.pagination.totalPages - 2
                ) {
                  pageNum = communitiesData.pagination.totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                )
              }
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(communitiesData.pagination.totalPages, prev + 1)
              )
            }
            disabled={currentPage === communitiesData.pagination.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {/* Results summary */}
      {!limit &&
      communitiesData?.pagination?.totalPages &&
      communitiesData.pagination.totalPages > 1 ? (
        <div className="text-muted-foreground text-center text-sm">
          Page {currentPage} of {communitiesData.pagination.totalPages} •{" "}
          {communitiesData.pagination.total} total communities
        </div>
      ) : null}
    </div>
  )
}
