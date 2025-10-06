import { Router } from 'express';
import communitiesRouter from './communities';
import communityPostsRouter from './community-posts';
import coursesRouter from './courses';
import enrollmentsRouter from './enrollments';
import quizzesRouter from './quizzes';
import scoreboardRouter from './scoreboard';
import uploadsRouter from './uploads';
import postsRouter from './posts';
import commentsRouter from './comments';

const router: Router = Router();

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API status endpoint  
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OpenCourse API v1.0.0
 *                 status:
 *                   type: string
 *                   example: running
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'OpenCourse API v1.0.0',
      status: 'running',
      version: '1.0.0',
      availableEndpoints: [
        '/api/communities',
        '/api/courses',
        '/api/enrollments',
        '/api/quizzes',
        '/api/scoreboard',
        '/api/uploads',
        '/api/posts',
        '/api/comments'
      ]
    }
  });
});

// Register all route modules
router.use('/communities', communitiesRouter);
router.use('/communities', communityPostsRouter);
router.use('/courses', coursesRouter);
router.use('/enrollments', enrollmentsRouter);
router.use('/quizzes', quizzesRouter);
router.use('/scoreboard', scoreboardRouter);
router.use('/uploads', uploadsRouter);
router.use('/posts', postsRouter);
router.use('/comments', commentsRouter);

export default router;