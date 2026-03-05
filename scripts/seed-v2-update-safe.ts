import { getDb } from "../server/db";
import { poetCards, questions } from "../drizzle/schema";
import fs from "fs";

// 1. New Cards
const newCards = [
  { 
    poetName: "鱼玄机", 
    dynasty: "唐", 
    rarity: "rare" as const, 
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405419107/lWZrYBsRNUBixfFu.png", 
    description: "晚唐诗人，才华横溢，情感热烈而奔放。", 
    signaturePoem: "易求无价宝，难得有心郎" 
  },
  { 
    poetName: "薛涛", 
    dynasty: "唐", 
    rarity: "rare" as const, 
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405419107/GPypfHgmSDzXFBqm.png", 
    description: "唐代女诗人，薛涛笺发明者，诗风清雅脱俗。", 
    signaturePoem: "花开不同赏，花落不同悲" 
  }
];

// 2. Load New Questions
const questionsData = JSON.parse(fs.readFileSync('./scripts/v2_new_questions.json', 'utf8'));

async function run() {
  console.log("🚀 Starting V2 Update (Safe Mode)...");
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available. Make sure DATABASE_URL is set.");
    process.exit(1);
  }

  // Insert New Cards
  for (const c of newCards) {
    await db.insert(poetCards).values(c).onDuplicateKeyUpdate({ set: { imageUrl: c.imageUrl } });
    console.log(`✅ Processed card: ${c.poetName}`);
  }

  // Insert New Questions
  console.log(`📝 Inserting ${questionsData.length} new questions...`);
  
  let count = 0;
  for (const q of questionsData) {
    await db.insert(questions).values({
      poetId: 0,
      content: q.content,
      options: q.options,
      correctAnswer: q.correctAnswer,
      questionType: 'fill',
      difficulty: q.difficulty,
      sourcePoemTitle: q.sourcePoemTitle,
      sourcePoemAuthor: q.sourcePoemAuthor,
      themeTag: 'v2_tang300'
    });
    count++;
    if (count % 100 === 0) console.log(`  Progress: ${count}/${questionsData.length}`);
  }

  console.log(`✅ Successfully inserted ${count} questions.`);
  console.log("🎉 V2 Update Complete!");
  process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
