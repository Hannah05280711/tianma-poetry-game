import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not configured, skipping V2 data update");
  process.exit(0);
}

let connection;
try {
  connection = await mysql.createConnection(DATABASE_URL);
  console.log("✅ Database connection established");

  // 1. New Cards
  const newCards = [
    {
      poetName: "鱼玄机",
      dynasty: "唐",
      rarity: "epic",
      imageUrl: "/images/poets/yuxuanji.png",
      description: "晚唐杰出女诗人，才华横溢，性格叛逆，与李冶、薛涛并称唐代三大女诗人。",
      signaturePoem: "易求无价宝，难得有情郎。"
    },
    {
      poetName: "薛涛",
      dynasty: "唐",
      rarity: "epic",
      imageUrl: "/images/poets/xuetao.png",
      description: "唐代著名女诗人、发明家，曾创制“薛涛笺”。她聪慧过人，是唐代女诗人的杰出代表。",
      signaturePoem: "风花日将老，佳期犹渺渺。"
    }
  ];

  // 2. Load New Questions
  const questionsPath = path.join(__dirname, "v2_new_questions.json");
  if (!fs.existsSync(questionsPath)) {
    console.error(`❌ Questions file not found: ${questionsPath}`);
    process.exit(1);
  }
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, "utf8"));
  console.log(`📝 Loaded ${questionsData.length} questions from v2_new_questions.json`);

  // Insert New Cards
  console.log("🎴 Processing poet cards...");
  for (const c of newCards) {
    try {
      const [rows] = await connection.execute("SELECT id FROM poetCards WHERE poetName = ?", [c.poetName]);
      if (rows.length === 0) {
        await connection.execute(
          `INSERT INTO poetCards (poetName, dynasty, imageUrl, rarity, description, signaturePoem)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [c.poetName, c.dynasty, c.imageUrl, c.rarity, c.description, c.signaturePoem]
        );
        console.log(`✅ Added card: ${c.poetName}`);
      } else {
        // Update existing card to ensure correct imageUrl and rarity
        await connection.execute(
          `UPDATE poetCards SET imageUrl = ?, rarity = ?, description = ?, signaturePoem = ? WHERE poetName = ?`,
          [c.imageUrl, c.rarity, c.description, c.signaturePoem, c.poetName]
        );
        console.log(`ℹ️ Updated card: ${c.poetName}`);
      }
    } catch (err) {
      console.error(`❌ Error processing card ${c.poetName}:`, err.message);
    }
  }

  // Insert New Questions
  console.log("❓ Processing questions...");
  // Clear old V2 questions first to avoid duplicates or outdated content
  await connection.execute("DELETE FROM questions WHERE difficulty = 3");
  
  for (const q of questionsData) {
    try {
      await connection.execute(
        `INSERT INTO questions (content, options, correctAnswer, difficulty, sourcePoemTitle, sourcePoemAuthor)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [q.content, q.options, q.correctAnswer, q.difficulty, q.sourcePoemTitle, q.sourcePoemAuthor]
      );
    } catch (err) {
      console.error(`❌ Error inserting question: `, err.message);
    }
  }
  console.log(`✅ Successfully imported ${questionsData.length} questions.`);

} catch (error) {
  console.error("❌ Database error:", error);
} finally {
  if (connection) await connection.end();
  console.log("👋 Database connection closed");
}
