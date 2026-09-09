DROP TABLE `ping`;--> statement-breakpoint
CREATE INDEX `profile_catalogue_idx` ON `profile` (`status`,"updated_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `profile_sector_idx` ON `profile` (`status`,`sector`);--> statement-breakpoint
CREATE INDEX `profile_city_idx` ON `profile` (`status`,`city`);--> statement-breakpoint
CREATE INDEX `profile_certified_idx` ON `profile` (`status`,`certified_at`);