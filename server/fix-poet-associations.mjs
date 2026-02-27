/**
 * 修复题目诗人关联脚本
 * 
 * 问题：从 chinese-poetry 数据集导入的题目（曹操、屈原、李璟、无名氏等）
 * 被错误地归入 poetId=1（李白）。
 * 
 * 解决方案：
 * 1. 向 poets 表插入曹操、屈原、李璟等诗人
 * 2. 根据 sourcePoemAuthor 字段更新 questions 表的 poetId
 * 3. 无名氏/元曲无名氏的题目归入"元曲"分类，关联到关汉卿（poetId=30024）
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// 需要新增的诗人数据
const newPoets = [
  {
    id: 30044,
    name: '曹操',
    dynasty: '汉',
    mbtiType: 'ENTJ',
    mbtiDescription: '雄才大略，以诗言志，豪情万丈。你如曹操，胸怀天下，文武兼备，是乱世中的英雄诗人。',
    personalityTags: JSON.stringify(['豪迈', '雄壮', '政治家', '军事家', '诗人']),
    signaturePoems: JSON.stringify(['短歌行', '观沧海', '龟虽寿', '蒿里行']),
    styleKeywords: JSON.stringify(['慷慨', '悲凉', '豪壮', '建安风骨']),
    dynastyWeight: 1.1,
  },
  {
    id: 30045,
    name: '屈原',
    dynasty: '楚',
    mbtiType: 'INFJ',
    mbtiDescription: '忧国忧民，以香草美人寄托理想。你如屈原，有着深沉的爱国情怀与不屈的精神。',
    personalityTags: JSON.stringify(['爱国', '浪漫', '忧郁', '理想主义', '楚辞之祖']),
    signaturePoems: JSON.stringify(['离骚', '天问', '九歌', '九章']),
    styleKeywords: JSON.stringify(['浪漫', '忧愤', '香草美人', '楚辞']),
    dynastyWeight: 1.2,
  },
  {
    id: 30046,
    name: '李璟',
    dynasty: '五代',
    mbtiType: 'INFP',
    mbtiDescription: '南唐中主，词风清丽哀婉。你如李璟，多情善感，以词寄托家国之愁。',
    personalityTags: JSON.stringify(['多情', '哀婉', '词人', '帝王', '南唐']),
    signaturePoems: JSON.stringify(['摊破浣溪沙·菡萏香销翠叶残', '望远行·玉砌花光锦绣明']),
    styleKeywords: JSON.stringify(['清丽', '哀婉', '感伤', '南唐词']),
    dynastyWeight: 1.0,
  },
];

// 作者名 -> 诗人ID 的映射
const authorToPoetId = {
  '曹操': 30044,
  '屈原': 30045,
  '李璟': 30046,
  // 元曲无名氏 -> 关汉卿（元曲代表）
  '无名氏': 30024,
  '无名氏《张协状元》': 30024,
  '萧德祥《小孙屠》': 30024,
  '施惠《幽闺记》': 30024,
  // 元曲作者
  '贾仲明': 30024,  // 元曲作者，归入关汉卿
  '王实甫': 30024,  // 元曲作者（西厢记），归入关汉卿
  '顾德润': 30024,
  '武汉臣': 30024,
  '朱庭玉': 30024,
  '萧德祥': 30024,
  '高文秀': 30024,
  '杨显之': 30024,
  '刘庭信': 30024,
  '李唐宾': 30024,
  '孙仲章': 30024,
  '刘君锡': 30024,
  '纪君祥': 30024,
  '周文质': 30024,
  '杨梓': 30024,
  '曾瑞': 30024,
};

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('=== 修复题目诗人关联 ===\n');
    
    // 1. 插入新诗人
    console.log('步骤1: 插入新诗人...');
    for (const poet of newPoets) {
      try {
        await conn.execute(
          `INSERT INTO poets (id, name, dynasty, mbtiType, mbtiDescription, personalityTags, signaturePoems, styleKeywords, dynastyWeight) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name)`,
          [poet.id, poet.name, poet.dynasty, poet.mbtiType, poet.mbtiDescription, 
           poet.personalityTags, poet.signaturePoems, poet.styleKeywords, poet.dynastyWeight]
        );
        console.log(`  ✓ 插入诗人: ${poet.name} (ID: ${poet.id})`);
      } catch (e) {
        console.error(`  ✗ 插入诗人 ${poet.name} 失败:`, e.message);
      }
    }
    
    // 2. 更新题目的 poetId
    console.log('\n步骤2: 更新题目诗人关联...');
    let totalUpdated = 0;
    
    for (const [author, poetId] of Object.entries(authorToPoetId)) {
      try {
        const [result] = await conn.execute(
          `UPDATE questions SET poetId = ? WHERE poetId = 1 AND sourcePoemAuthor = ?`,
          [poetId, author]
        );
        const affected = result.affectedRows;
        if (affected > 0) {
          console.log(`  ✓ ${author} -> poetId=${poetId}: 更新 ${affected} 道题`);
          totalUpdated += affected;
        }
      } catch (e) {
        console.error(`  ✗ 更新 ${author} 的题目失败:`, e.message);
      }
    }
    
    console.log(`\n共更新 ${totalUpdated} 道题目`);
    
    // 3. 验证结果
    console.log('\n步骤3: 验证结果...');
    const [remaining] = await conn.execute(
      `SELECT sourcePoemAuthor, COUNT(*) as cnt FROM questions WHERE poetId = 1 AND sourcePoemAuthor != '李白' GROUP BY sourcePoemAuthor ORDER BY cnt DESC`
    );
    
    if (remaining.length === 0) {
      console.log('  ✓ 所有非李白题目已正确关联');
    } else {
      console.log('  仍有未关联的题目:');
      for (const row of remaining) {
        console.log(`    ${row.sourcePoemAuthor}: ${row.cnt} 道`);
      }
    }
    
    // 4. 显示最终分布
    console.log('\n最终 poetId 分布（前15）:');
    const [dist] = await conn.execute(
      `SELECT p.name, COUNT(q.id) as cnt 
       FROM poets p 
       LEFT JOIN questions q ON p.id = q.poetId 
       GROUP BY p.id, p.name 
       ORDER BY cnt DESC 
       LIMIT 15`
    );
    for (const row of dist) {
      console.log(`  ${row.name}: ${row.cnt} 道`);
    }
    
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
