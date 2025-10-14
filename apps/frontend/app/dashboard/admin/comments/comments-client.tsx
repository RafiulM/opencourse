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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  MessageSquare,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

// Mock data for now - will be replaced with actual API calls
const mockComments = [
  {
    id: "1",
    content: "This is a great post! Really helpful information.",
    postId: "post-1",
    postTitle: "Getting Started with React",
    author: { name: "John Doe", email: "john@example.com" },
    community: { name: "Web Development" },
    isReported: false,
    reportsCount: 0,
    likesCount: 5,
    createdAt: "2024-01-15T10:30:00Z",
    status: "approved"
  },
  {
    id: "2",
    content: "I disagree with some points here. Can we discuss this further?",
    postId: "post-2",
    postTitle: "Advanced TypeScript Patterns",
    author: { name: "Jane Smith", email: "jane@example.com" },
    community: { name: "TypeScript Masters" },
    isReported: true,
    reportsCount: 3,
    likesCount: 2,
    createdAt: "2024-01-14T15:45:00Z",
    status: "pending"
  },
  {
    id: "3",
    content: "This content is inappropriate and violates community guidelines.",
    postId: "post-1",
    postTitle: "Getting Started with React",
    author: { name: "Spam Bot", email: "spam@example.com" },
    community: { name: "Web Development" },
    isReported: true,
    reportsCount: 15,
    likesCount: 0,
    createdAt: "2024-01-13T09:20:00Z",
    status: "rejected"
  }
]

export default function CommentsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [reported, setReported] = useState<string>("all")
  const [page, setPage] = useState(1)
  const limit = 10

  // Mock loading state - will be replaced with actual API calls
  const [isLoading, setIsLoading] = useState(false)
  const [comments, setComments] = useState(mockComments)

  // Filter comments based on search and filters
  const filteredComments = comments.filter(comment => {
    const matchesSearch = search === "" ||
      comment.content.toLowerCase().includes(search.toLowerCase()) ||
      comment.author.name.toLowerCase().includes(search.toLowerCase()) ||
      comment.postTitle.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = status === "all" || comment.status === status
    const matchesReported = reported === "all" ||
      (reported === "reported" && comment.isReported) ||
      (reported === "not_reported" && !comment.isReported)

    return matchesSearch && matchesStatus && matchesReported
  })

  const paginatedComments = filteredComments.slice((page - 1) * limit, page * limit)
  const totalPages = Math.ceil(filteredComments.length / limit)

  const handleApprove = async (commentId: string) => {
    // Mock API call - will be replaced with actual implementation
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? { ...comment, status: "approved", isReported: false, reportsCount: 0 }
        : comment
    ))
    toast.success("Comment approved successfully")
  }

  const handleReject = async (commentId: string) => {
    // Mock API call - will be replaced with actual implementation
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? { ...comment, status: "rejected" }
        : comment
    ))
    toast.success("Comment rejected")
  }

  const handleDelete = async (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      // Mock API call - will be replaced with actual implementation
      setComments(prev => prev.filter(comment => comment.id !== commentId))
      toast.success("Comment deleted successfully")
    }
  }

  const handleClearReports = async (commentId: string) => {
    // Mock API call - will be replaced with actual implementation
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? { ...comment, isReported: false, reportsCount: 0 }
        : comment
    ))
    toast.success("Reports cleared successfully")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string, isReported: boolean) => {
    if (isReported && status !== 'rejected') {
      return <Badge variant="destructive">Reported</Badge>
    }

    const variants = {
      approved: "default",
      rejected: "secondary",
      pending: "outline"
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Comments Moderation</CardTitle>
            <CardDescription>
              Review and moderate user comments across all communities
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search comments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status Filter */}
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* Reported Filter */}
              <Select value={reported} onValueChange={setReported}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Reports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Comments</SelectItem>
                  <SelectItem value="reported">Reported Only</SelectItem>
                  <SelectItem value="not_reported">Not Reported</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comment</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Post</TableHead>
                    <TableHead>Community</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        Loading comments...
                      </TableCell>
                    </TableRow>
                  ) : paginatedComments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        No comments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedComments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell>
                          <div className="max-w-md">
                            <div className="text-sm line-clamp-2">{comment.content}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{comment.author.name}</div>
                            <div className="text-muted-foreground">{comment.author.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="text-sm font-medium line-clamp-1">{comment.postTitle}</div>
                            <Link
                              href={`/communities/${comment.community?.name?.toLowerCase().replace(/\s+/g, '-')}/posts/${comment.postId}`}
                              target="_blank"
                              className="text-xs text-blue-600 hover:underline flex items-center"
                            >
                              View Post
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{comment.community?.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <MessageSquare className="mr-1 h-3 w-3" />
                              {comment.likesCount}
                            </div>
                            {comment.isReported && (
                              <div className="flex items-center text-red-600">
                                <Flag className="mr-1 h-3 w-3" />
                                {comment.reportsCount}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(comment.status)}
                            {getStatusBadge(comment.status, comment.isReported)}
                          </div>
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
                              {comment.status !== 'approved' && (
                                <DropdownMenuItem
                                  onClick={() => handleApprove(comment.id)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {comment.status !== 'rejected' && (
                                <DropdownMenuItem
                                  onClick={() => handleReject(comment.id)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              )}
                              {comment.isReported && (
                                <DropdownMenuItem
                                  onClick={() => handleClearReports(comment.id)}
                                >
                                  <Flag className="mr-2 h-4 w-4" />
                                  Clear Reports
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(comment.id)}
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, filteredComments.length)} of{" "}
                  {filteredComments.length} comments
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
                    disabled={page >= totalPages}
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