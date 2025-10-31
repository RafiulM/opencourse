import { db } from "../db"
import {
  communities,
  communityMembers,
  communityRoleEnum,
  communityPrivacyEnum,
} from "../db/schema/community"
import {
  eq,
  and,
  desc,
  asc,
  count,
  ilike,
  gte,
  lte,
  or,
  sql,
} from "drizzle-orm"

export interface CreateCommunityData {
  name: string
  slug: string
  domain?: string
  description?: string
  banner?: string
  avatar?: string
  privacy?: "public" | "private" | "invite_only"
  settings?: Record<string, any>
  createdBy: string
}

export interface UpdateCommunityData {
  name?: string
  slug?: string
  domain?: string
  description?: string
  banner?: string
  avatar?: string
  privacy?: "public" | "private" | "invite_only"
  settings?: Record<string, any>
}

export interface CreateCommunityMemberData {
  communityId: string
  userId: string
  role?: "owner" | "moderator" | "member"
}

export interface UpdateCommunityMemberData {
  role?: "owner" | "moderator" | "member"
}

export interface CommunityQueryOptions {
  page?: number
  pageSize?: number
  filters?: {
    privacy?: "public" | "private" | "invite_only"
    createdBy?: string
    isVerified?: boolean
    memberCount?: { min?: number; max?: number }
    createdAt?: { start?: Date; end?: Date }
    updatedAt?: { start?: Date; end?: Date }
  }
  search?: string
  sort?: Array<{ field: string; order: "asc" | "desc" }>
}

// Community CRUD Operations
export class CommunityService {
  // Create Community
  static async createCommunity(data: CreateCommunityData) {
    const communitiesResult = await db
      .insert(communities)
      .values(data)
      .returning()

    const community = communitiesResult[0]

    // Add creator as owner
    await db.insert(communityMembers).values({
      communityId: community.id,
      userId: data.createdBy,
      role: "owner",
    })

    // Return community with computed memberCount
    return this.getCommunityById(community.id, data.createdBy)
  }

  // Get Community by ID
  static async getCommunityById(id: string, userId?: string) {
    const [result] = await db
      .select({
        id: communities.id,
        name: communities.name,
        slug: communities.slug,
        domain: communities.domain,
        description: communities.description,
        banner: communities.banner,
        avatar: communities.avatar,
        bannerUploadId: communities.bannerUploadId,
        avatarUploadId: communities.avatarUploadId,
        privacy: communities.privacy,
        settings: communities.settings,
        isVerified: communities.isVerified,
        createdBy: communities.createdBy,
        createdAt: communities.createdAt,
        updatedAt: communities.updatedAt,
        memberCount: sql<number>`COALESCE(${sql`(
          SELECT COUNT(*)::int
          FROM ${communityMembers}
          WHERE ${communityMembers.communityId} = ${communities.id}
        )`}, 0)`,
      })
      .from(communities)
      .where(eq(communities.id, id))
      .limit(1)

    if (!result) {
      return null
    }

    // If community is private, check if user is a member
    if (result.privacy === "private" && userId) {
      const isMember = await CommunityMemberService.isMember(userId, id)
      if (!isMember) {
        return null
      }
    }

    return result
  }

  // Get Community by Slug
  static async getCommunityBySlug(slug: string, userId?: string) {
    const [result] = await db
      .select({
        id: communities.id,
        name: communities.name,
        slug: communities.slug,
        domain: communities.domain,
        description: communities.description,
        banner: communities.banner,
        avatar: communities.avatar,
        bannerUploadId: communities.bannerUploadId,
        avatarUploadId: communities.avatarUploadId,
        privacy: communities.privacy,
        settings: communities.settings,
        isVerified: communities.isVerified,
        createdBy: communities.createdBy,
        createdAt: communities.createdAt,
        updatedAt: communities.updatedAt,
        memberCount: sql<number>`COALESCE(${sql`(
          SELECT COUNT(*)::int
          FROM ${communityMembers}
          WHERE ${communityMembers.communityId} = ${communities.id}
        )`}, 0)`,
      })
      .from(communities)
      .where(eq(communities.slug, slug))
      .limit(1)

    if (!result) {
      return null
    }

    // If community is private, check if user is a member
    if (result.privacy === "private" && userId) {
      const isMember = await CommunityMemberService.isMember(userId, result.id)
      if (!isMember) {
        return null
      }
    }

    return result
  }

  // Get All Communities (with advanced filtering, sorting, and search)
  static async getAllCommunities(options: CommunityQueryOptions = {}) {
    const {
      page = 1,
      pageSize = 20,
      filters = {},
      search,
      sort = [{ field: "createdAt", order: "desc" }],
    } = options

    // Build query with computed memberCount
    const baseSelect = {
      id: communities.id,
      name: communities.name,
      slug: communities.slug,
      domain: communities.domain,
      description: communities.description,
      banner: communities.banner,
      avatar: communities.avatar,
      bannerUploadId: communities.bannerUploadId,
      avatarUploadId: communities.avatarUploadId,
      privacy: communities.privacy,
      settings: communities.settings,
      isVerified: communities.isVerified,
      createdBy: communities.createdBy,
      createdAt: communities.createdAt,
      updatedAt: communities.updatedAt,
      memberCount: sql<number>`COALESCE(${sql`(
        SELECT COUNT(*)::int
        FROM ${communityMembers}
        WHERE ${communityMembers.communityId} = ${communities.id}
      )`}, 0)`,
    }

    const query = db.select(baseSelect).from(communities)
    const dynamicQuery = query.$dynamic()

    // Apply filters
    if (filters.privacy) {
      dynamicQuery.where(eq(communities.privacy, filters.privacy))
    }

    if (filters.createdBy) {
      dynamicQuery.where(eq(communities.createdBy, filters.createdBy))
    }

    if (filters.isVerified !== undefined) {
      dynamicQuery.where(eq(communities.isVerified, filters.isVerified))
    }

    if (filters.createdAt) {
      if (filters.createdAt.start) {
        dynamicQuery.where(gte(communities.createdAt, filters.createdAt.start))
      }
      if (filters.createdAt.end) {
        dynamicQuery.where(lte(communities.createdAt, filters.createdAt.end))
      }
    }

    if (filters.updatedAt) {
      if (filters.updatedAt.start) {
        dynamicQuery.where(gte(communities.updatedAt, filters.updatedAt.start))
      }
      if (filters.updatedAt.end) {
        dynamicQuery.where(lte(communities.updatedAt, filters.updatedAt.end))
      }
    }

    // Apply search
    if (search) {
      dynamicQuery.where(
        or(
          ilike(communities.name, `%${search}%`),
          ilike(communities.description, `%${search}%`)
        )
      )
    }

    // For memberCount filtering, we need to use HAVING with a subquery
    // We'll wrap the query in a subquery to enable HAVING clause
    let memberCountFilter: any = null
    if (filters.memberCount) {
      if (filters.memberCount.min !== undefined) {
        memberCountFilter = gte(
          sql<number>`COALESCE(${sql`(
            SELECT COUNT(*)::int
            FROM ${communityMembers}
            WHERE ${communityMembers.communityId} = ${communities.id}
          )`}, 0)`,
          filters.memberCount.min
        )
      }
      if (filters.memberCount.max !== undefined) {
        const maxFilter = lte(
          sql<number>`COALESCE(${sql`(
            SELECT COUNT(*)::int
            FROM ${communityMembers}
            WHERE ${communityMembers.communityId} = ${communities.id}
          )`}, 0)`,
          filters.memberCount.max
        )
        if (memberCountFilter) {
          memberCountFilter = and(memberCountFilter, maxFilter)
        } else {
          memberCountFilter = maxFilter
        }
      }
      if (memberCountFilter) {
        dynamicQuery.where(memberCountFilter)
      }
    }

    // Get total count - we need to use a subquery for accurate count with memberCount filters
    const countQuery = db
      .select({ count: count() })
      .from(
        db
          .select(baseSelect)
          .from(communities)
          .$dynamic()
          .as("communities_with_counts")
      )
    const dynamicCountQuery = countQuery.$dynamic()

    // Apply same filters to count query
    if (filters.privacy) {
      dynamicCountQuery.where(
        sql`(SELECT privacy FROM ${communities} WHERE id = communities_with_counts.id) = ${filters.privacy}`
      )
    }

    if (filters.createdBy) {
      dynamicCountQuery.where(
        sql`(SELECT created_by FROM ${communities} WHERE id = communities_with_counts.id) = ${filters.createdBy}`
      )
    }

    if (filters.isVerified !== undefined) {
      dynamicCountQuery.where(
        sql`(SELECT is_verified FROM ${communities} WHERE id = communities_with_counts.id) = ${filters.isVerified}`
      )
    }

    if (memberCountFilter) {
      dynamicCountQuery.where(memberCountFilter)
    }

    if (filters.createdAt) {
      if (filters.createdAt.start) {
        dynamicCountQuery.where(
          sql`(SELECT created_at FROM ${communities} WHERE id = communities_with_counts.id) >= ${filters.createdAt.start}`
        )
      }
      if (filters.createdAt.end) {
        dynamicCountQuery.where(
          sql`(SELECT created_at FROM ${communities} WHERE id = communities_with_counts.id) <= ${filters.createdAt.end}`
        )
      }
    }

    if (filters.updatedAt) {
      if (filters.updatedAt.start) {
        dynamicCountQuery.where(
          sql`(SELECT updated_at FROM ${communities} WHERE id = communities_with_counts.id) >= ${filters.updatedAt.start}`
        )
      }
      if (filters.updatedAt.end) {
        dynamicCountQuery.where(
          sql`(SELECT updated_at FROM ${communities} WHERE id = communities_with_counts.id) <= ${filters.updatedAt.end}`
        )
      }
    }

    // Apply same search to count query
    if (search) {
      dynamicCountQuery.where(
        or(
          sql`(SELECT name FROM ${communities} WHERE id = communities_with_counts.id) ILIKE ${`%${search}%`}`,
          sql`(SELECT description FROM ${communities} WHERE id = communities_with_counts.id) ILIKE ${`%${search}%`}`
        )
      )
    }

    // Actually, let's use a simpler approach - query all matching communities first, then count
    // This is more efficient than complex subqueries
    const allMatchingCommunities = await dynamicQuery
    const totalCount = allMatchingCommunities.length
    const totalPages = Math.ceil(totalCount / pageSize)

    const offset = (page - 1) * pageSize

    // Apply sorting
    let orderedResults = allMatchingCommunities
    for (const sortItem of sort) {
      orderedResults = orderedResults.sort((a, b) => {
        let aVal: any
        let bVal: any

        switch (sortItem.field) {
          case "name":
            aVal = a.name
            bVal = b.name
            break
          case "slug":
            aVal = a.slug
            bVal = b.slug
            break
          case "memberCount":
            aVal = a.memberCount
            bVal = b.memberCount
            break
          case "createdAt":
            aVal = a.createdAt
            bVal = b.createdAt
            break
          case "updatedAt":
            aVal = a.updatedAt
            bVal = b.updatedAt
            break
          case "isVerified":
            aVal = a.isVerified
            bVal = b.isVerified
            break
          default:
            return 0
        }

        if (aVal < bVal) return sortItem.order === "asc" ? -1 : 1
        if (aVal > bVal) return sortItem.order === "asc" ? 1 : -1
        return 0
      })
    }

    const results = orderedResults.slice(offset, offset + pageSize)

    return {
      communities: results,
      totalCount,
      totalPages,
    }
  }

  // Update Community
  static async updateCommunity(
    id: string,
    data: UpdateCommunityData,
    userId: string
  ) {
    // Check if user is owner or moderator
    const member = await CommunityMemberService.getMemberByUserAndCommunity(
      userId,
      id
    )
    if (!member || !["owner", "moderator"].includes(member.role)) {
      throw new Error(
        "Unauthorized: Only owners and moderators can update communities"
      )
    }

    const [community] = await db
      .update(communities)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(communities.id, id))
      .returning()

    return community
  }

  // Delete Community
  static async deleteCommunity(id: string, userId: string) {
    // Check if user is owner
    const member = await CommunityMemberService.getMemberByUserAndCommunity(
      userId,
      id
    )
    if (!member || member.role !== "owner") {
      throw new Error("Unauthorized: Only owners can delete communities")
    }

    const communitiesResult = await db
      .delete(communities)
      .where(eq(communities.id, id))
      .returning()

    return communitiesResult[0]
  }

  // Get Communities by User
  static async getCommunitiesByUser(userId: string) {
    return await db
      .select({
        id: communities.id,
        name: communities.name,
        slug: communities.slug,
        description: communities.description,
        avatar: communities.avatar,
        privacy: communities.privacy,
        memberCount: sql<number>`COALESCE(${sql`(
          SELECT COUNT(*)::int
          FROM ${communityMembers}
          WHERE ${communityMembers.communityId} = ${communities.id}
        )`}, 0)`,
        role: communityMembers.role,
        joinedAt: communityMembers.joinedAt,
      })
      .from(communities)
      .innerJoin(
        communityMembers,
        eq(communities.id, communityMembers.communityId)
      )
      .where(eq(communityMembers.userId, userId))
      .orderBy(desc(communityMembers.joinedAt))
  }

  // Reconcile Member Count
  static async reconcileMemberCount(
    communityId: string
  ): Promise<{ fixed: boolean; cachedCount: number; actualCount: number }> {
    // Get current cached member count
    const [community] = await db
      .select({ memberCount: communities.memberCount })
      .from(communities)
      .where(eq(communities.id, communityId))
      .limit(1)

    if (!community) {
      throw new Error("Community not found")
    }

    // Calculate actual member count
    const [{ count: actualCount }] = await db
      .select({ count: count() })
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId))
    const cachedCount = community.memberCount

    // If counts don't match, update the cached count
    if (actualCount !== cachedCount) {
      await db
        .update(communities)
        .set({ memberCount: actualCount })
        .where(eq(communities.id, communityId))

      return { fixed: true, cachedCount, actualCount }
    }

    return { fixed: false, cachedCount, actualCount }
  }

  // Reconcile All Member Counts
  static async reconcileAllMemberCounts(): Promise<{
    totalCommunities: number
    fixedCommunities: number
  }> {
    // Get all communities
    const allCommunities = await db
      .select({
        id: communities.id,
        name: communities.name,
        slug: communities.slug,
        cachedMemberCount: communities.memberCount,
      })
      .from(communities)

    let fixedCount = 0

    for (const community of allCommunities) {
      // Calculate actual member count
      const [{ count: actualCount }] = await db
        .select({ count: count() })
        .from(communityMembers)
        .where(eq(communityMembers.communityId, community.id))
      const cachedCount = community.cachedMemberCount

      // If there's a discrepancy, update the cached count
      if (actualCount !== cachedCount) {
        await db
          .update(communities)
          .set({ memberCount: actualCount })
          .where(eq(communities.id, community.id))

        fixedCount++
      }
    }

    return {
      totalCommunities: allCommunities.length,
      fixedCommunities: fixedCount,
    }
  }
}

// Community Member CRUD Operations
export class CommunityMemberService {
  // Add Member to Community
  static async addMember(data: CreateCommunityMemberData) {
    // Use transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Check if user is already a member
      const existingMember = await tx
        .select()
        .from(communityMembers)
        .where(
          and(
            eq(communityMembers.communityId, data.communityId),
            eq(communityMembers.userId, data.userId)
          )
        )
        .limit(1)

      if (existingMember.length > 0) {
        throw new Error("User is already a member of this community")
      }

      // Add the member
      const [member] = await tx
        .insert(communityMembers)
        .values(data)
        .returning()

      return member
    })
  }

  // Get Community Members
  static async getCommunityMembers(
    communityId: string,
    page = 1,
    pageSize = 50
  ) {
    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId))
    const totalPages = Math.ceil(totalCount / pageSize)

    const offset = (page - 1) * pageSize

    const results = await db
      .select({
        id: communityMembers.id,
        userId: communityMembers.userId,
        role: communityMembers.role,
        joinedAt: communityMembers.joinedAt,
      })
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId))
      .orderBy(desc(communityMembers.joinedAt))
      .limit(pageSize)
      .offset(offset)

    return {
      members: results,
      totalCount,
      totalPages,
    }
  }

  // Get Member by User and Community
  static async getMemberByUserAndCommunity(
    userId: string,
    communityId: string
  ) {
    const [member] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, userId),
          eq(communityMembers.communityId, communityId)
        )
      )
      .limit(1)

    return member
  }

  // Update Member Role
  static async updateMemberRole(
    id: string,
    data: UpdateCommunityMemberData,
    requestUserId: string
  ) {
    // Get the member to be updated
    const [targetMember] = await db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.id, id))
      .limit(1)

    if (!targetMember) {
      return null
    }

    // Check if requesting user is owner or moderator of the community
    const requestMember =
      await CommunityMemberService.getMemberByUserAndCommunity(
        requestUserId,
        targetMember.communityId
      )
    if (
      !requestMember ||
      !["owner", "moderator"].includes(requestMember.role)
    ) {
      throw new Error(
        "Unauthorized: Only owners and moderators can update member roles"
      )
    }

    // Only owners can make someone else an owner
    if (data.role === "owner" && requestMember.role !== "owner") {
      throw new Error("Unauthorized: Only owners can assign owner role")
    }

    const [member] = await db
      .update(communityMembers)
      .set(data)
      .where(eq(communityMembers.id, id))
      .returning()

    return member
  }

  // Remove Member from Community
  static async removeMember(id: string, requestUserId: string) {
    // Use transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Get the member to be removed
      const [targetMember] = await tx
        .select()
        .from(communityMembers)
        .where(eq(communityMembers.id, id))
        .limit(1)

      if (!targetMember) {
        return null
      }

      // Check if requesting user is removing themselves or is owner/moderator
      const requestMember = await tx
        .select()
        .from(communityMembers)
        .where(
          and(
            eq(communityMembers.userId, requestUserId),
            eq(communityMembers.communityId, targetMember.communityId)
          )
        )
        .limit(1)

      // Users can remove themselves, owners can remove anyone, moderators can remove non-owners
      const canRemove =
        targetMember.userId === requestUserId || // removing themselves
        (requestMember && requestMember[0]?.role === "owner") || // owner removing anyone
        (requestMember &&
          requestMember[0]?.role === "moderator" &&
          targetMember.role !== "owner") // moderator removing non-owner

      if (!canRemove) {
        throw new Error("Unauthorized: You cannot remove this member")
      }

      // Delete the member
      const [member] = await tx
        .delete(communityMembers)
        .where(eq(communityMembers.id, id))
        .returning()

      return member
    })
  }

  // Check if User is Member of Community
  static async isMember(userId: string, communityId: string): Promise<boolean> {
    const [member] = await db
      .select({ id: communityMembers.id })
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, userId),
          eq(communityMembers.communityId, communityId)
        )
      )
      .limit(1)

    return !!member
  }

  // Get Member Count
  static async getMemberCount(communityId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId))

    return result?.count || 0
  }
}
