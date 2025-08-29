import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { relations } from "drizzle-orm";
import { courses } from "./course";
import { uploads } from "./uploads";

export const communityRoleEnum = pgEnum('community_role', ['owner', 'moderator', 'member']);
export const communityPrivacyEnum = pgEnum('community_privacy', ['public', 'private', 'invite_only']);

export const communities = pgTable('communities', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    domain: varchar('domain', { length: 255 }).unique(), // Custom domain support
    description: text('description'),
    banner: text('banner'), // Direct URL for backward compatibility
    avatar: text('avatar'), // Direct URL for backward compatibility
    bannerUploadId: uuid('banner_upload_id').references(() => uploads.id),
    avatarUploadId: uuid('avatar_upload_id').references(() => uploads.id),
    privacy: communityPrivacyEnum('privacy').default('public').notNull(),
    settings: jsonb('settings').default({}),
    // Removed customization fields related to drag-and-drop/page building
    memberCount: integer('member_count').default(0).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(), // For custom domains
    createdBy: text('created_by').notNull().references(() => user.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    createdByIdx: index('communities_created_by_idx').on(table.createdBy),
}));

export const communityMembers = pgTable('community_members', {
    id: uuid('id').primaryKey().defaultRandom(),
    communityId: uuid('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    role: communityRoleEnum('role').default('member').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    uniqueMember: uniqueIndex('community_members_unique').on(table.communityId, table.userId),
    userIdx: index('community_members_user_idx').on(table.userId),
    communityIdx: index('community_members_community_idx').on(table.communityId),
}));


export const communitiesRelations = relations(communities, ({ one, many }) => ({
    creator: one(user, {
        fields: [communities.createdBy],
        references: [user.id],
    }),
    members: many(communityMembers),
    courses: many(courses),
    uploads: many(uploads),
    bannerUpload: one(uploads, {
        fields: [communities.bannerUploadId],
        references: [uploads.id],
    }),
    avatarUpload: one(uploads, {
        fields: [communities.avatarUploadId],
        references: [uploads.id],
    }),
}));

export const communityMembersRelations = relations(communityMembers, ({ one }) => ({
    community: one(communities, {
        fields: [communityMembers.communityId],
        references: [communities.id],
    }),
    user: one(user, {
        fields: [communityMembers.userId],
        references: [user.id],
    }),
}));
