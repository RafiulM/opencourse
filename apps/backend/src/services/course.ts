import { db } from '@/db';
import { courses, courseModules, courseMaterials, materialTypeEnum } from '@/db/schema/course';
import { eq, and, desc, asc, count } from 'drizzle-orm';

export interface CreateCourseData {
  communityId: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  price?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  duration?: number;
  difficulty?: string;
  prerequisites?: any[];
  learningOutcomes?: any[];
  instructorId: string;
}

export interface UpdateCourseData {
  title?: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  price?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  duration?: number;
  difficulty?: string;
  prerequisites?: any[];
  learningOutcomes?: any[];
}

export interface CreateCourseModuleData {
  courseId: string;
  title: string;
  description?: string;
  order: number;
}

export interface UpdateCourseModuleData {
  title?: string;
  description?: string;
  order?: number;
}

export interface CreateCourseMaterialData {
  moduleId: string;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'file' | 'link';
  content?: string;
  url?: string;
  metadata?: Record<string, any>;
  order: number;
  duration?: number;
  isPreview?: boolean;
}

export interface UpdateCourseMaterialData {
  title?: string;
  description?: string;
  type?: 'video' | 'text' | 'file' | 'link';
  content?: string;
  url?: string;
  metadata?: Record<string, any>;
  order?: number;
  duration?: number;
  isPreview?: boolean;
}

// Course CRUD Operations
export class CourseService {
  // Create Course
  static async createCourse(data: CreateCourseData) {
    const [course] = await db.insert(courses)
      .values(data)
      .returning();

    return course;
  }

  // Get Course by ID
  static async getCourseById(id: string) {
    const [course] = await db.select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);

    return course;
  }

  // Get Course by Slug and Community
  static async getCourseBySlug(slug: string, communityId: string) {
    const [course] = await db.select()
      .from(courses)
      .where(and(
        eq(courses.slug, slug),
        eq(courses.communityId, communityId)
      ))
      .limit(1);

    return course;
  }

  // Get All Courses (with pagination and filters)
  static async getAllCourses(
    page = 1,
    pageSize = 20,
    filters?: {
      communityId?: string;
      instructorId?: string;
      isPublished?: boolean;
      isFeatured?: boolean;
      difficulty?: string;
    }
  ) {
    const query = db.select().from(courses);

    const dynamicQuery = query.$dynamic();

    if (filters?.communityId) {
      dynamicQuery.where(eq(courses.communityId, filters.communityId));
    }
    if (filters?.instructorId) {
      dynamicQuery.where(eq(courses.instructorId, filters.instructorId));
    }
    if (filters?.isPublished !== undefined) {
      dynamicQuery.where(eq(courses.isPublished, filters.isPublished));
    }
    if (filters?.isFeatured !== undefined) {
      dynamicQuery.where(eq(courses.isFeatured, filters.isFeatured));
    }
    if (filters?.difficulty) {
      dynamicQuery.where(eq(courses.difficulty, filters.difficulty));
    }

    const offset = (page - 1) * pageSize;
    const results = await query
      .orderBy(desc(courses.createdAt))
      .limit(pageSize)
      .offset(offset);

    return results;
  }

  // Get Courses by Community
  static async getCoursesByCommunity(communityId: string, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    return await db.select()
      .from(courses)
      .where(eq(courses.communityId, communityId))
      .orderBy(desc(courses.createdAt))
      .limit(pageSize)
      .offset(offset);
  }

  // Get Courses by Instructor
  static async getCoursesByInstructor(instructorId: string, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    return await db.select()
      .from(courses)
      .where(eq(courses.instructorId, instructorId))
      .orderBy(desc(courses.createdAt))
      .limit(pageSize)
      .offset(offset);
  }

  // Update Course
  static async updateCourse(id: string, data: UpdateCourseData) {
    const [course] = await db.update(courses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();

    return course;
  }

  // Delete Course
  static async deleteCourse(id: string) {
    const [course] = await db.delete(courses)
      .where(eq(courses.id, id))
      .returning();

    return course;
  }

  // Update Enrollment Count
  static async updateEnrollmentCount(courseId: string, increment = 1) {
    // Select the current enrollment count with transaction
    await db.transaction(async (tx) => {
      const currentEnrollmentCount = await tx.select({
        enrollmentCount: courses.enrollmentCount,
      })
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);

      await db.update(courses)
        .set({
          enrollmentCount: currentEnrollmentCount[0].enrollmentCount + increment,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, courseId));

    })
  }

  // Get Course with Modules and Materials
  static async getCourseWithContent(id: string) {
    const course = await this.getCourseById(id);
    if (!course) return null;

    const modules = await CourseModuleService.getModulesByCourse(id);
    const courseWithModules = {
      ...course,
      modules: await Promise.all(
        modules.map(async (module) => ({
          ...module,
          materials: await CourseMaterialService.getMaterialsByModule(module.id),
        }))
      ),
    };

    return courseWithModules;
  }
}

// Course Module CRUD Operations
export class CourseModuleService {
  // Create Course Module
  static async createCourseModule(data: CreateCourseModuleData) {
    const [module] = await db.insert(courseModules)
      .values(data)
      .returning();

    return module;
  }

  // Get Course Module by ID
  static async getCourseModuleById(id: string) {
    const [module] = await db.select()
      .from(courseModules)
      .where(eq(courseModules.id, id))
      .limit(1);

    return module;
  }

  // Get Modules by Course
  static async getModulesByCourse(courseId: string) {
    return await db.select()
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(asc(courseModules.order));
  }

  // Update Course Module
  static async updateCourseModule(id: string, data: UpdateCourseModuleData) {
    const [module] = await db.update(courseModules)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(courseModules.id, id))
      .returning();

    return module;
  }

  // Delete Course Module
  static async deleteCourseModule(id: string) {
    const [module] = await db.delete(courseModules)
      .where(eq(courseModules.id, id))
      .returning();

    return module;
  }

  // Reorder Modules
  static async reorderModules(courseId: string, moduleOrders: { id: string; order: number }[]) {
    const results = [];

    for (const { id, order } of moduleOrders) {
      const [module] = await db.update(courseModules)
        .set({
          order,
          updatedAt: new Date(),
        })
        .where(and(
          eq(courseModules.id, id),
          eq(courseModules.courseId, courseId)
        ))
        .returning();

      results.push(module);
    }

    return results;
  }
}

// Course Material CRUD Operations
export class CourseMaterialService {
  // Create Course Material
  static async createCourseMaterial(data: CreateCourseMaterialData) {
    const [material] = await db.insert(courseMaterials)
      .values(data)
      .returning();

    return material;
  }

  // Get Course Material by ID
  static async getCourseMaterialById(id: string) {
    const [material] = await db.select()
      .from(courseMaterials)
      .where(eq(courseMaterials.id, id))
      .limit(1);

    return material;
  }

  // Get Materials by Module
  static async getMaterialsByModule(moduleId: string) {
    return await db.select()
      .from(courseMaterials)
      .where(eq(courseMaterials.moduleId, moduleId))
      .orderBy(asc(courseMaterials.order));
  }

  // Get Materials by Type
  static async getMaterialsByType(moduleId: string, type: 'video' | 'text' | 'file' | 'link') {
    return await db.select()
      .from(courseMaterials)
      .where(and(
        eq(courseMaterials.moduleId, moduleId),
        eq(courseMaterials.type, type)
      ))
      .orderBy(asc(courseMaterials.order));
  }

  // Update Course Material
  static async updateCourseMaterial(id: string, data: UpdateCourseMaterialData) {
    const [material] = await db.update(courseMaterials)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(courseMaterials.id, id))
      .returning();

    return material;
  }

  // Delete Course Material
  static async deleteCourseMaterial(id: string) {
    const [material] = await db.delete(courseMaterials)
      .where(eq(courseMaterials.id, id))
      .returning();

    return material;
  }

  // Reorder Materials
  static async reorderMaterials(moduleId: string, materialOrders: { id: string; order: number }[]) {
    const results = [];

    for (const { id, order } of materialOrders) {
      const [material] = await db.update(courseMaterials)
        .set({
          order,
          updatedAt: new Date(),
        })
        .where(and(
          eq(courseMaterials.id, id),
          eq(courseMaterials.moduleId, moduleId)
        ))
        .returning();

      results.push(material);
    }

    return results;
  }

  // Get Preview Materials (for non-enrolled users)
  static async getPreviewMaterials(courseId: string) {
    return await db.select({
      id: courseMaterials.id,
      moduleId: courseMaterials.moduleId,
      title: courseMaterials.title,
      description: courseMaterials.description,
      type: courseMaterials.type,
      url: courseMaterials.url,
      duration: courseMaterials.duration,
      order: courseMaterials.order,
    })
      .from(courseMaterials)
      .innerJoin(courseModules, eq(courseMaterials.moduleId, courseModules.id))
      .where(and(
        eq(courseModules.courseId, courseId),
        eq(courseMaterials.isPreview, true)
      ))
      .orderBy(asc(courseModules.order), asc(courseMaterials.order));
  }
}