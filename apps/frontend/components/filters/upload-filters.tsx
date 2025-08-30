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

interface UploadFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  onSortChange: (sort: string[]) => void;
  currentFilters: Record<string, any>;
  currentSort: string[];
}

export function UploadFilters({
  onFiltersChange,
  onSortChange,
  currentFilters,
  currentSort
}: UploadFiltersProps) {
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
          <SheetTitle>Upload Filters</SheetTitle>
          <SheetDescription>
            Filter and sort uploads based on various criteria
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-6">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by file name"
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
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
                <SelectItem value="uploading">Uploading</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload Type */}
          <div className="space-y-2">
            <Label>Upload Type</Label>
            <Select 
              value={filters.uploadType || ''} 
              onValueChange={(value) => updateFilter('uploadType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="community_avatar">Community Avatar</SelectItem>
                <SelectItem value="community_banner">Community Banner</SelectItem>
                <SelectItem value="course_thumbnail">Course Thumbnail</SelectItem>
                <SelectItem value="module_thumbnail">Module Thumbnail</SelectItem>
                <SelectItem value="material_video">Material Video</SelectItem>
                <SelectItem value="material_file">Material File</SelectItem>
                <SelectItem value="material_document">Material Document</SelectItem>
                <SelectItem value="user_avatar">User Avatar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Size Range (bytes) */}
          <div className="space-y-2">
            <Label>File Size (bytes)</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                placeholder="Min"
                value={filters.fileSizeMin || ''}
                onChange={(e) => updateFilter('fileSizeMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                min="0"
                placeholder="Max"
                value={filters.fileSizeMax || ''}
                onChange={(e) => updateFilter('fileSizeMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
            </div>
          </div>

          {/* Mime Type */}
          <div className="space-y-2">
            <Label htmlFor="mimeType">Mime Type</Label>
            <Input
              id="mimeType"
              placeholder="e.g., image/png, video/mp4"
              value={filters.mimeType || ''}
              onChange={(e) => updateFilter('mimeType', e.target.value)}
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

          {/* Module ID */}
          <div className="space-y-2">
            <Label htmlFor="moduleId">Module ID</Label>
            <Input
              id="moduleId"
              placeholder="Module ID"
              value={filters.moduleId || ''}
              onChange={(e) => updateFilter('moduleId', e.target.value)}
            />
          </div>

          {/* Material ID */}
          <div className="space-y-2">
            <Label htmlFor="materialId">Material ID</Label>
            <Input
              id="materialId"
              placeholder="Material ID"
              value={filters.materialId || ''}
              onChange={(e) => updateFilter('materialId', e.target.value)}
            />
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
                { field: 'originalName', label: 'File Name' },
                { field: 'fileSize', label: 'File Size' },
                { field: 'mimeType', label: 'Mime Type' },
                { field: 'uploadType', label: 'Upload Type' },
                { field: 'status', label: 'Status' },
                { field: 'createdAt', label: 'Upload Date' },
                { field: 'updatedAt', label: 'Last Update' },
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