ALTER TABLE `profile` ADD `availability` text DEFAULT 'immediate' NOT NULL;--> statement-breakpoint
CREATE INDEX `profile_availability_idx` ON `profile` (`status`,`availability`);