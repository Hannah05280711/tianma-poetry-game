import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql2.createConnection(process.env.DATABASE_URL);
const tables = [
  'gameSessions','weeklyLeaderboard','userDailyTasks','dailyTaskConfigs',
  'destinyPoets','userQuestionRecords','weaponRanks','questions','poets',
  '__drizzle_migrations'
];
for (const t of tables) {
  try {
    await conn.execute(`DROP TABLE IF EXISTS \`${t}\``);
    console.log('dropped', t);
  } catch(e) {
    console.log('skip', t, e.message);
  }
}
await conn.end();
console.log('done');
