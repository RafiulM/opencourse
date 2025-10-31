import { Request, Response, NextFunction } from "express"
import {
  AppError,
  formatErrorResponse,
  handleDatabaseError,
  createInternalError,
} from "../lib/errors"
import { logDatabaseOperation, logApiCall } from "./logger"

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = (req as any).requestId
  const timestamp = new Date().toISOString()

  // Simplified error logging - only essential information
  console.error(
    `[${timestamp}] [ERROR:${requestId}] ${req.method} ${req.url} - ${error.name}: ${error.message}`
  )

  // Log user information if available
  if ((req as any).user) {
    console.error(
      `[${timestamp}] [ERROR:${requestId}] User: ${(req as any).user.id}`
    )
  }

  // Log stack trace for non-validation errors
  if (!(error instanceof AppError) || error.statusCode >= 500) {
    console.error(`[${timestamp}] [ERROR:${requestId}] Stack: ${error.stack}`)
  }

  // Log database-specific errors
  if ("code" in error && "severity" in error) {
    const dbError = error as any
    console.error(
      `[${timestamp}] [ERROR:${requestId}] DB Error [${dbError.code}]: ${dbError.message || dbError.detail || "Unknown database error"}`
    )
    if (dbError.table) {
      console.error(
        `[${timestamp}] [ERROR:${requestId}] Table: ${dbError.table}${dbError.column ? `, Column: ${dbError.column}` : ""}`
      )
    }
  }

  // Handle known AppError instances
  if (error instanceof AppError) {
    const errorResponse = formatErrorResponse(error)
    return res.status(error.statusCode).json(errorResponse)
  }

  // Handle database errors (PostgreSQL errors have code and severity properties)
  if ("code" in error && "severity" in error) {
    const dbError = handleDatabaseError(error)
    const errorResponse = formatErrorResponse(dbError)
    return res.status(dbError.statusCode).json(errorResponse)
  }

  // Handle validation errors from libraries
  if (error.name === "ValidationError") {
    const validationError = new AppError(
      error.message,
      400,
      "VALIDATION_ERROR" as any
    )
    const errorResponse = formatErrorResponse(validationError)
    return res.status(400).json(errorResponse)
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && "body" in error) {
    const parseError = new AppError(
      "Invalid JSON in request body",
      400,
      "VALIDATION_ERROR" as any
    )
    const errorResponse = formatErrorResponse(parseError)
    return res.status(400).json(errorResponse)
  }

  // Handle any other unknown errors
  const internalError = createInternalError("An unexpected error occurred")
  const errorResponse = formatErrorResponse(internalError)
  res.status(500).json(errorResponse)
}

export const notFoundHandler = (req: Request, res: Response) => {
  const notFoundError = new AppError(
    `Route ${req.method} ${req.path} not found`,
    404,
    "RESOURCE_NOT_FOUND" as any
  )
  const errorResponse = formatErrorResponse(notFoundError)
  res.status(404).json(errorResponse)
}
