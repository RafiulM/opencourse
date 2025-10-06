import { pgTable, varchar, uuid, boolean, text, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { posts } from "./posts";
import { user } from "./auth";
import { relations } from "drizzle-orm";

export const postComments = pgTable('post_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => user.id, { onDelete: 'cascade' }),

  // Comment content
  content: text('content').notNull(), // Plain text or markdown content
  editedContent: text('edited_content'), // Stores previous versions for edit history

  // Thread structure for nested comments
  parentId: uuid('parent_id').references(() => postComments.id, { onDelete: 'cascade' }), // For replies
  level: integer('level').default(0).notNull(), // Nesting level (0 = top-level comment)

  // Moderation and status
  isEdited: boolean('is_edited').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(), // Soft delete
  isReported: boolean('is_reported').default(false).notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(), // Pinned comments appear first

  // Engagement metrics
  likeCount: integer('like_count').default(0).notNull(),
  replyCount: integer('reply_count').default(0).notNull(),

  // Moderation metadata
  moderatedBy: text('moderated_by').references(() => user.id), // Who moderated this comment
  moderatedAt: timestamp('moderated_at', { withTimezone: true }),
  moderationReason: text('moderation_reason'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  postIdx: index('post_comments_post_idx').on(table.postId),
  authorIdx: index('post_comments_author_idx').on(table.authorId),
  parentIdx: index('post_comments_parent_idx').on(table.parentId),
  levelIdx: index('post_comments_level_idx').on(table.level),
  pinnedIdx: index('post_comments_pinned_idx').on(table.isPinned.desc()),
  likeCountIdx: index('post_comments_like_count_idx').on(table.likeCount.desc()),
  createdAtIdx: index('post_comments_created_at_idx').on(table.createdAt.asc()), // Oldest first by default
  deletedIdx: index('post_comments_deleted_idx').on(table.isDeleted),
}));

// Comment likes table
export const commentLikes = pgTable('comment_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  commentId: uuid('comment_id').notNull().references(() => postComments.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),

  // Optional metadata about the like
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueCommentLike: uniqueIndex('comment_likes_unique').on(table.commentId, table.userId),
  commentIdx: index('comment_likes_comment_idx').on(table.commentId),
  userIdx: index('comment_likes_user_idx').on(table.userId),
  createdAtIdx: index('comment_likes_created_at_idx').on(table.createdAt.desc()),
}));

// Relations
export const postCommentsRelations = relations(postComments, ({ one, many }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  author: one(user, {
    fields: [postComments.authorId],
    references: [user.id],
  }),
  parent: one(postComments, {
    fields: [postComments.parentId],
    references: [postComments.id],
    relationName: 'commentReplies',
  }),
  replies: many(postComments, { relationName: 'commentReplies' }),
  likes: many(commentLikes),
  moderatedByUser: one(user, {
    fields: [postComments.moderatedBy],
    references: [user.id],
  }),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(postComments, {
    fields: [commentLikes.commentId],
    references: [postComments.id],
  }),
  user: one(user, {
    fields: [commentLikes.userId],
    references: [user.id],
  }),
}));