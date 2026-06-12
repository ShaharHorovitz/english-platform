DROP INDEX "user_progress_user_task_idx";--> statement-breakpoint
CREATE INDEX "user_progress_user_status_idx" ON "user_progress" USING btree ("user_id","status");