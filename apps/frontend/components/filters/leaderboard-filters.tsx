'use client';

import { useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Filter, X } from 'lucide-react';

interface LeaderboardFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  onSortChange: (sort: string[]) => void;
  currentFilters: Record<string, any>;
  currentSort: string[];
  type: 'community' | 'course';
}

export function LeaderboardFilters({
  onFiltersChange,
  onSortChange,
  currentFilters,
  currentSort,
  type
}: LeaderboardFiltersProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState(currentFilters);
  const [sort, setSort] = useState(currentSort);

  const applyFilters = () => {
    onFiltersChange(filters);
    onSortChange(sort);
    setOpen(false);
  };

  const resetFilters = () => {
    setFilters({});
    setSort([]);
    onFiltersChange({});
    onSortChange([]);
    setOpen(false);
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateSort = (field: string, direction: 'asc' | 'desc') => {
    const newSort = sort.filter(s => !s.includes(field));
    newSort.push(`${direction === 'desc' ? '-' : '+'}${field}`);
    setSort(newSort);
  };

  const removeSort = (field: string) => {
    setSort(prev => prev.filter(s => !s.includes(field)));
  };

  const commonFilters = [
    { field: 'userId', label: 'User ID', type: 'text' },
    { field: 'totalPointsMin', label: 'Min Total Points', type: 'number' },
    { field: 'totalPointsMax', label: 'Max Total Points', type: 'number' },
  ];

  const communitySpecificFilters = [
    { field: 'coursesCompletedMin', label: 'Min Courses Completed', type: 'number' },
    { field: 'coursesCompletedMax', label: 'Max Courses Completed', type: 'number' },
    { field: 'quizzesPassedMin', label: 'Min Quizzes Passed', type: 'number' },
    { field: 'quizzesPassedMax', label: 'Max Quizzes Passed', type: 'number' },
    { field: 'averageQuizScoreMin', label: 'Min Avg Quiz Score', type: 'number' },
    { field: 'averageQuizScoreMax', label: 'Max Avg Quiz Score', type: 'number' },
    { field: 'streakMin', label: 'Min Streak', type: 'number' },
    { field: 'streakMax', label: 'Max Streak', type: 'number' },
  ];

  const courseSpecificFilters = [
    { field: 'quizzesPassedMin', label: 'Min Quizzes Passed', type: 'number' },
    { field: 'quizzesPassedMax', label: 'Max Quizzes Passed', type: 'number' },
    { field: 'averageQuizScoreMin', label: 'Min Avg Quiz Score', type: 'number' },
    { field: 'averageQuizScoreMax', label: 'Max Avg Quiz Score', type: 'number' },
  ];

  const allFilters = type === 'community' 
    ? [...commonFilters, ...communitySpecificFilters] 
    : [...commonFilters, ...courseSpecificFilters];

  const commonSortOptions = [
    { field: 'totalPoints', label: 'Total Points' },
    { field: 'quizzesPassed', label: 'Quizzes Passed' },
    { field: 'averageQuizScore', label: 'Average Quiz Score' },
    { field: 'lastActivityAt', label: 'Last Activity Date' },
  ];

  const communitySortOptions = [
    ...commonSortOptions,
    { field: 'coursesCompleted', label: 'Courses Completed' },
    { field: 'streak', label: 'Current Streak' },
  ];

  const courseSortOptions = commonSortOptions;

  const allSortOptions = type === 'community' ? communitySortOptions : courseSortOptions;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{type === 'community' ? 'Community' : 'Course'} Leaderboard Filters</SheetTitle>
          <SheetDescription>
            Filter and sort leaderboard entries based on various criteria
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-6">
          {/* User ID */}
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              placeholder="User ID"
              value={filters.userId || ''}
              onChange={(e) => updateFilter('userId', e.target.value)}
            />
          </div>

          {/* Points Range */}
          <div className="space-y-2">
            <Label>Total Points</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.totalPointsMin || ''}
                onChange={(e) => updateFilter('totalPointsMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.totalPointsMax || ''}
                onChange={(e) => updateFilter('totalPointsMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
            </div>
          </div>

          {/* Community-specific filters */}
          {type === 'community' && (
            <>
              {/* Courses Completed Range */}
              <div className="space-y-2">
                <Label>Courses Completed</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.coursesCompletedMin || ''}
                    onChange={(e) => updateFilter('coursesCompletedMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.coursesCompletedMax || ''}
                    onChange={(e) => updateFilter('coursesCompletedMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-24"
                  />
                </div>
              </div>

              {/* Streak Range */}
              <div className="space-y-2">
                <Label>Streak</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.streakMin || ''}
                    onChange={(e) => updateFilter('streakMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.streakMax || ''}
                    onChange={(e) => updateFilter('streakMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-24"
                  />
                </div>
              </div>
            </>
          )}

          {/* Quizzes Passed Range */}
          <div className="space-y-2">
            <Label>Quizzes Passed</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.quizzesPassedMin || ''}
                onChange={(e) => updateFilter('quizzesPassedMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.quizzesPassedMax || ''}
                onChange={(e) => updateFilter('quizzesPassedMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
            </div>
          </div>

          {/* Average Quiz Score Range */}
          <div className="space-y-2">
            <Label>Average Quiz Score</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.averageQuizScoreMin || ''}
                onChange={(e) => updateFilter('averageQuizScoreMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-24"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.averageQuizScoreMax || ''}
                onChange={(e) => updateFilter('averageQuizScoreMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-24"
              />
            </div>
          </div>

          {/* Sorting Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Sort By</Label>
              {sort.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSort([])}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {allSortOptions.map(({ field, label }) => (
                <div key={field} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <div className="flex space-x-1">
                    <Button
                      variant={sort.includes(`+${field}`) ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSort(field, 'asc')}
                      className="h-8 w-8 p-0"
                    >
                      ↑
                    </Button>
                    <Button
                      variant={sort.includes(`-${field}`) ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSort(field, 'desc')}
                      className="h-8 w-8 p-0"
                    >
                      ↓
                    </Button>
                    {(sort.includes(`+${field}`) || sort.includes(`-${field}`)) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSort(field)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}