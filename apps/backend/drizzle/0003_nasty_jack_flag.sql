-- Create enum type if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."post_visibility" AS ENUM('community', 'public');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
-- Add column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'visibility'
  ) THEN
    ALTER TABLE "posts" ADD COLUMN "visibility" "post_visibility" DEFAULT 'community' NOT NULL;
  END IF;
END $$;