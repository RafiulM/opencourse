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

interface EnrollmentFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  onSortChange: (sort: string[]) => void;
  currentFilters: Record<string, any>;
  currentSort: string[];
}

export function EnrollmentFilters({
  onFiltersChange,
  onSortChange,
  currentFilters,
  currentSort
}: EnrollmentFiltersProps) {
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
          <SheetTitle>Enrollment Filters</SheetTitle>
          <SheetDescription>
            Filter and sort enrollments based on various criteria
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-6">
          {/* Course ID */}
          <div className="space-y-2">
            <Label htmlFor="courseId">Course ID</Label>
            <Input
              id="courseId"
              placeholder="Course ID"
              value={filters.courseId || ''}
              onChange={(e) => updateFilter('courseId', e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={filters.status || ''} 
              onValueChange={(value) => updateFilter('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress Range */}
          <div className="space-y-2">
            <Label>Progress (%)</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min (0)"
                min="0"
                max="100"
                value={filters.progressMin || ''}
                onChange={(e) => updateFilter('progressMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max (100)"
                min="0"
                max="100"
                value={filters.progressMax || ''}
                onChange={(e) => updateFilter('progressMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
            </div>
          </div>

          {/* Date Filters */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="enrolledAt">Enrolled At</Label>
              <Input
                id="enrolledAt"
                type="date"
                value={filters.enrolledAt || ''}
                onChange={(e) => updateFilter('enrolledAt', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completedAt">Completed At</Label>
              <Input
                id="completedAt"
                type="date"
                value={filters.completedAt || ''}
                onChange={(e) => updateFilter('completedAt', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastAccessedAt">Last Accessed At</Label>
              <Input
                id="lastAccessedAt"
                type="date"
                value={filters.lastAccessedAt || ''}
                onChange={(e) => updateFilter('lastAccessedAt', e.target.value)}
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
              {[
                { field: 'progress', label: 'Progress' },
                { field: 'status', label: 'Status' },
                { field: 'enrolledAt', label: 'Enrollment Date' },
                { field: 'completedAt', label: 'Completion Date' },
                { field: 'lastAccessedAt', label: 'Last Access Date' },
              ].map(({ field, label }) => (
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