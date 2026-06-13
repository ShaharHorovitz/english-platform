CREATE TABLE "task_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"time_spent_seconds" integer,
	"score" integer,
	"passed" boolean DEFAULT false NOT NULL,
	"redo_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocab_mastery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"vocab_item_id" uuid NOT NULL,
	"times_seen" integer DEFAULT 0 NOT NULL,
	"times_correct" integer DEFAULT 0 NOT NULL,
	"times_incorrect" integer DEFAULT 0 NOT NULL,
	"mastery_level" smallint DEFAULT 0 NOT NULL,
	"last_seen_at" timestamp with time zone,
	"last_correct_at" timestamp with time zone,
	CONSTRAINT "vocab_mastery_user_item_unique" UNIQUE("user_id","vocab_item_id")
);
--> statement-breakpoint
ALTER TABLE "task_attempts" ADD CONSTRAINT "task_attempts_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attempts" ADD CONSTRAINT "task_attempts_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocab_mastery" ADD CONSTRAINT "vocab_mastery_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocab_mastery" ADD CONSTRAINT "vocab_mastery_vocab_item_id_vocab_items_id_fk" FOREIGN KEY ("vocab_item_id") REFERENCES "public"."vocab_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_attempts_user_task_idx" ON "task_attempts" USING btree ("user_id","task_id");--> statement-breakpoint
CREATE INDEX "task_attempts_user_completed_idx" ON "task_attempts" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE INDEX "vocab_mastery_user_level_idx" ON "vocab_mastery" USING btree ("user_id","mastery_level");