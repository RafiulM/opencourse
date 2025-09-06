import { Router, Request, Response } from 'express';
import { r2Service, UploadService } from '../services/upload';
import { AppError, formatErrorResponse, handleDatabaseError } from '../lib/errors';
import { authenticate } from '../middleware/auth';
import { validateUploadQueryOptions } from '../lib/validation';

const router: Router = Router();

// Place specific routes before parameterized routes to avoid conflicts

/**
 * @swagger
 * /api/uploads/my:
 *   get:
 *     summary: Get current user's uploads with filtering, sorting, and search
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
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
 *           default: 50
 *       - in: query
 *         name: uploadType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: communityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: moduleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: materialId
 *         schema:
 *           type: string
 *       - in: query
 *         name: mimeType
 *         schema:
 *           type: string
 *       - in: query
 *         name: fileSizeMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fileSizeMax
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
 *           example: "-createdAt,+originalName"
 *     responses:
 *       200:
 *         description: User's uploads
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const queryOptions = validateUploadQueryOptions(req.query);

    const filters: any = {};
    if (queryOptions.filters.uploadType) filters.uploadType = queryOptions.filters.uploadType;
    if (queryOptions.filters.status) filters.status = queryOptions.filters.status;
    if (queryOptions.filters.communityId) filters.communityId = queryOptions.filters.communityId;
    if (queryOptions.filters.courseId) filters.courseId = queryOptions.filters.courseId;
    if (queryOptions.filters.moduleId) filters.moduleId = queryOptions.filters.moduleId;
    if (queryOptions.filters.materialId) filters.materialId = queryOptions.filters.materialId;
    if (queryOptions.filters.mimeType) filters.mimeType = queryOptions.filters.mimeType;
    if (queryOptions.filters.fileSize) {
      filters.fileSize = {};
      if (queryOptions.filters.fileSize.min) filters.fileSize.min = queryOptions.filters.fileSize.min;
      if (queryOptions.filters.fileSize.max) filters.fileSize.max = queryOptions.filters.fileSize.max;
    }
    if (queryOptions.filters.createdAt) filters.createdAt = queryOptions.filters.createdAt;
    if (queryOptions.filters.updatedAt) filters.updatedAt = queryOptions.filters.updatedAt;

    const result = await UploadService.getUserUploads(
      req.user!.id,
      {
        page: queryOptions.page,
        pageSize: queryOptions.pageSize,
        filters,
        search: queryOptions.search,
        sort: queryOptions.sort
      }
    );

    res.json({
      success: true,
      data: result.uploads,
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
 * /api/uploads/stats:
 *   get:
 *     summary: Get upload statistics
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upload statistics
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await UploadService.getUploadStats(req.user!.id);

    res.json({
      success: true,
      data: stats
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
 * /api/uploads/sessions:
 *   post:
 *     summary: Create upload session for batch uploads
 *     tags: [Upload Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uploadType, totalFiles]
 *             properties:
 *               uploadType:
 *                 type: string
 *               totalFiles:
 *                 type: integer
 *               communityId:
 *                 type: string
 *               courseId:
 *                 type: string
 *               moduleId:
 *                 type: string
 *               materialId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Upload session created
 */
router.post('/sessions', authenticate, async (req, res) => {
  try {
    const {
      uploadType,
      totalFiles,
      communityId,
      courseId,
      moduleId,
      materialId,
      metadata = {}
    } = req.body;

    if (!uploadType || !totalFiles || totalFiles <= 0) {
      return res.status(400).json({
        success: false,
        error: 'uploadType and totalFiles (> 0) are required'
      });
    }

    const associationIds: any = {};
    if (communityId) associationIds.communityId = communityId;
    if (courseId) associationIds.courseId = courseId;
    if (moduleId) associationIds.moduleId = moduleId;
    if (materialId) associationIds.materialId = materialId;

    const session = await r2Service.createUploadSession(
      uploadType,
      totalFiles,
      req.user!.id,
      associationIds,
      metadata
    );

    res.status(201).json({
      success: true,
      data: session,
      message: 'Upload session created successfully'
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
 * /api/uploads/sessions/{sessionToken}:
 *   get:
 *     summary: Get upload session info
 *     tags: [Upload Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionToken
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Upload session information
 *       404:
 *         description: Session not found
 */
router.get('/sessions/:sessionToken', authenticate, async (req, res) => {
  try {
    const { sessionToken } = req.params;

    const session = await r2Service.getUploadSession(sessionToken);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Upload session not found'
      });
    }

    res.json({
      success: true,
      data: session
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
 * /api/uploads/presigned-url:
 *   post:
 *     summary: Generate presigned upload URL
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileName, mimeType, uploadType]
 *             properties:
 *               fileName:
 *                 type: string
 *               mimeType:
 *                 type: string
 *               uploadType:
 *                 type: string
 *                 enum: [community_avatar, community_banner, course_thumbnail, module_thumbnail, material_video, material_file, material_document, user_avatar]
 *               fileSize:
 *                 type: integer
 *                 description: File size in bytes for validation
 *               expiresIn:
 *                 type: integer
 *                 default: 3600
 *               communityId:
 *                 type: string
 *               courseId:
 *                 type: string
 *               moduleId:
 *                 type: string
 *               materialId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Authentication required
 */
/**
 * @swagger
 * /api/uploads/max-file-size/{uploadType}:
 *   get:
 *     summary: Get maximum allowed file size for a specific upload type
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: uploadType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [community_avatar, community_banner, course_thumbnail, module_thumbnail, material_video, material_file, material_document, user_avatar]
 *     responses:
 *       200:
 *         description: Maximum file size information
 *       400:
 *         description: Invalid upload type
 */
/**
 * @swagger
 * /api/uploads/validation-rules:
 *   get:
 *     summary: Get all upload validation rules
 *     tags: [Uploads]
 *     responses:
 *       200:
 *         description: All upload validation rules
 */
router.get('/validation-rules', async (req, res) => {
  try {
    const { uploadValidation } = require('../lib/upload-validation');
    
    // Convert byte sizes to MB for easier reading
    const rulesWithFormattedSizes = Object.entries(uploadValidation).map(([type, rules]: [string, any]) => ({
      uploadType: type,
      maxSizeBytes: rules.maxSize,
      maxSizeMB: Math.round(rules.maxSize / (1024 * 1024)),
      maxSizeFormatted: `${Math.round(rules.maxSize / (1024 * 1024))}MB`,
      allowedTypes: rules.allowedTypes,
      maxDimensions: rules.maxDimensions
    }));

    res.json({
      success: true,
      data: rulesWithFormattedSizes
    });

  } catch (error) {
    console.error('❌ [UploadsRoute] Error getting validation rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get validation rules'
    });
  }
});

router.get('/max-file-size/:uploadType', async (req, res) => {
  try {
    const { uploadType } = req.params;
    
    const validUploadTypes = [
      'community_avatar',
      'community_banner',
      'course_thumbnail',
      'module_thumbnail',
      'material_video',
      'material_file',
      'material_document',
      'user_avatar'
    ];

    if (!validUploadTypes.includes(uploadType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid uploadType. Must be one of: ${validUploadTypes.join(', ')}`
      });
    }

    const maxSize = r2Service.getMaxAllowedFileSize(uploadType);
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));

    res.json({
      success: true,
      data: {
        uploadType,
        maxSizeBytes: maxSize,
        maxSizeMB,
        maxSizeFormatted: `${maxSizeMB}MB`
      }
    });

  } catch (error) {
    console.error('❌ [UploadsRoute] Error getting max file size:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get maximum file size'
    });
  }
});

router.post('/presigned-url', authenticate, async (req, res) => {
  try {
    console.log('📥 [UploadsRoute] Presigned URL request received:', {
      body: req.body,
      user: req.user?.id,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Bearer ***' : 'none'
      }
    });

    const {
      fileName,
      mimeType,
      uploadType,
      fileSize,
      expiresIn = 3600,
      communityId,
      courseId,
      moduleId,
      materialId
    } = req.body;

    if (!fileName || !mimeType || !uploadType) {
      console.error('❌ [UploadsRoute] Missing required fields:', {
        hasFileName: !!fileName,
        hasMimeType: !!mimeType,
        hasUploadType: !!uploadType,
        body: req.body
      });
      return res.status(400).json({
        success: false,
        error: 'fileName, mimeType, and uploadType are required'
      });
    }

    // Validate file size if provided
    if (fileSize !== undefined && (typeof fileSize !== 'number' || fileSize <= 0)) {
      console.error('❌ [UploadsRoute] Invalid fileSize:', { fileSize });
      return res.status(400).json({
        success: false,
        error: 'fileSize must be a positive number if provided'
      });
    }

    const validUploadTypes = [
      'community_avatar',
      'community_banner',
      'course_thumbnail',
      'module_thumbnail',
      'material_video',
      'material_file',
      'material_document',
      'user_avatar'
    ];

    if (!validUploadTypes.includes(uploadType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid uploadType. Must be one of: ${validUploadTypes.join(', ')}`
      });
    }

    // Validate file type based on upload type
    const allowedMimeTypes: { [key: string]: string[] } = {
      community_avatar: ['image/jpeg', 'image/png', 'image/webp'],
      community_banner: ['image/jpeg', 'image/png', 'image/webp'],
      course_thumbnail: ['image/jpeg', 'image/png', 'image/webp'],
      module_thumbnail: ['image/jpeg', 'image/png', 'image/webp'],
      user_avatar: ['image/jpeg', 'image/png', 'image/webp'],
      material_video: ['video/mp4', 'video/webm', 'video/quicktime'],
      material_file: ['application/pdf', 'application/zip', 'application/x-zip-compressed'],
      material_document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
      ]
    };

    if (allowedMimeTypes[uploadType] && !allowedMimeTypes[uploadType].includes(mimeType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid file type for ${uploadType}. Allowed types: ${allowedMimeTypes[uploadType].join(', ')}`
      });
    }

    const associationIds: any = {};
    if (communityId) associationIds.communityId = communityId;
    if (courseId) associationIds.courseId = courseId;
    if (moduleId) associationIds.moduleId = moduleId;
    if (materialId) associationIds.materialId = materialId;

    console.log('🔄 [UploadsRoute] Calling R2Service.generatePresignedUploadUrl...');

    const result = await r2Service.generatePresignedUploadUrl(
      uploadType,
      fileName,
      mimeType,
      req.user!.id,
      expiresIn,
      associationIds,
      fileSize
    );

    console.log('✅ [UploadsRoute] Presigned URL generated successfully:', {
      uploadId: result.uploadId,
      hasPresignedUrl: !!result.presignedUrl
    });

    res.json({
      success: true,
      data: result
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
 * /api/uploads/{uploadId}/complete:
 *   post:
 *     summary: Mark upload as completed
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileSize]
 *             properties:
 *               fileSize:
 *                 type: integer
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Upload marked as completed
 *       404:
 *         description: Upload not found
 */
router.post('/:uploadId/complete', authenticate, async (req, res) => {
  try {
    console.log('📥 [UploadsRoute] Complete upload request received:', {
      uploadId: req.params.uploadId,
      body: req.body,
      user: req.user?.id
    });

    const { uploadId } = req.params;
    const { fileSize, metadata = {} } = req.body;

    if (!fileSize || fileSize <= 0) {
      console.error('❌ [UploadsRoute] Invalid fileSize:', { fileSize });
      return res.status(400).json({
        success: false,
        error: 'Valid fileSize is required'
      });
    }

    // Get the upload to check its type for size validation
    const uploadInfo = await r2Service.getUploadInfo(uploadId);
    if (!uploadInfo) {
      console.error('❌ [UploadsRoute] Upload not found for validation:', { uploadId });
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }

    // Validate file size against upload type limits
    const { validateFileSize } = require('../lib/upload-validation');
    const sizeValidation = validateFileSize(uploadInfo.uploadType, fileSize);
    if (!sizeValidation.isValid) {
      console.error('❌ [UploadsRoute] File size validation failed:', { 
        fileSize, 
        uploadType: uploadInfo.uploadType, 
        error: sizeValidation.error 
      });
      return res.status(400).json({
        success: false,
        error: sizeValidation.error
      });
    }

    console.log('✅ [UploadsRoute] File size validation passed:', { 
      fileSize, 
      uploadType: uploadInfo.uploadType 
    });

    console.log('🔄 [UploadsRoute] Calling R2Service.completeUpload...');
    const upload = await r2Service.completeUpload(uploadId, fileSize, metadata);

    if (!upload) {
      console.error('❌ [UploadsRoute] Upload not found:', { uploadId });
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }

    console.log('✅ [UploadsRoute] Upload completed successfully:', {
      uploadId: upload.id,
      status: upload.status
    });

    res.json({
      success: true,
      data: upload,
      message: 'Upload completed successfully'
    });

  } catch (error) {
    console.error('💥 [UploadsRoute] Error in presigned-url route:', error);

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
 * /api/uploads/{uploadId}/fail:
 *   post:
 *     summary: Mark upload as failed
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               error:
 *                 type: string
 *     responses:
 *       200:
 *         description: Upload marked as failed
 */
router.post('/:uploadId/fail', authenticate, async (req, res) => {
  try {
    console.log('📥 [UploadsRoute] Fail upload request received:', {
      uploadId: req.params.uploadId,
      body: req.body,
      user: req.user?.id
    });

    const { uploadId } = req.params;
    const { error: errorMessage } = req.body;

    console.log('🔄 [UploadsRoute] Calling R2Service.failUpload...');
    const upload = await r2Service.failUpload(uploadId, errorMessage);

    console.log('✅ [UploadsRoute] Upload marked as failed successfully:', {
      uploadId: upload?.id,
      status: upload?.status
    });

    res.json({
      success: true,
      data: upload,
      message: 'Upload marked as failed'
    });

  } catch (error) {
    console.error('💥 [UploadsRoute] Error in fail upload route:', error);

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
 * /api/uploads/{uploadId}/download:
 *   get:
 *     summary: Get download URL for upload
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: expiresIn
 *         schema:
 *           type: integer
 *           default: 3600
 *     responses:
 *       200:
 *         description: Download URL generated
 *       404:
 *         description: Upload not found
 */
router.get('/:uploadId/download', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { expiresIn = 3600 } = req.query;

    const downloadUrl = await r2Service.generateDownloadUrl(uploadId, Number(expiresIn));

    if (!downloadUrl) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found or not accessible'
      });
    }

    res.json({
      success: true,
      data: {
        downloadUrl,
        expiresIn: Number(expiresIn)
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
 * /api/uploads/{uploadId}:
 *   get:
 *     summary: Get upload information
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Upload information
 *       404:
 *         description: Upload not found
 */
router.get('/:uploadId', authenticate, async (req, res) => {
  try {
    const { uploadId } = req.params;

    const upload = await r2Service.getUploadInfo(uploadId);

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }

    res.json({
      success: true,
      data: upload
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
 * /api/uploads/{uploadId}:
 *   delete:
 *     summary: Delete upload
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Upload deleted successfully
 *       404:
 *         description: Upload not found
 */
router.delete('/:uploadId', authenticate, async (req, res) => {
  try {
    const { uploadId } = req.params;

    const upload = await r2Service.deleteUpload(uploadId);

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }

    res.json({
      success: true,
      data: upload,
      message: 'Upload deleted successfully'
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

export default router;