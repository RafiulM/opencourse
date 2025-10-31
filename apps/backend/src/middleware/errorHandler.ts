import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse, handleDatabaseError, createInternalError } from '../lib/errors';
import { logDatabaseOperation, logApiCall } from './logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = (req as any).requestId;
  const timestamp = new Date().toISOString();

  // Enhanced error logging
  console.error(`[${timestamp}] [ERROR:${requestId}] ===================`);
  console.error(`[${timestamp}] [ERROR:${requestId}] ERROR OCCURRED`);
  console.error(`[${timestamp}] [ERROR:${requestId}] Request ID: ${requestId}`);
  console.error(`[${timestamp}] [ERROR:${requestId}] Method: ${req.method}`);
  console.error(`[${timestamp}] [ERROR:${requestId}] URL: ${req.url}`);
  console.error(`[${timestamp}] [ERROR:${requestId}] User-Agent: ${req.get('User-Agent')}`);
  console.error(`[${timestamp}] [ERROR:${requestId}] IP: ${req.ip || req.connection.remoteAddress}`);

  // Log user information if available
  if ((req as any).user) {
    console.error(`[${timestamp}] [ERROR:${requestId}] User ID: ${(req as any).user.id}`);
    console.error(`[${timestamp}] [ERROR:${requestId}] User Email: ${(req as any).user.email}`);
  }

  console.error(`[${timestamp}] [ERROR:${requestId}] Error Message: ${error.message}`);
  console.error(`[${timestamp}] [ERROR:${requestId}] Error Name: ${error.name}`);
  console.error(`[${timestamp}] [ERROR:${requestId}] Error Stack: ${error.stack}`);

  // Log request details
  console.error(`[${timestamp}] [ERROR:${requestId}] Request Params:`, JSON.stringify(req.params, null, 2));
  console.error(`[${timestamp}] [ERROR:${requestId}] Request Query:`, JSON.stringify(req.query, null, 2));

  // Log body only if it exists and isn't too large
  if (req.body && Object.keys(req.body).length > 0) {
    const bodySize = JSON.stringify(req.body).length;
    if (bodySize > 1000) {
      console.error(`[${timestamp}] [ERROR:${requestId}] Request Body: [Large payload - ${bodySize} bytes]`);
    } else {
      console.error(`[${timestamp}] [ERROR:${requestId}] Request Body:`, JSON.stringify(req.body, null, 2));
    }
  }

  // Log headers
  console.error(`[${timestamp}] [ERROR:${requestId}] Request Headers:`, JSON.stringify(req.headers, null, 2));

  // Log database-specific errors
  if ('code' in error && 'severity' in error) {
    const dbError = error as any;
    console.error(`[${timestamp}] [ERROR:${requestId}] Database Error Code: ${dbError.code}`);
    console.error(`[${timestamp}] [ERROR:${requestId}] Database Error Severity: ${dbError.severity}`);
    console.error(`[${timestamp}] [ERROR:${requestId}] Database Error Detail: ${dbError.detail}`);
    console.error(`[${timestamp}] [ERROR:${requestId}] Database Error Schema: ${dbError.schema}`);
    console.error(`[${timestamp}] [ERROR:${requestId}] Database Error Table: ${dbError.table}`);
    console.error(`[${timestamp}] [ERROR:${requestId}] Database Error Column: ${dbError.column}`);
    console.error(`[${timestamp}] [ERROR:${requestId}] Database Error Constraint: ${dbError.constraint}`);

    logDatabaseOperation('UNKNOWN', dbError.table || 'unknown', null, error);
  }

  console.error(`[${timestamp}] [ERROR:${requestId}] ===================`);

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