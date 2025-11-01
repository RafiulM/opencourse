import { db } from '../db';
import { user } from '../db/schema/auth';
import { eq, and, ne } from 'drizzle-orm';
import { AppError } from '../lib/errors';

export interface UpdateUserData {
  name?: string;
  username?: string;
  image?: string;
}

export class UserService {
  static async getUserById(userId: string) {
    try {
      const users = await db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      return users[0] || null;
    } catch (error) {
      throw new AppError('Failed to fetch user', 500, 'DATABASE_ERROR' as any);
    }
  }

  static async updateUser(userId: string, data: UpdateUserData) {
    try {
      const updatedUsers = await db
        .update(user)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(user.id, userId))
        .returning();

      if (updatedUsers.length === 0) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND' as any);
      }

      return updatedUsers[0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update user', 500, 'DATABASE_ERROR' as any);
    }
  }

  static async updateUserAvatar(userId: string, avatarUrl: string) {
    return this.updateUser(userId, { image: avatarUrl });
  }

  static async updateDisplayName(userId: string, displayName: string) {
    return this.updateUser(userId, { name: displayName });
  }

  static async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    try {
      const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(
          excludeUserId
            ? and(eq(user.username, username), ne(user.id, excludeUserId))
            : eq(user.username, username)
        )
        .limit(1);

      return existingUser.length === 0;
    } catch (error) {
      throw new AppError('Failed to check username availability', 500, 'DATABASE_ERROR' as any);
    }
  }

  static async updateUsername(userId: string, username: string) {
    // Validate username format
    if (!username || username.trim().length === 0) {
      throw new AppError('Username cannot be empty', 400, 'VALIDATION_ERROR' as any);
    }

    if (username.length < 3) {
      throw new AppError('Username must be at least 3 characters long', 400, 'VALIDATION_ERROR' as any);
    }

    if (username.length > 30) {
      throw new AppError('Username must be no more than 30 characters long', 400, 'VALIDATION_ERROR' as any);
    }

    // Username validation - allow alphanumeric characters, underscores, and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      throw new AppError('Username can only contain letters, numbers, underscores, and hyphens', 400, 'VALIDATION_ERROR' as any);
    }

    // Check if username is available
    const isAvailable = await this.isUsernameAvailable(username, userId);
    if (!isAvailable) {
      throw new AppError('Username is already taken', 409, 'DUPLICATE_RESOURCE' as any);
    }

    try {
      const updatedUsers = await db
        .update(user)
        .set({
          username: username.trim(),
          updatedAt: new Date()
        })
        .where(eq(user.id, userId))
        .returning();

      if (updatedUsers.length === 0) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND' as any);
      }

      return updatedUsers[0];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      // Handle database unique constraint violation
      if (error instanceof Error && error.message.includes('unique constraint')) {
        throw new AppError('Username is already taken', 409, 'DUPLICATE_RESOURCE' as any);
      }
      throw new AppError('Failed to update username', 500, 'DATABASE_ERROR' as any);
    }
  }
}