CREATE TABLE `poetCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poetName` varchar(64) NOT NULL,
	`dynasty` varchar(32),
	`imageUrl` text NOT NULL,
	`rarity` enum('common','rare','epic') NOT NULL DEFAULT 'common',
	`description` text,
	`signaturePoem` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poetCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPoetCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKey` varchar(128) NOT NULL,
	`cardId` int NOT NULL,
	`obtainedAt` timestamp NOT NULL DEFAULT (now()),
	`stageId` int,
	CONSTRAINT `userPoetCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userStageProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKey` varchar(128) NOT NULL,
	`stageId` int NOT NULL,
	`status` enum('locked','available','completed') NOT NULL DEFAULT 'locked',
	`bestCorrect` int DEFAULT 0,
	`attemptCount` int DEFAULT 0,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userStageProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `v2GameSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKey` varchar(128) NOT NULL,
	`stageId` int NOT NULL,
	`phase` enum('main','debt') NOT NULL DEFAULT 'main',
	`questionIds` text,
	`currentIndex` int DEFAULT 0,
	`correctCount` int DEFAULT 0,
	`wrongQuestionIds` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`passed` boolean DEFAULT false,
	CONSTRAINT `v2GameSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `v2PoetDebts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKey` varchar(128) NOT NULL,
	`stageId` int NOT NULL,
	`questionId` int NOT NULL,
	`wrongAnswer` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`repaidAt` timestamp,
	CONSTRAINT `v2PoetDebts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `v2Stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stageNumber` int NOT NULL,
	`tierKey` enum('bronze','silver','gold','platinum','diamond','star','king') NOT NULL,
	`subLevel` int NOT NULL,
	`stageName` varchar(64) NOT NULL,
	`storyBefore` text,
	`storyAfter` text,
	`difficulty` int NOT NULL DEFAULT 1,
	`questionsPerRound` int NOT NULL DEFAULT 10,
	`weaponEmoji` varchar(16) DEFAULT '⚔️',
	CONSTRAINT `v2Stages_id` PRIMARY KEY(`id`),
	CONSTRAINT `v2Stages_stageNumber_unique` UNIQUE(`stageNumber`)
);
