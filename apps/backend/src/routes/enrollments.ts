import { Router, Request, Response } from 'express';
import { EnrollmentService, MaterialProgressService } from '../services/enrollment';

const router: Router = Router();

// Enrollment Routes

/**
 * @swagger
 * /api/enrollments:
 *   post:
 *     summary: Create enrollment (enroll user in course)
 *     tags: [Enrollments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, userId]
 *             properties:
 *               courseId:
 *                 type: string
 *               userId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [enrolled, completed, dropped]
 *                 default: enrolled
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 */
router.post('/', async (req, res) => {
  try {
    const enrollment = await EnrollmentService.createEnrollment(req.body);
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/enrollments/{id}:
 *   get:
 *     summary: Get enrollment by ID
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment details
 *       404:
 *         description: Enrollment not found
 */
router.get('/:id', async (req, res) => {
  try {
    const enrollment = await EnrollmentService.getEnrollmentById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/enrollments/user/{userId}:
 *   get:
 *     summary: Get user enrollments
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: userId
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
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [enrolled, completed, dropped]
 *     responses:
 *       200:
 *         description: List of user enrollments
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const enrollments = await EnrollmentService.getUserEnrollments(
      req.params.userId,
      Number(page),
      Number(pageSize),
      status as any
    );
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/enrollments/course/{courseId}:
 *   get:
 *     summary: Get course enrollments
 *     tags: [Enrollments]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [enrolled, completed, dropped]
 *     responses:
 *       200:
 *         description: List of course enrollments
 */
router.get('/course/:courseId', async (req, res) => {
  try {
    const { page = 1, pageSize = 50, status } = req.query;
    const enrollments = await EnrollmentService.getCourseEnrollments(
      req.params.courseId,
      Number(page),
      Number(pageSize),
      status as any
    );
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/enrollments/{id}:
 *   put:
 *     summary: Update enrollment
 *     tags: [Enrollments]
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
 *               status:
 *                 type: string
 *                 enum: [enrolled, completed, dropped]
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Enrollment updated successfully
 */
router.put('/:id', async (req, res) => {
  try {
    const enrollment = await EnrollmentService.updateEnrollment(req.params.id, req.body);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/enrollments/{id}:
 *   delete:
 *     summary: Delete enrollment (unenroll)
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment deleted successfully
 */
router.delete('/:id', async (req, res) => {
  try {
    const enrollment = await EnrollmentService.deleteEnrollment(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    res.json({ message: 'Enrollment deleted successfully', enrollment });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Material Progress Routes

/**
 * @swagger
 * /api/enrollments/{enrollmentId}/progress:
 *   post:
 *     summary: Create or update material progress
 *     tags: [Material Progress]
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, materialId]
 *             properties:
 *               userId:
 *                 type: string
 *               materialId:
 *                 type: string
 *               completed:
 *                 type: boolean
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               lastPosition:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Progress updated successfully
 */
router.post('/:enrollmentId/progress', async (req, res) => {
  try {
    const { userId, materialId, ...progressData } = req.body;
    const progress = await MaterialProgressService.upsertMaterialProgress(
      userId,
      materialId,
      req.params.enrollmentId,
      progressData
    );
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/enrollments/{enrollmentId}/progress:
 *   get:
 *     summary: Get material progress for enrollment
 *     tags: [Material Progress]
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of material progress
 */
router.get('/:enrollmentId/progress', async (req, res) => {
  try {
    const progress = await MaterialProgressService.getMaterialProgressByEnrollment(req.params.enrollmentId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/enrollments/{enrollmentId}/stats:
 *   get:
 *     summary: Get completion statistics for enrollment
 *     tags: [Material Progress]
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Completion statistics
 */
router.get('/:enrollmentId/stats', async (req, res) => {
  try {
    const stats = await MaterialProgressService.getCompletionStats(req.params.enrollmentId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;