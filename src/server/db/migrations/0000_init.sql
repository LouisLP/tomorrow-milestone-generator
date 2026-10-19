CREATE TABLE `challenges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`brief` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`challenge_id` integer NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `milestones_challenge_id_position_idx` ON `milestones` (`challenge_id`,`position`);