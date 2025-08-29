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
  Search, 
  BookOpen, 
  ChevronRight, 
  Filter,
  Grid3X3,
  List,
  ChevronLeft,
  Play
} from 'lucide-react';
import { useCourses } from '@/hooks/use-courses';
import { Course } from '@/lib/types';
import { CourseFilters } from '@/components/filters/course-filters';

interface CourseExplorerProps {
  title?: string;
  description?: string;
  showHeader?: boolean;
  showViewToggle?: boolean;
  showCreateButton?: boolean;
  limit?: number;
  className?: string;
  communityId?: string;
}

type ViewMode = 'grid' | 'list';

const ITEMS_PER_PAGE = 12;

export function CourseExplorer({
  title = 'Explore Courses',
  description = 'Discover courses that match your interests',
  showHeader = true,
  showViewToggle = true,
  showCreateButton = false,
  limit,
  className = '',
  communityId
}: CourseExplorerProps) {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sort, setSort] = useState<string[]>([]);

  // Fetch courses with pagination, filters, and sorting
  const pageSize = limit || ITEMS_PER_PAGE;
  
  // Build filters object
  const apiFilters = {
    ...filters,
    ...(searchQuery && { search: searchQuery }),
    ...(communityId && { communityId })
  };
  
  const { data: coursesData, isLoading } = useCourses(currentPage, pageSize, apiFilters, sort);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Beginner</Badge>;
      case 'intermediate': return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Intermediate</Badge>;
      case 'advanced': return <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">Advanced</Badge>;
      default: return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
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
              placeholder="Search courses..."
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
            {/* Advanced Filters */}
            <CourseFilters
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
              <Link href="/dashboard/admin/courses/new">
                Create Course
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {coursesData?.pagination?.total === 0 ? 'No courses found' : 
           `Showing ${coursesData?.data?.length || 0} of ${coursesData?.pagination?.total || 0} courses`}
          {searchQuery && ` for "${searchQuery}"`}
        </div>
        <div>
          Page {currentPage} of {coursesData?.pagination?.totalPages || 1}
        </div>
      </div>

      {/* Courses Grid/List */}
      {coursesData?.data && coursesData.data.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'space-y-4'
        }>
          {coursesData.data.map((course) => (
            <Card 
              key={course.id} 
              className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${
                viewMode === 'list' ? 'flex-row flex items-center' : ''
              }`}
            >
              <Link href={`/courses/${course.id}`} className={viewMode === 'list' ? 'flex w-full' : ''}>
                <CardHeader className={viewMode === 'list' ? 'flex-1' : ''}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        <BookOpen className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                          {course.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {course.difficulty && getDifficultyBadge(course.difficulty)}
                          {course.duration !== undefined && (
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Play className="h-3 w-3 mr-1" />
                              {course.duration} min
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
                      {course.description || 'Learn valuable skills with this course.'}
                    </CardDescription>
                    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                      <span>Course</span>
                      <span className="flex items-center group-hover:text-primary transition-colors">
                        Explore <ChevronRight className="h-3 w-3 ml-1" />
                      </span>
                    </div>
                  </CardContent>
                )}
                
                {viewMode === 'list' && course.description && (
                  <CardContent className="flex-1">
                    <CardDescription className="line-clamp-2">
                      {course.description}
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
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No courses found' : 'No courses yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? `No courses match your search for "${searchQuery}". Try adjusting your filters or search terms.`
                : 'Courses will appear here once they\'re created. Check back soon!'
              }
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
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
      {!limit && coursesData?.pagination?.totalPages && coursesData.pagination.totalPages > 1 && (
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
            {Array.from({ length: Math.min(5, coursesData.pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (coursesData.pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= coursesData.pagination.totalPages - 2) {
                pageNum = coursesData.pagination.totalPages - 4 + i;
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
            onClick={() => setCurrentPage(prev => Math.min(coursesData.pagination.totalPages, prev + 1))}
            disabled={currentPage === coursesData.pagination.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Results summary */}
      {!limit && coursesData?.pagination?.totalPages && coursesData.pagination.totalPages > 1 && (
        <div className="text-center text-sm text-muted-foreground">
          Page {currentPage} of {coursesData.pagination.totalPages} • {coursesData.pagination.total} total courses
        </div>
      )}
    </div>
  );
}