import { pgTable, varchar, uuid, boolean, text, integer, timestamp, index, uniqueIndex, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { communities } from "./community";
import { user } from "./auth";
import { uploads } from "./uploads";
import { relations } from "drizzle-orm";

export const postTypeEnum = pgEnum('post_type', ['general', 'announcement', 'discussion', 'resource']);

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  communityId: uuid('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => user.id, { onDelete: 'cascade' }),

  // Content fields
  title: varchar('title', { length: 255 }),
  content: text('content'), // Main text content (markdown supported)
  excerpt: varchar('excerpt', { length: 500 }), // Auto-generated or manual excerpt

  // Visibility and engagement
  isPublished: boolean('is_published').default(true).notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(), // Pinned posts appear first
  isFeatured: boolean('is_featured').default(false).notNull(), // Featured posts in community
  viewCount: integer('view_count').default(0).notNull(),
  likeCount: integer('like_count').default(0).notNull(),
  commentCount: integer('comment_count').default(0).notNull(),

  // SEO and discovery
  slug: varchar('slug', { length: 255 }), // Community-unique slug
  tags: jsonb('tags').default([]), // Array of tag strings

  // Post type and settings
  postType: postTypeEnum('post_type').default('general').notNull(),
  allowComments: boolean('allow_comments').default(true).notNull(),
  isModerated: boolean('is_moderated').default(false).notNull(), // Requires moderator approval

  // Metadata
  metadata: jsonb('metadata').default({}), // Additional post metadata

  // Timestamps
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // Soft delete
}, (table) => ({
  communityIdx: index('posts_community_idx').on(table.communityId),
  authorIdx: index('posts_author_idx').on(table.authorId),
  publishedIdx: index('posts_published_idx').on(table.isPublished),
  publishedAtIdx: index('posts_published_at_idx').on(table.publishedAt),
  communitySlugUnique: uniqueIndex('posts_community_slug_unique').on(table.communityId, table.slug),
  likeCountIdx: index('posts_like_count_idx').on(table.likeCount.desc()),
  featuredIdx: index('posts_featured_idx').on(table.isFeatured.desc()),
  postTypeIdx: index('posts_post_type_idx').on(table.postType),
}));

// Post attachments table
export const postAttachmentTypeEnum = pgEnum('post_attachment_type', [
  'image', 'video', 'file', 'audio', 'document'
]);

export const postAttachments = pgTable('post_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  uploadId: uuid('upload_id').notNull().references(() => uploads.id, { onDelete: 'cascade' }),

  // Attachment metadata
  type: postAttachmentTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }), // Optional title for the attachment
  description: text('description'), // Optional description
  caption: text('caption'), // Caption for the attachment

  // Ordering for multiple attachments
  order: integer('order').notNull().default(0),

  // Display settings
  isPrimary: boolean('is_primary').default(false).notNull(), // Primary/thumbnail attachment

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  postIdx: index('post_attachments_post_idx').on(table.postId),
  uploadIdx: index('post_attachments_upload_idx').on(table.uploadId),
  postOrderIdx: index('post_attachments_post_order_idx').on(table.postId, table.order),
  primaryIdx: index('post_attachments_primary_idx').on(table.isPrimary),
}));

// Post likes table
export const postLikes = pgTable('post_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),

  // Optional metadata about the like
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniquePostLike: uniqueIndex('post_likes_unique').on(table.postId, table.userId),
  postIdx: index('post_likes_post_idx').on(table.postId),
  userIdx: index('post_likes_user_idx').on(table.userId),
  createdAtIdx: index('post_likes_created_at_idx').on(table.createdAt.desc()),
}));

// Relations
export const postsRelations = relations(posts, ({ one, many }) => ({
  community: one(communities, {
    fields: [posts.communityId],
    references: [communities.id],
  }),
  author: one(user, {
    fields: [posts.authorId],
    references: [user.id],
  }),
  attachments: many(postAttachments),
  likes: many(postLikes),
}));

export const postAttachmentsRelations = relations(postAttachments, ({ one }) => ({
  post: one(posts, {
    fields: [postAttachments.postId],
    references: [posts.id],
  }),
  upload: one(uploads, {
    fields: [postAttachments.uploadId],
    references: [uploads.id],
  }),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(user, {
    fields: [postLikes.userId],
    references: [user.id],
  }),
}));