import { Router, Request, Response } from 'express';
import { CourseService, CourseModuleService, CourseMaterialService } from '../services/course';
import { AppError, formatErrorResponse, handleDatabaseError } from '../lib/errors';
import { validatePaginationParams, validateCourseQueryOptions } from '../lib/validation';
import { authenticate, optionalAuth } from '../middleware/auth';

const router: Router = Router();

// Course Routes

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [communityId, title, slug, instructorId]
 *             properties:
 *               communityId:
 *                 type: string
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               price:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *               duration:
 *                 type: integer
 *               difficulty:
 *                 type: string
 *               prerequisites:
 *                 type: array
 *               learningOutcomes:
 *                 type: array
 *               instructorId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created successfully
 */
router.post('/', authenticate, async (req, res) => {
  try {
    // Automatically set instructorId from authenticated user
    const courseData = {
      ...req.body,
      instructorId: req.user!.id
    };
    
    const course = await CourseService.createCourse(courseData);
    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }
    
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses with filtering, sorting, and search
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: communityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: instructorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: durationMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: durationMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: enrollmentCountMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: enrollmentCountMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           description: Comma-separated list of sort fields with optional + (asc) or - (desc) prefix
 *           example: "-createdAt,+title"
 *     responses:
 *       200:
 *         description: List of courses
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const queryOptions = validateCourseQueryOptions(req.query);
    
    const filters: any = {};
    if (queryOptions.filters.communityId) filters.communityId = queryOptions.filters.communityId;
    if (queryOptions.filters.instructorId) filters.instructorId = queryOptions.filters.instructorId;
    if (queryOptions.filters.isPublished !== undefined) filters.isPublished = queryOptions.filters.isPublished;
    if (queryOptions.filters.isFeatured !== undefined) filters.isFeatured = queryOptions.filters.isFeatured;
    if (queryOptions.filters.difficulty) filters.difficulty = queryOptions.filters.difficulty;
    
    if (queryOptions.filters.price) {
      filters.price = {};
      if (queryOptions.filters.price.min) filters.price.min = queryOptions.filters.price.min;
      if (queryOptions.filters.price.max) filters.price.max = queryOptions.filters.price.max;
    }
    
    if (queryOptions.filters.duration) {
      filters.duration = {};
      if (queryOptions.filters.duration.min) filters.duration.min = queryOptions.filters.duration.min;
      if (queryOptions.filters.duration.max) filters.duration.max = queryOptions.filters.duration.max;
    }
    
    if (queryOptions.filters.enrollmentCount) {
      filters.enrollmentCount = {};
      if (queryOptions.filters.enrollmentCount.min) filters.enrollmentCount.min = queryOptions.filters.enrollmentCount.min;
      if (queryOptions.filters.enrollmentCount.max) filters.enrollmentCount.max = queryOptions.filters.enrollmentCount.max;
    }
    
    if (queryOptions.filters.createdAt) filters.createdAt = queryOptions.filters.createdAt;
    if (queryOptions.filters.updatedAt) filters.updatedAt = queryOptions.filters.updatedAt;
    
    const result = await CourseService.getAllCourses({
      page: queryOptions.page,
      pageSize: queryOptions.pageSize,
      filters,
      search: queryOptions.search,
      sort: queryOptions.sort
    });
    
    res.json({
      success: true,
      data: result.courses,
      pagination: {
        page: queryOptions.page,
        pageSize: queryOptions.pageSize,
        total: result.totalCount,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }
    
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/courses/new:
 *   get:
 *     summary: Get course creation form data
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course creation form data
 *       401:
 *         description: Authentication required
 */
router.get('/new', authenticate, async (req, res) => {
  try {
    // Return any data needed for course creation form
    // This could include available communities, difficulty levels, etc.
    res.json({
      success: true,
      data: {
        difficulties: ['beginner', 'intermediate', 'advanced'],
        materialTypes: ['video', 'text', 'file', 'link']
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }
    
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});


/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const course = await CourseService.getCourseById(req.params.id);
    if (!course) {
      const errorResponse = formatErrorResponse(
        new AppError('Course not found', 404, 'RESOURCE_NOT_FOUND' as any)
      );
      return res.status(404).json(errorResponse);
    }
    
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }
    
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/courses/{id}/content:
 *   get:
 *     summary: Get course with modules and materials
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course with complete content structure
 *       404:
 *         description: Course not found
 */
router.get('/:id/content', optionalAuth, async (req, res) => {
  try {
    const course = await CourseService.getCourseWithContent(req.params.id);
    if (!course) {
      const errorResponse = formatErrorResponse(
        new AppError('Course not found', 404, 'RESOURCE_NOT_FOUND' as any)
      );
      return res.status(404).json(errorResponse);
    }
    
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }
    
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               price:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *               duration:
 *                 type: integer
 *               difficulty:
 *                 type: string
 *               prerequisites:
 *                 type: array
 *               learningOutcomes:
 *                 type: array
 *     responses:
 *       200:
 *         description: Course updated successfully
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    // TODO: Add ownership check - only course instructor should be able to update
    
    const course = await CourseService.updateCourse(req.params.id, req.body);
    if (!course) {
      const errorResponse = formatErrorResponse(
        new AppError('Course not found', 404, 'RESOURCE_NOT_FOUND' as any)
      );
      return res.status(404).json(errorResponse);
    }
    
    res.json({
      success: true,
      data: course,
      message: 'Course updated successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }
    
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted successfully
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // TODO: Add ownership check - only course instructor should be able to delete
    
    const course = await CourseService.deleteCourse(req.params.id);
    if (!course) {
      const errorResponse = formatErrorResponse(
        new AppError('Course not found', 404, 'RESOURCE_NOT_FOUND' as any)
      );
      return res.status(404).json(errorResponse);
    }
    
    res.json({
      success: true,
      data: course,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }
    
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

// Course Module Routes

/**
 * @swagger
 * /api/courses/{courseId}/modules:
 *   post:
 *     summary: Create a course module
 *     tags: [Course Modules]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, order]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Module created successfully
 */
router.post('/:courseId/modules', authenticate, async (req, res) => {
  try {
    // TODO: Add ownership check - only course instructor should be able to add modules
    
    const module = await CourseModuleService.createCourseModule({
      courseId: req.params.courseId,
      ...req.body
    });
    
    res.status(201).json({
      success: true,
      data: module,
      message: 'Module created successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }
    
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/courses/{courseId}/modules:
 *   get:
 *     summary: Get course modules
 *     tags: [Course Modules]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of course modules
 */
router.get('/:courseId/modules', optionalAuth, async (req, res) => {
  try {
    // Get modules for the course (returns empty array if no modules found)
    let modules;
    try {
      modules = await CourseModuleService.getModulesByCourse(req.params.courseId);
    } catch (dbError) {
      // If database query fails, return empty array (course may exist but no modules yet)
      modules = [];
    }

    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }
    
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(dbError.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/courses/modules/{moduleId}:
 *   get:
 *     summary: Get module by ID
 *     tags: [Course Modules]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module details
 *       404:
 *         description: Module not found
 */
router.get('/modules/:moduleId', async (req, res) => {
  try {
    const module = await CourseModuleService.getCourseModuleById(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ 
        success: false,
        error: 'Module not found' 
      });
    }
    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/courses/modules/{moduleId}:
 *   put:
 *     summary: Update course module
 *     tags: [Course Modules]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Module updated successfully
 */
router.put('/modules/:moduleId', async (req, res) => {
  try {
    const module = await CourseModuleService.updateCourseModule(req.params.moduleId, req.body);
    if (!module) {
      return res.status(404).json({ 
        success: false,
        error: 'Module not found' 
      });
    }
    res.json({
      success: true,
      data: module,
      message: 'Module updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/courses/modules/{moduleId}:
 *   delete:
 *     summary: Delete course module
 *     tags: [Course Modules]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module deleted successfully
 */
router.delete('/modules/:moduleId', async (req, res) => {
  try {
    const module = await CourseModuleService.deleteCourseModule(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ 
        success: false,
        error: 'Module not found' 
      });
    }
    res.json({ 
      success: true,
      data: module,
      message: 'Module deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

// Course Material Routes

/**
 * @swagger
 * /api/courses/modules/{moduleId}/materials:
 *   post:
 *     summary: Create course material
 *     tags: [Course Materials]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type, order]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [video, text, file, link]
 *               content:
 *                 type: string
 *               url:
 *                 type: string
 *               metadata:
 *                 type: object
 *               order:
 *                 type: integer
 *               duration:
 *                 type: integer
 *               isPreview:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Material created successfully
 */
router.post('/modules/:moduleId/materials', async (req, res) => {
  try {
    const material = await CourseMaterialService.createCourseMaterial({
      moduleId: req.params.moduleId,
      ...req.body
    });
    res.status(201).json({
      success: true,
      data: material,
      message: 'Material created successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/courses/modules/{moduleId}/materials:
 *   get:
 *     summary: Get module materials
 *     tags: [Course Materials]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [video, text, file, link]
 *     responses:
 *       200:
 *         description: List of course materials
 */
router.get('/modules/:moduleId/materials', async (req, res) => {
  try {
    const { type } = req.query;
    const materials = type 
      ? await CourseMaterialService.getMaterialsByType(req.params.moduleId, type as any)
      : await CourseMaterialService.getMaterialsByModule(req.params.moduleId);
    res.json({
      success: true,
      data: materials
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/courses/materials/{materialId}:
 *   get:
 *     summary: Get material by ID
 *     tags: [Course Materials]
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material details
 *       404:
 *         description: Material not found
 */
router.get('/materials/:materialId', async (req, res) => {
  try {
    const material = await CourseMaterialService.getCourseMaterialById(req.params.materialId);
    if (!material) {
      return res.status(404).json({ 
        success: false,
        error: 'Material not found' 
      });
    }
    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/courses/materials/{materialId}:
 *   put:
 *     summary: Update course material
 *     tags: [Course Materials]
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [video, text, file, link]
 *               content:
 *                 type: string
 *               url:
 *                 type: string
 *               metadata:
 *                 type: object
 *               order:
 *                 type: integer
 *               duration:
 *                 type: integer
 *               isPreview:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Material updated successfully
 */
router.put('/materials/:materialId', async (req, res) => {
  try {
    const material = await CourseMaterialService.updateCourseMaterial(req.params.materialId, req.body);
    if (!material) {
      return res.status(404).json({ 
        success: false,
        error: 'Material not found' 
      });
    }
    res.json({
      success: true,
      data: material,
      message: 'Material updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/courses/materials/{materialId}:
 *   delete:
 *     summary: Delete course material
 *     tags: [Course Materials]
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material deleted successfully
 */
router.delete('/materials/:materialId', async (req, res) => {
  try {
    const material = await CourseMaterialService.deleteCourseMaterial(req.params.materialId);
    if (!material) {
      return res.status(404).json({ 
        success: false,
        error: 'Material not found' 
      });
    }
    res.json({ 
      success: true,
      data: material,
      message: 'Material deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/courses/{courseId}/preview:
 *   get:
 *     summary: Get course preview materials
 *     tags: [Course Materials]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of preview materials
 */
router.get('/:courseId/preview', async (req, res) => {
  try {
    const materials = await CourseMaterialService.getPreviewMaterials(req.params.courseId);
    res.json({
      success: true,
      data: materials
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: (error as Error).message 
    });
  }
});

export default router;