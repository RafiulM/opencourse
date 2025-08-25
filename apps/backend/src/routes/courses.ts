import { Router, Request, Response } from 'express';
import { CourseService, CourseModuleService, CourseMaterialService } from '../services/course';

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
router.post('/', async (req, res) => {
  try {
    const course = await CourseService.createCourse(req.body);
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
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
 *     responses:
 *       200:
 *         description: List of courses
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, ...filters } = req.query;
    const courses = await CourseService.getAllCourses(
      Number(page), 
      Number(pageSize), 
      filters as any
    );
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.get('/:id', async (req, res) => {
  try {
    const course = await CourseService.getCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.get('/:id/content', async (req, res) => {
  try {
    const course = await CourseService.getCourseWithContent(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.put('/:id', async (req, res) => {
  try {
    const course = await CourseService.updateCourse(req.params.id, req.body);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.delete('/:id', async (req, res) => {
  try {
    const course = await CourseService.deleteCourse(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully', course });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.post('/:courseId/modules', async (req, res) => {
  try {
    const module = await CourseModuleService.createCourseModule({
      courseId: req.params.courseId,
      ...req.body
    });
    res.status(201).json(module);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
router.get('/:courseId/modules', async (req, res) => {
  try {
    const modules = await CourseModuleService.getModulesByCourse(req.params.courseId);
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json({ message: 'Module deleted successfully', module });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json({ message: 'Material deleted successfully', material });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;