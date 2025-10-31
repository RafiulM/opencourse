import { Request, Response, NextFunction } from 'express';

// Request logger middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const requestId = Math.random().toString(36).substring(2, 15);

  // Add request ID to request object for tracking
  (req as any).requestId = requestId;

  // Log incoming request details
  console.log(`[${timestamp}] [REQUEST:${requestId}] ${req.method} ${req.url}`);
  console.log(`[${timestamp}] [REQUEST:${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`[${timestamp}] [REQUEST:${requestId}] Query:`, JSON.stringify(req.query, null, 2));

  // Log body only if it exists and isn't too large
  if (req.body && Object.keys(req.body).length > 0) {
    const bodySize = JSON.stringify(req.body).length;
    if (bodySize > 1000) {
      console.log(`[${timestamp}] [REQUEST:${requestId}] Body: [Large payload - ${bodySize} bytes]`);
    } else {
      console.log(`[${timestamp}] [REQUEST:${requestId}] Body:`, JSON.stringify(req.body, null, 2));
    }
  }

  console.log(`[${timestamp}] [REQUEST:${requestId}] User-Agent: ${req.get('User-Agent')}`);
  console.log(`[${timestamp}] [REQUEST:${requestId}] IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`[${timestamp}] [REQUEST:${requestId}] -------------------`);

  next();
};

// Response logger middleware
export const responseLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId;
  const timestamp = new Date().toISOString();

  // Store original res.json method
  const originalJson = res.json;

  // Override res.json to log response data
  res.json = function(data: any) {
    const responseTimestamp = new Date().toISOString();
    console.log(`[${responseTimestamp}] [RESPONSE:${requestId}] ${req.method} ${req.url} - Status: ${res.statusCode}`);

    // Log response data (but limit size for readability)
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 1000) {
      console.log(`[${responseTimestamp}] [RESPONSE:${requestId}] Response Body: [Large response - ${dataSize} bytes]`);
    } else {
      console.log(`[${responseTimestamp}] [RESPONSE:${requestId}] Response Body:`, JSON.stringify(data, null, 2));
    }
    console.log(`[${responseTimestamp}] [RESPONSE:${requestId}] -------------------`);

    // Call original json method
    return originalJson.call(this, data);
  };

  // Also log when response ends without json (like file downloads, etc.)
  res.on('finish', () => {
    const responseTimestamp = new Date().toISOString();
    if (!res.headersSent) {
      console.log(`[${responseTimestamp}] [RESPONSE:${requestId}] ${req.method} ${req.url} - Status: ${res.statusCode}`);
      console.log(`[${responseTimestamp}] [RESPONSE:${requestId}] -------------------`);
    }
  });

  next();
};

// Database operation logger
export const logDatabaseOperation = (operation: string, table: string, data?: any, error?: Error) => {
  const timestamp = new Date().toISOString();

  if (error) {
    console.error(`[${timestamp}] [DB_ERROR] Operation: ${operation}, Table: ${table}`);
    console.error(`[${timestamp}] [DB_ERROR] Error: ${error.message}`);
    console.error(`[${timestamp}] [DB_ERROR] Stack: ${error.stack}`);
    if (data) {
      console.error(`[${timestamp}] [DB_ERROR] Data:`, JSON.stringify(data, null, 2));
    }
    console.error(`[${timestamp}] [DB_ERROR] -------------------`);
  } else {
    console.log(`[${timestamp}] [DB_SUCCESS] Operation: ${operation}, Table: ${table}`);
    if (data) {
      console.log(`[${timestamp}] [DB_SUCCESS] Data:`, JSON.stringify(data, null, 2));
    }
    console.log(`[${timestamp}] [DB_SUCCESS] -------------------`);
  }
};

// API call logger for service functions
export const logApiCall = (serviceName: string, method: string, args?: any, result?: any, error?: Error) => {
  const timestamp = new Date().toISOString();
  const callId = Math.random().toString(36).substring(2, 15);

  console.log(`[${timestamp}] [API_CALL:${callId}] ${serviceName}.${method}`);
  if (args) {
    console.log(`[${timestamp}] [API_CALL:${callId}] Arguments:`, JSON.stringify(args, null, 2));
  }

  if (error) {
    console.error(`[${timestamp}] [API_CALL:${callId}] ERROR: ${error.message}`);
    console.error(`[${timestamp}] [API_CALL:${callId}] Stack: ${error.stack}`);
  } else if (result) {
    const resultSize = JSON.stringify(result).length;
    if (resultSize > 1000) {
      console.log(`[${timestamp}] [API_CALL:${callId}] Result: [Large result - ${resultSize} bytes]`);
    } else {
      console.log(`[${timestamp}] [API_CALL:${callId}] Result:`, JSON.stringify(result, null, 2));
    }
  }

  console.log(`[${timestamp}] [API_CALL:${callId}] -------------------`);
};