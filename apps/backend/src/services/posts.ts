import { db } from "../db"
import {
  posts,
  postLikes,
  postAttachments,
  communities,
  communityMembers,
  user,
} from "../db/schema"
import {
  eq,
  ne,
  and,
  desc,
  asc,
  count,
  ilike,
  gte,
  lte,
  or,
  isNull,
  sql,
  SQL,
} from "drizzle-orm"
import { PostAttachmentService } from "./post-attachments"
import { generateUniqueCommunitySlug } from "../lib/slug"
import { logApiCall, logDatabaseOperation } from "../middleware/logger"

export interface CreatePostData {
  communityId: string
  title?: string
  content?: string
  excerpt?: string
  postType?: "general" | "announcement" | "discussion" | "resource"
  tags?: string[]
  allowComments?: boolean
  visibility?: "community" | "public"
  attachments?: Array<{
    uploadId: string
    type: "image" | "video" | "file" | "audio" | "document"
    title?: string
    description?: string
    caption?: string
    order?: number
    isPrimary?: boolean
  }>
  isPublished?: boolean
  slug?: string
}

export interface UpdatePostData {
  title?: string
  content?: string
  excerpt?: string
  tags?: string[]
  allowComments?: boolean
  visibility?: "community" | "public"
  isPublished?: boolean
  slug?: string
}

export interface PostQueryOptions {
  page?: number
  pageSize?: number
  filters?: {
    communityId?: string
    authorId?: string
    postType?: string
    isPublished?: boolean
    isPinned?: boolean
    isFeatured?: boolean
    tags?: string[]
    createdAt?: { start?: Date; end?: Date }
    updatedAt?: { start?: Date; end?: Date }
  }
  search?: string
  sort?: Array<{ field: string; order: "asc" | "desc" }>
}

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  totalPages: number
  currentPage: number
  pageSize: number
}

class PostService {
  // Helper method to check if user is a community member
  static async isCommunityMember(userId: string, communityId: string): Promise<boolean> {
    if (!userId) return false;

    const membership = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      )
      .limit(1);

    return membership.length > 0;
  }

  // Create new post with attachments in community
  static async createPost(
    authorId: string,
    communityId: string,
    data: CreatePostData
  ) {
    const startTime = Date.now();

    try {
      logApiCall('PostService', 'createPost', { authorId, communityId, data });

      // Verify user is member of community
      logDatabaseOperation('SELECT', 'community_members', { communityId, userId: authorId });

      const membership = await db
        .select()
        .from(communityMembers)
        .where(
          and(
            eq(communityMembers.communityId, communityId),
            eq(communityMembers.userId, authorId)
          )
        )
        .limit(1)

      logDatabaseOperation('SELECT', 'community_members', { result: `Found ${membership.length} memberships` });

      if (membership.length === 0) {
        const error = new Error("User must be a member of the community to create posts");
        logApiCall('PostService', 'createPost', { authorId, communityId, data }, null, error);
        throw error;
      }

    // Check if user can create this type of post
    if (data.postType === "announcement") {
      const userRole = membership[0].role
      if (userRole !== "owner" && userRole !== "moderator") {
        const error = new Error(
          "Only community owners and moderators can create announcements"
        );
        logApiCall('PostService', 'createPost', { authorId, communityId, data, userRole }, null, error);
        throw error;
      }
    }

    // Generate slug if not provided but title is available
    let finalSlug = data.slug
    if (!finalSlug && data.title) {
      logDatabaseOperation('SELECT', 'posts', { operation: 'slug uniqueness check', communityId });

      finalSlug = await generateUniqueCommunitySlug(
        data.title,
        communityId,
        async (slug: string, cid: string) => {
          const existing = await db
            .select({ id: posts.id })
            .from(posts)
            .where(
              and(
                eq(posts.slug, slug),
                eq(posts.communityId, cid),
                isNull(posts.deletedAt)
              )
            )
            .limit(1)
          return existing.length > 0
        }
      )

      logDatabaseOperation('SELECT', 'posts', { operation: 'slug generated', slug: finalSlug });
    }

    const now = new Date()
    const publishedAt = data.isPublished !== false ? now : null

    const postData = {
      communityId,
      authorId,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      postType: data.postType || "general",
      tags: data.tags || [],
      allowComments: data.allowComments !== false,
      visibility: data.visibility || "community",
      isPublished: data.isPublished !== false,
      isPinned: false,
      isFeatured: false,
      slug: finalSlug,
      publishedAt,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    logDatabaseOperation('INSERT', 'posts', postData);

    const [post] = await db
      .insert(posts)
      .values(postData)
      .returning()

    logDatabaseOperation('INSERT', 'posts', { result: `Post created with ID: ${post.id}` });

    // Handle attachments if provided
    if (data.attachments && data.attachments.length > 0) {
      logDatabaseOperation('INSERT', 'post_attachments', { postId: post.id, attachmentsCount: data.attachments.length });
      await PostAttachmentService.addAttachments(post.id, data.attachments)
    }

    const result = await this.getPostById(post.id, authorId);
    const duration = Date.now() - startTime;

    logApiCall('PostService', 'createPost', { authorId, communityId, data }, {
      postId: post.id,
      duration: `${duration}ms`,
      success: true
    });

    return result

    } catch (error) {
      const duration = Date.now() - startTime;
      logApiCall('PostService', 'createPost', { authorId, communityId, data }, null, error as Error);
      logDatabaseOperation('INSERT', 'posts', { error: (error as Error).message, duration: `${duration}ms` });
      throw error;
    }
  }

  // Get community posts with filtering and pagination
  static async getCommunityPosts(
    communityId: string,
    options: PostQueryOptions = {},
    userId?: string
  ) {
    const {
      page = 1,
      pageSize = 20,
      filters = {},
      search,
      sort = [{ field: "createdAt", order: "desc" }],
    } = options

    const offset = (page - 1) * pageSize

    const query = db
      .select({
        id: posts.id,
        communityId: posts.communityId,
        authorId: posts.authorId,
        title: posts.title,
        content: posts.content,
        excerpt: posts.excerpt,
        slug: posts.slug,
        postType: posts.postType,
        tags: posts.tags,
        isPublished: posts.isPublished,
        isPinned: posts.isPinned,
        isFeatured: posts.isFeatured,
        allowComments: posts.allowComments,
        isModerated: posts.isModerated,
        visibility: posts.visibility,
        viewCount: posts.viewCount,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        metadata: posts.metadata,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        community: {
          id: communities.id,
          name: communities.name,
          slug: communities.slug,
        },
      })
      .from(posts)
      .innerJoin(user, eq(posts.authorId, user.id))
      .innerJoin(communities, eq(posts.communityId, communities.id))
      .$dynamic()

    // Apply base conditions
    const baseConditions = [
      eq(posts.communityId, communityId),
      eq(posts.isPublished, true),
      isNull(posts.deletedAt),
    ]

    // Add visibility filtering
    // For community posts page, allow both public and community posts
    // Only filter out private posts for non-members
    if (userId) {
      // Authenticated user - check if member
      const isMember = await this.isCommunityMember(userId, communityId);
      if (!isMember) {
        // Non-member can see public and community posts, but not private posts
        baseConditions.push(or(eq(posts.visibility, 'public'), eq(posts.visibility, 'community')));
      }
      // Members can see all posts (no additional filter needed)
    } else {
      // Unauthenticated user can see public and community posts, but not private posts
      baseConditions.push(or(eq(posts.visibility, 'public'), eq(posts.visibility, 'community')));
    }

    query.where(and(...baseConditions))

    // Apply filters
    if (filters.authorId) {
      query.where(and(...baseConditions, eq(posts.authorId, filters.authorId)))
    }
    if (filters.postType) {
      query.where(
        and(...baseConditions, eq(posts.postType, filters.postType as any))
      )
    }
    if (filters.isPinned !== undefined) {
      query.where(and(...baseConditions, eq(posts.isPinned, filters.isPinned)))
    }
    if (filters.isFeatured !== undefined) {
      query.where(
        and(...baseConditions, eq(posts.isFeatured, filters.isFeatured))
      )
    }
    if (filters.tags && filters.tags.length > 0) {
      query.where(
        and(
          ...baseConditions,
          or(...filters.tags.map((tag) => ilike(posts.tags, `%${tag}%`)))
        )
      )
    }
    if (filters.createdAt) {
      if (filters.createdAt.start) {
        query.where(
          and(...baseConditions, gte(posts.createdAt, filters.createdAt.start))
        )
      }
      if (filters.createdAt.end) {
        query.where(
          and(...baseConditions, lte(posts.createdAt, filters.createdAt.end))
        )
      }
    }

    // Apply search
    if (search) {
      query.where(
        and(
          ...baseConditions,
          or(
            ilike(posts.title, `%${search}%`),
            ilike(posts.content, `%${search}%`),
            ilike(posts.excerpt, `%${search}%`)
          )
        )
      )
    }

    // Get total count - apply the same visibility filtering
    const countBaseConditions = [
      eq(posts.communityId, communityId),
      eq(posts.isPublished, true),
      isNull(posts.deletedAt),
    ]

    // Apply the same visibility logic to count query
    if (userId) {
      // Authenticated user - check if member
      const isMember = await this.isCommunityMember(userId, communityId);
      if (!isMember) {
        // Non-member can see public and community posts, but not private posts
        countBaseConditions.push(or(eq(posts.visibility, 'public'), eq(posts.visibility, 'community')));
      }
      // Members can see all posts (no additional filter needed)
    } else {
      // Unauthenticated user can see public and community posts, but not private posts
      countBaseConditions.push(or(eq(posts.visibility, 'public'), eq(posts.visibility, 'community')));
    }

    const countQuery = db
      .select({ count: count() })
      .from(posts)
      .where(and(...countBaseConditions))

    const dynamicCountQuery = countQuery.$dynamic()

    // Apply same filters to count query
    if (filters.authorId) {
      dynamicCountQuery.where(
        and(...baseConditions, eq(posts.authorId, filters.authorId))
      )
    }
    if (filters.postType) {
      dynamicCountQuery.where(
        and(...baseConditions, eq(posts.postType, filters.postType as any))
      )
    }
    if (filters.isPinned !== undefined) {
      dynamicCountQuery.where(
        and(...baseConditions, eq(posts.isPinned, filters.isPinned))
      )
    }
    if (filters.isFeatured !== undefined) {
      dynamicCountQuery.where(
        and(...baseConditions, eq(posts.isFeatured, filters.isFeatured))
      )
    }

    const [{ count: totalCount }] = await dynamicCountQuery
    const totalPages = Math.ceil(totalCount / pageSize)

    // Apply sorting with priority to pinned/featured posts
    let orderedQuery = query

    // Always sort pinned posts first, then featured, then by specified sort
    orderedQuery = orderedQuery.orderBy(
      desc(posts.isPinned),
      desc(posts.isFeatured),
      ...sort.map((sortItem) => {
        switch (sortItem.field) {
          case "createdAt":
            return sortItem.order === "asc"
              ? asc(posts.createdAt)
              : desc(posts.createdAt)
          case "updatedAt":
            return sortItem.order === "asc"
              ? asc(posts.updatedAt)
              : desc(posts.updatedAt)
          case "title":
            return sortItem.order === "asc"
              ? asc(posts.title)
              : desc(posts.title)
          case "likeCount":
            return sortItem.order === "asc"
              ? asc(posts.likeCount)
              : desc(posts.likeCount)
          case "commentCount":
            return sortItem.order === "asc"
              ? asc(posts.commentCount)
              : desc(posts.commentCount)
          default:
            return desc(posts.createdAt)
        }
      })
    )

    const results = await orderedQuery.limit(pageSize).offset(offset)

    return {
      data: results,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
    }
  }

  // Get posts across communities (admin/moderator use)
  static async getPosts(options: PostQueryOptions = {}, userId?: string) {
    const {
      page = 1,
      pageSize = 20,
      filters = {},
      search,
      sort = [{ field: "createdAt", order: "desc" }],
    } = options

    const offset = (page - 1) * pageSize

    const query = db
      .select({
        id: posts.id,
        communityId: posts.communityId,
        authorId: posts.authorId,
        title: posts.title,
        content: posts.content,
        excerpt: posts.excerpt,
        slug: posts.slug,
        postType: posts.postType,
        tags: posts.tags,
        isPublished: posts.isPublished,
        isPinned: posts.isPinned,
        isFeatured: posts.isFeatured,
        allowComments: posts.allowComments,
        isModerated: posts.isModerated,
        visibility: posts.visibility,
        viewCount: posts.viewCount,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        metadata: posts.metadata,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        community: {
          id: communities.id,
          name: communities.name,
          slug: communities.slug,
        },
      })
      .from(posts)
      .innerJoin(user, eq(posts.authorId, user.id))
      .innerJoin(communities, eq(posts.communityId, communities.id))
      .$dynamic()

    // Apply base conditions
    const baseConditions = [isNull(posts.deletedAt)]

    // For the global posts endpoint used by admin dashboard:
    // - If no userId: only show public posts (public access)
    // - If userId provided: show all posts (for admin use)
    if (!userId) {
      baseConditions.push(eq(posts.visibility, 'public'))
    }
    // Note: When userId is provided, we don't filter by visibility
    // This allows admins to see all posts including drafts and community posts

    query.where(and(...baseConditions))

    // Apply filters
    if (filters.communityId) {
      query.where(
        and(...baseConditions, eq(posts.communityId, filters.communityId))
      )
    }
    if (filters.authorId) {
      query.where(and(...baseConditions, eq(posts.authorId, filters.authorId)))
    }
    if (filters.isPublished !== undefined) {
      query.where(
        and(...baseConditions, eq(posts.isPublished, filters.isPublished))
      )
    }

    // Get total count
    const countBaseConditions = [isNull(posts.deletedAt)]

    // Apply the same visibility logic to count query
    if (!userId) {
      countBaseConditions.push(eq(posts.visibility, 'public'))
    }
    // Note: When userId is provided, we don't filter by visibility for count query either

    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(...countBaseConditions))

    const totalPages = Math.ceil(totalCount / pageSize)

    // Apply sorting
    let orderedQuery = query
    for (const sortItem of sort) {
      switch (sortItem.field) {
        case "createdAt":
          orderedQuery = orderedQuery.orderBy(
            sortItem.order === "asc"
              ? asc(posts.createdAt)
              : desc(posts.createdAt)
          )
          break
        case "updatedAt":
          orderedQuery = orderedQuery.orderBy(
            sortItem.order === "asc"
              ? asc(posts.updatedAt)
              : desc(posts.updatedAt)
          )
          break
        default:
          orderedQuery = orderedQuery.orderBy(desc(posts.createdAt))
          break
      }
    }

    const results = await orderedQuery.limit(pageSize).offset(offset)

    return {
      data: results,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
    }
  }

  // Get single post by slug
  static async getPostBySlug(slug: string, communityId?: string, userId?: string) {
    const query = db
      .select({
        id: posts.id,
        communityId: posts.communityId,
        authorId: posts.authorId,
        title: posts.title,
        content: posts.content,
        excerpt: posts.excerpt,
        slug: posts.slug,
        postType: posts.postType,
        tags: posts.tags,
        isPublished: posts.isPublished,
        isPinned: posts.isPinned,
        isFeatured: posts.isFeatured,
        allowComments: posts.allowComments,
        isModerated: posts.isModerated,
        visibility: posts.visibility,
        viewCount: posts.viewCount,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        metadata: posts.metadata,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        community: {
          id: communities.id,
          name: communities.name,
          slug: communities.slug,
        },
        attachments: {
          id: postAttachments.id,
          uploadId: postAttachments.uploadId,
          type: postAttachments.type,
          title: postAttachments.title,
          description: postAttachments.description,
          caption: postAttachments.caption,
          order: postAttachments.order,
          isPrimary: postAttachments.isPrimary,
        },
      })
      .from(posts)
      .innerJoin(user, eq(posts.authorId, user.id))
      .innerJoin(communities, eq(posts.communityId, communities.id))
      .leftJoin(postAttachments, eq(posts.id, postAttachments.postId))

    let filters: SQL | undefined

    // If communityId is provided, add it to the filter
    if (communityId) {
      filters = and(
        eq(posts.slug, slug),
        eq(posts.communityId, communityId),
        eq(posts.isPublished, true),
        isNull(posts.deletedAt)
      )
    }

    const results = await query
      .where(
        and(
          eq(posts.slug, slug),
          eq(posts.isPublished, true),
          isNull(posts.deletedAt),
          filters
        )
      )
      .orderBy(postAttachments.order)
      .limit(1)

    if (results.length === 0) {
      return null
    }

    const post = results[0]

    // Check visibility access control
    if (post.visibility === 'community') {
      if (!userId) {
        throw new Error('Authentication required for community posts')
      }

      const isMember = await this.isCommunityMember(userId, post.communityId)
      if (!isMember) {
        throw new Error('Access denied - community membership required')
      }
    }
    // Public posts are accessible to everyone

    // Group attachments
    const postWithAttachments = {
      ...post,
      attachments: post.attachments ? [post.attachments] : [],
    }

    return postWithAttachments
  }

  // Get single post by ID
  static async getPostById(id: string, userId?: string) {
    const [post] = await db
      .select({
        id: posts.id,
        communityId: posts.communityId,
        authorId: posts.authorId,
        title: posts.title,
        content: posts.content,
        excerpt: posts.excerpt,
        slug: posts.slug,
        postType: posts.postType,
        tags: posts.tags,
        isPublished: posts.isPublished,
        isPinned: posts.isPinned,
        isFeatured: posts.isFeatured,
        allowComments: posts.allowComments,
        isModerated: posts.isModerated,
        visibility: posts.visibility,
        viewCount: posts.viewCount,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        metadata: posts.metadata,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        community: {
          id: communities.id,
          name: communities.name,
          slug: communities.slug,
        },
        attachments: {
          id: postAttachments.id,
          uploadId: postAttachments.uploadId,
          type: postAttachments.type,
          title: postAttachments.title,
          description: postAttachments.description,
          caption: postAttachments.caption,
          order: postAttachments.order,
          isPrimary: postAttachments.isPrimary,
        },
      })
      .from(posts)
      .innerJoin(user, eq(posts.authorId, user.id))
      .innerJoin(communities, eq(posts.communityId, communities.id))
      .leftJoin(postAttachments, eq(posts.id, postAttachments.postId))
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .orderBy(postAttachments.order)
      .limit(1)

    if (!post) {
      return null
    }

    // Check visibility access control
    if (post.visibility === 'community') {
      if (!userId) {
        throw new Error('Authentication required for community posts')
      }

      const isMember = await this.isCommunityMember(userId, post.communityId)
      if (!isMember) {
        throw new Error('Access denied - community membership required')
      }
    }
    // Public posts are accessible to everyone

    // Group attachments
    const postWithAttachments = {
      ...post,
      attachments: post.attachments ? [post.attachments] : [],
    }

    return postWithAttachments
  }

  // Update post (author/community moderator only)
  static async updatePost(id: string, userId: string, data: UpdatePostData) {
    const post = await this.getPostById(id, userId)
    if (!post) {
      throw new Error("Post not found")
    }

    const permissions = await this.checkPostPermissions(id, userId)
    if (!permissions.canEdit) {
      throw new Error("Insufficient permissions to edit this post")
    }

    const updateData: any = {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      tags: data.tags,
      allowComments: data.allowComments,
      isPublished: data.isPublished,
      slug: data.slug,
      updatedAt: new Date(),
    }
    
    if (data.visibility !== undefined) {
      updateData.visibility = data.visibility
    }

    const [updatedPost] = await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, id))
      .returning()

    return await this.getPostById(updatedPost.id)
  }

  // Delete post (author/community admin only)
  static async deletePost(id: string, userId: string) {
    const post = await this.getPostById(id, userId)
    if (!post) {
      throw new Error("Post not found")
    }

    const permissions = await this.checkPostPermissions(id, userId)
    if (!permissions.canDelete) {
      throw new Error("Insufficient permissions to delete this post")
    }

    await db
      .update(posts)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
  }

  // Like/unlike post
  static async toggleLike(postId: string, userId: string) {
    const post = await this.getPostById(postId, userId)
    if (!post) {
      throw new Error("Post not found")
    }

    // Check if user already liked the post
    const [existingLike] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .limit(1)

    let liked: boolean
    let likeCount: number

    if (existingLike) {
      // Unlike
      await db.delete(postLikes).where(eq(postLikes.id, existingLike.id))
      liked = false
      likeCount = post.likeCount - 1
    } else {
      // Like
      await db.insert(postLikes).values({
        postId,
        userId,
        createdAt: new Date(),
      })
      liked = true
      likeCount = post.likeCount + 1
    }

    // Update like count on post
    await db.update(posts).set({ likeCount }).where(eq(posts.id, postId))

    return { liked, likeCount }
  }

  // Pin/unpin post (community moderator only)
  static async togglePinPost(id: string, userId: string) {
    const post = await this.getPostById(id, userId)
    if (!post) {
      throw new Error("Post not found")
    }

    const permissions = await this.checkPostPermissions(id, userId)
    if (!permissions.canModerate) {
      throw new Error("Insufficient permissions to pin this post")
    }

    const newPinnedState = !post.isPinned

    await db
      .update(posts)
      .set({
        isPinned: newPinnedState,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))

    return { isPinned: newPinnedState }
  }

  // Feature/unfeature post (community admin only)
  static async toggleFeaturePost(id: string, userId: string) {
    const post = await this.getPostById(id, userId)
    if (!post) {
      throw new Error("Post not found")
    }

    const permissions = await this.checkPostPermissions(id, userId)
    if (!permissions.canAdmin) {
      throw new Error("Insufficient permissions to feature this post")
    }

    const newFeaturedState = !post.isFeatured

    await db
      .update(posts)
      .set({
        isFeatured: newFeaturedState,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))

    return { isFeatured: newFeaturedState }
  }

  // Get user's posts
  static async getUserPosts(userId: string, options: PostQueryOptions = {}) {
    const {
      page = 1,
      pageSize = 20,
      filters = {},
      sort = [{ field: "createdAt", order: "desc" }],
    } = options

    const offset = (page - 1) * pageSize

    const baseConditions = [eq(posts.authorId, userId), isNull(posts.deletedAt)]

    if (filters.isPublished !== undefined) {
      baseConditions.push(eq(posts.isPublished, filters.isPublished))
    }

    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(...baseConditions))

    const totalPages = Math.ceil(totalCount / pageSize)

    const results = await db
      .select({
        id: posts.id,
        communityId: posts.communityId,
        authorId: posts.authorId,
        title: posts.title,
        content: posts.content,
        excerpt: posts.excerpt,
        slug: posts.slug,
        postType: posts.postType,
        tags: posts.tags,
        isPublished: posts.isPublished,
        isPinned: posts.isPinned,
        isFeatured: posts.isFeatured,
        allowComments: posts.allowComments,
        visibility: posts.visibility,
        viewCount: posts.viewCount,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        community: {
          id: communities.id,
          name: communities.name,
          slug: communities.slug,
        },
      })
      .from(posts)
      .innerJoin(communities, eq(posts.communityId, communities.id))
      .where(and(...baseConditions))
      .orderBy(desc(posts.createdAt))
      .limit(pageSize)
      .offset(offset)

    return {
      data: results,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
    }
  }

  // Get user's posts in specific community
  static async getUserPostsInCommunity(
    userId: string,
    communityId: string,
    options: PostQueryOptions = {}
  ) {
    const modifiedOptions = {
      ...options,
      filters: {
        ...options.filters,
        authorId: userId,
        communityId,
      },
    }

    return await this.getCommunityPosts(communityId, modifiedOptions)
  }

  // Get user's liked posts
  static async getUserLikedPosts(
    userId: string,
    options: PostQueryOptions = {}
  ) {
    const {
      page = 1,
      pageSize = 20,
      sort = [{ field: "createdAt", order: "desc" }],
    } = options

    const offset = (page - 1) * pageSize

    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(postLikes)
      .where(and(eq(postLikes.userId, userId), isNull(posts.deletedAt)))
      .innerJoin(posts, eq(postLikes.postId, posts.id))

    const totalPages = Math.ceil(totalCount / pageSize)

    const results = await db
      .select({
        id: posts.id,
        communityId: posts.communityId,
        authorId: posts.authorId,
        title: posts.title,
        content: posts.content,
        excerpt: posts.excerpt,
        slug: posts.slug,
        postType: posts.postType,
        tags: posts.tags,
        isPublished: posts.isPublished,
        isPinned: posts.isPinned,
        isFeatured: posts.isFeatured,
        allowComments: posts.allowComments,
        visibility: posts.visibility,
        viewCount: posts.viewCount,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        community: {
          id: communities.id,
          name: communities.name,
          slug: communities.slug,
        },
        likedAt: postLikes.createdAt,
      })
      .from(postLikes)
      .innerJoin(posts, eq(postLikes.postId, posts.id))
      .innerJoin(user, eq(posts.authorId, user.id))
      .innerJoin(communities, eq(posts.communityId, communities.id))
      .where(and(eq(postLikes.userId, userId), isNull(posts.deletedAt)))
      .orderBy(desc(postLikes.createdAt))
      .limit(pageSize)
      .offset(offset)

    return {
      data: results,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
    }
  }

  // Increment view count
  static async incrementViewCount(postId: string) {
    await db
      .update(posts)
      .set({
        viewCount: sql`${posts.viewCount} + 1`,
      })
      .where(eq(posts.id, postId))
  }

  // Check user permissions for post actions
  static async checkPostPermissions(postId: string, userId: string) {
    const post = await db
      .select({
        authorId: posts.authorId,
        communityId: posts.communityId,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1)

    if (!post) {
      throw new Error("Post not found")
    }

    const [membership] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, post[0].communityId),
          eq(communityMembers.userId, userId)
        )
      )
      .limit(1)

    const isAuthor = post[0].authorId === userId
    const userRole = membership?.role || "non-member"

    return {
      canEdit: isAuthor || ["owner", "moderator"].includes(userRole),
      canDelete: isAuthor || ["owner"].includes(userRole),
      canModerate: ["owner", "moderator"].includes(userRole),
      canAdmin: ["owner"].includes(userRole),
    }
  }
}

export { PostService }
