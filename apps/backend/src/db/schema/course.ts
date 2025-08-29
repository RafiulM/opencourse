import { pgTable, varchar, uuid, text, decimal, boolean, integer, jsonb, timestamp, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { communities } from "./community";
import { user } from "./auth";
import { enrollments, materialProgress } from "./enrollment";
import { quizzes } from "./quiz";
import { uploads } from "./uploads";
import { relations } from "drizzle-orm";

export const materialTypeEnum = pgEnum('material_type', ['video', 'text', 'file', 'link']);

export const courses = pgTable('courses', {
    id: uuid('id').primaryKey().defaultRandom(),
    communityId: uuid('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    thumbnail: text('thumbnail'), // Direct URL for backward compatibility
    thumbnailUploadId: uuid('thumbnail_upload_id').references(() => uploads.id),
    price: decimal('price', { precision: 10, scale: 2 }).default('0'),
    isPublished: boolean('is_published').default(false).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    duration: integer('duration'), // in minutes
    difficulty: varchar('difficulty', { length: 50 }),
    prerequisites: jsonb('prerequisites').default([]),
    learningOutcomes: jsonb('learning_outcomes').default([]),
    instructorId: text('instructor_id').notNull().references(() => user.id),
    enrollmentCount: integer('enrollment_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    communitySlugUnique: uniqueIndex('courses_community_slug_unique').on(table.communityId, table.slug),
    communityIdx: index('courses_community_idx').on(table.communityId),
    instructorIdx: index('courses_instructor_idx').on(table.instructorId),
    publishedIdx: index('courses_published_idx').on(table.isPublished),
}));

export const courseModules = pgTable('course_modules', {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    thumbnail: text('thumbnail'), // Direct URL for module thumbnails
    thumbnailUploadId: uuid('thumbnail_upload_id').references(() => uploads.id),
    order: integer('order').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    courseOrderIdx: index('course_modules_course_order_idx').on(table.courseId, table.order),
}));

export const courseMaterials = pgTable('course_materials', {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id').notNull().references(() => courseModules.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    type: materialTypeEnum('type').notNull(),
    content: text('content'), // For text content
    url: text('url'), // For video/file URLs - backward compatibility
    fileUploadId: uuid('file_upload_id').references(() => uploads.id), // Reference to uploaded file
    metadata: jsonb('metadata').default({}), // Store additional info like video duration, file size, etc.
    order: integer('order').notNull(),
    duration: integer('duration'), // in minutes (for videos)
    isPreview: boolean('is_preview').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    moduleOrderIdx: index('course_materials_module_order_idx').on(table.moduleId, table.order),
}));


export const coursesRelations = relations(courses, ({ one, many }) => ({
    community: one(communities, {
        fields: [courses.communityId],
        references: [communities.id],
    }),
    instructor: one(user, {
        fields: [courses.instructorId],
        references: [user.id],
    }),
    modules: many(courseModules),
    enrollments: many(enrollments),
    quizzes: many(quizzes),
    uploads: many(uploads),
    thumbnailUpload: one(uploads, {
        fields: [courses.thumbnailUploadId],
        references: [uploads.id],
    }),
}));

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
    course: one(courses, {
        fields: [courseModules.courseId],
        references: [courses.id],
    }),
    materials: many(courseMaterials),
    quizzes: many(quizzes),
    uploads: many(uploads),
    thumbnailUpload: one(uploads, {
        fields: [courseModules.thumbnailUploadId],
        references: [uploads.id],
    }),
}));

export const courseMaterialsRelations = relations(courseMaterials, ({ one, many }) => ({
    module: one(courseModules, {
        fields: [courseMaterials.moduleId],
        references: [courseModules.id],
    }),
    progress: many(materialProgress),
    uploads: many(uploads),
    fileUpload: one(uploads, {
        fields: [courseMaterials.fileUploadId],
        references: [uploads.id],
    }),
}));

