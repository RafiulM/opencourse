import { Router, Request, Response } from 'express';
import { CommentService } from '../services/comments';
import { AppError, formatErrorResponse, handleDatabaseError } from '../lib/errors';
import {
  validateCreateCommentData,
  validateUpdateCommentData,
  validatePaginationParams,
  validateCommentQueryOptions
} from '../lib/validation';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

// Comment Routes

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Create comment on post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
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
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *               parentId:
 *                 type: string
 *                 description: Parent comment ID for replies
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: User must be a member of the community
 *       404:
 *         description: Post not found or comments not allowed
 *       500:
 *         description: Internal server error
 */
router.post('/posts/:postId/comments', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    validateCreateCommentData(req.body);

    const comment = await CommentService.createComment(postId, req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment created successfully'
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
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Get comments for post (with pagination, threading)
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
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
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Filter by author ID
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Filter by parent comment ID
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
 *         description: Filter by nesting level
 *       - in: query
 *         name: isPinned
 *         schema:
 *           type: boolean
 *         description: Filter by pinned status
 *       - in: query
 *         name: includeReplies
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include replies in results
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in comment content
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt:asc
 *         description: Sort field and order (field:order)
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    validatePaginationParams(req.query);
    validateCommentQueryOptions(req.query);

    const options = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      filters: {
        postId,
        authorId: req.query.authorId as string,
        parentId: req.query.parentId as string,
        level: req.query.level ? parseInt(req.query.level as string) : undefined,
        isPinned: req.query.isPinned === 'true' ? true : req.query.isPinned === 'false' ? false : undefined,
        includeReplies: req.query.includeReplies === 'true'
      },
      search: req.query.search as string,
      sort: req.query.sort ?
        (req.query.sort as string).split(',').map((s: string) => {
          const [field, order] = s.split(':');
          return { field, order: order as 'asc' | 'desc' };
        }) :
        [{ field: 'createdAt', order: 'asc' as const }]
    };

    const result = await CommentService.getPostComments(postId, options);
    res.json({
      success: true,
      data: result,
      message: 'Comments retrieved successfully'
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
 * /api/comments/{id}:
 *   get:
 *     summary: Get specific comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment retrieved successfully
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await CommentService.getCommentById(id);

    if (!comment) {
      throw new AppError('Comment not found', 404, 'RESOURCE_NOT_FOUND' as any);
    }

    res.json({
      success: true,
      data: comment,
      message: 'Comment retrieved successfully'
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
 * /api/comments/{id}:
 *   put:
 *     summary: Update comment (author only)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       403:
 *         description: Only the author can edit this comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    validateUpdateCommentData(req.body);

    const updatedComment = await CommentService.updateComment(id, req.user!.id, req.body);

    res.json({
      success: true,
      data: updatedComment,
      message: 'Comment updated successfully'
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
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete comment (author/admin/moderator only)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await CommentService.deleteComment(id, req.user!.id);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
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
 * /api/comments/{id}/pin:
 *   post:
 *     summary: Pin/unpin comment (author/admin/moderator only)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment pin status updated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/pin', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await CommentService.togglePinComment(id, req.user!.id);

    res.json({
      success: true,
      data: result,
      message: `Comment ${result.isPinned ? 'pinned' : 'unpinned'} successfully`
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
 * /api/comments/{id}/report:
 *   post:
 *     summary: Report comment for moderation
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for reporting
 *     responses:
 *       200:
 *         description: Comment reported successfully
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/report', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await CommentService.reportComment(id, req.user!.id, reason);

    res.json({
      success: true,
      message: 'Comment reported successfully'
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
 * /api/comments/{id}/moderate:
 *   post:
 *     summary: Moderate comment (admin/moderator only)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [delete, restore, clear_report]
 *                 description: Moderation action to take
 *               reason:
 *                 type: string
 *                 description: Reason for moderation action
 *     responses:
 *       200:
 *         description: Comment moderated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/moderate', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!['delete', 'restore', 'clear_report'].includes(action)) {
      throw new AppError('Invalid moderation action', 400, 'INVALID_ACTION' as any);
    }

    const moderatedComment = await CommentService.moderateComment(
      id,
      req.user!.id,
      action,
      reason
    );

    res.json({
      success: true,
      data: moderatedComment,
      message: 'Comment moderated successfully'
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
 * /api/comments/{commentId}/replies:
 *   post:
 *     summary: Reply to comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Reply created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: User must be a member of the community
 *       404:
 *         description: Parent comment not found
 *       500:
 *         description: Internal server error
 */
router.post('/:commentId/replies', authenticate, async (req, res) => {
  try {
    const { commentId } = req.params;
    validateCreateCommentData(req.body);

    // Get the post ID for the parent comment
    const parentComment = await CommentService.getCommentById(commentId);
    if (!parentComment) {
      throw new AppError('Parent comment not found', 404, 'RESOURCE_NOT_FOUND' as any);
    }

    const reply = await CommentService.createComment(
      parentComment.postId,
      req.user!.id,
      {
        ...req.body,
        parentId: commentId
      }
    );

    res.status(201).json({
      success: true,
      data: reply,
      message: 'Reply created successfully'
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
 * /api/comments/{commentId}/replies:
 *   get:
 *     summary: Get replies to comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent comment ID
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
 *         description: Replies retrieved successfully
 *       404:
 *         description: Parent comment not found
 *       500:
 *         description: Internal server error
 */
router.get('/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    validatePaginationParams(req.query);

    const options = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      filters: {
        includeReplies: true
      },
      sort: [{ field: 'createdAt', order: 'asc' as const }]
    };

    const result = await CommentService.getCommentReplies(commentId, options);
    res.json({
      success: true,
      data: result,
      message: 'Replies retrieved successfully'
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
 * /api/comments/{id}/like:
 *   post:
 *     summary: Like comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment liked successfully
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await CommentService.toggleCommentLike(id, req.user!.id);

    res.json({
      success: true,
      data: result,
      message: `Comment ${result.liked ? 'liked' : 'unliked'} successfully`
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
 * /api/comments/{id}/likes:
 *   get:
 *     summary: Get comment likes (with pagination)
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
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
 *         description: Comment likes retrieved successfully
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/likes', async (req, res) => {
  try {
    const { id } = req.params;
    validatePaginationParams(req.query);

    // This would be implemented in CommentService to get likes with user info
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
      message: 'Comment likes retrieved successfully'
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