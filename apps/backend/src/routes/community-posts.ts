import { Router, Request, Response } from 'express';
import { PostService } from '../services/posts';
import { AppError, formatErrorResponse, handleDatabaseError } from '../lib/errors';
import {
  validateCreatePostData,
  validatePaginationParams,
  validatePostQueryOptions
} from '../lib/validation';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

// Community-specific Post Routes

/**
 * @swagger
 * /api/communities/{communityId}/posts:
 *   post:
 *     summary: Create new post in community
 *     tags: [Community Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Community ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [communityId]
 *             properties:
 *               communityId:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               postType:
 *                 type: string
 *                 enum: [general, announcement, discussion, resource]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               allowComments:
 *                 type: boolean
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     uploadId:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [image, video, file, audio, document]
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     caption:
 *                       type: string
 *                     order:
 *                       type: integer
 *                     isPrimary:
 *                       type: boolean
 *               isPublished:
 *                 type: boolean
 *               slug:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: User must be a member of the community
 *       500:
 *         description: Internal server error
 */
router.post('/:communityId/posts', authenticate, async (req, res) => {
  try {
    const { communityId } = req.params;
    validateCreatePostData({ ...req.body, communityId });

    const postData = {
      ...req.body,
      communityId // Ensure communityId from path is used
    };

    const post = await PostService.createPost(req.user!.id, communityId, postData);
    res.status(201).json({
      success: true,
      data: post,
      message: 'Post created successfully'
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
 * /api/communities/{communityId}/posts:
 *   get:
 *     summary: Get community posts
 *     tags: [Community Posts]
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Community ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Filter by author ID
 *       - in: query
 *         name: postType
 *         schema:
 *           type: string
 *           enum: [general, announcement, discussion, resource]
 *         description: Filter by post type
 *       - in: query
 *         name: isPinned
 *         schema:
 *           type: boolean
 *         description: Filter by pinned status
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, content, or excerpt
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt:desc
 *         description: Sort field and order (field:order)
 *     responses:
 *       200:
 *         description: Community posts retrieved successfully
 *       404:
 *         description: Community not found
 *       500:
 *         description: Internal server error
 */
router.get('/:communityId/posts', async (req, res) => {
  try {
    const { communityId } = req.params;
    validatePaginationParams(req.query);
    validatePostQueryOptions(req.query);

    const options = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      filters: {
        communityId,
        authorId: req.query.authorId as string,
        postType: req.query.postType as string,
        isPinned: req.query.isPinned === 'true' ? true : req.query.isPinned === 'false' ? false : undefined,
        isFeatured: req.query.isFeatured === 'true' ? true : req.query.isFeatured === 'false' ? false : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',').map(t => t.trim()) : undefined,
      },
      search: req.query.search as string,
      sort: req.query.sort ?
        (req.query.sort as string).split(',').map((s: string) => {
          const [field, order] = s.split(':');
          return { field, order: order as 'asc' | 'desc' };
        }) :
        [{ field: 'createdAt', order: 'desc' as const }]
    };

    const result = await PostService.getCommunityPosts(communityId, options);
    res.json({
      success: true,
      data: result,
      message: 'Community posts retrieved successfully'
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
 * /api/communities/{communityId}/posts/featured:
 *   get:
 *     summary: Get featured community posts
 *     tags: [Community Posts]
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Community ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Featured posts retrieved successfully
 *       404:
 *         description: Community not found
 *       500:
 *         description: Internal server error
 */
router.get('/:communityId/posts/featured', async (req, res) => {
  try {
    const { communityId } = req.params;
    validatePaginationParams(req.query);

    const options = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      filters: {
        communityId,
        isFeatured: true,
        isPublished: true
      },
      sort: [{ field: 'createdAt', order: 'desc' as const }]
    };

    const result = await PostService.getCommunityPosts(communityId, options);
    res.json({
      success: true,
      data: result,
      message: 'Featured posts retrieved successfully'
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
 * /api/communities/{communityId}/posts/pinned:
 *   get:
 *     summary: Get pinned community posts
 *     tags: [Community Posts]
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Community ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Pinned posts retrieved successfully
 *       404:
 *         description: Community not found
 *       500:
 *         description: Internal server error
 */
router.get('/:communityId/posts/pinned', async (req, res) => {
  try {
    const { communityId } = req.params;
    validatePaginationParams(req.query);

    const options = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      filters: {
        communityId,
        isPinned: true,
        isPublished: true
      },
      sort: [{ field: 'createdAt', order: 'desc' as const }]
    };

    const result = await PostService.getCommunityPosts(communityId, options);
    res.json({
      success: true,
      data: result,
      message: 'Pinned posts retrieved successfully'
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
 * /api/communities/{communityId}/posts/announcements:
 *   get:
 *     summary: Get community announcements
 *     tags: [Community Posts]
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Community ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Announcements retrieved successfully
 *       404:
 *         description: Community not found
 *       500:
 *         description: Internal server error
 */
router.get('/:communityId/posts/announcements', async (req, res) => {
  try {
    const { communityId } = req.params;
    validatePaginationParams(req.query);

    const options = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      filters: {
        communityId,
        postType: 'announcement',
        isPublished: true
      },
      sort: [{ field: 'createdAt', order: 'desc' as const }]
    };

    const result = await PostService.getCommunityPosts(communityId, options);
    res.json({
      success: true,
      data: result,
      message: 'Announcements retrieved successfully'
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