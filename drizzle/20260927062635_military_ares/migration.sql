CREATE TABLE `Post` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_Post_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `Tag` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`postId` text NOT NULL,
	`createdAt` integer NOT NULL,
	CONSTRAINT `fk_Tag_postId_Post_id_fk` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`removedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Tag_postId_name_key` ON `Tag` (`postId`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_key` ON `User` (`email`);