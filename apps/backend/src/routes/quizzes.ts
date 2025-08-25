import { Router, Request, Response } from 'express';
import { QuizService, QuizQuestionService, QuizAttemptService } from '../services/quiz';

const router: Router = Router();

// Quiz Routes

/**
 * @swagger
 * /api/quizzes:
 *   post:
 *     summary: Create a new quiz
 *     tags: [Quizzes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, title, order]
 *             properties:
 *               courseId:
 *                 type: string
 *               moduleId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               passingScore:
 *                 type: integer
 *                 default: 70
 *               timeLimit:
 *                 type: integer
 *               maxAttempts:
 *                 type: integer
 *                 default: 3
 *               order:
 *                 type: integer
 *               isPublished:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Quiz created successfully
 */
router.post('/', async (req, res) => {
  try {
    const quiz = await QuizService.createQuiz(req.body);
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/quizzes/{id}:
 *   get:
 *     summary: Get quiz by ID
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz details
 *       404:
 *         description: Quiz not found
 */
router.get('/:id', async (req, res) => {
  try {
    const quiz = await QuizService.getQuizById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/quizzes/{id}/questions:
 *   get:
 *     summary: Get quiz with questions
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeAnswers
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Quiz with questions
 *       404:
 *         description: Quiz not found
 */
router.get('/:id/questions', async (req, res) => {
  try {
    const includeAnswers = req.query.includeAnswers === 'true';
    const quiz = await QuizService.getQuizWithQuestions(req.params.id, includeAnswers);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/quizzes/course/{courseId}:
 *   get:
 *     summary: Get quizzes by course
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeUnpublished
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: List of course quizzes
 */
router.get('/course/:courseId', async (req, res) => {
  try {
    const includeUnpublished = req.query.includeUnpublished === 'true';
    const quizzes = await QuizService.getQuizzesByCourse(req.params.courseId, includeUnpublished);
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/quizzes/{id}:
 *   put:
 *     summary: Update quiz
 *     tags: [Quizzes]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               passingScore:
 *                 type: integer
 *               timeLimit:
 *                 type: integer
 *               maxAttempts:
 *                 type: integer
 *               order:
 *                 type: integer
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 */
router.put('/:id', async (req, res) => {
  try {
    const quiz = await QuizService.updateQuiz(req.params.id, req.body);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/quizzes/{id}:
 *   delete:
 *     summary: Delete quiz
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 */
router.delete('/:id', async (req, res) => {
  try {
    const quiz = await QuizService.deleteQuiz(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json({ message: 'Quiz deleted successfully', quiz });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Quiz Question Routes

/**
 * @swagger
 * /api/quizzes/{quizId}/questions:
 *   post:
 *     summary: Create quiz question
 *     tags: [Quiz Questions]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, question, correctAnswer, order]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [multiple_choice, true_false, short_answer, essay]
 *               question:
 *                 type: string
 *               options:
 *                 type: array
 *               correctAnswer:
 *                 type: string
 *               explanation:
 *                 type: string
 *               points:
 *                 type: integer
 *                 default: 1
 *               order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Question created successfully
 */
router.post('/:quizId/questions', async (req, res) => {
  try {
    const question = await QuizQuestionService.createQuizQuestion({
      quizId: req.params.quizId,
      ...req.body
    });
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/quizzes/questions/{questionId}:
 *   put:
 *     summary: Update quiz question
 *     tags: [Quiz Questions]
 *     parameters:
 *       - in: path
 *         name: questionId
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
 *               type:
 *                 type: string
 *                 enum: [multiple_choice, true_false, short_answer, essay]
 *               question:
 *                 type: string
 *               options:
 *                 type: array
 *               correctAnswer:
 *                 type: string
 *               explanation:
 *                 type: string
 *               points:
 *                 type: integer
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Question updated successfully
 */
router.put('/questions/:questionId', async (req, res) => {
  try {
    const question = await QuizQuestionService.updateQuizQuestion(req.params.questionId, req.body);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/quizzes/questions/{questionId}:
 *   delete:
 *     summary: Delete quiz question
 *     tags: [Quiz Questions]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question deleted successfully
 */
router.delete('/questions/:questionId', async (req, res) => {
  try {
    const question = await QuizQuestionService.deleteQuizQuestion(req.params.questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully', question });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Quiz Attempt Routes

/**
 * @swagger
 * /api/quizzes/{quizId}/attempts:
 *   post:
 *     summary: Submit quiz attempt
 *     tags: [Quiz Attempts]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, answers, startedAt]
 *             properties:
 *               userId:
 *                 type: string
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     answer:
 *                       type: string
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Quiz attempt submitted successfully
 */
router.post('/:quizId/attempts', async (req, res) => {
  try {
    const { userId, answers, startedAt } = req.body;
    const result = await QuizAttemptService.submitQuizAttempt(
      userId,
      req.params.quizId,
      answers,
      new Date(startedAt)
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/quizzes/{quizId}/attempts/user/{userId}:
 *   get:
 *     summary: Get user's quiz attempts
 *     tags: [Quiz Attempts]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's quiz attempts and statistics
 */
router.get('/:quizId/attempts/user/:userId', async (req, res) => {
  try {
    const stats = await QuizAttemptService.getUserQuizStats(req.params.userId, req.params.quizId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/quizzes/{quizId}/stats:
 *   get:
 *     summary: Get quiz statistics
 *     tags: [Quiz Attempts]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz statistics
 */
router.get('/:quizId/stats', async (req, res) => {
  try {
    const stats = await QuizService.getQuizStats(req.params.quizId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;