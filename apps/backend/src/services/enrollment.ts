import { db } from '@/db';
import { enrollments, materialProgress, enrollmentStatusEnum } from '@/db/schema/enrollment';
import { courses } from '@/db/schema/course';
import { eq, and, desc, count, avg } from 'drizzle-orm';

export interface CreateEnrollmentData {
  courseId: string;
  userId: string;
  status?: 'enrolled' | 'completed' | 'dropped';
}

export interface UpdateEnrollmentData {
  status?: 'enrolled' | 'completed' | 'dropped';
  progress?: number;
  completedAt?: Date;
  lastAccessedAt?: Date;
}

export interface CreateMaterialProgressData {
  userId: string;
  materialId: string;
  enrollmentId: string;
  completed?: boolean;
  progress?: number;
  lastPosition?: number;
}

export interface UpdateMaterialProgressData {
  completed?: boolean;
  progress?: number;
  lastPosition?: number;
  completedAt?: Date;
  lastAccessedAt?: Date;
}

// Enrollment CRUD Operations
export class EnrollmentService {
  // Create Enrollment
  static async createEnrollment(data: CreateEnrollmentData) {
    const [enrollment] = await db.insert(enrollments)
      .values(data)
      .returning();

    // Update course enrollment count
    await db.update(courses)
      .set({
        enrollmentCount: count(enrollments.id),
      })
      .where(eq(courses.id, data.courseId));

    return enrollment;
  }

  // Get Enrollment by ID
  static async getEnrollmentById(id: string) {
    const [enrollment] = await db.select()
      .from(enrollments)
      .where(eq(enrollments.id, id))
      .limit(1);

    return enrollment;
  }

  // Get Enrollment by User and Course
  static async getEnrollmentByUserAndCourse(userId: string, courseId: string) {
    const [enrollment] = await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ))
      .limit(1);

    return enrollment;
  }

  // Get User's Enrollments
  static async getUserEnrollments(
    userId: string,
    page = 1,
    pageSize = 20,
    status?: 'enrolled' | 'completed' | 'dropped'
  ) {
    const query = db.select({
      id: enrollments.id,
      courseId: enrollments.courseId,
      status: enrollments.status,
      progress: enrollments.progress,
      enrolledAt: enrollments.enrolledAt,
      completedAt: enrollments.completedAt,
      lastAccessedAt: enrollments.lastAccessedAt,
      courseTitle: courses.title,
      courseThumbnail: courses.thumbnail,
      courseDescription: courses.description,
    })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId));

    const dynamicQuery = query.$dynamic();

    if (status) {
      dynamicQuery.where(eq(enrollments.status, status));
    }

    const offset = (page - 1) * pageSize;
    const results = await dynamicQuery
      .orderBy(desc(enrollments.enrolledAt))
      .limit(pageSize)
      .offset(offset);

    return results;
  }

  // Get Course Enrollments
  static async getCourseEnrollments(
    courseId: string,
    page = 1,
    pageSize = 50,
    status?: 'enrolled' | 'completed' | 'dropped'
  ) {
    const query = db.select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));

    const dynamicQuery = query.$dynamic();

    if (status) {
      dynamicQuery.where(eq(enrollments.status, status));
    }

    const offset = (page - 1) * pageSize;
    const results = await query
      .orderBy(desc(enrollments.enrolledAt))
      .limit(pageSize)
      .offset(offset);

    return results;
  }

  // Update Enrollment
  static async updateEnrollment(id: string, data: UpdateEnrollmentData) {
    const [enrollment] = await db.update(enrollments)
      .set(data)
      .where(eq(enrollments.id, id))
      .returning();

    return enrollment;
  }

  // Delete Enrollment (Unenroll)
  static async deleteEnrollment(id: string) {
    const enrollment = await this.getEnrollmentById(id);
    if (!enrollment) return null;

    const [deletedEnrollment] = await db.delete(enrollments)
      .where(eq(enrollments.id, id))
      .returning();

    // Update course enrollment count
    await db.update(courses)
      .set({
        enrollmentCount: count(enrollments.id),
      })
      .where(eq(courses.id, enrollment.courseId));

    return deletedEnrollment;
  }

  // Check if User is Enrolled
  static async isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    const [enrollment] = await db.select({ id: enrollments.id })
      .from(enrollments)
      .where(and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ))
      .limit(1);

    return !!enrollment;
  }

  // Get Enrollment Statistics
  static async getEnrollmentStats(courseId: string) {
    const [stats] = await db.select({
      totalEnrollments: count(),
      avgProgress: avg(enrollments.progress),
    })
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));

    const [statusCounts] = await db.select({
      enrolled: count(),
    })
      .from(enrollments)
      .where(and(
        eq(enrollments.courseId, courseId),
        eq(enrollments.status, 'enrolled')
      ));

    const [completedCounts] = await db.select({
      completed: count(),
    })
      .from(enrollments)
      .where(and(
        eq(enrollments.courseId, courseId),
        eq(enrollments.status, 'completed')
      ));

    const [droppedCounts] = await db.select({
      dropped: count(),
    })
      .from(enrollments)
      .where(and(
        eq(enrollments.courseId, courseId),
        eq(enrollments.status, 'dropped')
      ));

    return {
      totalEnrollments: stats?.totalEnrollments || 0,
      averageProgress: stats?.avgProgress || 0,
      enrolled: statusCounts?.enrolled || 0,
      completed: completedCounts?.completed || 0,
      dropped: droppedCounts?.dropped || 0,
    };
  }

  // Update Enrollment Progress
  static async updateEnrollmentProgress(enrollmentId: string, progress: number) {
    const [enrollment] = await db.update(enrollments)
      .set({
        progress,
        lastAccessedAt: new Date(),
        completedAt: progress >= 100 ? new Date() : null,
        status: progress >= 100 ? 'completed' : 'enrolled',
      })
      .where(eq(enrollments.id, enrollmentId))
      .returning();

    return enrollment;
  }
}

// Material Progress CRUD Operations
export class MaterialProgressService {
  // Create Material Progress
  static async createMaterialProgress(data: CreateMaterialProgressData) {
    const [progress] = await db.insert(materialProgress)
      .values({
        ...data,
        lastAccessedAt: new Date(),
      })
      .returning();

    return progress;
  }

  // Get Material Progress by ID
  static async getMaterialProgressById(id: string) {
    const [progress] = await db.select()
      .from(materialProgress)
      .where(eq(materialProgress.id, id))
      .limit(1);

    return progress;
  }

  // Get Material Progress by User and Material
  static async getMaterialProgressByUserAndMaterial(userId: string, materialId: string) {
    const [progress] = await db.select()
      .from(materialProgress)
      .where(and(
        eq(materialProgress.userId, userId),
        eq(materialProgress.materialId, materialId)
      ))
      .limit(1);

    return progress;
  }

  // Get User's Material Progress for Enrollment
  static async getUserMaterialProgress(userId: string, enrollmentId: string) {
    return await db.select()
      .from(materialProgress)
      .where(and(
        eq(materialProgress.userId, userId),
        eq(materialProgress.enrollmentId, enrollmentId)
      ))
      .orderBy(desc(materialProgress.lastAccessedAt));
  }

  // Get Material Progress by Enrollment
  static async getMaterialProgressByEnrollment(enrollmentId: string) {
    return await db.select()
      .from(materialProgress)
      .where(eq(materialProgress.enrollmentId, enrollmentId))
      .orderBy(desc(materialProgress.lastAccessedAt));
  }

  // Update Material Progress
  static async updateMaterialProgress(id: string, data: UpdateMaterialProgressData) {
    const [progress] = await db.update(materialProgress)
      .set({
        ...data,
        lastAccessedAt: new Date(),
        completedAt: data.completed ? new Date() : undefined,
      })
      .where(eq(materialProgress.id, id))
      .returning();

    return progress;
  }

  // Update or Create Material Progress
  static async upsertMaterialProgress(
    userId: string,
    materialId: string,
    enrollmentId: string,
    data: Omit<UpdateMaterialProgressData, 'lastAccessedAt'>
  ) {
    const existing = await this.getMaterialProgressByUserAndMaterial(userId, materialId);

    if (existing) {
      return await this.updateMaterialProgress(existing.id, data);
    } else {
      return await this.createMaterialProgress({
        userId,
        materialId,
        enrollmentId,
        ...data,
      });
    }
  }

  // Delete Material Progress
  static async deleteMaterialProgress(id: string) {
    const [progress] = await db.delete(materialProgress)
      .where(eq(materialProgress.id, id))
      .returning();

    return progress;
  }

  // Mark Material as Completed
  static async markMaterialCompleted(userId: string, materialId: string, enrollmentId: string) {
    return await this.upsertMaterialProgress(userId, materialId, enrollmentId, {
      completed: true,
      progress: 100,
      completedAt: new Date(),
    });
  }

  // Update Video Progress
  static async updateVideoProgress(
    userId: string,
    materialId: string,
    enrollmentId: string,
    progress: number,
    lastPosition: number
  ) {
    return await this.upsertMaterialProgress(userId, materialId, enrollmentId, {
      progress,
      lastPosition,
      completed: progress >= 95, // Consider 95% as completed for videos
    });
  }

  // Get Completion Statistics for Enrollment
  static async getCompletionStats(enrollmentId: string) {
    const [totalMaterials] = await db.select({ count: count() })
      .from(materialProgress)
      .where(eq(materialProgress.enrollmentId, enrollmentId));

    const [completedMaterials] = await db.select({ count: count() })
      .from(materialProgress)
      .where(and(
        eq(materialProgress.enrollmentId, enrollmentId),
        eq(materialProgress.completed, true)
      ));

    const total = totalMaterials?.count || 0;
    const completed = completedMaterials?.count || 0;
    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalMaterials: total,
      completedMaterials: completed,
      progressPercentage,
    };
  }
}