import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { createUnauthorizedError, formatErrorResponse } from '../lib/errors';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        image?: string;
        createdAt: Date;
        updatedAt: Date;
      };
      session?: {
        id: string;
        expiresAt: Date;
        token: string;
        createdAt: Date;
        updatedAt: Date;
        ipAddress?: string;
        userAgent?: string;
        userId: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Convert Node.js headers to Web API Headers format
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value[0] : value);
      }
    });

    // Get the session from better-auth using the request
    const session = await auth.api.getSession({
      headers
    });

    if (!session || !session.user) {
      const unauthorizedError = createUnauthorizedError('Authentication required');
      const errorResponse = formatErrorResponse(unauthorizedError);
      return res.status(401).json(errorResponse);
    }

    // Add user and session to request object
    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      image: session.user.image,
      createdAt: session.user.createdAt,
      updatedAt: session.user.updatedAt
    };

    req.session = {
      id: session.session.id,
      expiresAt: session.session.expiresAt,
      token: session.session.token,
      createdAt: session.session.createdAt,
      updatedAt: session.session.updatedAt,
      ipAddress: session.session.ipAddress,
      userAgent: session.session.userAgent,
      userId: session.session.userId
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    const unauthorizedError = createUnauthorizedError('Invalid or expired session');
    const errorResponse = formatErrorResponse(unauthorizedError);
    return res.status(401).json(errorResponse);
  }
};

// Optional authentication - adds user to request if authenticated, but doesn't require it
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Convert Node.js headers to Web API Headers format
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value[0] : value);
      }
    });

    const session = await auth.api.getSession({
      headers
    });

    if (session && session.user) {
      req.user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        image: session.user.image,
        createdAt: session.user.createdAt,
        updatedAt: session.user.updatedAt
      };

      req.session = {
        id: session.session.id,
        expiresAt: session.session.expiresAt,
        token: session.session.token,
        createdAt: session.session.createdAt,
        updatedAt: session.session.updatedAt,
        ipAddress: session.session.ipAddress,
        userAgent: session.session.userAgent,
        userId: session.session.userId
      };
    }

    next();
  } catch (error) {
    // For optional auth, continue even if there's an error
    next();
  }
};

// Middleware to check if user has specific roles
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const unauthorizedError = createUnauthorizedError('Authentication required');
      const errorResponse = formatErrorResponse(unauthorizedError);
      return res.status(401).json(errorResponse);
    }

    // For now, we don't have role checking implemented in the user schema
    // This is a placeholder for future role-based access control
    // TODO: Add role field to user schema and implement role checking
    
    next();
  };
};

// Middleware to check if user owns the resource or is admin
export const requireOwnership = (getResourceUserId: (req: Request) => string | Promise<string>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const unauthorizedError = createUnauthorizedError('Authentication required');
      const errorResponse = formatErrorResponse(unauthorizedError);
      return res.status(401).json(errorResponse);
    }

    try {
      const resourceUserId = await getResourceUserId(req);
      
      if (req.user.id !== resourceUserId) {
        const forbiddenError = createUnauthorizedError('Access forbidden - insufficient permissions');
        const errorResponse = formatErrorResponse(forbiddenError);
        return res.status(403).json(errorResponse);
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      const errorResponse = formatErrorResponse(
        createUnauthorizedError('Error checking resource ownership')
      );
      return res.status(500).json(errorResponse);
    }
  };
};