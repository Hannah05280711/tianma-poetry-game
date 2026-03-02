/**
 * 题目质量修复脚本
 * 修复：
 * 1. 末尾多余标点（如 ？。 ！。 ，。）
 * 2. fill题目末尾缺少标点（补充句号）
 * 3. 删除戏曲舞台指令题目（含（云）（唱）等）
 * 4. 清理注释内容（如 (一作：螣)）
 * 5. 清理《》书名号（标题连句问题）
 */
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

let fixed = 0;
let deleted = 0;

// 1. 删除戏曲舞台指令类题目（质量极差，无法修复）
const [dramaRows] = await conn.execute(
  'SELECT id FROM questions WHERE content LIKE "%（云）%" OR content LIKE "%（唱）%" OR content LIKE "%（白%" OR content LIKE "%（旦%" OR content LIKE "%（外%"'
);
if (dramaRows.length > 0) {
  const ids = dramaRows.map(r => r.id);
  await conn.execute(`DELETE FROM questions WHERE id IN (${ids.join(',')})`);
  console.log(`✅ 删除 ${ids.length} 道戏曲舞台指令题目: ${ids.join(',')}`);
  deleted += ids.length;
}

// 2. 修复末尾多余标点（？。 ！。 ，。）
const [punctRows] = await conn.execute(
  'SELECT id, content FROM questions WHERE content LIKE "%？。" OR content LIKE "%！。" OR content LIKE "%，。"'
);
for (const row of punctRows) {
  // 移除末尾的句号（保留问号/感叹号/逗号）
  const newContent = row.content.replace(/([？！，])。$/, '$1');
  await conn.execute('UPDATE questions SET content = ? WHERE id = ?', [newContent, row.id]);
  console.log(`✅ 修复标点 #${row.id}: "${row.content}" → "${newContent}"`);
  fixed++;
}

// 3. 清理注释内容（如 (一作：螣) (腾 一作：螣)）
const [noteRows] = await conn.execute(
  'SELECT id, content FROM questions WHERE content LIKE "%一作：%" OR content LIKE "%一作:%"'
);
for (const row of noteRows) {
  const newContent = row.content
    .replace(/\s*[\(（][^)）]*一作[：:][^)）]*[\)）]/g, '')
    .trim();
  await conn.execute('UPDATE questions SET content = ? WHERE id = ?', [newContent, row.id]);
  console.log(`✅ 清理注释 #${row.id}: "${row.content}" → "${newContent}"`);
  fixed++;
}

// 4. 清理《》书名号（标题连句问题，如 "人在小红楼，离情__《石州》"）
const [titleRows] = await conn.execute(
  'SELECT id, content FROM questions WHERE content LIKE "%《%" OR content LIKE "%》%"'
);
for (const row of titleRows) {
  const newContent = row.content
    .replace(/《[^》]*》/g, '')
    .replace(/[，。！？；：、\s]+$/, match => match.trim() || '')
    .trim();
  if (newContent !== row.content) {
    await conn.execute('UPDATE questions SET content = ? WHERE id = ?', [newContent, row.id]);
    console.log(`✅ 清理书名号 #${row.id}: "${row.content}" → "${newContent}"`);
    fixed++;
  }
}

// 5. 修复fill题目末尾缺少标点的问题
// 对于末尾是汉字（不是标点）的fill题目，添加句号
// 但要排除末尾是 __ 的情况（空白在末尾是正常的）
const [noEndPunctRows] = await conn.execute(
  `SELECT id, content FROM questions 
   WHERE questionType = 'fill' 
   AND content NOT REGEXP '[。，！？；：、」』]$'
   AND content NOT LIKE '%__'
   LIMIT 600`
);
let batchFixed = 0;
for (const row of noEndPunctRows) {
  // 末尾是汉字，补充句号
  const lastChar = row.content[row.content.length - 1];
  // 如果末尾是汉字（Unicode范围），补充句号
  if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(lastChar)) {
    const newContent = row.content + '。';
    await conn.execute('UPDATE questions SET content = ? WHERE id = ?', [newContent, row.id]);
    batchFixed++;
  }
}
console.log(`✅ 批量补充句号: ${batchFixed} 道题目`);
fixed += batchFixed;

// 6. 修复 content 末尾是冒号的题目（如 "肇锡余以嘉名："）
const [colonRows] = await conn.execute(
  'SELECT id, content FROM questions WHERE content LIKE "%："'
);
for (const row of colonRows) {
  const newContent = row.content.replace(/：$/, '');
  await conn.execute('UPDATE questions SET content = ? WHERE id = ?', [newContent, row.id]);
  console.log(`✅ 清理末尾冒号 #${row.id}: "${row.content}" → "${newContent}"`);
  fixed++;
}

console.log(`\n🎉 修复完成！共修复 ${fixed} 道题目，删除 ${deleted} 道低质量题目`);
await conn.end();
