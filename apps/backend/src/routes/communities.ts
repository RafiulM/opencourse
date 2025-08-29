import { Router, Request, Response } from 'express';
import { CommunityService, CommunityMemberService } from '../services/community';
import { AppError, formatErrorResponse, handleDatabaseError } from '../lib/errors';
import { 
  validateCommunityData, 
  validateCommunityUpdateData, 
  validateAddMemberData,
  validatePaginationParams,
  validateCommunityQueryOptions
} from '../lib/validation';
import { authenticate, optionalAuth } from '../middleware/auth';

const router: Router = Router();

// Community Routes

/**
 * @swagger
 * /api/communities:
 *   post:
 *     summary: Create a new community
 *     tags: [Communities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug, createdBy]
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               domain:
 *                 type: string
 *               description:
 *                 type: string
 *               banner:
 *                 type: string
 *               avatar:
 *                 type: string
 *               privacy:
 *                 type: string
 *                 enum: [public, private, invite_only]
 *               settings:
 *                 type: object
 *               createdBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: Community created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticate, async (req, res) => {
  try {
    validateCommunityData(req.body);
    
    // Add createdBy from authenticated user
    const communityData = {
      ...req.body,
      createdBy: req.user!.id
    };
    
    const community = await CommunityService.createCommunity(communityData);
    res.status(201).json({ 
      success: true,
      data: community,
      message: 'Community created successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }
    
    // Handle database errors
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/communities:
 *   get:
 *     summary: Get all communities with filtering, sorting, and search
 *     tags: [Communities]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: privacy
 *         schema:
 *           type: string
 *           enum: [public, private, invite_only]
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: memberCountMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: memberCountMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           description: Comma-separated list of sort fields with optional + (asc) or - (desc) prefix
 *           example: "-createdAt,+name"
 *     responses:
 *       200:
 *         description: List of communities
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const queryOptions = validateCommunityQueryOptions(req.query);
    
    const filters: any = {};
    if (queryOptions.filters.privacy) filters.privacy = queryOptions.filters.privacy;
    if (queryOptions.filters.createdBy) filters.createdBy = queryOptions.filters.createdBy;
    if (queryOptions.filters.isVerified !== undefined) filters.isVerified = queryOptions.filters.isVerified;
    if (queryOptions.filters.memberCount) {
      filters.memberCount = {};
      if (queryOptions.filters.memberCount.min) filters.memberCount.min = queryOptions.filters.memberCount.min;
      if (queryOptions.filters.memberCount.max) filters.memberCount.max = queryOptions.filters.memberCount.max;
    }
    if (queryOptions.filters.createdAt) filters.createdAt = queryOptions.filters.createdAt;
    if (queryOptions.filters.updatedAt) filters.updatedAt = queryOptions.filters.updatedAt;
    
    const result = await CommunityService.getAllCommunities({
      page: queryOptions.page,
      pageSize: queryOptions.pageSize,
      filters,
      search: queryOptions.search,
      sort: queryOptions.sort
    });
    
    res.json({
      success: true,
      data: result.communities,
      pagination: {
        page: queryOptions.page,
        pageSize: queryOptions.pageSize,
        total: result.totalCount,
        totalPages: result.totalPages
      }
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
 * /api/communities/my:
 *   get:
 *     summary: Get current user's communities
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of current user's communities
 *       401:
 *         description: Authentication required
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const communities = await CommunityService.getCommunitiesByUser(req.user!.id);
    res.json({
      success: true,
      data: communities
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
 * /api/communities/{id}:
 *   get:
 *     summary: Get community by ID
 *     tags: [Communities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Community details
 *       404:
 *         description: Community not found
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const community = await CommunityService.getCommunityById(req.params.id);
    if (!community) {
      const errorResponse = formatErrorResponse(
        new AppError('Community not found', 404, 'RESOURCE_NOT_FOUND' as any)
      );
      return res.status(404).json(errorResponse);
    }
    
    res.json({
      success: true,
      data: community
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
 * /api/communities/slug/{slug}:
 *   get:
 *     summary: Get community by slug
 *     tags: [Communities]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Community details
 *       404:
 *         description: Community not found
 */
router.get('/slug/:slug', optionalAuth, async (req, res) => {
  try {
    const community = await CommunityService.getCommunityBySlug(req.params.slug);
    if (!community) {
      const errorResponse = formatErrorResponse(
        new AppError('Community not found', 404, 'RESOURCE_NOT_FOUND' as any)
      );
      return res.status(404).json(errorResponse);
    }
    
    res.json({
      success: true,
      data: community
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
 * /api/communities/{id}:
 *   put:
 *     summary: Update community
 *     tags: [Communities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               domain:
 *                 type: string
 *               description:
 *                 type: string
 *               banner:
 *                 type: string
 *               avatar:
 *                 type: string
 *               privacy:
 *                 type: string
 *                 enum: [public, private, invite_only]
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Community updated successfully
 *       404:
 *         description: Community not found
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    validateCommunityUpdateData(req.body);
    
    // TODO: Add ownership check - only community creator or owners should be able to update
    
    const community = await CommunityService.updateCommunity(req.params.id, req.body);
    if (!community) {
      const errorResponse = formatErrorResponse(
        new AppError('Community not found', 404, 'RESOURCE_NOT_FOUND' as any)
      );
      return res.status(404).json(errorResponse);
    }
    
    res.json({
      success: true,
      data: community,
      message: 'Community updated successfully'
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
 * /api/communities/{id}:
 *   delete:
 *     summary: Delete community
 *     tags: [Communities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Community deleted successfully
 *       404:
 *         description: Community not found
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // TODO: Add ownership check - only community creator should be able to delete
    
    const community = await CommunityService.deleteCommunity(req.params.id);
    if (!community) {
      const errorResponse = formatErrorResponse(
        new AppError('Community not found', 404, 'RESOURCE_NOT_FOUND' as any)
      );
      return res.status(404).json(errorResponse);
    }
    
    res.json({
      success: true,
      data: community,
      message: 'Community deleted successfully'
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
 * /api/communities/user/{userId}:
 *   get:
 *     summary: Get communities by user
 *     tags: [Communities]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user's communities
 */
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    // Users can only see their own communities or public ones
    // For now, allow access to any user's communities (may need privacy controls later)
    const communities = await CommunityService.getCommunitiesByUser(req.params.userId);
    res.json({
      success: true,
      data: communities
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

// Community Member Routes

/**
 * @swagger
 * /api/communities/{id}/members:
 *   post:
 *     summary: Add member to community
 *     tags: [Community Members]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [owner, moderator, member]
 *                 default: member
 *     responses:
 *       201:
 *         description: Member added successfully
 */
router.post('/:id/members', authenticate, async (req, res) => {
  try {
    validateAddMemberData(req.body);
    
    // Add authenticated user to community (self-join)
    const memberData = {
      communityId: req.params.id,
      userId: req.user!.id,
      role: req.body.role || 'member'
    };
    
    const member = await CommunityMemberService.addMember(memberData);
    res.status(201).json({
      success: true,
      data: member,
      message: 'Successfully joined community'
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
 * /api/communities/{id}/members:
 *   get:
 *     summary: Get community members
 *     tags: [Community Members]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of community members
 */
router.get('/:id/members', optionalAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    validatePaginationParams(page, pageSize);
    
    const result = await CommunityMemberService.getCommunityMembers(
      req.params.id, 
      Number(page), 
      Number(pageSize)
    );
    
    res.json({
      success: true,
      data: result.members,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: result.totalCount,
        totalPages: result.totalPages
      }
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
 * /api/communities/{id}/members/{memberId}:
 *   put:
 *     summary: Update member role
 *     tags: [Community Members]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [owner, moderator, member]
 *     responses:
 *       200:
 *         description: Member role updated successfully
 */
router.put('/:id/members/:memberId', authenticate, async (req, res) => {
  try {
    if (req.body.role && !['owner', 'moderator', 'member'].includes(req.body.role)) {
      const errorResponse = formatErrorResponse(
        new AppError('Role must be one of: owner, moderator, member', 400, 'VALIDATION_ERROR' as any)
      );
      return res.status(400).json(errorResponse);
    }
    
    // TODO: Add permission check - only owners/moderators should be able to update roles
    
    const member = await CommunityMemberService.updateMemberRole(req.params.memberId, req.body);
    if (!member) {
      const errorResponse = formatErrorResponse(
        new AppError('Member not found', 404, 'RESOURCE_NOT_FOUND' as any)
      );
      return res.status(404).json(errorResponse);
    }
    
    res.json({
      success: true,
      data: member,
      message: 'Member role updated successfully'
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
 * /api/communities/{id}/members/{memberId}:
 *   delete:
 *     summary: Remove member from community
 *     tags: [Community Members]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 */
router.delete('/:id/members/:memberId', authenticate, async (req, res) => {
  try {
    // TODO: Add permission check - only owners/moderators should be able to remove members
    // Users should be able to remove themselves (leave community)
    
    const member = await CommunityMemberService.removeMember(req.params.memberId);
    if (!member) {
      const errorResponse = formatErrorResponse(
        new AppError('Member not found', 404, 'RESOURCE_NOT_FOUND' as any)
      );
      return res.status(404).json(errorResponse);
    }
    
    res.json({
      success: true,
      data: member,
      message: 'Member removed successfully'
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