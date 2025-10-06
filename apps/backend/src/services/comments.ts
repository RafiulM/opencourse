import { db } from '../db';
import { postComments, commentLikes, posts, communities, communityMembers, user } from '../db/schema';
import { eq, and, desc, asc, count, ilike, gte, lte, or, isNull, sql } from 'drizzle-orm';

export interface CreateCommentData {
  content: string;
  parentId?: string; // For replies to other comments
}

export interface UpdateCommentData {
  content: string;
}

export interface CommentQueryOptions {
  page?: number;
  pageSize?: number;
  filters?: {
    postId?: string;
    authorId?: string;
    parentId?: string;
    isDeleted?: boolean;
    isReported?: boolean;
    isPinned?: boolean;
    level?: number;
    includeReplies?: boolean;
    createdAt?: { start?: Date; end?: Date };
    updatedAt?: { start?: Date; end?: Date };
  };
  search?: string;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

class CommentService {
  // Create new comment
  static async createComment(postId: string, authorId: string, data: CreateCommentData) {
    // Check if post exists and allows comments
    const [post] = await db
      .select({
        id: posts.id,
        communityId: posts.communityId,
        allowComments: posts.allowComments,
        isModerated: posts.isModerated,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      throw new Error('Post not found');
    }

    if (!post.allowComments) {
      throw new Error('Comments are not allowed on this post');
    }

    // Check if user is member of the community
    const [membership] = await db
      .select()
      .from(communityMembers)
      .where(and(
        eq(communityMembers.communityId, post.communityId),
        eq(communityMembers.userId, authorId)
      ))
      .limit(1);

    if (!membership) {
      throw new Error('User must be a member of the community to comment');
    }

    let level = 0;
    let parentComment = null;

    // Check parent comment if provided
    if (data.parentId) {
      [parentComment] = await db
        .select()
        .from(postComments)
        .where(and(
          eq(postComments.id, data.parentId),
          eq(postComments.postId, postId),
          isNull(postComments.deletedAt)
        ))
        .limit(1);

      if (!parentComment) {
        throw new Error('Parent comment not found');
      }

      // Limit nesting depth to 5 levels
      level = Math.min(parentComment.level + 1, 5);
    }

    const now = new Date();

    const insertResult = await db.insert(postComments).values({
      postId,
      authorId,
      content: data.content,
      parentId: data.parentId,
      level,
      isEdited: false,
      isDeleted: false,
      isReported: false,
      isPinned: false,
      likeCount: 0,
      replyCount: 0,
      isModerated: post.isModerated && membership.role === 'member',
      createdAt: now,
      updatedAt: now,
    }).returning();

    const comment = insertResult[0];

    // Update parent comment's reply count if this is a reply
    if (data.parentId) {
      await db
        .update(postComments)
        .set({
          replyCount: sql`${postComments.replyCount} + 1`,
          updatedAt: now,
        })
        .where(eq(postComments.id, data.parentId));

      // Update post's comment count
      await db
        .update(posts)
        .set({
          commentCount: sql`${posts.commentCount} + 1`,
          updatedAt: now,
        })
        .where(eq(posts.id, postId));
    } else {
      // Update post's comment count for top-level comment
      await db
        .update(posts)
        .set({
          commentCount: sql`${posts.commentCount} + 1`,
          updatedAt: now,
        })
        .where(eq(posts.id, postId));
    }

    return await this.getCommentById(comment.id);
  }

  // Get comments for post with threading
  static async getPostComments(postId: string, options: CommentQueryOptions = {}) {
    const {
      page = 1,
      pageSize = 20,
      filters = {},
      search,
      sort = [{ field: 'createdAt', order: 'asc' }] // Oldest first for comments
    } = options;

    const offset = (page - 1) * pageSize;

    const query = db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        authorId: postComments.authorId,
        content: postComments.content,
        editedContent: postComments.editedContent,
        parentId: postComments.parentId,
        level: postComments.level,
        isEdited: postComments.isEdited,
        isDeleted: postComments.isDeleted,
        isReported: postComments.isReported,
        isPinned: postComments.isPinned,
        likeCount: postComments.likeCount,
        replyCount: postComments.replyCount,
        moderatedBy: postComments.moderatedBy,
        moderatedAt: postComments.moderatedAt,
        moderationReason: postComments.moderationReason,
        createdAt: postComments.createdAt,
        updatedAt: postComments.updatedAt,
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(postComments)
      .innerJoin(user, eq(postComments.authorId, user.id))
      .$dynamic();

    // Apply base conditions
    const baseConditions = [
      eq(postComments.postId, postId),
      isNull(postComments.deletedAt)
    ];

    query.where(and(...baseConditions));

    // Apply filters
    if (filters.authorId) {
      query.where(and(...baseConditions, eq(postComments.authorId, filters.authorId)));
    }
    if (filters.parentId) {
      query.where(and(...baseConditions, eq(postComments.parentId, filters.parentId)));
    } else {
      // If no parent filter, only get top-level comments by default
      if (!filters.includeReplies) {
        query.where(and(...baseConditions, isNull(postComments.parentId)));
      }
    }
    if (filters.level !== undefined) {
      query.where(and(...baseConditions, eq(postComments.level, filters.level)));
    }
    if (filters.isPinned !== undefined) {
      query.where(and(...baseConditions, eq(postComments.isPinned, filters.isPinned)));
    }

    // Apply search
    if (search) {
      query.where(and(...baseConditions,
        ilike(postComments.content, `%${search}%`)
      ));
    }

    // Get total count
    const countQuery = db
      .select({ count: count() })
      .from(postComments)
      .where(and(...baseConditions));

    const dynamicCountQuery = countQuery.$dynamic();

    // Apply same filters to count query
    if (filters.authorId) {
      dynamicCountQuery.where(and(...baseConditions, eq(postComments.authorId, filters.authorId)));
    }
    if (filters.parentId) {
      dynamicCountQuery.where(and(...baseConditions, eq(postComments.parentId, filters.parentId)));
    } else if (!filters.includeReplies) {
      dynamicCountQuery.where(and(...baseConditions, isNull(postComments.parentId)));
    }

    const [{ count: totalCount }] = await dynamicCountQuery;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Apply sorting with pinned comments first
    let orderedQuery = query;
    orderedQuery = orderedQuery.orderBy(
      desc(postComments.isPinned),
      ...sort.map(sortItem => {
        switch (sortItem.field) {
          case 'createdAt':
            return sortItem.order === 'asc' ? asc(postComments.createdAt) : desc(postComments.createdAt);
          case 'updatedAt':
            return sortItem.order === 'asc' ? asc(postComments.updatedAt) : desc(postComments.updatedAt);
          case 'likeCount':
            return sortItem.order === 'asc' ? asc(postComments.likeCount) : desc(postComments.likeCount);
          default:
            return asc(postComments.createdAt);
        }
      })
    );

    const results = await orderedQuery
      .limit(pageSize)
      .offset(offset);

    return {
      data: results,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize
    };
  }

  // Get single comment by ID
  static async getCommentById(id: string) {
    const [comment] = await db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        authorId: postComments.authorId,
        content: postComments.content,
        editedContent: postComments.editedContent,
        parentId: postComments.parentId,
        level: postComments.level,
        isEdited: postComments.isEdited,
        isDeleted: postComments.isDeleted,
        isReported: postComments.isReported,
        isPinned: postComments.isPinned,
        likeCount: postComments.likeCount,
        replyCount: postComments.replyCount,
        moderatedBy: postComments.moderatedBy,
        moderatedAt: postComments.moderatedAt,
        moderationReason: postComments.moderationReason,
        createdAt: postComments.createdAt,
        updatedAt: postComments.updatedAt,
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        post: {
          id: posts.id,
          title: posts.title,
          communityId: posts.communityId,
        },
        moderatedByUser: {
          id: user.id,
          name: user.name,
        },
      })
      .from(postComments)
      .innerJoin(user, eq(postComments.authorId, user.id))
      .innerJoin(posts, eq(postComments.postId, posts.id))
      .leftJoin(user, eq(postComments.moderatedBy, user.id))
      .where(eq(postComments.id, id))
      .limit(1);

    if (!comment) {
      return null;
    }

    return comment;
  }

  // Update comment (author only)
  static async updateComment(id: string, userId: string, data: UpdateCommentData) {
    const comment = await this.getCommentById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new Error('Only the author can edit this comment');
    }

    if (comment.isDeleted) {
      throw new Error('Cannot edit a deleted comment');
    }

    const now = new Date();

    const [updatedComment] = await db
      .update(postComments)
      .set({
        content: data.content,
        editedContent: comment.content, // Store original content
        isEdited: true,
        updatedAt: now,
      })
      .where(eq(postComments.id, id))
      .returning();

    return await this.getCommentById(updatedComment.id);
  }

  // Delete comment (author/admin/moderator only)
  static async deleteComment(id: string, userId: string, role?: string) {
    const comment = await this.getCommentById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const canDelete = comment.authorId === userId ||
                     ['admin', 'owner', 'moderator'].includes(role || '');

    if (!canDelete) {
      throw new Error('Insufficient permissions to delete this comment');
    }

    const now = new Date();

    await db
      .update(postComments)
      .set({
        isDeleted: true,
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(postComments.id, id));

    // Update parent comment's reply count if this is a reply
    if (comment.parentId) {
      await db
        .update(postComments)
        .set({
          replyCount: sql`CASE WHEN ${postComments.replyCount} > 0 THEN ${postComments.replyCount} - 1 ELSE 0 END`,
          updatedAt: now,
        })
        .where(eq(postComments.id, comment.parentId));
    }

    // Update post's comment count
    await db
      .update(posts)
      .set({
        commentCount: sql`CASE WHEN ${posts.commentCount} > 0 THEN ${posts.commentCount} - 1 ELSE 0 END`,
        updatedAt: now,
      })
      .where(eq(posts.id, comment.postId));
  }

  // Like/unlike comment
  static async toggleCommentLike(commentId: string, userId: string) {
    const comment = await this.getCommentById(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user already liked the comment
    const [existingLike] = await db
      .select()
      .from(commentLikes)
      .where(and(
        eq(commentLikes.commentId, commentId),
        eq(commentLikes.userId, userId)
      ))
      .limit(1);

    let liked: boolean;
    let likeCount: number;

    if (existingLike) {
      // Unlike
      await db.delete(commentLikes).where(eq(commentLikes.id, existingLike.id));
      liked = false;
      likeCount = comment.likeCount - 1;
    } else {
      // Like
      await db.insert(commentLikes).values({
        commentId,
        userId,
        createdAt: new Date(),
      });
      liked = true;
      likeCount = comment.likeCount + 1;
    }

    // Update like count on comment
    await db
      .update(postComments)
      .set({ likeCount })
      .where(eq(postComments.id, commentId));

    return { liked, likeCount };
  }

  // Pin/unpin comment (author/admin/moderator only)
  static async togglePinComment(id: string, userId: string, role?: string) {
    const comment = await this.getCommentById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const canPin = comment.authorId === userId ||
                   ['admin', 'owner', 'moderator'].includes(role || '');

    if (!canPin) {
      throw new Error('Insufficient permissions to pin this comment');
    }

    const newPinnedState = !comment.isPinned;

    await db
      .update(postComments)
      .set({
        isPinned: newPinnedState,
        updatedAt: new Date(),
      })
      .where(eq(postComments.id, id));

    return { isPinned: newPinnedState };
  }

  // Report comment for moderation
  static async reportComment(id: string, reporterId: string, reason?: string) {
    const comment = await this.getCommentById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    await db
      .update(postComments)
      .set({
        isReported: true,
        updatedAt: new Date(),
      })
      .where(eq(postComments.id, id));

    return { success: true };
  }

  // Moderate comment (admin/moderator only)
  static async moderateComment(
    id: string,
    moderatorId: string,
    action: 'delete' | 'restore' | 'clear_report',
    reason?: string
  ) {
    const comment = await this.getCommentById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const now = new Date();
    let updateData: any = {
      moderatedBy: moderatorId,
      moderatedAt: now,
      moderationReason: reason,
      updatedAt: now,
    };

    switch (action) {
      case 'delete':
        updateData.isDeleted = true;
        updateData.deletedAt = now;
        break;
      case 'restore':
        updateData.isDeleted = false;
        updateData.deletedAt = null;
        updateData.isReported = false;
        break;
      case 'clear_report':
        updateData.isReported = false;
        break;
    }

    const [updatedComment] = await db
      .update(postComments)
      .set(updateData)
      .where(eq(postComments.id, id))
      .returning();

    return await this.getCommentById(updatedComment.id);
  }

  // Get replies to comment
  static async getCommentReplies(commentId: string, options: CommentQueryOptions = {}) {
    const modifiedOptions = {
      ...options,
      filters: {
        ...options.filters,
        parentId: commentId,
        includeReplies: true
      }
    };

    // Get the post ID for this comment
    const [parentComment] = await db
      .select({ postId: postComments.postId })
      .from(postComments)
      .where(eq(postComments.id, commentId))
      .limit(1);

    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    return await this.getPostComments(parentComment.postId, modifiedOptions);
  }

  // Get user's comments
  static async getUserComments(userId: string, options: CommentQueryOptions = {}) {
    const {
      page = 1,
      pageSize = 20,
      filters = {},
      sort = [{ field: 'createdAt', order: 'desc' }]
    } = options;

    const offset = (page - 1) * pageSize;

    const baseConditions = [
      eq(postComments.authorId, userId),
      isNull(postComments.deletedAt)
    ];

    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(postComments)
      .where(and(...baseConditions));

    const totalPages = Math.ceil(totalCount / pageSize);

    const results = await db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        authorId: postComments.authorId,
        content: postComments.content,
        parentId: postComments.parentId,
        level: postComments.level,
        isEdited: postComments.isEdited,
        isPinned: postComments.isPinned,
        likeCount: postComments.likeCount,
        replyCount: postComments.replyCount,
        createdAt: postComments.createdAt,
        updatedAt: postComments.updatedAt,
        post: {
          id: posts.id,
          title: posts.title,
          communityId: posts.communityId,
        },
        community: {
          id: communities.id,
          name: communities.name,
          slug: communities.slug,
        }
      })
      .from(postComments)
      .innerJoin(posts, eq(postComments.postId, posts.id))
      .innerJoin(communities, eq(posts.communityId, communities.id))
      .where(and(...baseConditions))
      .orderBy(desc(postComments.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      data: results,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize
    };
  }

  // Get user's liked comments
  static async getUserLikedComments(userId: string, options: CommentQueryOptions = {}) {
    const {
      page = 1,
      pageSize = 20,
      sort = [{ field: 'createdAt', order: 'desc' }]
    } = options;

    const offset = (page - 1) * pageSize;

    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(commentLikes)
      .where(and(
        eq(commentLikes.userId, userId),
        isNull(postComments.deletedAt)
      ))
      .innerJoin(postComments, eq(commentLikes.commentId, postComments.id));

    const totalPages = Math.ceil(totalCount / pageSize);

    const results = await db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        authorId: postComments.authorId,
        content: postComments.content,
        parentId: postComments.parentId,
        level: postComments.level,
        isEdited: postComments.isEdited,
        isPinned: postComments.isPinned,
        likeCount: postComments.likeCount,
        replyCount: postComments.replyCount,
        createdAt: postComments.createdAt,
        updatedAt: postComments.updatedAt,
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        post: {
          id: posts.id,
          title: posts.title,
          communityId: posts.communityId,
        },
        community: {
          id: communities.id,
          name: communities.name,
          slug: communities.slug,
        },
        likedAt: commentLikes.createdAt
      })
      .from(commentLikes)
      .innerJoin(postComments, eq(commentLikes.commentId, postComments.id))
      .innerJoin(user, eq(postComments.authorId, user.id))
      .innerJoin(posts, eq(postComments.postId, posts.id))
      .innerJoin(communities, eq(posts.communityId, communities.id))
      .where(and(
        eq(commentLikes.userId, userId),
        isNull(postComments.deletedAt)
      ))
      .orderBy(desc(commentLikes.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      data: results,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize
    };
  }

  // Get reported comments for moderation
  static async getReportedComments(options: CommentQueryOptions = {}) {
    const {
      page = 1,
      pageSize = 20,
      filters = {},
      sort = [{ field: 'createdAt', order: 'desc' }]
    } = options;

    const offset = (page - 1) * pageSize;

    const baseConditions = [
      eq(postComments.isReported, true),
      isNull(postComments.deletedAt)
    ];

    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(postComments)
      .where(and(...baseConditions));

    const totalPages = Math.ceil(totalCount / pageSize);

    const results = await db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        authorId: postComments.authorId,
        content: postComments.content,
        parentId: postComments.parentId,
        level: postComments.level,
        isEdited: postComments.isEdited,
        isPinned: postComments.isPinned,
        likeCount: postComments.likeCount,
        replyCount: postComments.replyCount,
        moderatedBy: postComments.moderatedBy,
        moderatedAt: postComments.moderatedAt,
        moderationReason: postComments.moderationReason,
        createdAt: postComments.createdAt,
        updatedAt: postComments.updatedAt,
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        post: {
          id: posts.id,
          title: posts.title,
          communityId: posts.communityId,
        },
        community: {
          id: communities.id,
          name: communities.name,
          slug: communities.slug,
        },
        moderatedByUser: {
          id: user.id,
          name: user.name,
        },
      })
      .from(postComments)
      .innerJoin(user, eq(postComments.authorId, user.id))
      .innerJoin(posts, eq(postComments.postId, posts.id))
      .innerJoin(communities, eq(posts.communityId, communities.id))
      .leftJoin(user, eq(postComments.moderatedBy, user.id))
      .where(and(...baseConditions))
      .orderBy(desc(postComments.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      data: results,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize
    };
  }
}

export { CommentService };