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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Filter, X } from 'lucide-react';

interface CourseFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  onSortChange: (sort: string[]) => void;
  currentFilters: Record<string, any>;
  currentSort: string[];
}

export function CourseFilters({
  onFiltersChange,
  onSortChange,
  currentFilters,
  currentSort
}: CourseFiltersProps) {
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
          <SheetTitle>Course Filters</SheetTitle>
          <SheetDescription>
            Filter and sort courses based on various criteria
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-6">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by title or description"
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          {/* Published Status */}
          <div className="space-y-2">
            <Label>Published Status</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={filters.isPublished === true}
                onCheckedChange={(checked) => updateFilter('isPublished', checked)}
              />
              <Label htmlFor="isPublished">Published courses only</Label>
            </div>
          </div>

          {/* Featured Status */}
          <div className="space-y-2">
            <Label>Featured Status</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="isFeatured"
                checked={filters.isFeatured === true}
                onCheckedChange={(checked) => updateFilter('isFeatured', checked)}
              />
              <Label htmlFor="isFeatured">Featured courses only</Label>
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select 
              value={filters.difficulty || ''} 
              onValueChange={(value) => updateFilter('difficulty', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label>Price Range</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.priceMin || ''}
                onChange={(e) => updateFilter('priceMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-24"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.priceMax || ''}
                onChange={(e) => updateFilter('priceMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-24"
              />
            </div>
          </div>

          {/* Duration Range (minutes) */}
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.durationMin || ''}
                onChange={(e) => updateFilter('durationMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.durationMax || ''}
                onChange={(e) => updateFilter('durationMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
            </div>
          </div>

          {/* Enrollment Count Range */}
          <div className="space-y-2">
            <Label>Enrollment Count</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.enrollmentCountMin || ''}
                onChange={(e) => updateFilter('enrollmentCountMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.enrollmentCountMax || ''}
                onChange={(e) => updateFilter('enrollmentCountMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
            </div>
          </div>

          {/* Community ID */}
          <div className="space-y-2">
            <Label htmlFor="communityId">Community ID</Label>
            <Input
              id="communityId"
              placeholder="Community ID"
              value={filters.communityId || ''}
              onChange={(e) => updateFilter('communityId', e.target.value)}
            />
          </div>

          {/* Instructor ID */}
          <div className="space-y-2">
            <Label htmlFor="instructorId">Instructor ID</Label>
            <Input
              id="instructorId"
              placeholder="Instructor ID"
              value={filters.instructorId || ''}
              onChange={(e) => updateFilter('instructorId', e.target.value)}
            />
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="createdAfter" className="text-xs">Created After</Label>
                <Input
                  id="createdAfter"
                  type="date"
                  value={filters.createdAfter || ''}
                  onChange={(e) => updateFilter('createdAfter', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="createdBefore" className="text-xs">Created Before</Label>
                <Input
                  id="createdBefore"
                  type="date"
                  value={filters.createdBefore || ''}
                  onChange={(e) => updateFilter('createdBefore', e.target.value)}
                />
              </div>
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
                { field: 'title', label: 'Title' },
                { field: 'price', label: 'Price' },
                { field: 'duration', label: 'Duration' },
                { field: 'difficulty', label: 'Difficulty' },
                { field: 'enrollmentCount', label: 'Enrollment Count' },
                { field: 'createdAt', label: 'Creation Date' },
                { field: 'updatedAt', label: 'Last Update' },
                { field: 'isPublished', label: 'Published Status' },
                { field: 'isFeatured', label: 'Featured Status' },
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