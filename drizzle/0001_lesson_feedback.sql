CREATE TABLE "lesson_feedback" (
	"event_id" text PRIMARY KEY NOT NULL,
	"helpful" boolean NOT NULL,
	"comment" varchar(500)
);
--> statement-breakpoint
ALTER TABLE "lesson_feedback" ADD CONSTRAINT "lesson_feedback_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;