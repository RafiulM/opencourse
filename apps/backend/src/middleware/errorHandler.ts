import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse, handleDatabaseError, createInternalError } from '../lib/errors';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error for debugging
  console.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Handle known AppError instances
  if (error instanceof AppError) {
    const errorResponse = formatErrorResponse(error);
    return res.status(error.statusCode).json(errorResponse);
  }

  // Handle database errors (PostgreSQL errors have code and severity properties)
  if ('code' in error && 'severity' in error) {
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    return res.status(dbError.statusCode).json(errorResponse);
  }

  // Handle validation errors from libraries
  if (error.name === 'ValidationError') {
    const validationError = new AppError(
      error.message,
      400,
      'VALIDATION_ERROR' as any
    );
    const errorResponse = formatErrorResponse(validationError);
    return res.status(400).json(errorResponse);
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    const parseError = new AppError(
      'Invalid JSON in request body',
      400,
      'VALIDATION_ERROR' as any
    );
    const errorResponse = formatErrorResponse(parseError);
    return res.status(400).json(errorResponse);
  }

  // Handle any other unknown errors
  const internalError = createInternalError('An unexpected error occurred');
  const errorResponse = formatErrorResponse(internalError);
  res.status(500).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const notFoundError = new AppError(
    `Route ${req.method} ${req.path} not found`,
    404,
    'RESOURCE_NOT_FOUND' as any
  );
  const errorResponse = formatErrorResponse(notFoundError);
  res.status(404).json(errorResponse);
};