/**
 * 节日题库 themeTag 批量标记脚本
 * 为清明、端午、中秋、春节、元宵、重阳、七夕等节日相关题目添加 themeTag
 */
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 节日关键词映射
const FESTIVAL_TAGS = [
  {
    tag: "qingming",
    keywords: ["清明", "杜牧", "扫墓", "踏青", "寒食", "断魂", "纷纷", "牧童"],
    poets: ["杜牧"],
    titles: ["清明", "寒食", "清明日", "清明即事"],
  },
  {
    tag: "duanwu",
    keywords: ["端午", "屈原", "粽子", "龙舟", "汨罗", "离骚", "楚辞", "五月五", "艾草", "菖蒲"],
    poets: ["屈原"],
    titles: ["离骚", "天问", "九歌", "九章", "端午", "竞渡歌"],
  },
  {
    tag: "zhongqiu",
    keywords: ["中秋", "明月", "嫦娥", "玉兔", "广寒", "婵娟", "月饼", "团圆", "水调歌头", "把酒问青天", "但愿人长久"],
    poets: [],
    titles: ["水调歌头", "中秋", "望月怀远", "嫦娥", "静夜思", "月下独酌", "霜月"],
  },
  {
    tag: "chunjie",
    keywords: ["春节", "除夕", "爆竹", "新年", "元日", "岁首", "守岁", "拜年", "春联", "压岁"],
    poets: [],
    titles: ["元日", "除夜", "守岁", "新年", "拜年"],
  },
  {
    tag: "yuanxiao",
    keywords: ["元宵", "灯节", "花灯", "汤圆", "上元", "正月十五", "灯火阑珊", "青玉案"],
    poets: [],
    titles: ["青玉案·元夕", "元夕", "上元", "灯节", "正月十五夜"],
  },
  {
    tag: "chongyang",
    keywords: ["重阳", "登高", "茱萸", "菊花", "九月九", "佳节", "异乡"],
    poets: [],
    titles: ["九月九日忆山东兄弟", "重阳", "登高", "采桑子·重阳"],
  },
  {
    tag: "qixi",
    keywords: ["七夕", "牛郎", "织女", "鹊桥", "银河", "乞巧", "天阶夜色", "两情若是久长时"],
    poets: [],
    titles: ["鹊桥仙", "七夕", "乞巧", "秋夕", "迢迢牵牛星"],
  },
  {
    tag: "dongzhi",
    keywords: ["冬至", "数九", "汤圆", "饺子", "冬日", "寒冬"],
    poets: [],
    titles: ["冬至", "小至", "冬夜"],
  },
  {
    tag: "liqiu",
    keywords: ["立秋", "秋天", "秋风", "秋叶", "秋水", "秋日", "秋思", "秋声"],
    poets: [],
    titles: ["秋思", "秋夕", "天净沙·秋思", "秋日", "秋兴"],
  },
  {
    tag: "lichun",
    keywords: ["立春", "春天", "春风", "春雨", "春花", "春草", "春色", "春日", "春晓"],
    poets: [],
    titles: ["春晓", "春日", "春望", "春夜喜雨", "钱塘湖春行"],
  },
];

let totalTagged = 0;

for (const festival of FESTIVAL_TAGS) {
  const { tag, keywords, poets, titles } = festival;
  
  // 1. 按标题精确匹配
  for (const title of titles) {
    const [result] = await conn.execute(
      'UPDATE questions SET themeTag = ? WHERE sourcePoemTitle = ? AND (themeTag IS NULL OR themeTag = "")',
      [tag, title]
    );
    const affected = result.affectedRows;
    if (affected > 0) {
      console.log(`✅ [${tag}] 标题"${title}" → ${affected} 道题`);
      totalTagged += affected;
    }
  }
  
  // 2. 按诗人名匹配（仅对特定节日诗人）
  for (const poet of poets) {
    const [result] = await conn.execute(
      'UPDATE questions SET themeTag = ? WHERE sourcePoemAuthor = ? AND (themeTag IS NULL OR themeTag = "")',
      [tag, poet]
    );
    const affected = result.affectedRows;
    if (affected > 0) {
      console.log(`✅ [${tag}] 诗人"${poet}" → ${affected} 道题`);
      totalTagged += affected;
    }
  }
  
  // 3. 按关键词匹配题目内容
  for (const kw of keywords) {
    const [result] = await conn.execute(
      'UPDATE questions SET themeTag = ? WHERE content LIKE ? AND (themeTag IS NULL OR themeTag = "")',
      [tag, `%${kw}%`]
    );
    const affected = result.affectedRows;
    if (affected > 0) {
      console.log(`✅ [${tag}] 关键词"${kw}" → ${affected} 道题`);
      totalTagged += affected;
    }
  }
}

// 统计各节日题目数量
const [stats] = await conn.execute(
  'SELECT themeTag, COUNT(*) as cnt FROM questions WHERE themeTag IS NOT NULL AND themeTag != "" GROUP BY themeTag ORDER BY cnt DESC'
);
console.log('\n📊 节日题库统计：');
for (const row of stats) {
  console.log(`  ${row.themeTag}: ${row.cnt} 道`);
}

console.log(`\n🎉 共标记 ${totalTagged} 道节日题目`);
await conn.end();
