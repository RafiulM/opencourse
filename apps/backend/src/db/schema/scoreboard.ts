import { pgTable, uuid, varchar, text, jsonb, integer, decimal, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core"
import { user } from "./auth"
import { communities } from "./community"
import { courses } from "./course"
import { relations } from "drizzle-orm"

export const userScores = pgTable('user_scores', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    communityId: uuid('community_id').references(() => communities.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
    totalPoints: integer('total_points').default(0).notNull(),
    coursesCompleted: integer('courses_completed').default(0).notNull(),
    quizzesPassed: integer('quizzes_passed').default(0).notNull(),
    averageQuizScore: decimal('average_quiz_score', { precision: 5, scale: 2 }),
    streak: integer('streak').default(0).notNull(), // Days of consecutive activity
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userCommunityUnique: uniqueIndex('user_scores_user_community_unique').on(table.userId, table.communityId),
    userCourseUnique: uniqueIndex('user_scores_user_course_unique').on(table.userId, table.courseId),
    communityPointsIdx: index('user_scores_community_points_idx').on(table.communityId, table.totalPoints),
    coursePointsIdx: index('user_scores_course_points_idx').on(table.courseId, table.totalPoints),
}))

export const achievements = pgTable('achievements', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    icon: text('icon'),
    criteria: jsonb('criteria').notNull(), // Define achievement criteria
    points: integer('points').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const userAchievements = pgTable('user_achievements', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    achievementId: uuid('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
    earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userAchievementUnique: uniqueIndex('user_achievements_unique').on(table.userId, table.achievementId),
    userIdx: index('user_achievements_user_idx').on(table.userId),
}))




export const userScoresRelations = relations(userScores, ({ one }) => ({
    user: one(user, {
        fields: [userScores.userId],
        references: [user.id],
    }),
    community: one(communities, {
        fields: [userScores.communityId],
        references: [communities.id],
    }),
    course: one(courses, {
        fields: [userScores.courseId],
        references: [courses.id],
    }),
}))

export const achievementsRelations = relations(achievements, ({ many }) => ({
    userAchievements: many(userAchievements),
}))

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
    user: one(user, {
        fields: [userAchievements.userId],
        references: [user.id],
    }),
    achievement: one(achievements, {
        fields: [userAchievements.achievementId],
        references: [achievements.id],
    }),
}))