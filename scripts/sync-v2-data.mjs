#!/usr/bin/env node
/**
 * V2 数据同步脚本
 * 用途：将新的诗人卡牌和题库同步到数据库
 * 使用：node scripts/sync-v2-data.mjs
 */

import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL environment variable is not set!");
  console.error("Please set DATABASE_URL before running this script.");
  process.exit(1);
}

let connection;

async function main() {
  try {
    console.log("🔗 Connecting to database...");
    connection = await mysql.createConnection(DATABASE_URL);
    console.log("✅ Database connection established\n");

    // ========================================
    // 1. Add New Poet Cards
    // ========================================
    console.log("📌 Step 1: Adding new poet cards...");
    
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

    let cardsAdded = 0;
    for (const card of newCards) {
      try {
        const [rows] = await connection.execute(
          "SELECT id FROM poetCards WHERE poetName = ?", 
          [card.poetName]
        );
        
        if (rows.length === 0) {
          await connection.execute(
            `INSERT INTO poetCards (poetName, dynasty, imageUrl, rarity, description, signaturePoem)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [card.poetName, card.dynasty, card.imageUrl, card.rarity, card.description, card.signaturePoem]
          );
          console.log(`  ✅ Added: ${card.poetName} (${card.rarity})`);
          cardsAdded++;
        } else {
          console.log(`  ℹ️  Already exists: ${card.poetName}`);
        }
      } catch (err) {
        console.error(`  ❌ Error adding ${card.poetName}: ${err.message}`);
      }
    }
    console.log(`✅ Poet cards sync complete: ${cardsAdded} new cards added\n`);

    // ========================================
    // 2. Verify Total Card Count
    // ========================================
    console.log("📌 Step 2: Verifying total card count...");
    const [cardRows] = await connection.execute("SELECT COUNT(*) as count FROM poetCards");
    const totalCards = cardRows[0].count;
    console.log(`✅ Total cards in database: ${totalCards}\n`);

    // ========================================
    // 3. Add New Questions from Tang 300 Poems
    // ========================================
    console.log("📌 Step 3: Adding new questions from Tang 300 Poems...");
    
    const questionsPath = path.join(__dirname, "v2_new_questions.json");
    if (!fs.existsSync(questionsPath)) {
      console.warn(`⚠️  Questions file not found: ${questionsPath}`);
      console.warn("Skipping question import...\n");
    } else {
      const questionsData = JSON.parse(fs.readFileSync(questionsPath, "utf8"));
      console.log(`  📚 Loaded ${questionsData.length} questions from file`);

      // Check how many questions already exist with the v2_tang300 tag
      const [existingRows] = await connection.execute(
        "SELECT COUNT(*) as count FROM questions WHERE themeTag = 'v2_tang300'"
      );
      const existingCount = existingRows[0].count;
      console.log(`  ℹ️  Existing Tang 300 questions: ${existingCount}`);

      if (existingCount === 0) {
        let inserted = 0;
        let errors = 0;

        for (let i = 0; i < questionsData.length; i++) {
          try {
            const q = questionsData[i];
            await connection.execute(
              `INSERT INTO questions (poetId, content, options, correctAnswer, questionType, difficulty, sourcePoemTitle, sourcePoemAuthor, themeTag)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [0, q.content, q.options, q.correctAnswer, 'fill', q.difficulty, q.sourcePoemTitle, q.sourcePoemAuthor, 'v2_tang300']
            );
            inserted++;
            
            if ((i + 1) % 200 === 0) {
              console.log(`  Progress: ${i + 1}/${questionsData.length}`);
            }
          } catch (err) {
            errors++;
            if (errors <= 3) {
              console.error(`  ⚠️  Error at question ${i}: ${err.message}`);
            }
          }
        }

        console.log(`✅ Questions import complete: ${inserted} inserted, ${errors} errors\n`);
      } else {
        console.log(`✅ Tang 300 questions already imported, skipping...\n`);
      }
    }

    // ========================================
    // 4. Verify Question Count
    // ========================================
    console.log("📌 Step 4: Verifying question count...");
    const [qRows] = await connection.execute(
      "SELECT COUNT(*) as count FROM questions WHERE questionType = 'fill'"
    );
    const totalQuestions = qRows[0].count;
    console.log(`✅ Total fill-in-the-blank questions: ${totalQuestions}\n`);

    // ========================================
    // 5. Summary
    // ========================================
    console.log("=" .repeat(50));
    console.log("🎉 V2 Data Sync Complete!");
    console.log("=" .repeat(50));
    console.log(`📊 Summary:`);
    console.log(`   • Total Poet Cards: ${totalCards}`);
    console.log(`   • Total Questions: ${totalQuestions}`);
    console.log(`   • New Cards Added: ${cardsAdded}`);
    console.log("");
    console.log("✅ Your game is ready to play!");
    console.log("=" .repeat(50));

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Fatal Error:", err.message);
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        // ignore
      }
    }
    process.exit(1);
  }
}

main();
