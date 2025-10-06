import { db } from '../db';
import { communities, communityMembers, communityRoleEnum, communityPrivacyEnum } from '../db/schema/community';
import { eq, and, desc, asc, count, ilike, gte, lte, or } from 'drizzle-orm';

export interface CreateCommunityData {
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  banner?: string;
  avatar?: string;
  privacy?: 'public' | 'private' | 'invite_only';
  settings?: Record<string, any>;
  createdBy: string;
}

export interface UpdateCommunityData {
  name?: string;
  slug?: string;
  domain?: string;
  description?: string;
  banner?: string;
  avatar?: string;
  privacy?: 'public' | 'private' | 'invite_only';
  settings?: Record<string, any>;
}

export interface CreateCommunityMemberData {
  communityId: string;
  userId: string;
  role?: 'owner' | 'moderator' | 'member';
}

export interface UpdateCommunityMemberData {
  role?: 'owner' | 'moderator' | 'member';
}

export interface CommunityQueryOptions {
  page?: number;
  pageSize?: number;
  filters?: {
    privacy?: 'public' | 'private' | 'invite_only';
    createdBy?: string;
    isVerified?: boolean;
    memberCount?: { min?: number; max?: number };
    createdAt?: { start?: Date; end?: Date };
    updatedAt?: { start?: Date; end?: Date };
  };
  search?: string;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
}

// Community CRUD Operations
export class CommunityService {
  // Create Community
  static async createCommunity(data: CreateCommunityData) {
    const communitiesResult = await db.insert(communities)
      .values({
        ...data,
        memberCount: 1, // Creator is first member
      })
      .returning();

    const community = communitiesResult[0];

    // Add creator as owner
    await db.insert(communityMembers).values({
      communityId: community.id,
      userId: data.createdBy,
      role: 'owner',
    });

    return community;
  }

  // Get Community by ID
  static async getCommunityById(id: string, userId?: string) {
    const [community] = await db.select()
      .from(communities)
      .where(eq(communities.id, id))
      .limit(1);

    if (!community) {
      return null;
    }

    // If community is private, check if user is a member
    if (community.privacy === 'private' && userId) {
      const isMember = await CommunityMemberService.isMember(userId, id);
      if (!isMember) {
        return null;
      }
    }

    return community;
  }

  // Get Community by Slug
  static async getCommunityBySlug(slug: string, userId?: string) {
    const [community] = await db.select()
      .from(communities)
      .where(eq(communities.slug, slug))
      .limit(1);

    if (!community) {
      return null;
    }

    // If community is private, check if user is a member
    if (community.privacy === 'private' && userId) {
      const isMember = await CommunityMemberService.isMember(userId, community.id);
      if (!isMember) {
        return null;
      }
    }

    return community;
  }

  // Get All Communities (with advanced filtering, sorting, and search)
  static async getAllCommunities(options: CommunityQueryOptions = {}) {
    const {
      page = 1,
      pageSize = 20,
      filters = {},
      search,
      sort = [{ field: 'createdAt', order: 'desc' }]
    } = options;

    const query = db.select().from(communities);
    const dynamicQuery = query.$dynamic();

    // Apply filters
    if (filters.privacy) {
      dynamicQuery.where(eq(communities.privacy, filters.privacy));
    }

    if (filters.createdBy) {
      dynamicQuery.where(eq(communities.createdBy, filters.createdBy));
    }

    if (filters.isVerified !== undefined) {
      dynamicQuery.where(eq(communities.isVerified, filters.isVerified));
    }

    if (filters.memberCount) {
      if (filters.memberCount.min !== undefined) {
        dynamicQuery.where(gte(communities.memberCount, filters.memberCount.min));
      }
      if (filters.memberCount.max !== undefined) {
        dynamicQuery.where(lte(communities.memberCount, filters.memberCount.max));
      }
    }

    if (filters.createdAt) {
      if (filters.createdAt.start) {
        dynamicQuery.where(gte(communities.createdAt, filters.createdAt.start));
      }
      if (filters.createdAt.end) {
        dynamicQuery.where(lte(communities.createdAt, filters.createdAt.end));
      }
    }

    if (filters.updatedAt) {
      if (filters.updatedAt.start) {
        dynamicQuery.where(gte(communities.updatedAt, filters.updatedAt.start));
      }
      if (filters.updatedAt.end) {
        dynamicQuery.where(lte(communities.updatedAt, filters.updatedAt.end));
      }
    }

    // Apply search
    if (search) {
      dynamicQuery.where(
        or(
          ilike(communities.name, `%${search}%`),
          ilike(communities.description, `%${search}%`)
        )
      );
    }

    // Get total count
    const countQuery = db.select({ count: count() }).from(communities);
    const dynamicCountQuery = countQuery.$dynamic();

    // Apply same filters to count query
    if (filters.privacy) {
      dynamicCountQuery.where(eq(communities.privacy, filters.privacy));
    }

    if (filters.createdBy) {
      dynamicCountQuery.where(eq(communities.createdBy, filters.createdBy));
    }

    if (filters.isVerified !== undefined) {
      dynamicCountQuery.where(eq(communities.isVerified, filters.isVerified));
    }

    if (filters.memberCount) {
      if (filters.memberCount.min !== undefined) {
        dynamicCountQuery.where(gte(communities.memberCount, filters.memberCount.min));
      }
      if (filters.memberCount.max !== undefined) {
        dynamicCountQuery.where(lte(communities.memberCount, filters.memberCount.max));
      }
    }

    if (filters.createdAt) {
      if (filters.createdAt.start) {
        dynamicCountQuery.where(gte(communities.createdAt, filters.createdAt.start));
      }
      if (filters.createdAt.end) {
        dynamicCountQuery.where(lte(communities.createdAt, filters.createdAt.end));
      }
    }

    if (filters.updatedAt) {
      if (filters.updatedAt.start) {
        dynamicCountQuery.where(gte(communities.updatedAt, filters.updatedAt.start));
      }
      if (filters.updatedAt.end) {
        dynamicCountQuery.where(lte(communities.updatedAt, filters.updatedAt.end));
      }
    }

    // Apply same search to count query
    if (search) {
      dynamicCountQuery.where(
        or(
          ilike(communities.name, `%${search}%`),
          ilike(communities.description, `%${search}%`)
        )
      );
    }

    const [{ count: totalCount }] = await dynamicCountQuery;
    const totalPages = Math.ceil(totalCount / pageSize);

    const offset = (page - 1) * pageSize;

    // Apply sorting
    let orderedQuery = dynamicQuery;
    for (const sortItem of sort) {
      switch (sortItem.field) {
        case 'name':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(communities.name) : desc(communities.name));
          break;
        case 'slug':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(communities.slug) : desc(communities.slug));
          break;
        case 'memberCount':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(communities.memberCount) : desc(communities.memberCount));
          break;
        case 'createdAt':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(communities.createdAt) : desc(communities.createdAt));
          break;
        case 'updatedAt':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(communities.updatedAt) : desc(communities.updatedAt));
          break;
        case 'isVerified':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(communities.isVerified) : desc(communities.isVerified));
          break;
      }
    }

    const results = await orderedQuery
      .limit(pageSize)
      .offset(offset);

    return {
      communities: results,
      totalCount,
      totalPages
    };
  }

  // Update Community
  static async updateCommunity(id: string, data: UpdateCommunityData, userId: string) {
    // Check if user is owner or moderator
    const member = await CommunityMemberService.getMemberByUserAndCommunity(userId, id);
    if (!member || !['owner', 'moderator'].includes(member.role)) {
      throw new Error('Unauthorized: Only owners and moderators can update communities');
    }

    const [community] = await db.update(communities)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(communities.id, id))
      .returning();

    return community;
  }

  // Delete Community
  static async deleteCommunity(id: string, userId: string) {
    // Check if user is owner
    const member = await CommunityMemberService.getMemberByUserAndCommunity(userId, id);
    if (!member || member.role !== 'owner') {
      throw new Error('Unauthorized: Only owners can delete communities');
    }

    const communitiesResult = await db.delete(communities)
      .where(eq(communities.id, id))
      .returning();

    return communitiesResult[0];
  }

  // Get Communities by User
  static async getCommunitiesByUser(userId: string) {
    return await db.select({
      id: communities.id,
      name: communities.name,
      slug: communities.slug,
      description: communities.description,
      avatar: communities.avatar,
      privacy: communities.privacy,
      memberCount: communities.memberCount,
      role: communityMembers.role,
      joinedAt: communityMembers.joinedAt,
    })
      .from(communities)
      .innerJoin(communityMembers, eq(communities.id, communityMembers.communityId))
      .where(eq(communityMembers.userId, userId))
      .orderBy(desc(communityMembers.joinedAt));
  }
}

// Community Member CRUD Operations
export class CommunityMemberService {
  // Add Member to Community
  static async addMember(data: CreateCommunityMemberData) {
    const [member] = await db.insert(communityMembers)
      .values(data)
      .returning();

    // Update member count
    await db.update(communities)
      .set({
        memberCount: count(communityMembers.id),
        updatedAt: new Date(),
      })
      .where(eq(communities.id, data.communityId));

    return member;
  }

  // Get Community Members
  static async getCommunityMembers(communityId: string, page = 1, pageSize = 50) {
    // Get total count
    const [{ count: totalCount }] = await db.select({ count: count() })
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId));
    const totalPages = Math.ceil(totalCount / pageSize);

    const offset = (page - 1) * pageSize;

    const results = await db.select({
      id: communityMembers.id,
      userId: communityMembers.userId,
      role: communityMembers.role,
      joinedAt: communityMembers.joinedAt,
    })
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId))
      .orderBy(desc(communityMembers.joinedAt))
      .limit(pageSize)
      .offset(offset);

    return {
      members: results,
      totalCount,
      totalPages
    };
  }

  // Get Member by User and Community
  static async getMemberByUserAndCommunity(userId: string, communityId: string) {
    const [member] = await db.select()
      .from(communityMembers)
      .where(and(
        eq(communityMembers.userId, userId),
        eq(communityMembers.communityId, communityId)
      ))
      .limit(1);

    return member;
  }

  // Update Member Role
  static async updateMemberRole(id: string, data: UpdateCommunityMemberData, requestUserId: string) {
    // Get the member to be updated
    const [targetMember] = await db.select()
      .from(communityMembers)
      .where(eq(communityMembers.id, id))
      .limit(1);

    if (!targetMember) {
      return null;
    }

    // Check if requesting user is owner or moderator of the community
    const requestMember = await CommunityMemberService.getMemberByUserAndCommunity(requestUserId, targetMember.communityId);
    if (!requestMember || !['owner', 'moderator'].includes(requestMember.role)) {
      throw new Error('Unauthorized: Only owners and moderators can update member roles');
    }

    // Only owners can make someone else an owner
    if (data.role === 'owner' && requestMember.role !== 'owner') {
      throw new Error('Unauthorized: Only owners can assign owner role');
    }

    const [member] = await db.update(communityMembers)
      .set(data)
      .where(eq(communityMembers.id, id))
      .returning();

    return member;
  }

  // Remove Member from Community
  static async removeMember(id: string, requestUserId: string) {
    // Get the member to be removed
    const [targetMember] = await db.select()
      .from(communityMembers)
      .where(eq(communityMembers.id, id))
      .limit(1);

    if (!targetMember) {
      return null;
    }

    // Check if requesting user is removing themselves or is owner/moderator
    const requestMember = await CommunityMemberService.getMemberByUserAndCommunity(requestUserId, targetMember.communityId);

    // Users can remove themselves, owners can remove anyone, moderators can remove non-owners
    const canRemove =
      targetMember.userId === requestUserId || // removing themselves
      (requestMember && requestMember.role === 'owner') || // owner removing anyone
      (requestMember && requestMember.role === 'moderator' && targetMember.role !== 'owner'); // moderator removing non-owner

    if (!canRemove) {
      throw new Error('Unauthorized: You cannot remove this member');
    }

    const [member] = await db.delete(communityMembers)
      .where(eq(communityMembers.id, id))
      .returning();

    if (member) {
      // Update member count
      await db.update(communities)
        .set({
          memberCount: count(communityMembers.id),
          updatedAt: new Date(),
        })
        .where(eq(communities.id, member.communityId));
    }

    return member;
  }

  // Check if User is Member of Community
  static async isMember(userId: string, communityId: string): Promise<boolean> {
    const [member] = await db.select({ id: communityMembers.id })
      .from(communityMembers)
      .where(and(
        eq(communityMembers.userId, userId),
        eq(communityMembers.communityId, communityId)
      ))
      .limit(1);

    return !!member;
  }

  // Get Member Count
  static async getMemberCount(communityId: string): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId));

    return result?.count || 0;
  }
}