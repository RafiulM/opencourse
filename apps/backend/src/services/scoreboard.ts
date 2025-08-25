import { db } from '@/db';
import { userScores, achievements, userAchievements } from '@/db/schema/scoreboard';
import { eq, and, desc, asc, count, avg, sum, gte, lte } from 'drizzle-orm';

export interface CreateUserScoreData {
  userId: string;
  communityId?: string;
  courseId?: string;
  totalPoints?: number;
  coursesCompleted?: number;
  quizzesPassed?: number;
  averageQuizScore?: string;
  streak?: number;
}

export interface UpdateUserScoreData {
  totalPoints?: number;
  coursesCompleted?: number;
  quizzesPassed?: number;
  averageQuizScore?: string;
  streak?: number;
  lastActivityAt?: Date;
}

export interface CreateAchievementData {
  name: string;
  description?: string;
  icon?: string;
  criteria: Record<string, any>;
  points?: number;
}

export interface UpdateAchievementData {
  name?: string;
  description?: string;
  icon?: string;
  criteria?: Record<string, any>;
  points?: number;
}

export interface CreateUserAchievementData {
  userId: string;
  achievementId: string;
}

// User Scores CRUD Operations
export class UserScoreService {
  // Create User Score
  static async createUserScore(data: CreateUserScoreData) {
    const [userScore] = await db.insert(userScores)
      .values(data)
      .returning();

    return userScore;
  }

  // Get User Score by ID
  static async getUserScoreById(id: string) {
    const [userScore] = await db.select()
      .from(userScores)
      .where(eq(userScores.id, id))
      .limit(1);
    
    return userScore;
  }

  // Get User Score by User and Community
  static async getUserScoreByUserAndCommunity(userId: string, communityId: string) {
    const [userScore] = await db.select()
      .from(userScores)
      .where(and(
        eq(userScores.userId, userId),
        eq(userScores.communityId, communityId)
      ))
      .limit(1);
    
    return userScore;
  }

  // Get User Score by User and Course
  static async getUserScoreByUserAndCourse(userId: string, courseId: string) {
    const [userScore] = await db.select()
      .from(userScores)
      .where(and(
        eq(userScores.userId, userId),
        eq(userScores.courseId, courseId)
      ))
      .limit(1);
    
    return userScore;
  }

  // Get All User Scores for User
  static async getUserScores(userId: string) {
    return await db.select()
      .from(userScores)
      .where(eq(userScores.userId, userId))
      .orderBy(desc(userScores.totalPoints));
  }

  // Update User Score
  static async updateUserScore(id: string, data: UpdateUserScoreData) {
    const [userScore] = await db.update(userScores)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userScores.id, id))
      .returning();
    
    return userScore;
  }

  // Update or Create User Score
  static async upsertUserScore(
    userId: string,
    communityId: string | null,
    courseId: string | null,
    data: Omit<UpdateUserScoreData, 'lastActivityAt'>
  ) {
    let existing;
    
    if (communityId) {
      existing = await this.getUserScoreByUserAndCommunity(userId, communityId);
    } else if (courseId) {
      existing = await this.getUserScoreByUserAndCourse(userId, courseId);
    }
    
    if (existing) {
      return await this.updateUserScore(existing.id, {
        ...data,
        lastActivityAt: new Date(),
      });
    } else {
      return await this.createUserScore({
        userId,
        communityId: communityId || undefined,
        courseId: courseId || undefined,
        ...data,
      });
    }
  }

  // Delete User Score
  static async deleteUserScore(id: string) {
    const [userScore] = await db.delete(userScores)
      .where(eq(userScores.id, id))
      .returning();
    
    return userScore;
  }

  // Add Points to User
  static async addPointsToUser(
    userId: string,
    points: number,
    communityId?: string,
    courseId?: string
  ) {
    const existing = communityId 
      ? await this.getUserScoreByUserAndCommunity(userId, communityId)
      : courseId 
        ? await this.getUserScoreByUserAndCourse(userId, courseId)
        : null;

    if (existing) {
      return await this.updateUserScore(existing.id, {
        totalPoints: existing.totalPoints + points,
        lastActivityAt: new Date(),
      });
    } else {
      return await this.createUserScore({
        userId,
        communityId,
        courseId,
        totalPoints: points,
      });
    }
  }

  // Update Course Completion
  static async updateCourseCompletion(userId: string, communityId?: string) {
    const existing = communityId 
      ? await this.getUserScoreByUserAndCommunity(userId, communityId)
      : null;

    if (existing) {
      return await this.updateUserScore(existing.id, {
        coursesCompleted: existing.coursesCompleted + 1,
        lastActivityAt: new Date(),
      });
    } else if (communityId) {
      return await this.createUserScore({
        userId,
        communityId,
        coursesCompleted: 1,
      });
    }
  }

  // Update Quiz Pass
  static async updateQuizPass(
    userId: string, 
    score: number, 
    communityId?: string,
    courseId?: string
  ) {
    const existing = communityId 
      ? await this.getUserScoreByUserAndCommunity(userId, communityId)
      : courseId 
        ? await this.getUserScoreByUserAndCourse(userId, courseId)
        : null;

    if (existing) {
      // Calculate new average quiz score
      const totalQuizzes = existing.quizzesPassed + 1;
      const currentAverage = existing.averageQuizScore || 0;
      const newAverage = (((parseFloat(currentAverage.toString()) || 0) * existing.quizzesPassed) + score) / totalQuizzes;
      
      return await this.updateUserScore(existing.id, {
        quizzesPassed: existing.quizzesPassed + 1,
        averageQuizScore: newAverage.toFixed(2),
        lastActivityAt: new Date(),
      });
    } else {
      return await this.createUserScore({
        userId,
        communityId,
        courseId,
        quizzesPassed: 1,
        averageQuizScore: score.toFixed(2),
      });
    }
  }

  // Update User Streak
  static async updateUserStreak(userId: string, communityId?: string, courseId?: string) {
    const existing = communityId 
      ? await this.getUserScoreByUserAndCommunity(userId, communityId)
      : courseId 
        ? await this.getUserScoreByUserAndCourse(userId, courseId)
        : null;

    if (existing) {
      const lastActivity = existing.lastActivityAt;
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      let newStreak = existing.streak;
      
      // Check if last activity was yesterday (continue streak) or today (maintain streak)
      if (lastActivity && lastActivity >= yesterday) {
        if (lastActivity.toDateString() === yesterday.toDateString()) {
          newStreak += 1; // Continue streak
        }
        // If last activity was today, maintain current streak
      } else {
        newStreak = 1; // Reset streak
      }
      
      return await this.updateUserScore(existing.id, {
        streak: newStreak,
        lastActivityAt: new Date(),
      });
    } else {
      return await this.createUserScore({
        userId,
        communityId,
        courseId,
        streak: 1,
      });
    }
  }

  // Get Community Leaderboard
  static async getCommunityLeaderboard(communityId: string, page = 1, pageSize = 50) {
    const offset = (page - 1) * pageSize;
    
    return await db.select({
      id: userScores.id,
      userId: userScores.userId,
      totalPoints: userScores.totalPoints,
      coursesCompleted: userScores.coursesCompleted,
      quizzesPassed: userScores.quizzesPassed,
      averageQuizScore: userScores.averageQuizScore,
      streak: userScores.streak,
      lastActivityAt: userScores.lastActivityAt,
    })
    .from(userScores)
    .where(eq(userScores.communityId, communityId))
    .orderBy(desc(userScores.totalPoints), desc(userScores.lastActivityAt))
    .limit(pageSize)
    .offset(offset);
  }

  // Get Course Leaderboard
  static async getCourseLeaderboard(courseId: string, page = 1, pageSize = 50) {
    const offset = (page - 1) * pageSize;
    
    return await db.select({
      id: userScores.id,
      userId: userScores.userId,
      totalPoints: userScores.totalPoints,
      quizzesPassed: userScores.quizzesPassed,
      averageQuizScore: userScores.averageQuizScore,
      lastActivityAt: userScores.lastActivityAt,
    })
    .from(userScores)
    .where(eq(userScores.courseId, courseId))
    .orderBy(desc(userScores.totalPoints), desc(userScores.averageQuizScore))
    .limit(pageSize)
    .offset(offset);
  }

  // Get User Rank in Community
  static async getUserRankInCommunity(userId: string, communityId: string) {
    const userScore = await this.getUserScoreByUserAndCommunity(userId, communityId);
    if (!userScore) return null;

    const [rankResult] = await db.select({ rank: count() })
      .from(userScores)
      .where(and(
        eq(userScores.communityId, communityId),
        gte(userScores.totalPoints, userScore.totalPoints)
      ));

    return rankResult?.rank || null;
  }

  // Get Community Statistics
  static async getCommunityStats(communityId: string) {
    const [stats] = await db.select({
      totalUsers: count(),
      totalPoints: sum(userScores.totalPoints),
      averagePoints: avg(userScores.totalPoints),
      totalCoursesCompleted: sum(userScores.coursesCompleted),
      totalQuizzesPassed: sum(userScores.quizzesPassed),
      averageQuizScore: avg(userScores.averageQuizScore),
    })
    .from(userScores)
    .where(eq(userScores.communityId, communityId));

    return stats || {
      totalUsers: 0,
      totalPoints: 0,
      averagePoints: 0,
      totalCoursesCompleted: 0,
      totalQuizzesPassed: 0,
      averageQuizScore: 0,
    };
  }
}

// Achievement CRUD Operations
export class AchievementService {
  // Create Achievement
  static async createAchievement(data: CreateAchievementData) {
    const [achievement] = await db.insert(achievements)
      .values(data)
      .returning();

    return achievement;
  }

  // Get Achievement by ID
  static async getAchievementById(id: string) {
    const [achievement] = await db.select()
      .from(achievements)
      .where(eq(achievements.id, id))
      .limit(1);
    
    return achievement;
  }

  // Get All Achievements
  static async getAllAchievements(page = 1, pageSize = 50) {
    const offset = (page - 1) * pageSize;
    
    return await db.select()
      .from(achievements)
      .orderBy(desc(achievements.points), asc(achievements.name))
      .limit(pageSize)
      .offset(offset);
  }

  // Update Achievement
  static async updateAchievement(id: string, data: UpdateAchievementData) {
    const [achievement] = await db.update(achievements)
      .set(data)
      .where(eq(achievements.id, id))
      .returning();
    
    return achievement;
  }

  // Delete Achievement
  static async deleteAchievement(id: string) {
    const [achievement] = await db.delete(achievements)
      .where(eq(achievements.id, id))
      .returning();
    
    return achievement;
  }

  // Check if Achievement Criteria is Met
  static checkAchievementCriteria(criteria: Record<string, any>, userStats: any): boolean {
    for (const [key, value] of Object.entries(criteria)) {
      switch (key) {
        case 'totalPoints':
          if (userStats.totalPoints < value) return false;
          break;
        case 'coursesCompleted':
          if (userStats.coursesCompleted < value) return false;
          break;
        case 'quizzesPassed':
          if (userStats.quizzesPassed < value) return false;
          break;
        case 'averageQuizScore':
          if (userStats.averageQuizScore < value) return false;
          break;
        case 'streak':
          if (userStats.streak < value) return false;
          break;
        default:
          // Custom criteria can be added here
          break;
      }
    }
    return true;
  }
}

// User Achievement CRUD Operations
export class UserAchievementService {
  // Create User Achievement
  static async createUserAchievement(data: CreateUserAchievementData) {
    const [userAchievement] = await db.insert(userAchievements)
      .values(data)
      .returning();

    return userAchievement;
  }

  // Get User Achievement by ID
  static async getUserAchievementById(id: string) {
    const [userAchievement] = await db.select()
      .from(userAchievements)
      .where(eq(userAchievements.id, id))
      .limit(1);
    
    return userAchievement;
  }

  // Get User Achievements
  static async getUserAchievements(userId: string) {
    return await db.select({
      id: userAchievements.id,
      achievementId: userAchievements.achievementId,
      earnedAt: userAchievements.earnedAt,
      name: achievements.name,
      description: achievements.description,
      icon: achievements.icon,
      points: achievements.points,
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, userId))
    .orderBy(desc(userAchievements.earnedAt));
  }

  // Check if User Has Achievement
  static async hasUserAchievement(userId: string, achievementId: string): Promise<boolean> {
    const [userAchievement] = await db.select({ id: userAchievements.id })
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      ))
      .limit(1);
    
    return !!userAchievement;
  }

  // Award Achievement to User
  static async awardAchievement(userId: string, achievementId: string) {
    // Check if user already has this achievement
    const hasAchievement = await this.hasUserAchievement(userId, achievementId);
    if (hasAchievement) {
      return null; // User already has this achievement
    }

    // Award the achievement
    const userAchievement = await this.createUserAchievement({
      userId,
      achievementId,
    });

    // Add points to user score (if achievement has points)
    const achievement = await AchievementService.getAchievementById(achievementId);
    if (achievement && achievement.points > 0) {
      // You might want to add points to a specific community or course score
      // This would depend on your business logic
      // await UserScoreService.addPointsToUser(userId, achievement.points);
    }

    return userAchievement;
  }

  // Remove Achievement from User
  static async removeUserAchievement(id: string) {
    const [userAchievement] = await db.delete(userAchievements)
      .where(eq(userAchievements.id, id))
      .returning();
    
    return userAchievement;
  }

  // Get Achievement Statistics
  static async getAchievementStats(achievementId: string) {
    const [stats] = await db.select({
      totalEarned: count(),
    })
    .from(userAchievements)
    .where(eq(userAchievements.achievementId, achievementId));

    return {
      totalEarned: stats?.totalEarned || 0,
    };
  }

  // Check and Award Eligible Achievements
  static async checkAndAwardAchievements(userId: string, communityId?: string, courseId?: string) {
    const userStats = communityId 
      ? await UserScoreService.getUserScoreByUserAndCommunity(userId, communityId)
      : courseId 
        ? await UserScoreService.getUserScoreByUserAndCourse(userId, courseId)
        : null;

    if (!userStats) return [];

    const allAchievements = await AchievementService.getAllAchievements();
    const newAchievements = [];

    for (const achievement of allAchievements) {
      const hasAchievement = await this.hasUserAchievement(userId, achievement.id);
      if (!hasAchievement) {
        const meetsCriteria = AchievementService.checkAchievementCriteria(
          achievement.criteria as Record<string, any>, 
          userStats
        );
        
        if (meetsCriteria) {
          const userAchievement = await this.awardAchievement(userId, achievement.id);
          if (userAchievement) {
            newAchievements.push({
              ...userAchievement,
              achievement,
            });
          }
        }
      }
    }

    return newAchievements;
  }
}