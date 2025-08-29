import { pgTable, varchar, uuid, text, integer, timestamp, index, pgEnum, jsonb, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { communities } from "./community";
import { courses, courseModules, courseMaterials } from "./course";
import { relations } from "drizzle-orm";

export const uploadTypeEnum = pgEnum('upload_type', [
  'community_avatar', 
  'community_banner', 
  'course_thumbnail', 
  'module_thumbnail',
  'material_video', 
  'material_file', 
  'material_document',
  'user_avatar'
]);

export const uploadStatusEnum = pgEnum('upload_status', [
  'uploading', 
  'processing', 
  'completed', 
  'failed', 
  'deleted'
]);

// Central uploads table to track all file uploads to R2
export const uploads = pgTable('uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(), // Generated unique filename
  fileSize: integer('file_size').notNull(), // Size in bytes
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  uploadType: uploadTypeEnum('upload_type').notNull(),
  status: uploadStatusEnum('status').default('uploading').notNull(),
  
  // R2 specific fields
  r2Key: varchar('r2_key', { length: 500 }).notNull(), // Full R2 object key
  r2Bucket: varchar('r2_bucket', { length: 100 }).notNull(),
  r2Url: text('r2_url'), // Public URL if applicable
  r2PresignedUrl: text('r2_presigned_url'), // Temporary signed URL for uploads
  r2PresignedExpiresAt: timestamp('r2_presigned_expires_at'),
  
  // Metadata and processing info
  metadata: jsonb('metadata').default({}), // Store additional file metadata (dimensions, duration, etc.)
  processingInfo: jsonb('processing_info').default({}), // Store processing results, thumbnails, etc.
  
  // Associations - nullable because not all uploads are immediately associated
  communityId: uuid('community_id').references(() => communities.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').references(() => courseModules.id, { onDelete: 'cascade' }),
  materialId: uuid('material_id').references(() => courseMaterials.id, { onDelete: 'cascade' }),
  
  // Audit fields
  uploadedBy: text('uploaded_by').notNull().references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // Soft delete
}, (table) => ({
  uploaderIdx: index('uploads_uploader_idx').on(table.uploadedBy),
  statusIdx: index('uploads_status_idx').on(table.status),
  typeIdx: index('uploads_type_idx').on(table.uploadType),
  communityIdx: index('uploads_community_idx').on(table.communityId),
  courseIdx: index('uploads_course_idx').on(table.courseId),
  moduleIdx: index('uploads_module_idx').on(table.moduleId),
  materialIdx: index('uploads_material_idx').on(table.materialId),
  r2KeyIdx: index('uploads_r2_key_idx').on(table.r2Key),
}));

// Upload sessions for managing multi-part uploads or batch operations
export const uploadSessions = pgTable('upload_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  uploadType: uploadTypeEnum('upload_type').notNull(),
  status: uploadStatusEnum('status').default('uploading').notNull(),
  
  // Association context
  communityId: uuid('community_id').references(() => communities.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').references(() => courseModules.id, { onDelete: 'cascade' }),
  materialId: uuid('material_id').references(() => courseMaterials.id, { onDelete: 'cascade' }),
  
  // Session metadata
  metadata: jsonb('metadata').default({}),
  totalFiles: integer('total_files').default(1).notNull(),
  completedFiles: integer('completed_files').default(0).notNull(),
  failedFiles: integer('failed_files').default(0).notNull(),
  
  // Audit fields
  createdBy: text('created_by').notNull().references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), // Session expiry
}, (table) => ({
  sessionTokenIdx: index('upload_sessions_token_idx').on(table.sessionToken),
  createdByIdx: index('upload_sessions_created_by_idx').on(table.createdBy),
  statusIdx: index('upload_sessions_status_idx').on(table.status),
  expiresIdx: index('upload_sessions_expires_idx').on(table.expiresAt),
}));

// Relations
export const uploadsRelations = relations(uploads, ({ one }) => ({
  uploader: one(user, {
    fields: [uploads.uploadedBy],
    references: [user.id],
  }),
  community: one(communities, {
    fields: [uploads.communityId],
    references: [communities.id],
  }),
  course: one(courses, {
    fields: [uploads.courseId],
    references: [courses.id],
  }),
  module: one(courseModules, {
    fields: [uploads.moduleId],
    references: [courseModules.id],
  }),
  material: one(courseMaterials, {
    fields: [uploads.materialId],
    references: [courseMaterials.id],
  }),
}));

export const uploadSessionsRelations = relations(uploadSessions, ({ one, many }) => ({
  creator: one(user, {
    fields: [uploadSessions.createdBy],
    references: [user.id],
  }),
  community: one(communities, {
    fields: [uploadSessions.communityId],
    references: [communities.id],
  }),
  course: one(courses, {
    fields: [uploadSessions.courseId],
    references: [courses.id],
  }),
  module: one(courseModules, {
    fields: [uploadSessions.moduleId],
    references: [courseModules.id],
  }),
  material: one(courseMaterials, {
    fields: [uploadSessions.materialId],
    references: [courseMaterials.id],
  }),
}));