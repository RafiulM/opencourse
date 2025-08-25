import { db } from '@/db';
import { quizzes, quizQuestions, quizAttempts, questionTypeEnum } from '@/db/schema/quiz';
import { eq, and, desc, asc, count, avg, max } from 'drizzle-orm';

export interface CreateQuizData {
  courseId: string;
  moduleId?: string;
  title: string;
  description?: string;
  passingScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  order: number;
  isPublished?: boolean;
}

export interface UpdateQuizData {
  title?: string;
  description?: string;
  passingScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  order?: number;
  isPublished?: boolean;
}

export interface CreateQuizQuestionData {
  quizId: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: any[];
  correctAnswer: any;
  explanation?: string;
  points?: number;
  order: number;
}

export interface UpdateQuizQuestionData {
  type?: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question?: string;
  options?: any[];
  correctAnswer?: any;
  explanation?: string;
  points?: number;
  order?: number;
}

export interface CreateQuizAttemptData {
  quizId: string;
  userId: string;
  score: number;
  totalPoints: number;
  percentage: string;
  passed: boolean;
  answers: Record<string, any>;
  startedAt: Date;
  completedAt: Date;
}

export interface QuizAttemptAnswer {
  questionId: string;
  answer: any;
  isCorrect?: boolean;
  points?: number;
}

// Quiz CRUD Operations
export class QuizService {
  // Create Quiz
  static async createQuiz(data: CreateQuizData) {
    const [quiz] = await db.insert(quizzes)
      .values(data)
      .returning();

    return quiz;
  }

  // Get Quiz by ID
  static async getQuizById(id: string) {
    const [quiz] = await db.select()
      .from(quizzes)
      .where(eq(quizzes.id, id))
      .limit(1);

    return quiz;
  }

  // Get Quizzes by Course
  static async getQuizzesByCourse(courseId: string, includeUnpublished = false) {
    const query = db.select()
      .from(quizzes)
      .where(eq(quizzes.courseId, courseId));

    const dynamicQuery = query.$dynamic();

    if (!includeUnpublished) {
      dynamicQuery.where(eq(quizzes.isPublished, true));
    }

    return await dynamicQuery.orderBy(asc(quizzes.order));
  }

  // Get Quizzes by Module
  static async getQuizzesByModule(moduleId: string, includeUnpublished = false) {
    const query = db.select()
      .from(quizzes)
      .where(eq(quizzes.moduleId, moduleId));

    const dynamicQuery = query.$dynamic();

    if (!includeUnpublished) {
      dynamicQuery.where(eq(quizzes.isPublished, true));
    }

    return await dynamicQuery.orderBy(asc(quizzes.order));
  }

  // Update Quiz
  static async updateQuiz(id: string, data: UpdateQuizData) {
    const [quiz] = await db.update(quizzes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(quizzes.id, id))
      .returning();

    return quiz;
  }

  // Delete Quiz
  static async deleteQuiz(id: string) {
    const [quiz] = await db.delete(quizzes)
      .where(eq(quizzes.id, id))
      .returning();

    return quiz;
  }

  // Get Quiz with Questions
  static async getQuizWithQuestions(id: string, includeCorrectAnswers = true) {
    const quiz = await this.getQuizById(id);
    if (!quiz) return null;

    const questions = await QuizQuestionService.getQuestionsByQuiz(id, includeCorrectAnswers);

    return {
      ...quiz,
      questions,
    };
  }

  // Reorder Quizzes
  static async reorderQuizzes(courseId: string, quizOrders: { id: string; order: number }[]) {
    const results = [];

    for (const { id, order } of quizOrders) {
      const [quiz] = await db.update(quizzes)
        .set({
          order,
          updatedAt: new Date(),
        })
        .where(and(
          eq(quizzes.id, id),
          eq(quizzes.courseId, courseId)
        ))
        .returning();

      results.push(quiz);
    }

    return results;
  }

  // Get Quiz Statistics
  static async getQuizStats(quizId: string) {
    const [attemptStats] = await db.select({
      totalAttempts: count(),
      averageScore: avg(quizAttempts.percentage),
      passRate: avg(quizAttempts.passed),
    })
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId));

    const [highScore] = await db.select({
      highestScore: max(quizAttempts.percentage),
    })
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId));

    return {
      totalAttempts: attemptStats?.totalAttempts || 0,
      averageScore: attemptStats?.averageScore || 0,
      passRate: attemptStats?.passRate || 0,
      highestScore: highScore?.highestScore || 0,
    };
  }
}

// Quiz Question CRUD Operations
export class QuizQuestionService {
  // Create Quiz Question
  static async createQuizQuestion(data: CreateQuizQuestionData) {
    const [question] = await db.insert(quizQuestions)
      .values(data)
      .returning();

    return question;
  }

  // Get Quiz Question by ID
  static async getQuizQuestionById(id: string, includeCorrectAnswer = true) {
    const [question] = await db.select()
      .from(quizQuestions)
      .where(eq(quizQuestions.id, id))
      .limit(1);

    if (question && !includeCorrectAnswer) {
      // Remove correct answer for student view
      const { correctAnswer, ...questionWithoutAnswer } = question;
      return questionWithoutAnswer;
    }

    return question;
  }

  // Get Questions by Quiz
  static async getQuestionsByQuiz(quizId: string, includeCorrectAnswers = true) {
    const questions = await db.select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(asc(quizQuestions.order));

    if (!includeCorrectAnswers) {
      // Remove correct answers for student view
      return questions.map(({ correctAnswer, ...question }) => question);
    }

    return questions;
  }

  // Update Quiz Question
  static async updateQuizQuestion(id: string, data: UpdateQuizQuestionData) {
    const [question] = await db.update(quizQuestions)
      .set(data)
      .where(eq(quizQuestions.id, id))
      .returning();

    return question;
  }

  // Delete Quiz Question
  static async deleteQuizQuestion(id: string) {
    const [question] = await db.delete(quizQuestions)
      .where(eq(quizQuestions.id, id))
      .returning();

    return question;
  }

  // Reorder Questions
  static async reorderQuestions(quizId: string, questionOrders: { id: string; order: number }[]) {
    const results = [];

    for (const { id, order } of questionOrders) {
      const [question] = await db.update(quizQuestions)
        .set({ order })
        .where(and(
          eq(quizQuestions.id, id),
          eq(quizQuestions.quizId, quizId)
        ))
        .returning();

      results.push(question);
    }

    return results;
  }

  // Calculate Total Points for Quiz
  static async getTotalPoints(quizId: string): Promise<number> {
    const questions = await this.getQuestionsByQuiz(quizId);
    return questions.reduce((total, question) => total + (question.points || 0), 0);
  }

  // Grade Question Answer
  static gradeAnswer(question: any, userAnswer: any): { isCorrect: boolean; points: number } {
    const { type, correctAnswer, points = 1 } = question;

    switch (type) {
      case 'multiple_choice':
        const isCorrect = Array.isArray(correctAnswer)
          ? correctAnswer.includes(userAnswer)
          : correctAnswer === userAnswer;
        return { isCorrect, points: isCorrect ? points : 0 };

      case 'true_false':
        const tfCorrect = correctAnswer === userAnswer;
        return { isCorrect: tfCorrect, points: tfCorrect ? points : 0 };

      case 'short_answer':
        // Simple string comparison (case-insensitive)
        const saCorrect = correctAnswer.toLowerCase().trim() === userAnswer.toLowerCase().trim();
        return { isCorrect: saCorrect, points: saCorrect ? points : 0 };

      case 'essay':
        // Essay questions need manual grading
        return { isCorrect: false, points: 0 };

      default:
        return { isCorrect: false, points: 0 };
    }
  }
}

// Quiz Attempt CRUD Operations
export class QuizAttemptService {
  // Create Quiz Attempt
  static async createQuizAttempt(data: CreateQuizAttemptData) {
    const [attempt] = await db.insert(quizAttempts)
      .values(data)
      .returning();

    return attempt;
  }

  // Get Quiz Attempt by ID
  static async getQuizAttemptById(id: string) {
    const [attempt] = await db.select()
      .from(quizAttempts)
      .where(eq(quizAttempts.id, id))
      .limit(1);

    return attempt;
  }

  // Get User's Quiz Attempts
  static async getUserQuizAttempts(userId: string, quizId: string) {
    return await db.select()
      .from(quizAttempts)
      .where(and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.quizId, quizId)
      ))
      .orderBy(desc(quizAttempts.completedAt));
  }

  // Get All Attempts for Quiz
  static async getQuizAttempts(quizId: string, page = 1, pageSize = 50) {
    const offset = (page - 1) * pageSize;

    return await db.select()
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId))
      .orderBy(desc(quizAttempts.completedAt))
      .limit(pageSize)
      .offset(offset);
  }

  // Get User's Best Attempt
  static async getUserBestAttempt(userId: string, quizId: string) {
    const [bestAttempt] = await db.select()
      .from(quizAttempts)
      .where(and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.quizId, quizId)
      ))
      .orderBy(desc(quizAttempts.percentage))
      .limit(1);

    return bestAttempt;
  }

  // Get User's Latest Attempt
  static async getUserLatestAttempt(userId: string, quizId: string) {
    const [latestAttempt] = await db.select()
      .from(quizAttempts)
      .where(and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.quizId, quizId)
      ))
      .orderBy(desc(quizAttempts.completedAt))
      .limit(1);

    return latestAttempt;
  }

  // Check if User Can Take Quiz
  static async canUserTakeQuiz(userId: string, quizId: string): Promise<{ canTake: boolean; attemptsUsed: number; reason?: string }> {
    const quiz = await QuizService.getQuizById(quizId);
    if (!quiz) {
      return { canTake: false, attemptsUsed: 0, reason: 'Quiz not found' };
    }

    const attempts = await this.getUserQuizAttempts(userId, quizId);
    const attemptsUsed = attempts.length;

    if (quiz.maxAttempts && attemptsUsed >= quiz.maxAttempts) {
      return { canTake: false, attemptsUsed, reason: 'Maximum attempts reached' };
    }

    return { canTake: true, attemptsUsed };
  }

  // Submit Quiz Attempt
  static async submitQuizAttempt(
    userId: string,
    quizId: string,
    answers: QuizAttemptAnswer[],
    startedAt: Date
  ) {
    // Get quiz and questions
    const quiz = await QuizService.getQuizWithQuestions(quizId);
    if (!quiz) throw new Error('Quiz not found');

    // Check if user can take quiz
    const { canTake, reason } = await this.canUserTakeQuiz(userId, quizId);
    if (!canTake) {
      throw new Error(reason || 'Cannot take quiz');
    }

    // Grade the answers
    let totalScore = 0;
    let totalPoints = 0;
    const gradedAnswers: Record<string, any> = {};

    for (const question of quiz.questions) {
      const userAnswer = answers.find(a => a.questionId === question.id);
      totalPoints += question.points || 0;

      if (userAnswer) {
        const { isCorrect, points } = QuizQuestionService.gradeAnswer(question, userAnswer.answer);
        totalScore += points;

        gradedAnswers[question.id] = {
          answer: userAnswer.answer,
          isCorrect,
          points,
        };
      } else {
        gradedAnswers[question.id] = {
          answer: null,
          isCorrect: false,
          points: 0,
        };
      }
    }

    const percentage = totalPoints > 0 ? ((totalScore / totalPoints) * 100).toFixed(2) : '0.00';
    const passed = parseFloat(percentage) >= quiz.passingScore;

    // Create attempt record
    const attempt = await this.createQuizAttempt({
      quizId,
      userId,
      score: totalScore,
      totalPoints,
      percentage,
      passed,
      answers: gradedAnswers,
      startedAt,
      completedAt: new Date(),
    });

    return {
      attempt,
      score: totalScore,
      totalPoints,
      percentage,
      passed,
      gradedAnswers,
    };
  }

  // Get User's Quiz Statistics
  static async getUserQuizStats(userId: string, quizId: string) {
    const attempts = await this.getUserQuizAttempts(userId, quizId);
    const bestAttempt = await this.getUserBestAttempt(userId, quizId);

    return {
      totalAttempts: attempts.length,
      bestScore: bestAttempt?.percentage || 0,
      passed: bestAttempt?.passed || false,
      averageScore: attempts.length > 0
        ? attempts.reduce((sum, attempt) => sum + parseFloat(attempt.percentage), 0) / attempts.length
        : 0,
      attempts: attempts.map(attempt => ({
        id: attempt.id,
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        percentage: attempt.percentage,
        passed: attempt.passed,
        completedAt: attempt.completedAt,
      })),
    };
  }

  // Delete Quiz Attempt (Admin only)
  static async deleteQuizAttempt(id: string) {
    const [attempt] = await db.delete(quizAttempts)
      .where(eq(quizAttempts.id, id))
      .returning();

    return attempt;
  }
}