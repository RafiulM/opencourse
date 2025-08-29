import { Router, Request, Response } from 'express';
import { UserScoreService, AchievementService, UserAchievementService } from '../services/scoreboard';
import { validateScoreboardQueryOptions } from '../lib/validation';

const router: Router = Router();

// User Score Routes

/**
 * @swagger
 * /api/scoreboard/users/{userId}/scores:
 *   get:
 *     summary: Get user scores
 *     tags: [User Scores]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's scores
 */
router.get('/users/:userId/scores', async (req, res) => {
  try {
    const scores = await UserScoreService.getUserScores(req.params.userId);
    res.json({
      success: true,
      data: scores
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/scoreboard/users/{userId}/points:
 *   post:
 *     summary: Add points to user
 *     tags: [User Scores]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [points]
 *             properties:
 *               points:
 *                 type: integer
 *               communityId:
 *                 type: string
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Points added successfully
 */
router.post('/users/:userId/points', async (req, res) => {
  try {
    const { points, communityId, courseId } = req.body;
    const userScore = await UserScoreService.addPointsToUser(
      req.params.userId,
      points,
      communityId,
      courseId
    );
    res.json({
      success: true,
      data: userScore,
      message: 'Points added successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/scoreboard/communities/{communityId}/leaderboard:
 *   get:
 *     summary: Get community leaderboard with filtering, sorting, and search
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: path
 *         name: communityId
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
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: totalPointsMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: totalPointsMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: coursesCompletedMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: coursesCompletedMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: quizzesPassedMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: quizzesPassedMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: averageQuizScoreMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: averageQuizScoreMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: streakMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: streakMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           description: Comma-separated list of sort fields with optional + (asc) or - (desc) prefix
 *           example: "-totalPoints,+streak"
 *     responses:
 *       200:
 *         description: Community leaderboard
 */
router.get('/communities/:communityId/leaderboard', async (req, res) => {
  try {
    const queryOptions = validateScoreboardQueryOptions(req.query);
    
    const filters: any = {};
    if (queryOptions.filters.userId) filters.userId = queryOptions.filters.userId;
    if (queryOptions.filters.totalPoints) {
      filters.totalPoints = {};
      if (queryOptions.filters.totalPoints.min) filters.totalPoints.min = queryOptions.filters.totalPoints.min;
      if (queryOptions.filters.totalPoints.max) filters.totalPoints.max = queryOptions.filters.totalPoints.max;
    }
    if (queryOptions.filters.coursesCompleted) {
      filters.coursesCompleted = {};
      if (queryOptions.filters.coursesCompleted.min) filters.coursesCompleted.min = queryOptions.filters.coursesCompleted.min;
      if (queryOptions.filters.coursesCompleted.max) filters.coursesCompleted.max = queryOptions.filters.coursesCompleted.max;
    }
    if (queryOptions.filters.quizzesPassed) {
      filters.quizzesPassed = {};
      if (queryOptions.filters.quizzesPassed.min) filters.quizzesPassed.min = queryOptions.filters.quizzesPassed.min;
      if (queryOptions.filters.quizzesPassed.max) filters.quizzesPassed.max = queryOptions.filters.quizzesPassed.max;
    }
    if (queryOptions.filters.averageQuizScore) {
      filters.averageQuizScore = {};
      if (queryOptions.filters.averageQuizScore.min) filters.averageQuizScore.min = queryOptions.filters.averageQuizScore.min;
      if (queryOptions.filters.averageQuizScore.max) filters.averageQuizScore.max = queryOptions.filters.averageQuizScore.max;
    }
    if (queryOptions.filters.streak) {
      filters.streak = {};
      if (queryOptions.filters.streak.min) filters.streak.min = queryOptions.filters.streak.min;
      if (queryOptions.filters.streak.max) filters.streak.max = queryOptions.filters.streak.max;
    }
    if (queryOptions.filters.createdAt) filters.createdAt = queryOptions.filters.createdAt;
    if (queryOptions.filters.updatedAt) filters.updatedAt = queryOptions.filters.updatedAt;
    
    const result = await UserScoreService.getCommunityLeaderboard(
      req.params.communityId,
      {
        page: queryOptions.page,
        pageSize: queryOptions.pageSize,
        filters,
        sort: queryOptions.sort
      }
    );
    
    res.json({
      success: true,
      data: result.leaderboard,
      pagination: {
        page: queryOptions.page,
        pageSize: queryOptions.pageSize,
        total: result.totalCount,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/scoreboard/courses/{courseId}/leaderboard:
 *   get:
 *     summary: Get course leaderboard with filtering, sorting, and search
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: path
 *         name: courseId
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
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: totalPointsMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: totalPointsMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: quizzesPassedMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: quizzesPassedMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: averageQuizScoreMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: averageQuizScoreMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           description: Comma-separated list of sort fields with optional + (asc) or - (desc) prefix
 *           example: "-totalPoints,+averageQuizScore"
 *     responses:
 *       200:
 *         description: Course leaderboard
 */
router.get('/courses/:courseId/leaderboard', async (req, res) => {
  try {
    const queryOptions = validateScoreboardQueryOptions(req.query);
    
    const filters: any = {};
    if (queryOptions.filters.userId) filters.userId = queryOptions.filters.userId;
    if (queryOptions.filters.totalPoints) {
      filters.totalPoints = {};
      if (queryOptions.filters.totalPoints.min) filters.totalPoints.min = queryOptions.filters.totalPoints.min;
      if (queryOptions.filters.totalPoints.max) filters.totalPoints.max = queryOptions.filters.totalPoints.max;
    }
    if (queryOptions.filters.quizzesPassed) {
      filters.quizzesPassed = {};
      if (queryOptions.filters.quizzesPassed.min) filters.quizzesPassed.min = queryOptions.filters.quizzesPassed.min;
      if (queryOptions.filters.quizzesPassed.max) filters.quizzesPassed.max = queryOptions.filters.quizzesPassed.max;
    }
    if (queryOptions.filters.averageQuizScore) {
      filters.averageQuizScore = {};
      if (queryOptions.filters.averageQuizScore.min) filters.averageQuizScore.min = queryOptions.filters.averageQuizScore.min;
      if (queryOptions.filters.averageQuizScore.max) filters.averageQuizScore.max = queryOptions.filters.averageQuizScore.max;
    }
    if (queryOptions.filters.createdAt) filters.createdAt = queryOptions.filters.createdAt;
    if (queryOptions.filters.updatedAt) filters.updatedAt = queryOptions.filters.updatedAt;
    
    const result = await UserScoreService.getCourseLeaderboard(
      req.params.courseId,
      {
        page: queryOptions.page,
        pageSize: queryOptions.pageSize,
        filters,
        sort: queryOptions.sort
      }
    );
    
    res.json({
      success: true,
      data: result.leaderboard,
      pagination: {
        page: queryOptions.page,
        pageSize: queryOptions.pageSize,
        total: result.totalCount,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/scoreboard/communities/{communityId}/stats:
 *   get:
 *     summary: Get community statistics
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Community statistics
 */
router.get('/communities/:communityId/stats', async (req, res) => {
  try {
    const stats = await UserScoreService.getCommunityStats(req.params.communityId);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

// Achievement Routes

/**
 * @swagger
 * /api/scoreboard/achievements:
 *   post:
 *     summary: Create achievement
 *     tags: [Achievements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, criteria]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               criteria:
 *                 type: object
 *               points:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Achievement created successfully
 */
router.post('/achievements', async (req, res) => {
  try {
    const achievement = await AchievementService.createAchievement(req.body);
    res.status(201).json({
      success: true,
      data: achievement,
      message: 'Achievement created successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/scoreboard/achievements:
 *   get:
 *     summary: Get all achievements
 *     tags: [Achievements]
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
 *           default: 50
 *     responses:
 *       200:
 *         description: List of achievements
 */
router.get('/achievements', async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    const result = await AchievementService.getAllAchievements(
      Number(page),
      Number(pageSize)
    );
    res.json({
      success: true,
      data: result.achievements,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: result.totalCount,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/scoreboard/achievements/{id}:
 *   get:
 *     summary: Get achievement by ID
 *     tags: [Achievements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Achievement details
 *       404:
 *         description: Achievement not found
 */
router.get('/achievements/:id', async (req, res) => {
  try {
    const achievement = await AchievementService.getAchievementById(req.params.id);
    if (!achievement) {
      return res.status(404).json({ 
        success: false,
        error: 'Achievement not found' 
      });
    }
    res.json({
      success: true,
      data: achievement
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/scoreboard/achievements/{id}:
 *   put:
 *     summary: Update achievement
 *     tags: [Achievements]
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
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               criteria:
 *                 type: object
 *               points:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Achievement updated successfully
 */
router.put('/achievements/:id', async (req, res) => {
  try {
    const achievement = await AchievementService.updateAchievement(req.params.id, req.body);
    if (!achievement) {
      return res.status(404).json({ 
        success: false,
        error: 'Achievement not found' 
      });
    }
    res.json({
      success: true,
      data: achievement,
      message: 'Achievement updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/scoreboard/achievements/{id}:
 *   delete:
 *     summary: Delete achievement
 *     tags: [Achievements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Achievement deleted successfully
 */
router.delete('/achievements/:id', async (req, res) => {
  try {
    const achievement = await AchievementService.deleteAchievement(req.params.id);
    if (!achievement) {
      return res.status(404).json({ 
        success: false,
        error: 'Achievement not found' 
      });
    }
    res.json({ 
      success: true,
      data: achievement,
      message: 'Achievement deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

// User Achievement Routes

/**
 * @swagger
 * /api/scoreboard/users/{userId}/achievements:
 *   get:
 *     summary: Get user achievements
 *     tags: [User Achievements]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's achievements
 */
router.get('/users/:userId/achievements', async (req, res) => {
  try {
    const achievements = await UserAchievementService.getUserAchievements(req.params.userId);
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/scoreboard/users/{userId}/achievements/{achievementId}:
 *   post:
 *     summary: Award achievement to user
 *     tags: [User Achievements]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: achievementId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Achievement awarded successfully
 *       400:
 *         description: User already has this achievement
 */
router.post('/users/:userId/achievements/:achievementId', async (req, res) => {
  try {
    const userAchievement = await UserAchievementService.awardAchievement(
      req.params.userId,
      req.params.achievementId
    );
    
    if (!userAchievement) {
      return res.status(400).json({ 
        success: false,
        error: 'User already has this achievement' 
      });
    }
    
    res.status(201).json({
      success: true,
      data: userAchievement,
      message: 'Achievement awarded successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/scoreboard/users/{userId}/check-achievements:
 *   post:
 *     summary: Check and award eligible achievements
 *     tags: [User Achievements]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               communityId:
 *                 type: string
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: List of newly awarded achievements
 */
router.post('/users/:userId/check-achievements', async (req, res) => {
  try {
    const { communityId, courseId } = req.body;
    const newAchievements = await UserAchievementService.checkAndAwardAchievements(
      req.params.userId,
      communityId,
      courseId
    );
    res.json({
      success: true,
      data: newAchievements,
      message: 'Achievements checked and awarded successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

export default router;