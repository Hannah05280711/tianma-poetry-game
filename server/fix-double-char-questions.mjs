/**
 * 修复双字填空题脚本
 * 
 * 问题：题库中有242道填空题的答案是两个字，违反"每道题只填一个字"的设计原则。
 * 
 * 解决方案：
 * 1. id=1 (床前__光): 改为 "床前明__，疑是地上霜。" 答案="月"，选项改为单字
 * 2. id=2 (举头望明月，__思故乡): 改为 "举头望明月，低__思故乡。" 答案="头"，选项改为单字
 * 3. id>=30000 的240道双字题：删除这些题目（元曲自动生成，双字词难以改为单字）
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('=== 修复双字填空题 ===\n');
    
    // 1. 修复 id=1: 床前__光 -> 床前明__
    console.log('步骤1: 修复经典诗词双字题...');
    await conn.execute(
      `UPDATE questions SET 
        content = '床前明__，疑是地上霜。',
        correctAnswer = '月',
        options = '["月","光","辉","华"]'
       WHERE id = 1`
    );
    console.log('  ✓ id=1: 床前明__，疑是地上霜。(答案: 月)');
    
    // 2. 修复 id=2: 举头望明月，__思故乡 -> 举头望明月，低__思故乡
    await conn.execute(
      `UPDATE questions SET 
        content = '举头望明月，低__思故乡。',
        correctAnswer = '头',
        options = '["头","首","眉","目"]'
       WHERE id = 2`
    );
    console.log('  ✓ id=2: 举头望明月，低__思故乡。(答案: 头)');
    
    // 3. 删除 id>=30000 的双字填空题
    console.log('\n步骤2: 删除自动生成的双字填空题...');
    const [countResult] = await conn.execute(
      `SELECT COUNT(*) as cnt FROM questions WHERE questionType='fill' AND CHAR_LENGTH(correctAnswer) = 2 AND id >= 30000`
    );
    const toDelete = countResult[0].cnt;
    console.log(`  待删除: ${toDelete} 道题`);
    
    const [deleteResult] = await conn.execute(
      `DELETE FROM questions WHERE questionType='fill' AND CHAR_LENGTH(correctAnswer) = 2 AND id >= 30000`
    );
    console.log(`  ✓ 已删除 ${deleteResult.affectedRows} 道双字填空题`);
    
    // 4. 验证结果
    console.log('\n步骤3: 验证结果...');
    const [remaining] = await conn.execute(
      `SELECT COUNT(*) as cnt FROM questions WHERE questionType='fill' AND CHAR_LENGTH(correctAnswer) >= 2`
    );
    console.log(`  剩余双字+答案的填空题: ${remaining[0].cnt} 道`);
    
    const [total] = await conn.execute('SELECT COUNT(*) as cnt FROM questions');
    console.log(`  题库总题数: ${total[0].cnt} 道`);
    
    // 5. 验证修复后的题目
    const [fixed] = await conn.execute('SELECT id, content, correctAnswer, options FROM questions WHERE id IN (1, 2)');
    console.log('\n修复后的题目:');
    fixed.forEach(r => {
      let opts = [];
      try { opts = JSON.parse(r.options); } catch {}
      console.log(`  id=${r.id}: ${r.content} | 答案: ${r.correctAnswer} | 选项: ${opts.join('/')}`);
    });
    
    // 6. 按题型统计
    const [typeStats] = await conn.execute(
      'SELECT questionType, COUNT(*) as cnt FROM questions GROUP BY questionType ORDER BY cnt DESC'
    );
    console.log('\n按题型分布:');
    typeStats.forEach(r => console.log(`  ${r.questionType}: ${r.cnt} 道`));
    
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
