import { Router, Request, Response } from 'express';
import { PostService } from '../services/posts';
import { AppError, formatErrorResponse, handleDatabaseError } from '../lib/errors';
import {
  validateCreatePostData,
  validateUpdatePostData,
  validatePaginationParams,
  validatePostQueryOptions
} from '../lib/validation';
import { authenticate, optionalAuth } from '../middleware/auth';

const router: Router = Router();

// Post Routes

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get posts across communities (admin/moderator use)
 *     tags: [Posts]
 *     parameters:
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
 *         name: communityId
 *         schema:
 *           type: string
 *         description: Filter by community ID
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
 *         name: isPublished
 *         schema:
 *           type: boolean
 *         description: Filter by published status
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
 *         description: Posts retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticate, async (req, res) => {
  try {
    validatePaginationParams(req.query);
    validatePostQueryOptions(req.query);

    const options = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      filters: {
        communityId: req.query.communityId as string,
        authorId: req.query.authorId as string,
        postType: req.query.postType as string,
        isPublished: req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : undefined,
      },
      search: req.query.search as string,
      sort: req.query.sort ?
        (req.query.sort as string).split(',').map((s: string) => {
          const [field, order] = s.split(':');
          return { field, order: order as 'asc' | 'desc' };
        }) :
        [{ field: 'createdAt', order: 'desc' as const }]
    };

    const result = await PostService.getPosts(options);
    res.json({
      success: true,
      data: result,
      message: 'Posts retrieved successfully'
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
 * /api/posts/{id}:
 *   get:
 *     summary: Get specific post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await PostService.getPostById(id);

    if (!post) {
      throw new AppError('Post not found', 404, 'RESOURCE_NOT_FOUND' as any);
    }

    // Increment view count asynchronously
    if (req.user) {
      PostService.incrementViewCount(id).catch(console.error);
    }

    res.json({
      success: true,
      data: post,
      message: 'Post retrieved successfully'
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
 * /api/posts/{id}:
 *   put:
 *     summary: Update post (author/community moderator only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               allowComments:
 *                 type: boolean
 *               isPublished:
 *                 type: boolean
 *               slug:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    validateUpdatePostData(req.body);

    const updatedPost = await PostService.updatePost(id, req.user!.id, req.body);

    res.json({
      success: true,
      data: updatedPost,
      message: 'Post updated successfully'
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
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete post (author/community admin only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await PostService.deletePost(id, req.user!.id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
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
 * /api/posts/{id}/publish:
 *   post:
 *     summary: Publish draft post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post published successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/publish', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const updatedPost = await PostService.updatePost(id, req.user!.id, { isPublished: true });

    res.json({
      success: true,
      data: updatedPost,
      message: 'Post published successfully'
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
 * /api/posts/{id}/pin:
 *   post:
 *     summary: Pin/unpin post (community moderator only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post pin status updated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/pin', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await PostService.togglePinPost(id, req.user!.id);

    res.json({
      success: true,
      data: result,
      message: `Post ${result.isPinned ? 'pinned' : 'unpinned'} successfully`
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
 * /api/posts/{id}/feature:
 *   post:
 *     summary: Feature/unfeature post (community admin only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post feature status updated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/feature', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await PostService.toggleFeaturePost(id, req.user!.id);

    res.json({
      success: true,
      data: result,
      message: `Post ${result.isFeatured ? 'featured' : 'unfeatured'} successfully`
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
 * /api/posts/{id}/like:
 *   post:
 *     summary: Like post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post liked successfully
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await PostService.toggleLike(id, req.user!.id);

    res.json({
      success: true,
      data: result,
      message: `Post ${result.liked ? 'liked' : 'unliked'} successfully`
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
 * /api/posts/{id}/likes:
 *   get:
 *     summary: Get post likes (with pagination)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
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
 *     responses:
 *       200:
 *         description: Post likes retrieved successfully
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/likes', async (req, res) => {
  try {
    const { id } = req.params;
    validatePaginationParams(req.query);

    // This would be implemented in PostService to get likes with user info
    // For now, return a placeholder response
    res.json({
      success: true,
      data: {
        likes: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20
      },
      message: 'Post likes retrieved successfully'
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
 * /api/posts/slug/{slug}:
 *   get:
 *     summary: Get post by slug
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Post slug
 *       - in: query
 *         name: communityId
 *         schema:
 *           type: string
 *         description: Optional community ID to narrow search within specific community
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.get('/slug/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { communityId } = req.query;

    const post = await PostService.getPostBySlug(slug, communityId as string);

    if (!post) {
      throw new AppError('Post not found', 404, 'RESOURCE_NOT_FOUND' as any);
    }

    // Increment view count asynchronously
    if (req.user) {
      PostService.incrementViewCount(post.id).catch(console.error);
    }

    res.json({
      success: true,
      data: post,
      message: 'Post retrieved successfully'
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