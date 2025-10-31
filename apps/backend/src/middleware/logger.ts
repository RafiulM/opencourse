import { Request, Response, NextFunction } from "express"

// Request logger middleware - only tracks request ID, no verbose logging
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = Math.random().toString(36).substring(2, 15)

  // Add request ID to request object for tracking (used in error logs)
  ;(req as any).requestId = requestId

  next()
}

// Response logger middleware - disabled, only errors are logged
export const responseLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Only log errors (4xx, 5xx status codes)
  const originalJson = res.json
  const requestId = (req as any).requestId

  res.json = function (data: any) {
    // Only log error responses
    if (res.statusCode >= 400) {
      const timestamp = new Date().toISOString()
      console.error(
        `[${timestamp}] [ERROR:${requestId}] ${req.method} ${req.url} - Status: ${res.statusCode}`
      )

      // Only log error details, not full payload
      if (data?.error) {
        console.error(
          `[${timestamp}] [ERROR:${requestId}] Error: ${data.error.type} - ${data.error.message}`
        )
      }
    }

    return originalJson.call(this, data)
  }

  next()
}

// Database operation logger - only logs errors
export const logDatabaseOperation = (
  operation: string,
  table: string,
  data?: any,
  error?: Error
) => {
  if (error) {
    const timestamp = new Date().toISOString()
    console.error(
      `[${timestamp}] [DB_ERROR] ${operation} on ${table}: ${error.message}`
    )
  }
  // Success operations are not logged to reduce noise
}

// API call logger for service functions - only logs errors
export const logApiCall = (
  serviceName: string,
  method: string,
  args?: any,
  result?: any,
  error?: Error
) => {
  if (error) {
    const timestamp = new Date().toISOString()
    console.error(
      `[${timestamp}] [API_ERROR] ${serviceName}.${method}: ${error.message}`
    )
  }
  // Success calls are not logged to reduce noise
}
