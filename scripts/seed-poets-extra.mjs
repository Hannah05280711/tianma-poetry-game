/**
 * 补充诗人种子数据：曹操、屈原、李璟
 * 这三位诗人在题库中有大量题目，需要完整的诗人档案
 */
import mysql from 'mysql2/promise';

const extraPoets = [
  {
    id: 30044,
    name: '曹操',
    dynasty: '汉',
    mbtiType: 'ENTJ',
    mbtiDescription: '曹操雄才大略，以诗言志，豪情万丈。你如曹操，胸怀天下，文武兼备，是乱世中的英雄诗人。面对困境，你不屈不挠；面对机遇，你果断出击。"老骥伏枥，志在千里"，这就是你的人生信条。',
    personalityTags: JSON.stringify(['豪迈', '雄壮', '政治家', '军事家', '建安风骨']),
    signaturePoems: JSON.stringify(['短歌行', '观沧海', '龟虽寿', '蒿里行', '步出夏门行']),
    styleKeywords: JSON.stringify(['慷慨', '悲凉', '豪壮', '建安风骨', '雄浑']),
    relatedWeapons: JSON.stringify(['gold', 'platinum', 'diamond', 'king']),
    dynastyWeight: 1.2,
  },
  {
    id: 30045,
    name: '屈原',
    dynasty: '楚',
    mbtiType: 'INFJ',
    mbtiDescription: '屈原忧国忧民，以香草美人寄托理想。你如屈原，有着深沉的爱国情怀与不屈的精神。你对理想的执着，对美好的追求，使你在黑暗中依然坚守光明。"路漫漫其修远兮，吾将上下而求索"，是你永恒的誓言。',
    personalityTags: JSON.stringify(['爱国', '浪漫', '忧郁', '理想主义', '楚辞之祖']),
    signaturePoems: JSON.stringify(['离骚', '天问', '九歌·湘夫人', '九章·哀郢', '渔父']),
    styleKeywords: JSON.stringify(['浪漫', '忧愤', '香草美人', '楚辞', '悲壮']),
    relatedWeapons: JSON.stringify(['star', 'king']),
    dynastyWeight: 1.3,
  },
  {
    id: 30046,
    name: '李璟',
    dynasty: '五代',
    mbtiType: 'INFP',
    mbtiDescription: '南唐中主李璟，词风清丽哀婉。你如李璟，多情善感，以词寄托家国之愁。你敏感细腻，对美好事物有着独特的感知，即便身处逆境，也能以诗词抒发内心的柔情。',
    personalityTags: JSON.stringify(['多情', '哀婉', '词人', '帝王', '南唐']),
    signaturePoems: JSON.stringify(['摊破浣溪沙·菡萏香销翠叶残', '望远行·玉砌花光锦绣明', '应天长·一钩初月临妆镜']),
    styleKeywords: JSON.stringify(['清丽', '哀婉', '感伤', '南唐词', '柔情']),
    relatedWeapons: JSON.stringify(['silver', 'gold']),
    dynastyWeight: 1.0,
  },
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('=== 补充诗人种子数据 ===\n');
  
  for (const poet of extraPoets) {
    try {
      await conn.execute(
        `INSERT INTO poets (id, name, dynasty, mbtiType, mbtiDescription, personalityTags, signaturePoems, styleKeywords, relatedWeapons, dynastyWeight) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           dynasty=VALUES(dynasty), mbtiType=VALUES(mbtiType), mbtiDescription=VALUES(mbtiDescription),
           personalityTags=VALUES(personalityTags), signaturePoems=VALUES(signaturePoems),
           styleKeywords=VALUES(styleKeywords), relatedWeapons=VALUES(relatedWeapons), dynastyWeight=VALUES(dynastyWeight)`,
        [poet.id, poet.name, poet.dynasty, poet.mbtiType, poet.mbtiDescription,
         poet.personalityTags, poet.signaturePoems, poet.styleKeywords, poet.relatedWeapons, poet.dynastyWeight]
      );
      console.log(`  ✓ ${poet.name} (${poet.dynasty})`);
    } catch (e) {
      console.error(`  ✗ ${poet.name}: ${e.message}`);
    }
  }
  
  const [countResult] = await conn.execute('SELECT COUNT(*) as count FROM poets');
  console.log(`\n总计: ${countResult[0].count} 位诗人`);
  
  const [dynastyStats] = await conn.execute('SELECT dynasty, COUNT(*) as count FROM poets GROUP BY dynasty ORDER BY count DESC');
  console.log('\n按朝代分布:');
  for (const r of dynastyStats) {
    console.log(`  ${r.dynasty}: ${r.count} 位`);
  }
  
  await conn.end();
}

main().catch(console.error);
