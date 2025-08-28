export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly type: ErrorType;
  public readonly details?: Record<string, any>;

  constructor(
    message: string, 
    statusCode: number, 
    type: ErrorType, 
    details?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    this.name = 'AppError';
  }
}

export const createValidationError = (message: string, field?: string) => {
  return new AppError(
    message, 
    400, 
    ErrorType.VALIDATION_ERROR,
    field ? { field } : undefined
  );
};

export const createDuplicateError = (resource: string, field: string, value: string) => {
  return new AppError(
    `${resource} with ${field} '${value}' already exists`,
    409,
    ErrorType.DUPLICATE_RESOURCE,
    { resource, field, value }
  );
};

export const createNotFoundError = (resource: string, identifier?: string) => {
  const message = identifier 
    ? `${resource} with identifier '${identifier}' not found`
    : `${resource} not found`;
  
  return new AppError(
    message,
    404,
    ErrorType.RESOURCE_NOT_FOUND,
    { resource, identifier }
  );
};

export const createDatabaseError = (message: string, originalError?: Error) => {
  return new AppError(
    message,
    500,
    ErrorType.DATABASE_ERROR,
    { originalError: originalError?.message }
  );
};

export const createUnauthorizedError = (message = 'Unauthorized access') => {
  return new AppError(message, 401, ErrorType.UNAUTHORIZED);
};

export const createForbiddenError = (message = 'Access forbidden') => {
  return new AppError(message, 403, ErrorType.FORBIDDEN);
};

export const createInternalError = (message = 'Internal server error') => {
  return new AppError(message, 500, ErrorType.INTERNAL_ERROR);
};

export interface ErrorResponse {
  error: {
    type: ErrorType;
    message: string;
    statusCode: number;
    details?: Record<string, any>;
    timestamp: string;
  };
}

export const formatErrorResponse = (error: AppError): ErrorResponse => {
  return {
    error: {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: new Date().toISOString()
    }
  };
};

export const handleDatabaseError = (error: any): AppError => {
  // PostgreSQL error codes
  if (error.code === '23505') { // unique_violation
    const detail = error.detail || '';
    
    // Extract field and value from constraint violation
    if (detail.includes('slug')) {
      const match = detail.match(/\(slug\)=\(([^)]+)\)/);
      const value = match ? match[1] : 'unknown';
      return createDuplicateError('Community', 'slug', value);
    }
    
    if (detail.includes('domain')) {
      const match = detail.match(/\(domain\)=\(([^)]+)\)/);
      const value = match ? match[1] : 'unknown';
      return createDuplicateError('Community', 'domain', value);
    }

    if (detail.includes('community_members_unique')) {
      return createDuplicateError('Community member', 'user', 'user');
    }
    
    return new AppError('Resource already exists', 409, ErrorType.DUPLICATE_RESOURCE);
  }
  
  if (error.code === '23503') { // foreign_key_violation
    return createValidationError('Referenced resource does not exist');
  }
  
  if (error.code === '23502') { // not_null_violation
    const column = error.column || 'unknown field';
    return createValidationError(`${column} is required`);
  }
  
  if (error.code === '23514') { // check_violation
    return createValidationError('Invalid data provided');
  }

  // Handle string length violations
  if (error.code === '22001') { // string_data_right_truncation
    return createValidationError('Input data too long for field');
  }

  // Generic database error
  return createDatabaseError('Database operation failed', error);
};