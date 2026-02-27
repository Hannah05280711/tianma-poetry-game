CREATE TABLE `dailyTaskConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskKey` varchar(64) NOT NULL,
	`taskName` varchar(128) NOT NULL,
	`description` text,
	`rewardScore` int DEFAULT 0,
	`rewardHints` int DEFAULT 0,
	`rewardInk` int DEFAULT 0,
	`targetCount` int DEFAULT 1,
	`iconEmoji` varchar(16) DEFAULT '📜',
	CONSTRAINT `dailyTaskConfigs_id` PRIMARY KEY(`id`),
	CONSTRAINT `dailyTaskConfigs_taskKey_unique` UNIQUE(`taskKey`)
);
--> statement-breakpoint
CREATE TABLE `destinyPoets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`poetId` int NOT NULL,
	`matchScore` float NOT NULL,
	`analysisReport` text,
	`acrosticPoem` text,
	`shareCount` int DEFAULT 0,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `destinyPoets_id` PRIMARY KEY(`id`),
	CONSTRAINT `destinyPoets_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `gameSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(64) NOT NULL,
	`difficulty` int DEFAULT 1,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	`totalQuestions` int DEFAULT 0,
	`correctCount` int DEFAULT 0,
	`scoreEarned` int DEFAULT 0,
	`inkUsed` int DEFAULT 0,
	`maxConsecutive` int DEFAULT 0,
	`completed` boolean DEFAULT false,
	CONSTRAINT `gameSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `gameSessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `poets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`dynasty` varchar(32) NOT NULL,
	`mbtiType` varchar(8) NOT NULL,
	`mbtiDescription` text NOT NULL,
	`personalityTags` json,
	`signaturePoems` json,
	`imageUrl` text,
	`relatedWeapons` json,
	`styleKeywords` json,
	`dynastyWeight` float DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poetId` int NOT NULL,
	`content` text NOT NULL,
	`options` json,
	`correctAnswer` varchar(512) NOT NULL,
	`questionType` enum('fill','reorder','error','chain','judge') NOT NULL,
	`difficulty` int NOT NULL DEFAULT 1,
	`weaponTag` varchar(64),
	`sourcePoemTitle` varchar(128),
	`sourcePoemAuthor` varchar(64),
	`dynasty` varchar(32),
	`themeTag` varchar(64),
	`explanation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userDailyTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskKey` varchar(64) NOT NULL,
	`date` varchar(16) NOT NULL,
	`progress` int DEFAULT 0,
	`completed` boolean DEFAULT false,
	`claimed` boolean DEFAULT false,
	`completedAt` timestamp,
	CONSTRAINT `userDailyTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userQuestionRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`isCorrect` boolean NOT NULL,
	`answeredAt` timestamp NOT NULL DEFAULT (now()),
	`responseTime` float DEFAULT 0,
	`sessionId` varchar(64),
	CONSTRAINT `userQuestionRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	`totalScore` int NOT NULL DEFAULT 0,
	`currentRankId` int NOT NULL DEFAULT 1,
	`consecutiveWins` int NOT NULL DEFAULT 0,
	`totalAnswered` int NOT NULL DEFAULT 0,
	`totalCorrect` int NOT NULL DEFAULT 0,
	`hintsCount` int NOT NULL DEFAULT 3,
	`shieldsCount` int NOT NULL DEFAULT 1,
	`inkDrops` int NOT NULL DEFAULT 20,
	`consecutiveLoginDays` int NOT NULL DEFAULT 0,
	`lastLoginDate` timestamp,
	`poetCorrectMap` json,
	`typePreferMap` json,
	`avgResponseTime` float DEFAULT 5,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `weaponRanks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rankTier` enum('bronze','silver','gold','platinum','diamond','star','king') NOT NULL,
	`rankName` varchar(64) NOT NULL,
	`tierName` varchar(32) NOT NULL,
	`subRank` int NOT NULL,
	`weaponName` varchar(64) NOT NULL,
	`weaponStory` text,
	`minScore` int NOT NULL,
	`maxScore` int NOT NULL,
	`iconEmoji` varchar(16) DEFAULT '⚔️',
	`color` varchar(32) DEFAULT '#CD7F32',
	`glowColor` varchar(32) DEFAULT '#CD7F32',
	CONSTRAINT `weaponRanks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklyLeaderboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekKey` varchar(16) NOT NULL,
	`weekScore` int DEFAULT 0,
	`weekAnswered` int DEFAULT 0,
	`weekCorrect` int DEFAULT 0,
	`rankTier` varchar(32),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weeklyLeaderboard_id` PRIMARY KEY(`id`)
);
