import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql2.createConnection(process.env.DATABASE_URL);

// Also add missing columns to users table
const alterStatements = [
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `totalScore` int NOT NULL DEFAULT 0",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `currentRankId` int NOT NULL DEFAULT 1",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `consecutiveWins` int NOT NULL DEFAULT 0",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `totalAnswered` int NOT NULL DEFAULT 0",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `totalCorrect` int NOT NULL DEFAULT 0",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `hintsCount` int NOT NULL DEFAULT 3",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `shieldsCount` int NOT NULL DEFAULT 1",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `inkDrops` int NOT NULL DEFAULT 20",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `consecutiveLoginDays` int NOT NULL DEFAULT 0",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `lastLoginDate` timestamp NULL",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `poetCorrectMap` json",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `typePreferMap` json",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `avgResponseTime` float DEFAULT 5.0",
];

const createStatements = [
  `CREATE TABLE IF NOT EXISTS \`poets\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(64) NOT NULL,
    \`dynasty\` varchar(32) NOT NULL,
    \`mbtiType\` varchar(8) NOT NULL,
    \`mbtiDescription\` text NOT NULL,
    \`personalityTags\` json,
    \`signaturePoems\` json,
    \`imageUrl\` text,
    \`relatedWeapons\` json,
    \`styleKeywords\` json,
    \`dynastyWeight\` float DEFAULT 1,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`poets_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`questions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`poetId\` int NOT NULL,
    \`content\` text NOT NULL,
    \`options\` json,
    \`correctAnswer\` varchar(512) NOT NULL,
    \`questionType\` enum('fill','reorder','error','chain','judge') NOT NULL,
    \`difficulty\` int NOT NULL DEFAULT 1,
    \`weaponTag\` varchar(64),
    \`sourcePoemTitle\` varchar(128),
    \`sourcePoemAuthor\` varchar(64),
    \`dynasty\` varchar(32),
    \`themeTag\` varchar(64),
    \`explanation\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`questions_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`weaponRanks\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`rankTier\` enum('bronze','silver','gold','platinum','diamond','star','king') NOT NULL,
    \`rankName\` varchar(64) NOT NULL,
    \`tierName\` varchar(32) NOT NULL,
    \`subRank\` int NOT NULL,
    \`weaponName\` varchar(64) NOT NULL,
    \`weaponStory\` text,
    \`minScore\` int NOT NULL,
    \`maxScore\` int NOT NULL,
    \`iconEmoji\` varchar(16) DEFAULT '⚔️',
    \`color\` varchar(32) DEFAULT '#CD7F32',
    \`glowColor\` varchar(32) DEFAULT '#CD7F32',
    CONSTRAINT \`weaponRanks_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`userQuestionRecords\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`questionId\` int NOT NULL,
    \`isCorrect\` boolean NOT NULL,
    \`answeredAt\` timestamp NOT NULL DEFAULT (now()),
    \`responseTime\` float DEFAULT 0,
    \`sessionId\` varchar(64),
    CONSTRAINT \`userQuestionRecords_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`destinyPoets\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`poetId\` int NOT NULL,
    \`matchScore\` float NOT NULL,
    \`analysisReport\` text,
    \`acrosticPoem\` text,
    \`shareCount\` int DEFAULT 0,
    \`generatedAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`destinyPoets_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`destinyPoets_userId_unique\` UNIQUE(\`userId\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`dailyTaskConfigs\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`taskKey\` varchar(64) NOT NULL,
    \`taskName\` varchar(128) NOT NULL,
    \`description\` text,
    \`rewardScore\` int DEFAULT 0,
    \`rewardHints\` int DEFAULT 0,
    \`rewardInk\` int DEFAULT 0,
    \`targetCount\` int DEFAULT 1,
    \`iconEmoji\` varchar(16) DEFAULT '📜',
    CONSTRAINT \`dailyTaskConfigs_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`dailyTaskConfigs_taskKey_unique\` UNIQUE(\`taskKey\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`userDailyTasks\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`taskKey\` varchar(64) NOT NULL,
    \`date\` varchar(16) NOT NULL,
    \`progress\` int DEFAULT 0,
    \`completed\` boolean DEFAULT false,
    \`claimed\` boolean DEFAULT false,
    \`completedAt\` timestamp NULL,
    CONSTRAINT \`userDailyTasks_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`weeklyLeaderboard\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`weekKey\` varchar(16) NOT NULL,
    \`weekScore\` int DEFAULT 0,
    \`weekAnswered\` int DEFAULT 0,
    \`weekCorrect\` int DEFAULT 0,
    \`rankTier\` varchar(32),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`weeklyLeaderboard_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`gameSessions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int,
    \`sessionId\` varchar(64) NOT NULL,
    \`difficulty\` int DEFAULT 1,
    \`startedAt\` timestamp NOT NULL DEFAULT (now()),
    \`endedAt\` timestamp NULL,
    \`totalQuestions\` int DEFAULT 0,
    \`correctCount\` int DEFAULT 0,
    \`scoreEarned\` int DEFAULT 0,
    \`inkUsed\` int DEFAULT 0,
    \`maxConsecutive\` int DEFAULT 0,
    \`completed\` boolean DEFAULT false,
    CONSTRAINT \`gameSessions_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`gameSessions_sessionId_unique\` UNIQUE(\`sessionId\`)
  )`,
];

for (const sql of alterStatements) {
  try {
    await conn.execute(sql);
    console.log('OK:', sql.slice(0, 60));
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('skip (exists):', sql.slice(0, 60));
    } else {
      console.error('ERROR:', e.message, sql.slice(0, 60));
    }
  }
}

for (const sql of createStatements) {
  try {
    await conn.execute(sql);
    const match = sql.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/);
    console.log('created:', match?.[1]);
  } catch(e) {
    console.error('ERROR:', e.message.slice(0, 100));
  }
}

await conn.end();
console.log('All done!');
