import { createValidationError } from './errors';

export const validateCommunityData = (data: any) => {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name is required and must be a string');
  } else if (data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (data.name.length > 255) {
    errors.push('Name must be less than 255 characters');
  }

  if (!data.slug || typeof data.slug !== 'string') {
    errors.push('Slug is required and must be a string');
  } else if (data.slug.trim().length < 2) {
    errors.push('Slug must be at least 2 characters long');
  } else if (data.slug.length > 255) {
    errors.push('Slug must be less than 255 characters');
  } else if (!/^[a-z0-9-_]+$/.test(data.slug)) {
    errors.push('Slug can only contain lowercase letters, numbers, hyphens, and underscores');
  }

  if (data.domain && typeof data.domain === 'string') {
    if (data.domain.length > 255) {
      errors.push('Domain must be less than 255 characters');
    }
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/;
    if (!domainRegex.test(data.domain)) {
      errors.push('Domain format is invalid');
    }
  }

  if (data.description && typeof data.description === 'string' && data.description.length > 5000) {
    errors.push('Description must be less than 5000 characters');
  }

  if (data.privacy && !['public', 'private', 'invite_only'].includes(data.privacy)) {
    errors.push('Privacy must be one of: public, private, invite_only');
  }

  if (errors.length > 0) {
    throw createValidationError(errors.join(', '));
  }
};

export const validateCommunityUpdateData = (data: any) => {
  const errors: string[] = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push('Name must be a string');
    } else if (data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (data.name.length > 255) {
      errors.push('Name must be less than 255 characters');
    }
  }

  if (data.slug !== undefined) {
    if (typeof data.slug !== 'string') {
      errors.push('Slug must be a string');
    } else if (data.slug.trim().length < 2) {
      errors.push('Slug must be at least 2 characters long');
    } else if (data.slug.length > 255) {
      errors.push('Slug must be less than 255 characters');
    } else if (!/^[a-z0-9-_]+$/.test(data.slug)) {
      errors.push('Slug can only contain lowercase letters, numbers, hyphens, and underscores');
    }
  }

  if (data.domain !== undefined && data.domain !== null && typeof data.domain === 'string') {
    if (data.domain.length > 255) {
      errors.push('Domain must be less than 255 characters');
    }
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/;
    if (!domainRegex.test(data.domain)) {
      errors.push('Domain format is invalid');
    }
  }

  if (data.description !== undefined && typeof data.description === 'string' && data.description.length > 5000) {
    errors.push('Description must be less than 5000 characters');
  }

  if (data.privacy !== undefined && !['public', 'private', 'invite_only'].includes(data.privacy)) {
    errors.push('Privacy must be one of: public, private, invite_only');
  }

  if (errors.length > 0) {
    throw createValidationError(errors.join(', '));
  }
};

export const validateCommunityMemberData = (data: any) => {
  const errors: string[] = [];

  if (!data.communityId || typeof data.communityId !== 'string') {
    errors.push('Community ID is required and must be a string');
  }

  if (!data.userId || typeof data.userId !== 'string') {
    errors.push('User ID is required and must be a string');
  }

  if (data.role && !['owner', 'moderator', 'member'].includes(data.role)) {
    errors.push('Role must be one of: owner, moderator, member');
  }

  if (errors.length > 0) {
    throw createValidationError(errors.join(', '));
  }
};

export const validateAddMemberData = (data: any) => {
  const errors: string[] = [];

  if (data.role && !['owner', 'moderator', 'member'].includes(data.role)) {
    errors.push('Role must be one of: owner, moderator, member');
  }

  if (errors.length > 0) {
    throw createValidationError(errors.join(', '));
  }
};

export const validatePaginationParams = (pageOrParams?: any, pageSizeParam?: any) => {
  const errors: string[] = [];

  const isQueryObject = pageOrParams && typeof pageOrParams === 'object' && !Array.isArray(pageOrParams);
  const page = isQueryObject ? pageOrParams.page : pageOrParams;

  const pageSize = isQueryObject ? pageOrParams.pageSize : pageSizeParam;

  if (page !== undefined) {
    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  if (pageSize !== undefined) {
    const pageSizeNum = Number(pageSize);
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      errors.push('Page size must be between 1 and 100');
    }
  }

  if (errors.length > 0) {
    throw createValidationError(errors.join(', '));
  }
};

// Post validation functions
export const validateCreatePostData = (data: any) => {
  const errors: string[] = [];

  if (!data.communityId || typeof data.communityId !== 'string') {
    errors.push('Community ID is required and must be a string');
  }

  if (data.title !== undefined) {
    if (typeof data.title !== 'string') {
      errors.push('Title must be a string');
    } else if (data.title.trim().length > 255) {
      errors.push('Title must be less than 255 characters');
    }
  }

  if (data.content !== undefined) {
    if (typeof data.content !== 'string') {
      errors.push('Content must be a string');
    } else if (data.content.length > 50000) {
      errors.push('Content must be less than 50,000 characters');
    }
  }

  if (data.excerpt !== undefined) {
    if (typeof data.excerpt !== 'string') {
      errors.push('Excerpt must be a string');
    } else if (data.excerpt.length > 500) {
      errors.push('Excerpt must be less than 500 characters');
    }
  }

  if (data.postType !== undefined) {
    const validTypes = ['general', 'announcement', 'discussion', 'resource'];
    if (!validTypes.includes(data.postType)) {
      errors.push('Post type must be one of: general, announcement, discussion, resource');
    }
  }

  if (data.slug !== undefined) {
    if (typeof data.slug !== 'string') {
      errors.push('Slug must be a string');
    } else if (data.slug.length > 255) {
      errors.push('Slug must be less than 255 characters');
    } else if (!/^[a-z0-9-_]+$/.test(data.slug)) {
      errors.push('Slug can only contain lowercase letters, numbers, hyphens, and underscores');
    }
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push('Tags must be an array');
    } else {
      for (const tag of data.tags) {
        if (typeof tag !== 'string') {
          errors.push('All tags must be strings');
        } else if (tag.length > 50) {
          errors.push('Each tag must be less than 50 characters');
        }
      }
      if (data.tags.length > 10) {
        errors.push('Maximum 10 tags allowed');
      }
    }
  }

  if (data.allowComments !== undefined && typeof data.allowComments !== 'boolean') {
    errors.push('Allow comments must be a boolean');
  }

  if (data.isPublished !== undefined && typeof data.isPublished !== 'boolean') {
    errors.push('Is published must be a boolean');
  }

  if (data.attachments !== undefined) {
    if (!Array.isArray(data.attachments)) {
      errors.push('Attachments must be an array');
    } else {
      for (const attachment of data.attachments) {
        if (!attachment.uploadId || typeof attachment.uploadId !== 'string') {
          errors.push('Each attachment must have a valid uploadId');
        }

        if (attachment.type && !['image', 'video', 'file', 'audio', 'document'].includes(attachment.type)) {
          errors.push('Attachment type must be one of: image, video, file, audio, document');
        }

        if (attachment.title !== undefined && typeof attachment.title === 'string' && attachment.title.length > 255) {
          errors.push('Attachment title must be less than 255 characters');
        }

        if (attachment.description !== undefined && typeof attachment.description === 'string' && attachment.description.length > 1000) {
          errors.push('Attachment description must be less than 1,000 characters');
        }

        if (attachment.caption !== undefined && typeof attachment.caption === 'string' && attachment.caption.length > 500) {
          errors.push('Attachment caption must be less than 500 characters');
        }

        if (attachment.order !== undefined && (typeof attachment.order !== 'number' || attachment.order < 0)) {
          errors.push('Attachment order must be a non-negative number');
        }

        if (attachment.isPrimary !== undefined && typeof attachment.isPrimary !== 'boolean') {
          errors.push('Attachment isPrimary must be a boolean');
        }
      }

      if (data.attachments.length > 10) {
        errors.push('Maximum 10 attachments allowed per post');
      }
    }
  }

  if (errors.length > 0) {
    throw createValidationError(errors.join(', '));
  }
};

export const validateUpdatePostData = (data: any) => {
  const errors: string[] = [];

  if (data.title !== undefined) {
    if (typeof data.title !== 'string') {
      errors.push('Title must be a string');
    } else if (data.title.trim().length > 255) {
      errors.push('Title must be less than 255 characters');
    }
  }

  if (data.content !== undefined) {
    if (typeof data.content !== 'string') {
      errors.push('Content must be a string');
    } else if (data.content.length > 50000) {
      errors.push('Content must be less than 50,000 characters');
    }
  }

  if (data.excerpt !== undefined) {
    if (typeof data.excerpt !== 'string') {
      errors.push('Excerpt must be a string');
    } else if (data.excerpt.length > 500) {
      errors.push('Excerpt must be less than 500 characters');
    }
  }

  if (data.slug !== undefined) {
    if (typeof data.slug !== 'string') {
      errors.push('Slug must be a string');
    } else if (data.slug.length > 255) {
      errors.push('Slug must be less than 255 characters');
    } else if (!/^[a-z0-9-_]+$/.test(data.slug)) {
      errors.push('Slug can only contain lowercase letters, numbers, hyphens, and underscores');
    }
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push('Tags must be an array');
    } else {
      for (const tag of data.tags) {
        if (typeof tag !== 'string') {
          errors.push('All tags must be strings');
        } else if (tag.length > 50) {
          errors.push('Each tag must be less than 50 characters');
        }
      }
      if (data.tags.length > 10) {
        errors.push('Maximum 10 tags allowed');
      }
    }
  }

  if (data.allowComments !== undefined && typeof data.allowComments !== 'boolean') {
    errors.push('Allow comments must be a boolean');
  }

  if (data.isPublished !== undefined && typeof data.isPublished !== 'boolean') {
    errors.push('Is published must be a boolean');
  }

  if (errors.length > 0) {
    throw createValidationError(errors.join(', '));
  }
};

// Comment validation functions
export const validateCreateCommentData = (data: any) => {
  const errors: string[] = [];

  if (!data.content || typeof data.content !== 'string') {
    errors.push('Content is required and must be a string');
  } else if (data.content.trim().length < 1) {
    errors.push('Content cannot be empty');
  } else if (data.content.length > 2000) {
    errors.push('Content must be less than 2,000 characters');
  }

  if (data.parentId !== undefined && typeof data.parentId !== 'string') {
    errors.push('Parent ID must be a string');
  }

  if (errors.length > 0) {
    throw createValidationError(errors.join(', '));
  }
};

export const validateUpdateCommentData = (data: any) => {
  const errors: string[] = [];

  if (!data.content || typeof data.content !== 'string') {
    errors.push('Content is required and must be a string');
  } else if (data.content.trim().length < 1) {
    errors.push('Content cannot be empty');
  } else if (data.content.length > 2000) {
    errors.push('Content must be less than 2,000 characters');
  }

  if (errors.length > 0) {
    throw createValidationError(errors.join(', '));
  }
};

// Query validation functions for posts and comments
export const validatePostQueryOptions = (query: any) => {
  const errors: string[] = [];

  if (query.authorId && typeof query.authorId !== 'string') {
    errors.push('Author ID must be a string');
  }

  if (query.communityId && typeof query.communityId !== 'string') {
    errors.push('Community ID must be a string');
  }

  if (query.postType && !['general', 'announcement', 'discussion', 'resource'].includes(query.postType)) {
    errors.push('Post type must be one of: general, announcement, discussion, resource');
  }

  if (query.isPinned !== undefined && query.isPinned !== 'true' && query.isPinned !== 'false') {
    errors.push('Is pinned must be true or false');
  }

  if (query.isFeatured !== undefined && query.isFeatured !== 'true' && query.isFeatured !== 'false') {
    errors.push('Is featured must be true or false');
  }

  if (query.isPublished !== undefined && query.isPublished !== 'true' && query.isPublished !== 'false') {
    errors.push('Is published must be true or false');
  }

  if (query.tags && typeof query.tags === 'string') {
    const tags = query.tags.split(',').map((t: string) => t.trim());
    if (tags.length > 10) {
      errors.push('Maximum 10 tags allowed for filtering');
    }
  }

  if (errors.length > 0) {
    throw createValidationError(errors.join(', '));
  }
};

export const validateCommentQueryOptions = (query: any) => {
  const errors: string[] = [];

  if (query.authorId && typeof query.authorId !== 'string') {
    errors.push('Author ID must be a string');
  }

  if (query.parentId && typeof query.parentId !== 'string') {
    errors.push('Parent ID must be a string');
  }

  if (query.level !== undefined) {
    const level = parseInt(query.level);
    if (isNaN(level) || level < 0 || level > 10) {
      errors.push('Level must be a number between 0 and 10');
    }
  }

  if (query.isPinned !== undefined && query.isPinned !== 'true' && query.isPinned !== 'false') {
    errors.push('Is pinned must be true or false');
  }

  if (query.isDeleted !== undefined && query.isDeleted !== 'true' && query.isDeleted !== 'false') {
    errors.push('Is deleted must be true or false');
  }

  if (query.isReported !== undefined && query.isReported !== 'true' && query.isReported !== 'false') {
    errors.push('Is reported must be true or false');
  }

  if (errors.length > 0) {
    throw createValidationError(errors.join(', '));
  }
};

// Advanced query validation and parsing
export interface QueryFilters {
  [key: string]: any;
}

export interface QuerySort {
  field: string;
  order: 'asc' | 'desc';
}

export interface QueryOptions {
  page: number;
  pageSize: number;
  filters: QueryFilters;
  search?: string;
  sort: QuerySort[];
}

export const parseQueryOptions = (
  query: any, 
  allowedFilters: string[] = [],
  allowedSortFields: string[] = [],
  defaultSort: QuerySort = { field: 'createdAt', order: 'desc' }
): QueryOptions => {
  const errors: string[] = [];

  // Parse pagination
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;

  if (page < 1) {
    errors.push('Page must be a positive integer');
  }

  if (pageSize < 1 || pageSize > 100) {
    errors.push('Page size must be between 1 and 100');
  }

  // Parse filters
  const filters: QueryFilters = {};
  for (const key of allowedFilters) {
    if (query[key] !== undefined && query[key] !== null && query[key] !== '') {
      // Handle different filter types
      if (key.endsWith('Id') || key.endsWith('_id')) {
        // UUID fields
        filters[key] = String(query[key]);
      } else if (key.includes('Date') || key.endsWith('At')) {
        // Date fields - support date range
        const dateValue = query[key];
        if (typeof dateValue === 'string') {
          if (dateValue.includes('|')) {
            // Date range: "2023-01-01|2023-12-31"
            const [startDate, endDate] = dateValue.split('|');
            filters[key] = { start: new Date(startDate), end: new Date(endDate) };
          } else {
            filters[key] = new Date(dateValue);
          }
        }
      } else if (key === 'isPublished' || key === 'isFeatured' || key === 'isVerified') {
        // Boolean fields
        filters[key] = query[key] === 'true' || query[key] === true;
      } else if (key === 'privacy' || key === 'status' || key === 'role' || key === 'difficulty') {
        // Enum fields
        filters[key] = String(query[key]);
      } else if (key === 'tags' || key === 'categories') {
        // Array fields
        const value = query[key];
        if (typeof value === 'string') {
          filters[key] = value.split(',').map(v => v.trim());
        } else if (Array.isArray(value)) {
          filters[key] = value;
        }
      } else {
        // String fields
        filters[key] = String(query[key]);
      }
    }
  }

  // Parse search
  const search = query.search ? String(query.search).trim() : undefined;
  if (search && search.length < 2) {
    errors.push('Search query must be at least 2 characters long');
  }

  // Parse sorting
  let sort: QuerySort[] = [];
  if (query.sort) {
    const sortString = String(query.sort);
    const sortFields = sortString.split(',');
    
    for (const field of sortFields) {
      const trimmedField = field.trim();
      let sortField = trimmedField;
      let sortOrder: 'asc' | 'desc' = 'asc';

      if (trimmedField.startsWith('-')) {
        sortField = trimmedField.substring(1);
        sortOrder = 'desc';
      } else if (trimmedField.startsWith('+')) {
        sortField = trimmedField.substring(1);
      }

      if (!allowedSortFields.includes(sortField)) {
        errors.push(`Invalid sort field: ${sortField}. Allowed fields: ${allowedSortFields.join(', ')}`);
      } else {
        sort.push({ field: sortField, order: sortOrder });
      }
    }
  }

  // Use default sort if none provided
  if (sort.length === 0) {
    sort = [defaultSort];
  }

  if (errors.length > 0) {
    throw createValidationError(errors.join(', '));
  }

  return {
    page,
    pageSize,
    filters,
    search,
    sort
  };
};

// Specific validation functions for different entities

export const validateCommunityQueryOptions = (query: any): QueryOptions => {
  const allowedFilters = [
    'privacy', 'createdBy', 'isVerified', 'memberCount', 'createdAt', 'updatedAt'
  ];
  
  const allowedSortFields = [
    'name', 'slug', 'memberCount', 'createdAt', 'updatedAt', 'isVerified'
  ];

  return parseQueryOptions(query, allowedFilters, allowedSortFields);
};

export const validateCourseQueryOptions = (query: any): QueryOptions => {
  const allowedFilters = [
    'communityId', 'instructorId', 'isPublished', 'isFeatured', 'difficulty', 
    'price', 'duration', 'enrollmentCount', 'createdAt', 'updatedAt'
  ];
  
  const allowedSortFields = [
    'title', 'price', 'duration', 'difficulty', 'enrollmentCount', 
    'createdAt', 'updatedAt', 'isPublished', 'isFeatured'
  ];

  return parseQueryOptions(query, allowedFilters, allowedSortFields);
};

export const validateEnrollmentQueryOptions = (query: any): QueryOptions => {
  const allowedFilters = [
    'userId', 'courseId', 'status', 'progress', 'enrolledAt', 'completedAt'
  ];
  
  const allowedSortFields = [
    'progress', 'status', 'enrolledAt', 'completedAt', 'lastAccessedAt'
  ];

  return parseQueryOptions(query, allowedFilters, allowedSortFields, { field: 'enrolledAt', order: 'desc' });
};

export const validateScoreboardQueryOptions = (query: any): QueryOptions => {
  const allowedFilters = [
    'userId', 'communityId', 'courseId', 'totalPoints', 'level', 'createdAt', 'updatedAt'
  ];
  
  const allowedSortFields = [
    'totalPoints', 'communityPoints', 'coursePoints', 'level', 'createdAt', 'updatedAt'
  ];

  return parseQueryOptions(query, allowedFilters, allowedSortFields, { field: 'totalPoints', order: 'desc' });
};

export const validateUploadQueryOptions = (query: any): QueryOptions => {
  const allowedFilters = [
    'uploadType', 'status', 'uploadedBy', 'communityId', 'courseId', 
    'moduleId', 'materialId', 'mimeType', 'createdAt', 'fileSize'
  ];
  
  const allowedSortFields = [
    'originalName', 'fileSize', 'uploadType', 'status', 'createdAt', 'updatedAt'
  ];

  return parseQueryOptions(query, allowedFilters, allowedSortFields);
};
