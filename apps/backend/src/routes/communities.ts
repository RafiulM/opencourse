import { Router, Request, Response } from 'express';
import { CommunityService, CommunityMemberService } from '../services/community';

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
router.post('/', async (req, res) => {
  try {
    const community = await CommunityService.createCommunity(req.body);
    res.status(201).json(community);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/communities:
 *   get:
 *     summary: Get all communities
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
 *     responses:
 *       200:
 *         description: List of communities
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, privacy } = req.query;
    const communities = await CommunityService.getAllCommunities(
      Number(page), 
      Number(pageSize), 
      privacy as any
    );
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.get('/:id', async (req, res) => {
  try {
    const community = await CommunityService.getCommunityById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.get('/slug/:slug', async (req, res) => {
  try {
    const community = await CommunityService.getCommunityBySlug(req.params.slug);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.put('/:id', async (req, res) => {
  try {
    const community = await CommunityService.updateCommunity(req.params.id, req.body);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.delete('/:id', async (req, res) => {
  try {
    const community = await CommunityService.deleteCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    res.json({ message: 'Community deleted successfully', community });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.get('/user/:userId', async (req, res) => {
  try {
    const communities = await CommunityService.getCommunitiesByUser(req.params.userId);
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.post('/:id/members', async (req, res) => {
  try {
    const member = await CommunityMemberService.addMember({
      communityId: req.params.id,
      ...req.body
    });
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.get('/:id/members', async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    const members = await CommunityMemberService.getCommunityMembers(
      req.params.id, 
      Number(page), 
      Number(pageSize)
    );
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.put('/:id/members/:memberId', async (req, res) => {
  try {
    const member = await CommunityMemberService.updateMemberRole(req.params.memberId, req.body);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const member = await CommunityMemberService.removeMember(req.params.memberId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member removed successfully', member });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;