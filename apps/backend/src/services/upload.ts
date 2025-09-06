import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '../db';
import { uploads, uploadSessions, uploadTypeEnum, uploadStatusEnum } from '../db/schema/uploads';
import { eq, and, isNull, desc, asc, count, ilike, gte, lte, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { validateFileSize, validateMimeType, UploadType, getMaxFileSize as getMaxFileSizeFromValidation } from '../lib/upload-validation';

interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBucket?: string; // Optional separate public bucket
  privateBucket?: string; // Optional separate private bucket
  publicDomain?: string;
}

export interface UploadQueryOptions {
  page?: number;
  pageSize?: number;
  filters?: {
    uploadType?: string;
    status?: string;
    uploadedBy?: string;
    communityId?: string;
    courseId?: string;
    moduleId?: string;
    materialId?: string;
    mimeType?: string;
    fileSize?: { min?: number; max?: number };
    createdAt?: { start?: Date; end?: Date };
    updatedAt?: { start?: Date; end?: Date };
  };
  search?: string;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
}

class R2Service {
  private s3Client: S3Client;
  private bucket: string;
  private publicBucket?: string;
  private privateBucket?: string;
  private publicDomain?: string;

  constructor(config: R2Config) {
    console.log('🔧 [R2Service] Initializing with config:', {
      endpoint: config.endpoint ? 'configured' : 'missing',
      accessKeyId: config.accessKeyId ? 'configured' : 'missing',
      secretAccessKey: config.secretAccessKey ? 'configured' : 'missing',
      bucket: config.bucket,
      publicBucket: config.publicBucket,
      privateBucket: config.privateBucket,
      publicDomain: config.publicDomain
    });

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
    this.bucket = config.bucket;
    this.publicBucket = config.publicBucket;
    this.privateBucket = config.privateBucket;
    this.publicDomain = config.publicDomain;

    console.log('✅ [R2Service] Initialized successfully');
  }

  private isPublicUploadType(uploadType: string): boolean {
    const publicTypes = [
      'community_avatar',
      'community_banner',
      'course_thumbnail',
      'module_thumbnail',
      'user_avatar'
    ];
    return publicTypes.includes(uploadType);
  }

  private getBucketForUploadType(uploadType: string): string {
    const isPublic = this.isPublicUploadType(uploadType);

    if (this.publicBucket && this.privateBucket) {
      // Using separate buckets strategy
      return isPublic ? this.publicBucket : this.privateBucket;
    } else {
      // Using single bucket with path-based strategy
      return this.bucket;
    }
  }

  private generateR2Key(uploadType: string, fileName: string, userId: string): string {
    const timestamp = Date.now();
    const uuid = randomUUID().slice(0, 8);
    const ext = extname(fileName);
    const baseName = fileName.replace(ext, '').replace(/[^a-zA-Z0-9-_]/g, '-');

    // If using single bucket, prefix with public/ or private/
    let pathPrefix = '';
    if (!this.publicBucket && !this.privateBucket) {
      pathPrefix = this.isPublicUploadType(uploadType) ? 'public/' : 'private/';
    }

    return `${pathPrefix}${uploadType}/${userId}/${timestamp}-${uuid}-${baseName}${ext}`;
  }

  private getPublicUrl(r2Key: string, bucket: string, uploadType: string): string {
    // Only return public URLs for public upload types
    if (!this.isPublicUploadType(uploadType)) {
      return ''; // Private files don't get public URLs
    }

    if (this.publicDomain) {
      return `${this.publicDomain}/${r2Key}`;
    }
    return `https://${bucket}.r2.cloudflarestorage.com/${r2Key}`;
  }

  getMaxAllowedFileSize(uploadType: string): number {
    return getMaxFileSizeFromValidation(uploadType as UploadType);
  }

  async generatePresignedUploadUrl(
    uploadType: string,
    fileName: string,
    mimeType: string,
    userId: string,
    expiresIn: number = 3600, // 1 hour default
    associationIds: {
      communityId?: string;
      courseId?: string;
      moduleId?: string;
      materialId?: string;
    } = {},
    fileSize?: number // Optional file size for validation
  ) {
    console.log('🔄 [R2Service] Generating presigned upload URL:', {
      uploadType,
      fileName,
      mimeType,
      userId,
      expiresIn,
      associationIds,
      fileSize
    });

    // Validate file size if provided
    if (fileSize !== undefined) {
      const sizeValidation = validateFileSize(uploadType as UploadType, fileSize);
      if (!sizeValidation.isValid) {
        throw new Error(sizeValidation.error);
      }
      console.log('✅ [R2Service] File size validation passed:', { fileSize });
    }

    // Validate MIME type
    const mimeValidation = validateMimeType(uploadType as UploadType, mimeType);
    if (!mimeValidation.isValid) {
      throw new Error(mimeValidation.error);
    }
    console.log('✅ [R2Service] MIME type validation passed:', { mimeType });

    const r2Key = this.generateR2Key(uploadType, fileName, userId);
    const bucket = this.getBucketForUploadType(uploadType);

    console.log('📋 [R2Service] Generated R2 key and bucket:', {
      r2Key,
      bucket,
      isPublic: this.isPublicUploadType(uploadType)
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: r2Key,
      ContentType: mimeType,
    });

    console.log('🔐 [R2Service] Creating presigned URL with S3 client...');

    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });

    console.log('✅ [R2Service] Presigned URL generated successfully:', {
      presignedUrlLength: presignedUrl.length,
      expiresIn
    });

    // Create upload record
    console.log('💾 [R2Service] Creating upload record in database...');
    const uploadRecords = await db.insert(uploads).values({
      originalName: fileName,
      fileName: fileName,
      fileSize: 0, // Will be updated when upload completes
      mimeType,
      uploadType: uploadType as any,
      status: 'uploading',
      r2Key,
      r2Bucket: bucket,
      r2Url: this.getPublicUrl(r2Key, bucket, uploadType),
      r2PresignedUrl: presignedUrl,
      r2PresignedExpiresAt: new Date(Date.now() + expiresIn * 1000),
      uploadedBy: userId,
      ...associationIds,
    }).returning();

    const uploadRecord = uploadRecords[0];

    console.log('✅ [R2Service] Upload record created successfully:', {
      uploadId: uploadRecord.id,
      r2Key: uploadRecord.r2Key,
      status: uploadRecord.status
    });

    const result = {
      uploadId: uploadRecord.id,
      presignedUrl,
      r2Key,
      publicUrl: this.getPublicUrl(r2Key, bucket, uploadType),
      expiresAt: uploadRecord.r2PresignedExpiresAt,
    };

    console.log('🎯 [R2Service] Returning presigned URL result:', {
      uploadId: result.uploadId,
      hasPresignedUrl: !!result.presignedUrl,
      hasPublicUrl: !!result.publicUrl,
      expiresAt: result.expiresAt
    });

    return result;
  }

  async completeUpload(uploadId: string, fileSize: number, metadata: Record<string, any> = {}) {
    console.log('🏁 [R2Service] Completing upload:', {
      uploadId,
      fileSize,
      metadata
    });

    const [updatedUpload] = await db
      .update(uploads)
      .set({
        status: 'completed',
        fileSize,
        metadata,
        r2PresignedUrl: null, // Clear presigned URL after completion
        r2PresignedExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(uploads.id, uploadId))
      .returning();

    console.log('✅ [R2Service] Upload completed successfully:', {
      uploadId: updatedUpload.id,
      status: updatedUpload.status,
      fileSize: updatedUpload.fileSize,
      r2Url: updatedUpload.r2Url
    });

    return updatedUpload;
  }

  async failUpload(uploadId: string, error?: string) {
    console.log('💥 [R2Service] Marking upload as failed:', {
      uploadId,
      error
    });

    const [upload] = await db
      .select()
      .from(uploads)
      .where(eq(uploads.id, uploadId))
      .limit(1);

    if (upload) {
      console.log('🗑️ [R2Service] Attempting to delete R2 object:', upload.r2Key);

      // Delete from R2 if it exists
      try {
        await this.deleteFromR2(upload.r2Key);
        console.log('✅ [R2Service] R2 object deleted successfully');
      } catch (error) {
        console.warn(`❌ [R2Service] Failed to delete R2 object ${upload.r2Key}:`, error);
      }

      // Update status
      console.log('📝 [R2Service] Updating upload status to failed in database...');
      await db
        .update(uploads)
        .set({
          status: 'failed',
          processingInfo: { error },
          updatedAt: new Date(),
        })
        .where(eq(uploads.id, uploadId));

      console.log('✅ [R2Service] Upload marked as failed successfully');
    } else {
      console.warn('⚠️ [R2Service] Upload not found for failure marking:', uploadId);
    }

    return upload;
  }

  async deleteUpload(uploadId: string) {
    const [upload] = await db
      .select()
      .from(uploads)
      .where(eq(uploads.id, uploadId))
      .limit(1);

    if (!upload) {
      return null;
    }

    // Delete from R2
    try {
      await this.deleteFromR2(upload.r2Key);
    } catch (error) {
      console.warn(`Failed to delete R2 object ${upload.r2Key}:`, error);
    }

    // Soft delete in database
    await db
      .update(uploads)
      .set({
        status: 'deleted',
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(uploads.id, uploadId));

    return upload;
  }

  private async deleteFromR2(r2Key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: r2Key,
    });

    return await this.s3Client.send(command);
  }

  async generateDownloadUrl(uploadId: string, expiresIn: number = 3600) {
    const [upload] = await db
      .select()
      .from(uploads)
      .where(and(
        eq(uploads.id, uploadId),
        eq(uploads.status, 'completed'),
        isNull(uploads.deletedAt)
      ))
      .limit(1);

    if (!upload) {
      return null;
    }

    // If it's a public file, return the public URL
    if (upload.r2Url) {
      return upload.r2Url;
    }

    // Generate signed URL for private access
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: upload.r2Key,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });

    return signedUrl;
  }

  async getUploadInfo(uploadId: string) {
    const [upload] = await db
      .select()
      .from(uploads)
      .where(and(
        eq(uploads.id, uploadId),
        isNull(uploads.deletedAt)
      ))
      .limit(1);

    return upload;
  }

  async createUploadSession(
    uploadType: string,
    totalFiles: number,
    userId: string,
    associationIds: {
      communityId?: string;
      courseId?: string;
      moduleId?: string;
      materialId?: string;
    } = {},
    metadata: Record<string, any> = {}
  ) {
    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [session] = await db.insert(uploadSessions).values({
      sessionToken,
      uploadType: uploadType as any,
      totalFiles,
      createdBy: userId,
      metadata,
      expiresAt,
      ...associationIds,
    }).returning();

    return session;
  }

  async getUploadSession(sessionToken: string) {
    const [session] = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.sessionToken, sessionToken))
      .limit(1);

    return session;
  }

  async updateUploadSessionProgress(sessionToken: string, completed: boolean, failed: boolean = false) {
    const session = await this.getUploadSession(sessionToken);
    if (!session) return null;

    const updates: any = { updatedAt: new Date() };

    if (completed) {
      updates.completedFiles = session.completedFiles + 1;
    }

    if (failed) {
      updates.failedFiles = session.failedFiles + 1;
    }

    // Update status based on progress
    const totalProcessed = (updates.completedFiles || session.completedFiles) +
      (updates.failedFiles || session.failedFiles);

    if (totalProcessed >= session.totalFiles) {
      updates.status = 'completed';
    }

    const [updatedSession] = await db
      .update(uploadSessions)
      .set(updates)
      .where(eq(uploadSessions.sessionToken, sessionToken))
      .returning();

    return updatedSession;
  }
}

// Initialize R2 service with environment variables
console.log('🚀 [UploadService] Initializing R2Service with environment variables...');

const r2Config: R2Config = {
  endpoint: process.env.R2_ENDPOINT || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  bucket: process.env.R2_BUCKET || '',
  publicBucket: process.env.R2_PUBLIC_BUCKET, // Optional separate public bucket
  privateBucket: process.env.R2_PRIVATE_BUCKET, // Optional separate private bucket
  publicDomain: process.env.R2_PUBLIC_DOMAIN,
};

console.log('📋 [UploadService] R2 Configuration loaded:', {
  hasEndpoint: !!r2Config.endpoint,
  hasAccessKeyId: !!r2Config.accessKeyId,
  hasSecretAccessKey: !!r2Config.secretAccessKey,
  hasBucket: !!r2Config.bucket,
  hasPublicBucket: !!r2Config.publicBucket,
  hasPrivateBucket: !!r2Config.privateBucket,
  hasPublicDomain: !!r2Config.publicDomain
});

export const r2Service = new R2Service(r2Config);

// Upload Service for business logic
export class UploadService {
  static async getUploadsByEntity(entityType: 'community' | 'course' | 'module' | 'material', entityId: string) {
    const whereConditions: any[] = [eq(uploads.status, 'completed'), isNull(uploads.deletedAt)];

    switch (entityType) {
      case 'community':
        whereConditions.push(eq(uploads.communityId, entityId));
        break;
      case 'course':
        whereConditions.push(eq(uploads.courseId, entityId));
        break;
      case 'module':
        whereConditions.push(eq(uploads.moduleId, entityId));
        break;
      case 'material':
        whereConditions.push(eq(uploads.materialId, entityId));
        break;
    }

    return await db
      .select()
      .from(uploads)
      .where(and(...whereConditions))
      .orderBy(uploads.createdAt);
  }

  static async getUserUploads(userId: string, options: UploadQueryOptions = {}) {
    const {
      page = 1,
      pageSize = 50,
      filters = {},
      search,
      sort = [{ field: 'createdAt', order: 'desc' }]
    } = options;

    const offset = (page - 1) * pageSize;

    const query = db.select().from(uploads);
    const dynamicQuery = query.$dynamic();

    // Apply base conditions
    const baseConditions = [eq(uploads.uploadedBy, userId), eq(uploads.status, 'completed'), isNull(uploads.deletedAt)];
    dynamicQuery.where(and(...baseConditions));

    // Apply filters
    if (filters.uploadType) {
      dynamicQuery.where(eq(uploads.uploadType, filters.uploadType as any));
    }
    if (filters.status) {
      dynamicQuery.where(eq(uploads.status, filters.status as any));
    }
    if (filters.communityId) {
      dynamicQuery.where(eq(uploads.communityId, filters.communityId));
    }
    if (filters.courseId) {
      dynamicQuery.where(eq(uploads.courseId, filters.courseId));
    }
    if (filters.moduleId) {
      dynamicQuery.where(eq(uploads.moduleId, filters.moduleId));
    }
    if (filters.materialId) {
      dynamicQuery.where(eq(uploads.materialId, filters.materialId));
    }
    if (filters.mimeType) {
      dynamicQuery.where(eq(uploads.mimeType, filters.mimeType));
    }
    if (filters.fileSize) {
      if (filters.fileSize.min !== undefined) {
        dynamicQuery.where(gte(uploads.fileSize, filters.fileSize.min));
      }
      if (filters.fileSize.max !== undefined) {
        dynamicQuery.where(lte(uploads.fileSize, filters.fileSize.max));
      }
    }
    if (filters.createdAt) {
      if (filters.createdAt.start) {
        dynamicQuery.where(gte(uploads.createdAt, filters.createdAt.start));
      }
      if (filters.createdAt.end) {
        dynamicQuery.where(lte(uploads.createdAt, filters.createdAt.end));
      }
    }
    if (filters.updatedAt) {
      if (filters.updatedAt.start) {
        dynamicQuery.where(gte(uploads.updatedAt, filters.updatedAt.start));
      }
      if (filters.updatedAt.end) {
        dynamicQuery.where(lte(uploads.updatedAt, filters.updatedAt.end));
      }
    }

    // Apply search
    if (search) {
      dynamicQuery.where(
        or(
          ilike(uploads.originalName, `%${search}%`),
          ilike(uploads.fileName, `%${search}%`)
        )
      );
    }

    // Get total count
    const countQuery = db.select({ count: count() }).from(uploads);
    const dynamicCountQuery = countQuery.$dynamic();
    dynamicCountQuery.where(and(...baseConditions));

    // Apply same filters to count query
    if (filters.uploadType) {
      dynamicCountQuery.where(eq(uploads.uploadType, filters.uploadType as any));
    }
    if (filters.status) {
      dynamicCountQuery.where(eq(uploads.status, filters.status as any));
    }
    if (filters.communityId) {
      dynamicCountQuery.where(eq(uploads.communityId, filters.communityId));
    }
    if (filters.courseId) {
      dynamicCountQuery.where(eq(uploads.courseId, filters.courseId));
    }
    if (filters.moduleId) {
      dynamicCountQuery.where(eq(uploads.moduleId, filters.moduleId));
    }
    if (filters.materialId) {
      dynamicCountQuery.where(eq(uploads.materialId, filters.materialId));
    }
    if (filters.mimeType) {
      dynamicCountQuery.where(eq(uploads.mimeType, filters.mimeType));
    }
    if (filters.fileSize) {
      if (filters.fileSize.min !== undefined) {
        dynamicCountQuery.where(gte(uploads.fileSize, filters.fileSize.min));
      }
      if (filters.fileSize.max !== undefined) {
        dynamicCountQuery.where(lte(uploads.fileSize, filters.fileSize.max));
      }
    }
    if (filters.createdAt) {
      if (filters.createdAt.start) {
        dynamicCountQuery.where(gte(uploads.createdAt, filters.createdAt.start));
      }
      if (filters.createdAt.end) {
        dynamicCountQuery.where(lte(uploads.createdAt, filters.createdAt.end));
      }
    }
    if (filters.updatedAt) {
      if (filters.updatedAt.start) {
        dynamicCountQuery.where(gte(uploads.updatedAt, filters.updatedAt.start));
      }
      if (filters.updatedAt.end) {
        dynamicCountQuery.where(lte(uploads.updatedAt, filters.updatedAt.end));
      }
    }

    // Apply same search to count query
    if (search) {
      dynamicCountQuery.where(
        or(
          ilike(uploads.originalName, `%${search}%`),
          ilike(uploads.fileName, `%${search}%`)
        )
      );
    }

    const [{ count: totalCount }] = await dynamicCountQuery;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Apply sorting
    let orderedQuery = dynamicQuery;
    for (const sortItem of sort) {
      switch (sortItem.field) {
        case 'originalName':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(uploads.originalName) : desc(uploads.originalName));
          break;
        case 'fileSize':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(uploads.fileSize) : desc(uploads.fileSize));
          break;
        case 'uploadType':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(uploads.uploadType) : desc(uploads.uploadType));
          break;
        case 'status':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(uploads.status) : desc(uploads.status));
          break;
        case 'createdAt':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(uploads.createdAt) : desc(uploads.createdAt));
          break;
        case 'updatedAt':
          orderedQuery = orderedQuery.orderBy(sortItem.order === 'asc' ? asc(uploads.updatedAt) : desc(uploads.updatedAt));
          break;
      }
    }

    const results = await orderedQuery
      .limit(pageSize)
      .offset(offset);

    return {
      uploads: results,
      totalCount,
      totalPages
    };
  }

  static async getUploadStats(userId?: string) {
    const whereConditions = [isNull(uploads.deletedAt)];

    if (userId) {
      whereConditions.push(eq(uploads.uploadedBy, userId));
    }

    // This would need to be implemented with proper aggregation
    // For now, returning basic info
    const allUploads = await db
      .select()
      .from(uploads)
      .where(and(...whereConditions));

    const stats = allUploads.reduce((acc, upload) => {
      acc.totalFiles += 1;
      acc.totalSize += upload.fileSize;

      if (upload.status === 'completed') acc.completed += 1;
      if (upload.status === 'failed') acc.failed += 1;
      if (upload.status === 'uploading') acc.pending += 1;

      return acc;
    }, {
      totalFiles: 0,
      totalSize: 0,
      completed: 0,
      failed: 0,
      pending: 0,
    });

    return stats;
  }
}

export { R2Service };