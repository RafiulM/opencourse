'use client';

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  Globe,
  Lock,
  UserCheck 
} from "lucide-react"
import Link from "next/link"
import { useCommunities, useDeleteCommunity } from "@/hooks/use-communities"
import { Community } from "@/lib/types"
import { toast } from "sonner"
import { useSession } from "@/lib/auth"

export default function CommunitiesPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  const { data: session } = useSession()
  const userId = session?.user?.id

  // Only show communities created by the current user
  const { data, isLoading, error } = useCommunities(page, limit, { createdBy: userId })
  const deleteCommunityMutation = useDeleteCommunity()

  const handleDelete = async (community: Community) => {
    if (confirm(`Are you sure you want to delete "${community.name}"? This action cannot be undone.`)) {
      try {
        await deleteCommunityMutation.mutateAsync(community.id)
        toast.success("Community deleted successfully")
      } catch (error) {
        toast.error("Failed to delete community")
      }
    }
  }

  const getPrivacyIcon = (privacy: Community['privacy']) => {
    switch (privacy) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-600" />
      case 'private':
        return <Lock className="h-4 w-4 text-red-600" />
      case 'invite_only':
        return <UserCheck className="h-4 w-4 text-yellow-600" />
      default:
        return <Globe className="h-4 w-4 text-gray-600" />
    }
  }

  const getPrivacyBadge = (privacy: Community['privacy']) => {
    const variants = {
      public: "default",
      private: "destructive", 
      invite_only: "secondary"
    } as const

    return (
      <Badge variant={variants[privacy]} className="capitalize">
        {privacy.replace('_', ' ')}
      </Badge>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading communities: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Communities Management</CardTitle>
              <CardDescription>
                Create and manage learning communities
              </CardDescription>
            </div>
            <Link href="/dashboard/admin/communities/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Community
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search communities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Community</TableHead>
                    <TableHead>Privacy</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        Loading communities...
                      </TableCell>
                    </TableRow>
                  ) : data?.data?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No communities found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data
                      ?.filter(community => 
                        search === "" || 
                        community.name.toLowerCase().includes(search.toLowerCase()) ||
                        community.slug.toLowerCase().includes(search.toLowerCase())
                      )
                      ?.map((community) => (
                        <TableRow key={community.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                                {community.name?.charAt(0).toUpperCase() || 'C'}
                              </div>
                              <div>
                                <div className="font-medium">{community.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  /{community.slug}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getPrivacyIcon(community.privacy)}
                              {getPrivacyBadge(community.privacy)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                              {community.memberCount}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(community.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={community.isVerified ? "default" : "outline"}>
                              {community.isVerified ? "Verified" : "Unverified"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <Link href={`/dashboard/admin/communities/${community.id}`}>
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                </Link>
                                <Link href={`/dashboard/admin/communities/${community.id}/edit`}>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(community)}
                                  disabled={deleteCommunityMutation.isPending}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {data?.pagination && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.pagination.total)} of{" "}
                  {data.pagination.total} communities
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}