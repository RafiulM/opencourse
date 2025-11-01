import { Router, Request, Response } from 'express';
import { UserService } from '../services/users';
import { AppError, formatErrorResponse, handleDatabaseError } from '../lib/errors';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userProfile = await UserService.getUserById(req.user!.id);

    if (!userProfile) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND' as any);
    }

    res.json({
      success: true,
      data: userProfile,
      message: 'User profile retrieved successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }

    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Display name
 *                 minLength: 1
 *                 maxLength: 100
 *               image:
 *                 type: string
 *                 description: Avatar URL
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, image } = req.body;

    // Validate input
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw new AppError('Name must be a non-empty string', 400, 'INVALID_INPUT' as any);
      }
      if (name.length > 100) {
        throw new AppError('Name must be less than 100 characters', 400, 'INVALID_INPUT' as any);
      }
    }

    if (image !== undefined && typeof image !== 'string') {
      throw new AppError('Image must be a string URL', 400, 'INVALID_INPUT' as any);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (image !== undefined) updateData.image = image;

    const updatedUser = await UserService.updateUser(req.user!.id, updateData);

    res.json({
      success: true,
      data: updatedUser,
      message: 'User profile updated successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }

    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/users/avatar:
 *   put:
 *     summary: Update user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatarUrl:
 *                 type: string
 *                 description: Avatar URL
 *             required:
 *               - avatarUrl
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *       400:
 *         description: Invalid avatar URL
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/avatar', authenticate, async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      throw new AppError('Avatar URL is required and must be a string', 400, 'INVALID_INPUT' as any);
    }

    const updatedUser = await UserService.updateUserAvatar(req.user!.id, avatarUrl);

    res.json({
      success: true,
      data: updatedUser,
      message: 'Avatar updated successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }

    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/users/username:
 *   put:
 *     summary: Update username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: New username (3-30 characters, alphanumeric + underscores + hyphens)
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: '^[a-zA-Z0-9_-]+$'
 *             required:
 *               - username
 *     responses:
 *       200:
 *         description: Username updated successfully
 *       400:
 *         description: Invalid username format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       409:
 *         description: Username already taken
 *       500:
 *         description: Internal server error
 */
router.put('/username', authenticate, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      throw new AppError('Username is required and must be a string', 400, 'INVALID_INPUT' as any);
    }

    const updatedUser = await UserService.updateUsername(req.user!.id, username);

    res.json({
      success: true,
      data: updatedUser,
      message: 'Username updated successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }

    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/users/username/check-availability:
 *   get:
 *     summary: Check if username is available
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *           description: Username to check
 *     responses:
 *       200:
 *         description: Username availability checked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                     username:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid username parameter
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/username/check-availability', authenticate, async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      throw new AppError('Username parameter is required', 400, 'INVALID_INPUT' as any);
    }

    const available = await UserService.isUsernameAvailable(username, req.user!.id);

    res.json({
      success: true,
      data: {
        available,
        username
      },
      message: available ? 'Username is available' : 'Username is not available'
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }

    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/users/validate-username:
 *   post:
 *     summary: Validate username format and availability
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username to validate
 *             required:
 *               - username
 *     responses:
 *       200:
 *         description: Username validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                     isAvailable:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     username:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid username format
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/validate-username', authenticate, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      throw new AppError('Username is required', 400, 'INVALID_INPUT' as any);
    }

    // Basic format validation
    if (username.length < 3) {
      return res.json({
        success: true,
        data: {
          isValid: false,
          isAvailable: false,
          message: 'Username must be at least 3 characters long',
          username
        }
      });
    }

    if (username.length > 30) {
      return res.json({
        success: true,
        data: {
          isValid: false,
          isAvailable: false,
          message: 'Username must be no more than 30 characters long',
          username
        }
      });
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return res.json({
        success: true,
        data: {
          isValid: false,
          isAvailable: false,
          message: 'Username can only contain letters, numbers, underscores, and hyphens',
          username
        }
      });
    }

    // Check availability (only if format is valid)
    const isAvailable = await UserService.isUsernameAvailable(username, req.user!.id);

    const responseMessage = isAvailable ? 'Username is available' : 'Username is not available';

    res.json({
      success: true,
      data: {
        isValid: true,
        isAvailable,
        message: responseMessage,
        username
      },
      message: responseMessage
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }

    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

export default router;