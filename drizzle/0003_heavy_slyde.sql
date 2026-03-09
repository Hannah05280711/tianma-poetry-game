CREATE TABLE `abTestAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`sessionKey` varchar(128) NOT NULL,
	`variant` varchar(64) NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `abTestAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `abTestResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`variant` varchar(64) NOT NULL,
	`sampleCount` int DEFAULT 0,
	`conversionCount` int DEFAULT 0,
	`conversionRate` float DEFAULT 0,
	`avgMetricValue` float DEFAULT 0,
	`stdDeviation` float DEFAULT 0,
	`confidence` float DEFAULT 0,
	`pValue` float DEFAULT 1,
	`winner` boolean DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `abTestResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `abTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testName` varchar(128) NOT NULL,
	`description` text,
	`status` enum('draft','running','paused','completed') NOT NULL DEFAULT 'draft',
	`controlVariant` varchar(64) NOT NULL,
	`treatmentVariant` varchar(64) NOT NULL,
	`targetMetric` varchar(64) NOT NULL,
	`sampleSize` int DEFAULT 1000,
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `abTests_id` PRIMARY KEY(`id`),
	CONSTRAINT `abTests_testName_unique` UNIQUE(`testName`)
);
--> statement-breakpoint
CREATE TABLE `conversionFunnel` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`step` enum('page_view','game_start','first_question','game_complete','rank_up','share') NOT NULL,
	`userCount` int DEFAULT 0,
	`conversionRate` float DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversionFunnel_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`dau` int DEFAULT 0,
	`newUsers` int DEFAULT 0,
	`totalSessions` int DEFAULT 0,
	`totalGamePlays` int DEFAULT 0,
	`avgGameDuration` float DEFAULT 0,
	`totalScore` int DEFAULT 0,
	`avgScore` float DEFAULT 0,
	`conversionRate` float DEFAULT 0,
	`rankUpCount` int DEFAULT 0,
	`cardDropCount` int DEFAULT 0,
	`shareCount` int DEFAULT 0,
	`errorCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyAnalytics_id` PRIMARY KEY(`id`),
	CONSTRAINT `dailyAnalytics_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `performanceMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKey` varchar(128) NOT NULL,
	`metricType` enum('LCP','FID','CLS','TTFB','FCP','api_response_time','page_load_time','error_rate') NOT NULL,
	`value` float NOT NULL,
	`page` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performanceMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `retentionAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cohortDate` varchar(10) NOT NULL,
	`daysSinceStart` int NOT NULL,
	`retainedUsers` int DEFAULT 0,
	`retentionRate` float DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `retentionAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userDistribution` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`dimension` enum('rank','difficulty','game_mode','device','region') NOT NULL,
	`dimensionValue` varchar(64) NOT NULL,
	`userCount` int DEFAULT 0,
	`percentage` float DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userDistribution_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKey` varchar(128) NOT NULL,
	`eventType` enum('game_start','game_complete','question_answer','rank_up','card_drop','share','destiny_unlock','daily_task','page_view','button_click','error') NOT NULL,
	`eventData` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userEvents_id` PRIMARY KEY(`id`)
);
