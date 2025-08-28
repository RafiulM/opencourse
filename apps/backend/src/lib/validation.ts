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

export const validatePaginationParams = (page?: any, pageSize?: any) => {
  const errors: string[] = [];

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