'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  MoreHorizontal
} from 'lucide-react';
import { useCommunities } from '@/hooks/use-communities';
import { Community } from '@/lib/types';
import { CommunityFilters } from '@/components/filters/community-filters';

interface CommunityExplorerProps {
  title?: string;
  description?: string;
  showHeader?: boolean;
  showViewToggle?: boolean;
  showCreateButton?: boolean;
  limit?: number;
  className?: string;
}

type PrivacyFilter = 'all' | 'public' | 'private' | 'invite_only';
type ViewMode = 'grid' | 'list';

const ITEMS_PER_PAGE = 12;

export function CommunityExplorer({
  title = 'Explore Communities',
  description = 'Discover learning communities that match your interests',
  showHeader = true,
  showViewToggle = true,
  showCreateButton = false,
  limit,
  className = ''
}: CommunityExplorerProps) {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sort, setSort] = useState<string[]>([]);

  // Fetch communities with pagination, filters, and sorting
  const pageSize = limit || ITEMS_PER_PAGE;
  
  // Build filters object
  const apiFilters = {
    ...filters,
    ...(searchQuery && { search: searchQuery }),
    ...(privacyFilter !== 'all' && { privacy: privacyFilter })
  };
  
  const { data: communitiesData, isLoading } = useCommunities(currentPage, pageSize, apiFilters, sort);

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public': return '🌍';
      case 'private': return '🔒';
      case 'invite_only': return '📩';
      default: return '🏠';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {showHeader && (
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when search changes
              }}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {/* Privacy Filter */}
            <Select 
              value={privacyFilter} 
              onValueChange={(value) => {
                setPrivacyFilter(value as PrivacyFilter);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
            >
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="public">🌍 Public</SelectItem>
                <SelectItem value="private">🔒 Private</SelectItem>
                <SelectItem value="invite_only">📩 Invite Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters */}
            <CommunityFilters
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                setCurrentPage(1); // Reset to first page when filters change
              }}
              onSortChange={setSort}
              currentFilters={filters}
              currentSort={sort}
            />
          </div>
        </div>

        {/* View Toggle and Actions */}
        <div className="flex items-center gap-2">
          {showViewToggle && (
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
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
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {communitiesData?.pagination?.total === 0 ? 'No communities found' : 
           `Showing ${communitiesData?.data?.length || 0} of ${communitiesData?.pagination?.total || 0} communities`}
          {searchQuery && ` for "${searchQuery}"`}
        </div>
        <div>
          Page {currentPage} of {communitiesData?.pagination?.totalPages || 1}
        </div>
      </div>

      {/* Communities Grid/List */}
      {communitiesData?.data && communitiesData.data.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'space-y-4'
        }>
          {communitiesData.data.map((community) => (
            <Card 
              key={community.id} 
              className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${
                viewMode === 'list' ? 'flex-row flex items-center' : ''
              }`}
            >
              <Link href={`/communities/${community.id}`} className={viewMode === 'list' ? 'flex w-full' : ''}>
                <CardHeader className={viewMode === 'list' ? 'flex-1' : ''}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                          {community.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {getPrivacyIcon(community.privacy)} {community.privacy.replace('_', ' ')}
                          </Badge>
                          {community.memberCount !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {community.memberCount} members
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardHeader>
                
                {viewMode === 'grid' && (
                  <CardContent>
                    <CardDescription className="line-clamp-3">
                      {community.description || 'Discover courses and learning materials in this community.'}
                    </CardDescription>
                    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                      <span>Community</span>
                      <span className="flex items-center group-hover:text-primary transition-colors">
                        Explore <ChevronRight className="h-3 w-3 ml-1" />
                      </span>
                    </div>
                  </CardContent>
                )}
                
                {viewMode === 'list' && community.description && (
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
      ) : (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No communities found' : 'No communities yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? `No communities match your search for "${searchQuery}". Try adjusting your filters or search terms.`
                : 'Communities will appear here once they\'re created. Check back soon!'
              }
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setPrivacyFilter('all');
                  setFilters({});
                }}
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!limit && communitiesData?.pagination?.totalPages && communitiesData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, communitiesData.pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (communitiesData.pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= communitiesData.pagination.totalPages - 2) {
                pageNum = communitiesData.pagination.totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(communitiesData.pagination.totalPages, prev + 1))}
            disabled={currentPage === communitiesData.pagination.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Results summary */}
      {!limit && communitiesData?.pagination?.totalPages && communitiesData.pagination.totalPages > 1 && (
        <div className="text-center text-sm text-muted-foreground">
          Page {currentPage} of {communitiesData.pagination.totalPages} • {communitiesData.pagination.total} total communities
        </div>
      )}
    </div>
  );
}