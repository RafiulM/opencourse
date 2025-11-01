ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
UPDATE "user" SET username = 'user' || SUBSTRING(id, 1, 5) WHERE username IS NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");