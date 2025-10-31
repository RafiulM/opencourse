import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Users, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type VisibilityFilter = 'all' | 'public' | 'community';

interface VisibilityFilterProps {
  currentFilter: VisibilityFilter;
  onFilterChange: (filter: VisibilityFilter) => void;
  counts?: {
    all: number;
    public: number;
    community: number;
  };
  className?: string;
}

export function VisibilityFilter({
  currentFilter,
  onFilterChange,
  counts,
  className = ''
}: VisibilityFilterProps) {
  const getFilterIcon = (filter: VisibilityFilter) => {
    switch (filter) {
      case 'public':
        return <Eye className="h-3 w-3" />;
      case 'community':
        return <Users className="h-3 w-3" />;
      default:
        return <Filter className="h-3 w-3" />;
    }
  };

  const getFilterLabel = (filter: VisibilityFilter) => {
    switch (filter) {
      case 'public':
        return 'Public Posts';
      case 'community':
        return 'Community Posts';
      default:
        return 'All Posts';
    }
  };

  const getFilterBadgeVariant = (filter: VisibilityFilter) => {
    return currentFilter === filter ? 'default' : 'secondary';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {getFilterIcon(currentFilter)}
            {getFilterLabel(currentFilter)}
            {counts && (
              <Badge variant="outline" className="ml-1 text-xs">
                {counts[currentFilter]}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onFilterChange('all')}>
            <div className="flex items-center gap-2 w-full">
              <Filter className="h-3 w-3" />
              <span>All Posts</span>
              {counts && (
                <Badge variant={getFilterBadgeVariant('all')} className="ml-auto text-xs">
                  {counts.all}
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('public')}>
            <div className="flex items-center gap-2 w-full">
              <Eye className="h-3 w-3" />
              <span>Public Posts</span>
              {counts && (
                <Badge variant={getFilterBadgeVariant('public')} className="ml-auto text-xs">
                  {counts.public}
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('community')}>
            <div className="flex items-center gap-2 w-full">
              <Users className="h-3 w-3" />
              <span>Community Posts</span>
              {counts && (
                <Badge variant={getFilterBadgeVariant('community')} className="ml-auto text-xs">
                  {counts.community}
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {currentFilter !== 'all' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange('all')}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
      )}
    </div>
  );
}

// Simple badge version for inline display
interface VisibilityBadgeFilterProps {
  currentFilter: VisibilityFilter;
  onFilterChange: (filter: VisibilityFilter) => void;
  className?: string;
}

export function VisibilityBadgeFilter({
  currentFilter,
  onFilterChange,
  className = ''
}: VisibilityBadgeFilterProps) {
  const filters: { value: VisibilityFilter; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Filter className="h-3 w-3" /> },
    { value: 'public', label: 'Public', icon: <Eye className="h-3 w-3" /> },
    { value: 'community', label: 'Community', icon: <Users className="h-3 w-3" /> },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {filters.map((filter) => (
        <Badge
          key={filter.value}
          variant={currentFilter === filter.value ? 'default' : 'secondary'}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onFilterChange(filter.value)}
        >
          <span className="flex items-center gap-1">
            {filter.icon}
            {filter.label}
          </span>
        </Badge>
      ))}
    </div>
  );
}