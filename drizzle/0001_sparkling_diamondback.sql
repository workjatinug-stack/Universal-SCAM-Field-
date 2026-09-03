CREATE TABLE `communityReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`category` varchar(64) NOT NULL,
	`description` text NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('reviewing','verified','resolved') NOT NULL DEFAULT 'reviewing',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communityReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scamScans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sourceType` varchar(32) NOT NULL,
	`contentPreview` text NOT NULL,
	`riskScore` int NOT NULL,
	`riskBand` varchar(32) NOT NULL,
	`scamType` varchar(96) NOT NULL,
	`reasonsJson` text NOT NULL,
	`recommendation` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scamScans_id` PRIMARY KEY(`id`)
);
