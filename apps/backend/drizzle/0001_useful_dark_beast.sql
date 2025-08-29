CREATE TYPE "public"."upload_status" AS ENUM('uploading', 'processing', 'completed', 'failed', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."upload_type" AS ENUM('community_avatar', 'community_banner', 'course_thumbnail', 'module_thumbnail', 'material_video', 'material_file', 'material_document', 'user_avatar');--> statement-breakpoint
CREATE TABLE "upload_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"upload_type" "upload_type" NOT NULL,
	"status" "upload_status" DEFAULT 'uploading' NOT NULL,
	"community_id" uuid,
	"course_id" uuid,
	"module_id" uuid,
	"material_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"total_files" integer DEFAULT 1 NOT NULL,
	"completed_files" integer DEFAULT 0 NOT NULL,
	"failed_files" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "upload_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"upload_type" "upload_type" NOT NULL,
	"status" "upload_status" DEFAULT 'uploading' NOT NULL,
	"r2_key" varchar(500) NOT NULL,
	"r2_bucket" varchar(100) NOT NULL,
	"r2_url" text,
	"r2_presigned_url" text,
	"r2_presigned_expires_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"processing_info" jsonb DEFAULT '{}'::jsonb,
	"community_id" uuid,
	"course_id" uuid,
	"module_id" uuid,
	"material_id" uuid,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "banner_upload_id" uuid;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "avatar_upload_id" uuid;--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN "file_upload_id" uuid;--> statement-breakpoint
ALTER TABLE "course_modules" ADD COLUMN "thumbnail" text;--> statement-breakpoint
ALTER TABLE "course_modules" ADD COLUMN "thumbnail_upload_id" uuid;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "thumbnail_upload_id" uuid;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_module_id_course_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_material_id_course_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."course_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_module_id_course_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_material_id_course_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."course_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "upload_sessions_token_idx" ON "upload_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "upload_sessions_created_by_idx" ON "upload_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "upload_sessions_status_idx" ON "upload_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "upload_sessions_expires_idx" ON "upload_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "uploads_uploader_idx" ON "uploads" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "uploads_status_idx" ON "uploads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "uploads_type_idx" ON "uploads" USING btree ("upload_type");--> statement-breakpoint
CREATE INDEX "uploads_community_idx" ON "uploads" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "uploads_course_idx" ON "uploads" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "uploads_module_idx" ON "uploads" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "uploads_material_idx" ON "uploads" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "uploads_r2_key_idx" ON "uploads" USING btree ("r2_key");--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_banner_upload_id_uploads_id_fk" FOREIGN KEY ("banner_upload_id") REFERENCES "public"."uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_avatar_upload_id_uploads_id_fk" FOREIGN KEY ("avatar_upload_id") REFERENCES "public"."uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_materials" ADD CONSTRAINT "course_materials_file_upload_id_uploads_id_fk" FOREIGN KEY ("file_upload_id") REFERENCES "public"."uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_thumbnail_upload_id_uploads_id_fk" FOREIGN KEY ("thumbnail_upload_id") REFERENCES "public"."uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_thumbnail_upload_id_uploads_id_fk" FOREIGN KEY ("thumbnail_upload_id") REFERENCES "public"."uploads"("id") ON DELETE no action ON UPDATE no action;