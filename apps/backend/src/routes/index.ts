import { Router } from 'express';
import communitiesRouter from './communities';
import coursesRouter from './courses';
import enrollmentsRouter from './enrollments';
import quizzesRouter from './quizzes';
import scoreboardRouter from './scoreboard';

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
    message: 'OpenCourse API v1.0.0',
    status: 'running',
    version: '1.0.0',
    availableEndpoints: [
      '/api/communities',
      '/api/courses', 
      '/api/enrollments',
      '/api/quizzes',
      '/api/scoreboard'
    ]
  });
});

// Register all route modules
router.use('/communities', communitiesRouter);
router.use('/courses', coursesRouter);
router.use('/enrollments', enrollmentsRouter);
router.use('/quizzes', quizzesRouter);
router.use('/scoreboard', scoreboardRouter);

export default router;