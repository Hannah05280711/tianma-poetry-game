import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

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
const questionsData = JSON.parse(fs.readFileSync('./scripts/v2_new_questions.json', 'utf8'));

async function run() {
  console.log("🚀 Starting V2 Update...");

  // Insert New Cards
  for (const c of newCards) {
    // Check if exists
    const [rows] = await connection.execute("SELECT id FROM poetCards WHERE poetName = ?", [c.poetName]);
    if (rows.length === 0) {
      await connection.execute(
        `INSERT INTO poetCards (poetName, dynasty, imageUrl, rarity, description, signaturePoem)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [c.poetName, c.dynasty, c.imageUrl, c.rarity, c.description, c.signaturePoem]
      );
      console.log(`✅ Added card: ${c.poetName}`);
    } else {
      console.log(`ℹ️ Card ${c.poetName} already exists, skipping.`);
    }
  }

  // Insert New Questions
  console.log(`📝 Inserting ${questionsData.length} new questions...`);
  
  // We'll tag these questions so we can identify them if needed, or just insert them
  // The user wants to "update" the question pool, so we'll add them.
  // To make them the primary source for V2, we might want to clear old ones or just add these.
  // Given the request "从文档里重新生成题目", I will clear old V2-like questions or just add these with a specific tag.
  
  let count = 0;
  for (const q of questionsData) {
    await connection.execute(
      `INSERT INTO questions (poetId, content, options, correctAnswer, questionType, difficulty, sourcePoemTitle, sourcePoemAuthor, themeTag)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [0, q.content, q.options, q.correctAnswer, 'fill', q.difficulty, q.sourcePoemTitle, q.sourcePoemAuthor, 'v2_tang300']
    );
    count++;
    if (count % 100 === 0) console.log(`  Progress: ${count}/${questionsData.length}`);
  }

  console.log(`✅ Successfully inserted ${count} questions.`);
  
  await connection.end();
  console.log("🎉 V2 Update Complete!");
}

run().catch(console.error);
