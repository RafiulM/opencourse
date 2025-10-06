import { db } from '../db';
import { postAttachments, posts, uploads } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export interface AddAttachmentRequest {
  uploadId: string;
  type: 'image' | 'video' | 'file' | 'audio' | 'document';
  title?: string;
  description?: string;
  caption?: string;
  order?: number;
  isPrimary?: boolean;
}

export interface UpdateAttachmentRequest {
  title?: string;
  description?: string;
  caption?: string;
  order?: number;
  isPrimary?: boolean;
}

class PostAttachmentService {
  // Add attachments to post
  static async addAttachments(postId: string, attachments: AddAttachmentRequest[]) {
    const now = new Date();

    // If any attachment is marked as primary, unmark existing primary attachments first
    const hasPrimary = attachments.some(att => att.isPrimary);
    if (hasPrimary) {
      await db
        .update(postAttachments)
        .set({ isPrimary: false, updatedAt: now })
        .where(eq(postAttachments.postId, postId));
    }

    const attachmentRecords = await db
      .insert(postAttachments)
      .values(
        attachments.map((att, index) => ({
          postId,
          uploadId: att.uploadId,
          type: att.type,
          title: att.title,
          description: att.description,
          caption: att.caption,
          order: att.order ?? index,
          isPrimary: att.isPrimary ?? false,
          createdAt: now,
          updatedAt: now,
        }))
      )
      .returning();

    return attachmentRecords;
  }

  // Add single attachment to post
  static async addAttachment(postId: string, data: AddAttachmentRequest) {
    const now = new Date();

    // If this attachment is marked as primary, unmark existing primary attachments
    if (data.isPrimary) {
      await db
        .update(postAttachments)
        .set({ isPrimary: false, updatedAt: now })
        .where(eq(postAttachments.postId, postId));
    }

    const [attachment] = await db
      .insert(postAttachments)
      .values({
        postId,
        uploadId: data.uploadId,
        type: data.type,
        title: data.title,
        description: data.description,
        caption: data.caption,
        order: data.order ?? 0,
        isPrimary: data.isPrimary ?? false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return attachment;
  }

  // Remove attachment from post
  static async removeAttachment(postId: string, attachmentId: string) {
    const [attachment] = await db
      .select()
      .from(postAttachments)
      .where(and(
        eq(postAttachments.id, attachmentId),
        eq(postAttachments.postId, postId)
      ))
      .limit(1);

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    await db
      .delete(postAttachments)
      .where(and(
        eq(postAttachments.id, attachmentId),
        eq(postAttachments.postId, postId)
      ));

    return attachment;
  }

  // Update attachment metadata
  static async updateAttachment(attachmentId: string, data: UpdateAttachmentRequest) {
    const now = new Date();

    const [attachment] = await db
      .select()
      .from(postAttachments)
      .where(eq(postAttachments.id, attachmentId))
      .limit(1);

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // If setting this attachment as primary, unmark other primary attachments
    if (data.isPrimary) {
      await db
        .update(postAttachments)
        .set({ isPrimary: false, updatedAt: now })
        .where(and(
          eq(postAttachments.postId, attachment.postId),
          eq(postAttachments.id, attachmentId)
        ));
    }

    const [updatedAttachment] = await db
      .update(postAttachments)
      .set({
        title: data.title,
        description: data.description,
        caption: data.caption,
        order: data.order,
        isPrimary: data.isPrimary,
        updatedAt: now,
      })
      .where(eq(postAttachments.id, attachmentId))
      .returning();

    return updatedAttachment;
  }

  // Reorder attachments
  static async reorderAttachments(postId: string, attachmentOrders: Array<{ id: string; order: number }>) {
    const now = new Date();

    // Verify all attachments belong to the post
    const attachmentIds = attachmentOrders.map(ord => ord.id);

    const existingAttachments = await db
      .select()
      .from(postAttachments)
      .where(and(
        eq(postAttachments.postId, postId),
        // This would need to be implemented with the 'in' operator
        // For now, we'll update one by one
      ));

    const updates = attachmentOrders.map(async ({ id, order }) => {
      await db
        .update(postAttachments)
        .set({ order, updatedAt: now })
        .where(and(
          eq(postAttachments.id, id),
          eq(postAttachments.postId, postId)
        ));
    });

    await Promise.all(updates);

    return { success: true };
  }

  // Get attachments for post
  static async getPostAttachments(postId: string) {
    return await db
      .select({
        id: postAttachments.id,
        uploadId: postAttachments.uploadId,
        type: postAttachments.type,
        title: postAttachments.title,
        description: postAttachments.description,
        caption: postAttachments.caption,
        order: postAttachments.order,
        isPrimary: postAttachments.isPrimary,
        createdAt: postAttachments.createdAt,
        updatedAt: postAttachments.updatedAt,
        upload: {
          id: uploads.id,
          originalName: uploads.originalName,
          fileName: uploads.fileName,
          fileSize: uploads.fileSize,
          mimeType: uploads.mimeType,
          r2Url: uploads.r2Url,
          r2Bucket: uploads.r2Bucket,
          r2Key: uploads.r2Key,
          metadata: uploads.metadata,
        }
      })
      .from(postAttachments)
      .innerJoin(uploads, eq(postAttachments.uploadId, uploads.id))
      .where(eq(postAttachments.postId, postId))
      .orderBy(postAttachments.order);
  }

  // Get single attachment
  static async getAttachmentById(attachmentId: string) {
    const [attachment] = await db
      .select({
        id: postAttachments.id,
        postId: postAttachments.postId,
        uploadId: postAttachments.uploadId,
        type: postAttachments.type,
        title: postAttachments.title,
        description: postAttachments.description,
        caption: postAttachments.caption,
        order: postAttachments.order,
        isPrimary: postAttachments.isPrimary,
        createdAt: postAttachments.createdAt,
        updatedAt: postAttachments.updatedAt,
        upload: {
          id: uploads.id,
          originalName: uploads.originalName,
          fileName: uploads.fileName,
          fileSize: uploads.fileSize,
          mimeType: uploads.mimeType,
          r2Url: uploads.r2Url,
          r2Bucket: uploads.r2Bucket,
          r2Key: uploads.r2Key,
          metadata: uploads.metadata,
        }
      })
      .from(postAttachments)
      .innerJoin(uploads, eq(postAttachments.uploadId, uploads.id))
      .where(eq(postAttachments.id, attachmentId))
      .limit(1);

    return attachment || null;
  }
}

export { PostAttachmentService };