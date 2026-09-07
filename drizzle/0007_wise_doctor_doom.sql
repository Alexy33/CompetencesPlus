PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_certification_answer` (
	`attempt_id` text NOT NULL,
	`question_id` text NOT NULL,
	`value` integer NOT NULL,
	PRIMARY KEY(`attempt_id`, `question_id`),
	FOREIGN KEY (`attempt_id`) REFERENCES `certification_attempt`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_certification_answer`("attempt_id", "question_id", "value") SELECT "attempt_id", "question_id", "value" FROM `certification_answer`;--> statement-breakpoint
DROP TABLE `certification_answer`;--> statement-breakpoint
ALTER TABLE `__new_certification_answer` RENAME TO `certification_answer`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `certification_attempt` ADD `questionnaire_version` integer DEFAULT 1 NOT NULL;
