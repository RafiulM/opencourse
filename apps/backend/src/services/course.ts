import { db } from '../db';
import { courses, courseModules, courseMaterials, materialTypeEnum } from '../db/schema/course';
import { eq, and, desc, asc, count, ilike, gte, lte, or } from 'drizzle-orm';

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

export interface CourseQueryOptions {
  page?: number;
  pageSize?: number;
  filters?: {
    communityId?: string;
    instructorId?: string;
    isPublished?: boolean;
    isFeatured?: boolean;
    difficulty?: string;
    price?: { min?: number; max?: number };
    duration?: { min?: number; max?: number };
    enrollmentCount?: { min?: number; max?: number };
    createdAt?: { start?: Date; end?: Date };
    updatedAt?: { start?: Date; end?: Date };
  };
  search?: string;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
}

// Course CRUD Operations
export class CourseService {
  // Create Course
  static async createCourse(data: CreateCourseData) {
    const coursesResult = await db.insert(courses)
      .values(data)
      .returning();

    const course = coursesResult[0];

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

  // Get All Courses (with advanced filtering, sorting, and search)
  static async getAllCourses(options: CourseQueryOptions = {}) {
    const {
      page = 1,
      pageSize = 20,
      filters = {},
      search,
      sort = [{ field: 'createdAt', order: 'desc' }]
    } = options;

    const query = db.select().from(courses);
    const dynamicQuery = query.$dynamic();

    // Apply filters
    if (filters.communityId) {
      dynamicQuery.where(eq(courses.communityId, filters.communityId));
    }
    if (filters.instructorId) {
      dynamicQuery.where(eq(courses.instructorId, filters.instructorId));
    }
    if (filters.isPublished !== undefined) {
      dynamicQuery.where(eq(courses.isPublished, filters.isPublished));
    }
    if (filters.isFeatured !== undefined) {
      dynamicQuery.where(eq(courses.isFeatured, filters.isFeatured));
    }
    if (filters.difficulty) {
      dynamicQuery.where(eq(courses.difficulty, filters.difficulty));
    }

    if (filters.price) {
      if (filters.price.min !== undefined) {
        dynamicQuery.where(gte(courses.price, filters.price.min.toString()));
      }
      if (filters.price.max !== undefined) {
        dynamicQuery.where(lte(courses.price, filters.price.max.toString()));
      }
    }

    if (filters.duration) {
      if (filters.duration.min !== undefined) {
        dynamicQuery.where(gte(courses.duration, filters.duration.min));
      }
      if (filters.duration.max !== undefined) {
        dynamicQuery.where(lte(courses.duration, filters.duration.max));
      }
    }

    if (filters.enrollmentCount) {
      if (filters.enrollmentCount.min !== undefined) {
        dynamicQuery.where(gte(courses.enrollmentCount, filters.enrollmentCount.min));
      }
      if (filters.enrollmentCount.max !== undefined) {
        dynamicQuery.where(lte(courses.enrollmentCount, filters.enrollmentCount.max));
      }
    }

    if (filters.createdAt) {
      if (filters.createdAt.start) {
        dynamicQuery.where(gte(courses.createdAt, filters.createdAt.start));
      }
      if (filters.createdAt.end) {
        dynamicQuery.where(lte(courses.createdAt, filters.createdAt.end));
      }
    }

    if (filters.updatedAt) {
      if (filters.updatedAt.start) {
        dynamicQuery.where(gte(courses.updatedAt, filters.updatedAt.start));
      }
      if (filters.updatedAt.end) {
        dynamicQuery.where(lte(courses.updatedAt, filters.updatedAt.end));
      }
    }

    // Apply search
    if (search) {
      dynamicQuery.where(
        or(
          ilike(courses.title, `%${search}%`),
          ilike(courses.description, `%${search}%`)
        )
      );
    }

    // Get total count
    const countQuery = db.select({ count: count() }).from(courses);
    const dynamicCountQuery = countQuery.$dynamic();

    // Apply same filters to count query
    if (filters.communityId) {
      dynamicCountQuery.where(eq(courses.communityId, filters.communityId));
    }
    if (filters.instructorId) {
      dynamicCountQuery.where(eq(courses.instructorId, filters.instructorId));
    }
    if (filters.isPublished !== undefined) {
      dynamicCountQuery.where(eq(courses.isPublished, filters.isPublished));
    }
    if (filters.isFeatured !== undefined) {
      dynamicCountQuery.where(eq(courses.isFeatured, filters.isFeatured));
    }
    if (filters.difficulty) {
      dynamicCountQuery.where(eq(courses.difficulty, filters.difficulty));
    }

    if (filters.price) {
      if (filters.price.min !== undefined) {
        dynamicCountQuery.where(gte(courses.price, filters.price.min.toString()));
      }
      if (filters.price.max !== undefined) {
        dynamicCountQuery.where(lte(courses.price, filters.price.max.toString()));
      }
    }

    if (filters.duration) {
      if (filters.duration.min !== undefined) {
        dynamicCountQuery.where(gte(courses.duration, filters.duration.min));
      }
      if (filters.duration.max !== undefined) {
        dynamicCountQuery.where(lte(courses.duration, filters.duration.max));
      }
    }

    if (filters.enrollmentCount) {
      if (filters.enrollmentCount.min !== undefined) {
        dynamicCountQuery.where(gte(courses.enrollmentCount, filters.enrollmentCount.min));
      }
      if (filters.enrollmentCount.max !== undefined) {
        dynamicCountQuery.where(lte(courses.enrollmentCount, filters.enrollmentCount.max));
      }
    }

    if (filters.createdAt) {
      if (filters.createdAt.start) {
        dynamicCountQuery.where(gte(courses.createdAt, filters.createdAt.start));
      }
      if (filters.createdAt.end) {
        dynamicCountQuery.where(lte(courses.createdAt, filters.createdAt.end));
      }
    }

    if (filters.updatedAt) {
      if (filters.updatedAt.start) {
        dynamicCountQuery.where(gte(courses.updatedAt, filters.updatedAt.start));
      }
      if (filters.updatedAt.end) {
        dynamicCountQuery.where(lte(courses.updatedAt, filters.updatedAt.end));
      }
    }

    // Apply same search to count query
    if (search) {
      dynamicCountQuery.where(
        or(
          ilike(courses.title, `%${search}%`),
          ilike(courses.description, `%${search}%`)
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
        case 'title':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(courses.title) : desc(courses.title));
          break;
        case 'price':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(courses.price) : desc(courses.price));
          break;
        case 'duration':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(courses.duration) : desc(courses.duration));
          break;
        case 'difficulty':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(courses.difficulty) : desc(courses.difficulty));
          break;
        case 'enrollmentCount':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(courses.enrollmentCount) : desc(courses.enrollmentCount));
          break;
        case 'createdAt':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(courses.createdAt) : desc(courses.createdAt));
          break;
        case 'updatedAt':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(courses.updatedAt) : desc(courses.updatedAt));
          break;
        case 'isPublished':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(courses.isPublished) : desc(courses.isPublished));
          break;
        case 'isFeatured':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(courses.isFeatured) : desc(courses.isFeatured));
          break;
      }
    }

    const results = await orderedQuery
      .limit(pageSize)
      .offset(offset);

    return {
      courses: results,
      totalCount,
      totalPages
    };
  }

  // Get Courses by Community
  static async getCoursesByCommunity(communityId: string, page = 1, pageSize = 20) {
    // Get total count
    const [{ count: totalCount }] = await db.select({ count: count() })
      .from(courses)
      .where(eq(courses.communityId, communityId));
    const totalPages = Math.ceil(totalCount / pageSize);

    const offset = (page - 1) * pageSize;

    const results = await db.select()
      .from(courses)
      .where(eq(courses.communityId, communityId))
      .orderBy(desc(courses.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      courses: results,
      totalCount,
      totalPages
    };
  }

  // Get Courses by Instructor
  static async getCoursesByInstructor(instructorId: string, page = 1, pageSize = 20) {
    // Get total count
    const [{ count: totalCount }] = await db.select({ count: count() })
      .from(courses)
      .where(eq(courses.instructorId, instructorId));
    const totalPages = Math.ceil(totalCount / pageSize);

    const offset = (page - 1) * pageSize;

    const results = await db.select()
      .from(courses)
      .where(eq(courses.instructorId, instructorId))
      .orderBy(desc(courses.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      courses: results,
      totalCount,
      totalPages
    };
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
    const coursesResult = await db.delete(courses)
      .where(eq(courses.id, id))
      .returning();

    return coursesResult[0];
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
    const courseModulesResult = await db.insert(courseModules)
      .values(data)
      .returning();

    const module = courseModulesResult[0];

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
    const courseModulesResult = await db.delete(courseModules)
      .where(eq(courseModules.id, id))
      .returning();

    return courseModulesResult[0];
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
    const courseMaterialsResult = await db.insert(courseMaterials)
      .values(data)
      .returning();

    const material = courseMaterialsResult[0];

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
    const courseMaterialsResult = await db.delete(courseMaterials)
      .where(eq(courseMaterials.id, id))
      .returning();

    return courseMaterialsResult[0];
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