import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { courseMaterials, courses } from "./course";
import { user } from "./auth";
import { relations } from "drizzle-orm";

export const enrollmentStatusEnum = pgEnum('enrollment_status', ['enrolled', 'completed', 'dropped']);

export const enrollments = pgTable('enrollments', {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    status: enrollmentStatusEnum('status').default('enrolled').notNull(),
    progress: integer('progress').default(0).notNull(), // percentage
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
}, (table) => ({
    userCourseUnique: uniqueIndex('enrollments_user_course_unique').on(table.userId, table.courseId),
    courseIdx: index('enrollments_course_idx').on(table.courseId),
    userIdx: index('enrollments_user_idx').on(table.userId),
    statusIdx: index('enrollments_status_idx').on(table.status),
}));

export const materialProgress = pgTable('material_progress', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    materialId: uuid('material_id').notNull().references(() => courseMaterials.id, { onDelete: 'cascade' }),
    enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
    completed: boolean('completed').default(false).notNull(),
    progress: integer('progress').default(0).notNull(), // For videos: percentage watched
    lastPosition: integer('last_position'), // For videos: last position in seconds
    completedAt: timestamp('completed_at'),
    lastAccessedAt: timestamp('last_accessed_at').defaultNow().notNull(),
}, (table) => ({
    userMaterialUnique: uniqueIndex('material_progress_unique').on(table.userId, table.materialId),
    enrollmentIdx: index('material_progress_enrollment_idx').on(table.enrollmentId),
}));


export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
    course: one(courses, {
        fields: [enrollments.courseId],
        references: [courses.id],
    }),
    user: one(user, {
        fields: [enrollments.userId],
        references: [user.id],
    }),
    materialProgress: many(materialProgress),
}));

export const materialProgressRelations = relations(materialProgress, ({ one }) => ({
    user: one(user, {
        fields: [materialProgress.userId],
        references: [user.id],
    }),
    material: one(courseMaterials, {
        fields: [materialProgress.materialId],
        references: [courseMaterials.id],
    }),
    enrollment: one(enrollments, {
        fields: [materialProgress.enrollmentId],
        references: [enrollments.id],
    }),
}));
