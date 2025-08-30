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

interface CommunityFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  onSortChange: (sort: string[]) => void;
  currentFilters: Record<string, any>;
  currentSort: string[];
}

export function CommunityFilters({
  onFiltersChange,
  onSortChange,
  currentFilters,
  currentSort
}: CommunityFiltersProps) {
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
          <SheetTitle>Community Filters</SheetTitle>
          <SheetDescription>
            Filter and sort communities based on various criteria
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-6">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name or description"
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          {/* Privacy */}
          <div className="space-y-2">
            <Label>Privacy</Label>
            <Select 
              value={filters.privacy || ''} 
              onValueChange={(value) => updateFilter('privacy', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select privacy level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="invite_only">Invite Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Verification Status */}
          <div className="space-y-2">
            <Label>Verification Status</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="isVerified"
                checked={filters.isVerified === true}
                onCheckedChange={(checked) => updateFilter('isVerified', checked)}
              />
              <Label htmlFor="isVerified">Verified communities only</Label>
            </div>
          </div>

          {/* Member Count Range */}
          <div className="space-y-2">
            <Label>Member Count</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.memberCountMin || ''}
                onChange={(e) => updateFilter('memberCountMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.memberCountMax || ''}
                onChange={(e) => updateFilter('memberCountMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24"
              />
            </div>
          </div>

          {/* Created By */}
          <div className="space-y-2">
            <Label htmlFor="createdBy">Created By</Label>
            <Input
              id="createdBy"
              placeholder="User ID"
              value={filters.createdBy || ''}
              onChange={(e) => updateFilter('createdBy', e.target.value)}
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
                { field: 'name', label: 'Name' },
                { field: 'slug', label: 'Slug' },
                { field: 'memberCount', label: 'Member Count' },
                { field: 'createdAt', label: 'Creation Date' },
                { field: 'updatedAt', label: 'Last Update' },
                { field: 'isVerified', label: 'Verification Status' },
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