import { pgTable, uuid, varchar, text, integer, boolean, jsonb, timestamp, index, decimal, pgEnum } from "drizzle-orm/pg-core";
import { courses, courseModules } from "./course";
import { user } from "./auth";
import { relations } from "drizzle-orm";

export const questionTypeEnum = pgEnum('question_type', ['multiple_choice', 'true_false', 'short_answer', 'essay']);

export const quizzes = pgTable('quizzes', {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    moduleId: uuid('module_id').references(() => courseModules.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    passingScore: integer('passing_score').default(70).notNull(), // percentage
    timeLimit: integer('time_limit'), // in minutes
    maxAttempts: integer('max_attempts').default(3),
    order: integer('order').notNull(),
    isPublished: boolean('is_published').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    courseIdx: index('quizzes_course_idx').on(table.courseId),
    moduleIdx: index('quizzes_module_idx').on(table.moduleId),
}));

export const quizQuestions = pgTable('quiz_questions', {
    id: uuid('id').primaryKey().defaultRandom(),
    quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
    type: questionTypeEnum('type').notNull(),
    question: text('question').notNull(),
    options: jsonb('options').default([]), // For multiple choice
    correctAnswer: jsonb('correct_answer').notNull(),
    explanation: text('explanation'),
    points: integer('points').default(1).notNull(),
    order: integer('order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    quizOrderIdx: index('quiz_questions_quiz_order_idx').on(table.quizId, table.order),
}));

export const quizAttempts = pgTable('quiz_attempts', {
    id: uuid('id').primaryKey().defaultRandom(),
    quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(),
    totalPoints: integer('total_points').notNull(),
    percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
    passed: boolean('passed').notNull(),
    answers: jsonb('answers').notNull(), // Store user's answers
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),
}, (table) => ({
    userQuizIdx: index('quiz_attempts_user_quiz_idx').on(table.userId, table.quizId),
    quizIdx: index('quiz_attempts_quiz_idx').on(table.quizId),
}));


export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
    course: one(courses, {
        fields: [quizzes.courseId],
        references: [courses.id],
    }),
    module: one(courseModules, {
        fields: [quizzes.moduleId],
        references: [courseModules.id],
    }),
    questions: many(quizQuestions),
    attempts: many(quizAttempts),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
    quiz: one(quizzes, {
        fields: [quizQuestions.quizId],
        references: [quizzes.id],
    }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
    quiz: one(quizzes, {
        fields: [quizAttempts.quizId],
        references: [quizzes.id],
    }),
    user: one(user, {
        fields: [quizAttempts.userId],
        references: [user.id],
    }),
}));