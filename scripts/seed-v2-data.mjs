import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not configured, skipping V2 data update");
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
      rarity: "rare", 
      imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405419107/lWZrYBsRNUBixfFu.png", 
      description: "晚唐诗人，才华横溢，情感热烈而奔放。", 
      signaturePoem: "易求无价宝，难得有心郎" 
    },
    { 
      poetName: "薛涛", 
      dynasty: "唐", 
      rarity: "rare", 
      imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405419107/GPypfHgmSDzXFBqm.png", 
      description: "唐代女诗人，薛涛笺发明者，诗风清雅脱俗。", 
      signaturePoem: "花开不同赏，花落不同悲" 
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
        console.log(`ℹ️  Card ${c.poetName} already exists, skipping.`);
      }
    } catch (err) {
      console.error(`❌ Error processing card ${c.poetName}:`, err.message);
    }
  }

  // Insert New Questions
  console.log(`📝 Inserting ${questionsData.length} new questions...`);
  
  let count = 0;
  let errors = 0;
  
  for (const q of questionsData) {
    try {
      await connection.execute(
        `INSERT INTO questions (poetId, content, options, correctAnswer, questionType, difficulty, sourcePoemTitle, sourcePoemAuthor, themeTag)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [0, q.content, q.options, q.correctAnswer, 'fill', q.difficulty, q.sourcePoemTitle, q.sourcePoemAuthor, 'v2_tang300']
      );
      count++;
      if (count % 100 === 0) console.log(`  Progress: ${count}/${questionsData.length}`);
    } catch (err) {
      errors++;
      if (errors <= 5) {
        console.error(`  ⚠️  Error inserting question: ${err.message}`);
      }
    }
  }

  console.log(`✅ Successfully inserted ${count} questions (${errors} errors).`);
  
  await connection.end();
  console.log("🎉 V2 Data Update Complete!");
  process.exit(0);
} catch (err) {
  console.error("❌ Fatal error:", err.message);
  if (connection) {
    try {
      await connection.end();
    } catch (e) {
      // ignore
    }
  }
  process.exit(1);
}
