import { db } from '@/db';
import { communities, communityMembers, communityRoleEnum, communityPrivacyEnum } from '@/db/schema/community';
import { eq, and, desc, count } from 'drizzle-orm';

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

// Community CRUD Operations
export class CommunityService {
  // Create Community
  static async createCommunity(data: CreateCommunityData) {
    const [community] = await db.insert(communities)
      .values({
        ...data,
        memberCount: 1, // Creator is first member
      })
      .returning();

    // Add creator as owner
    await db.insert(communityMembers).values({
      communityId: community.id,
      userId: data.createdBy,
      role: 'owner',
    });

    return community;
  }

  // Get Community by ID
  static async getCommunityById(id: string) {
    const [community] = await db.select()
      .from(communities)
      .where(eq(communities.id, id))
      .limit(1);

    return community;
  }

  // Get Community by Slug
  static async getCommunityBySlug(slug: string) {
    const [community] = await db.select()
      .from(communities)
      .where(eq(communities.slug, slug))
      .limit(1);

    return community;
  }

  // Get All Communities (with pagination)
  static async getAllCommunities(page = 1, pageSize = 20, privacy?: 'public' | 'private' | 'invite_only') {
    const query = db.select().from(communities);

    const dynamicQuery = query.$dynamic();

    if (privacy) {
      dynamicQuery.where(eq(communities.privacy, privacy));
    }

    const offset = (page - 1) * pageSize;
    const results = await dynamicQuery
      .orderBy(desc(communities.createdAt))
      .limit(pageSize)
      .offset(offset);

    return results;
  }

  // Update Community
  static async updateCommunity(id: string, data: UpdateCommunityData) {
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
  static async deleteCommunity(id: string) {
    const [community] = await db.delete(communities)
      .where(eq(communities.id, id))
      .returning();

    return community;
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
    const offset = (page - 1) * pageSize;

    return await db.select({
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
  static async updateMemberRole(id: string, data: UpdateCommunityMemberData) {
    const [member] = await db.update(communityMembers)
      .set(data)
      .where(eq(communityMembers.id, id))
      .returning();

    return member;
  }

  // Remove Member from Community
  static async removeMember(id: string) {
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