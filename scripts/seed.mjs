import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql2.createConnection(process.env.DATABASE_URL);

// ─── 1. 诗人数据 ─────────────────────────────────────────────────────────────
const poets = [
  {
    name: '李白', dynasty: '唐', mbtiType: 'ENFP',
    mbtiDescription: '热情洋溢的探险家，天马行空的想象力，浪漫主义的巅峰。你如李白般自由奔放，不拘一格，用诗歌丈量天地。',
    personalityTags: JSON.stringify(['浪漫','豪放','自由','想象力','侠义']),
    signaturePoems: JSON.stringify(['举头望明月，低头思故乡','天生我材必有用，千金散尽还复来','飞流直下三千尺，疑是银河落九天']),
    relatedWeapons: JSON.stringify(['龙泉剑','青龙刀']),
    styleKeywords: JSON.stringify(['豪放','浪漫','仙气','飘逸']),
    dynastyWeight: 1.2
  },
  {
    name: '杜甫', dynasty: '唐', mbtiType: 'INFJ',
    mbtiDescription: '深沉的守护者，以笔为剑，心系苍生。你如杜甫般悲天悯人，将个人命运与家国情怀融为一体。',
    personalityTags: JSON.stringify(['忧国忧民','深沉','现实','悲悯','责任感']),
    signaturePoems: JSON.stringify(['烽火连三月，家书抵万金','会当凌绝顶，一览众山小','朱门酒肉臭，路有冻死骨']),
    relatedWeapons: JSON.stringify(['丈八蛇矛']),
    styleKeywords: JSON.stringify(['沉郁','顿挫','现实','忧愁']),
    dynastyWeight: 1.2
  },
  {
    name: '王维', dynasty: '唐', mbtiType: 'INFP',
    mbtiDescription: '禅意的隐者，山水画中的诗人。你如王维般宁静淡泊，在自然中寻找心灵的归宿，诗中有画，画中有诗。',
    personalityTags: JSON.stringify(['禅意','淡泊','自然','内敛','空灵']),
    signaturePoems: JSON.stringify(['独坐幽篁里，弹琴复长啸','大漠孤烟直，长河落日圆','红豆生南国，春来发几枝']),
    relatedWeapons: JSON.stringify(['养由基弓']),
    styleKeywords: JSON.stringify(['空灵','禅意','山水','淡雅']),
    dynastyWeight: 1.1
  },
  {
    name: '苏轼', dynasty: '宋', mbtiType: 'ENFJ',
    mbtiDescription: '旷达的领袖，笑对人生起伏。你如苏轼般豁达乐观，无论身处顺境逆境，都能以诗词化解忧愁，感染身边的人。',
    personalityTags: JSON.stringify(['豁达','乐观','领袖力','多才多艺','幽默']),
    signaturePoems: JSON.stringify(['但愿人长久，千里共婵娟','大江东去，浪淘尽，千古风流人物','竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生']),
    relatedWeapons: JSON.stringify(['天龙戟']),
    styleKeywords: JSON.stringify(['豪放','旷达','词风多变','乐观']),
    dynastyWeight: 1.1
  },
  {
    name: '李清照', dynasty: '宋', mbtiType: 'ISTJ',
    mbtiDescription: '细腻的守护者，婉约词宗。你如李清照般敏感细腻，对情感有着极强的感知力，用文字记录生命中最真实的悲欢。',
    personalityTags: JSON.stringify(['细腻','婉约','坚韧','感性','才情']),
    signaturePoems: JSON.stringify(['生当作人杰，死亦为鬼雄','寻寻觅觅，冷冷清清，凄凄惨惨戚戚','知否知否，应是绿肥红瘦']),
    relatedWeapons: JSON.stringify(['鱼肠剑']),
    styleKeywords: JSON.stringify(['婉约','细腻','愁绪','女性视角']),
    dynastyWeight: 1.0
  },
  {
    name: '辛弃疾', dynasty: '宋', mbtiType: 'ESTJ',
    mbtiDescription: '铁血的战士词人，壮志难酬的英雄。你如辛弃疾般充满斗志，即使壮志未酬，也要用文字燃烧心中的热血。',
    personalityTags: JSON.stringify(['豪迈','爱国','壮志','英雄气概','执行力']),
    signaturePoems: JSON.stringify(['醉里挑灯看剑，梦回吹角连营','了却君王天下事，赢得生前身后名','青山遮不住，毕竟东流去']),
    relatedWeapons: JSON.stringify(['沥泉枪']),
    styleKeywords: JSON.stringify(['豪放','爱国','壮志','英雄']),
    dynastyWeight: 1.0
  },
  {
    name: '白居易', dynasty: '唐', mbtiType: 'ESFJ',
    mbtiDescription: '亲民的诗人，用最平易近人的语言道出最深刻的情感。你如白居易般关注民间疾苦，诗歌通俗易懂却意味深长。',
    personalityTags: JSON.stringify(['亲和','通俗','关怀','叙事','情感丰富']),
    signaturePoems: JSON.stringify(['野火烧不尽，春风吹又生','在天愿作比翼鸟，在地愿为连理枝','同是天涯沦落人，相逢何必曾相识']),
    relatedWeapons: JSON.stringify(['纯钧剑']),
    styleKeywords: JSON.stringify(['通俗','叙事','情感','写实']),
    dynastyWeight: 1.0
  },
  {
    name: '陶渊明', dynasty: '晋', mbtiType: 'INTP',
    mbtiDescription: '超然的隐士，田园诗派的开创者。你如陶渊明般追求精神自由，不为五斗米折腰，在平淡中发现生命的真谛。',
    personalityTags: JSON.stringify(['超然','隐逸','自然','独立','哲思']),
    signaturePoems: JSON.stringify(['采菊东篱下，悠然见南山','不为五斗米折腰','此中有真意，欲辨已忘言']),
    relatedWeapons: JSON.stringify(['伏羲琴']),
    styleKeywords: JSON.stringify(['田园','隐逸','自然','平淡']),
    dynastyWeight: 0.9
  },
];

console.log('Inserting poets...');
for (const p of poets) {
  await conn.execute(
    `INSERT IGNORE INTO poets (name, dynasty, mbtiType, mbtiDescription, personalityTags, signaturePoems, relatedWeapons, styleKeywords, dynastyWeight)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.name, p.dynasty, p.mbtiType, p.mbtiDescription, p.personalityTags, p.signaturePoems, p.relatedWeapons, p.styleKeywords, p.dynastyWeight]
  );
}
console.log('Poets inserted!');

// Get poet IDs
const [poetRows] = await conn.execute('SELECT id, name FROM poets');
const poetMap = {};
for (const r of poetRows) poetMap[r.name] = r.id;

// ─── 2. 兵器谱段位数据 ────────────────────────────────────────────────────────
const weaponRanks = [
  // 青铜剑 (0-299)
  { tier: 'bronze', tierName: '青铜剑', sub: 3, name: '青铜剑·Ⅲ', weapon: '鱼肠剑', story: '专诸刺王僚，藏于鱼腹的勇决之剑，初入江湖的第一把剑。', min: 0, max: 99, emoji: '🗡️', color: '#CD7F32', glow: '#CD7F32' },
  { tier: 'bronze', tierName: '青铜剑', sub: 2, name: '青铜剑·Ⅱ', weapon: '徐夫人匕首', story: '荆轲刺秦王所用，淬以剧毒，一寸见血的短刃。', min: 100, max: 199, emoji: '🗡️', color: '#CD7F32', glow: '#E8A060' },
  { tier: 'bronze', tierName: '青铜剑', sub: 1, name: '青铜剑·Ⅰ', weapon: '越女剑', story: '越女阿青所传，轻灵飘逸，以柔克刚的剑法。', min: 200, max: 299, emoji: '🗡️', color: '#CD7F32', glow: '#F0B870' },
  // 白银枪 (300-699)
  { tier: 'silver', tierName: '白银枪', sub: 4, name: '白银枪·Ⅳ', weapon: '龙泉剑', story: '欧冶子所铸，剑气纵横三万里，天下第一名剑。', min: 300, max: 399, emoji: '🔱', color: '#C0C0C0', glow: '#D8D8D8' },
  { tier: 'silver', tierName: '白银枪', sub: 3, name: '白银枪·Ⅲ', weapon: '太阿剑', story: '干将莫邪之师所铸，威压天下，诸侯莫敢不服。', min: 400, max: 499, emoji: '🔱', color: '#C0C0C0', glow: '#E0E0E0' },
  { tier: 'silver', tierName: '白银枪', sub: 2, name: '白银枪·Ⅱ', weapon: '工布剑', story: '铸剑大师所作，剑身有山川纹路，气象万千。', min: 500, max: 599, emoji: '🔱', color: '#C0C0C0', glow: '#E8E8E8' },
  { tier: 'silver', tierName: '白银枪', sub: 1, name: '白银枪·Ⅰ', weapon: '纯钧剑', story: '越王勾践宝剑，历经千年不锈，锋利如初。', min: 600, max: 699, emoji: '🔱', color: '#C0C0C0', glow: '#F0F0F0' },
  // 黄金刀 (700-1199)
  { tier: 'gold', tierName: '黄金刀', sub: 4, name: '黄金刀·Ⅳ', weapon: '尉迟恭鞭', story: '门神尉迟恭所用铁鞭，力大无穷，百战百胜。', min: 700, max: 849, emoji: '⚔️', color: '#FFD700', glow: '#FFE44D' },
  { tier: 'gold', tierName: '黄金刀', sub: 3, name: '黄金刀·Ⅲ', weapon: '秦琼锏', story: '秦叔宝双锏，马踏黄河两岸，锏扫千军。', min: 850, max: 999, emoji: '⚔️', color: '#FFD700', glow: '#FFE866' },
  { tier: 'gold', tierName: '黄金刀', sub: 2, name: '黄金刀·Ⅱ', weapon: '李元霸锤', story: '天下第一猛将李元霸所用擂鼓瓮金锤，无人能敌。', min: 1000, max: 1099, emoji: '⚔️', color: '#FFD700', glow: '#FFEC80' },
  { tier: 'gold', tierName: '黄金刀', sub: 1, name: '黄金刀·Ⅰ', weapon: '甘宁钩', story: '江东猛虎甘宁所用铁链钩，水战无敌，威震三军。', min: 1100, max: 1199, emoji: '⚔️', color: '#FFD700', glow: '#FFF099' },
  // 铂金戟 (1200-1799)
  { tier: 'platinum', tierName: '铂金戟', sub: 3, name: '铂金戟·Ⅲ', weapon: '越王剑', story: '越王勾践卧薪尝胆，此剑见证了十年复仇的传奇。', min: 1200, max: 1399, emoji: '🏆', color: '#E5E4E2', glow: '#F0EEF0' },
  { tier: 'platinum', tierName: '铂金戟', sub: 2, name: '铂金戟·Ⅱ', weapon: '干将莫邪', story: '干将莫邪双剑，雌雄相合，天下无双，爱情与铸剑的传说。', min: 1400, max: 1599, emoji: '🏆', color: '#E5E4E2', glow: '#F5F3F5' },
  { tier: 'platinum', tierName: '铂金戟', sub: 1, name: '铂金戟·Ⅰ', weapon: '养由基弓', story: '百步穿杨的神射手养由基所用神弓，箭无虚发。', min: 1600, max: 1799, emoji: '🏆', color: '#E5E4E2', glow: '#FAFAFA' },
  // 钻石弓 (1800-2499)
  { tier: 'diamond', tierName: '钻石弓', sub: 5, name: '钻石弓·Ⅴ', weapon: '青龙刀', story: '关羽青龙偃月刀，重八十二斤，忠义之气贯长虹。', min: 1800, max: 1999, emoji: '💎', color: '#B9F2FF', glow: '#C8F5FF' },
  { tier: 'diamond', tierName: '钻石弓', sub: 4, name: '钻石弓·Ⅳ', weapon: '天龙戟', story: '吕布方天画戟，天下第一武将的标志，所向披靡。', min: 2000, max: 2149, emoji: '💎', color: '#B9F2FF', glow: '#D0F7FF' },
  { tier: 'diamond', tierName: '钻石弓', sub: 3, name: '钻石弓·Ⅲ', weapon: '丈八蛇矛', story: '张飞丈八蛇矛，当阳桥头一声吼，百万曹军皆胆寒。', min: 2150, max: 2299, emoji: '💎', color: '#B9F2FF', glow: '#D8F9FF' },
  { tier: 'diamond', tierName: '钻石弓', sub: 2, name: '钻石弓·Ⅱ', weapon: '沥泉枪', story: '岳飞沥泉神枪，精忠报国，驰骋沙场，还我河山。', min: 2300, max: 2449, emoji: '💎', color: '#B9F2FF', glow: '#E0FBFF' },
  { tier: 'diamond', tierName: '钻石弓', sub: 1, name: '钻石弓·Ⅰ', weapon: '青釭剑', story: '曹操青釭剑，削铁如泥，赵云长坂坡七进七出所夺。', min: 2450, max: 2499, emoji: '💎', color: '#B9F2FF', glow: '#E8FDFF' },
  // 星耀扇 (2500-3499)
  { tier: 'star', tierName: '星耀扇', sub: 5, name: '星耀扇·Ⅴ', weapon: '轩辕剑', story: '黄帝轩辕剑，华夏第一神剑，斩蚩尤定天下，开创文明之始。', min: 2500, max: 2699, emoji: '⭐', color: '#FFB347', glow: '#FFC060' },
  { tier: 'star', tierName: '星耀扇', sub: 4, name: '星耀扇·Ⅳ', weapon: '蚩尤斧', story: '战神蚩尤所持神斧，力能开山裂地，上古最强战神的象征。', min: 2700, max: 2899, emoji: '⭐', color: '#FFB347', glow: '#FFD070' },
  { tier: 'star', tierName: '星耀扇', sub: 3, name: '星耀扇·Ⅲ', weapon: '后羿弓', story: '后羿神弓，射落九日，拯救苍生，英雄主义的永恒象征。', min: 2900, max: 3099, emoji: '⭐', color: '#FFB347', glow: '#FFD880' },
  { tier: 'star', tierName: '星耀扇', sub: 2, name: '星耀扇·Ⅱ', weapon: '女娲石', story: '女娲补天所用五彩神石，蕴含创世之力，化腐朽为神奇。', min: 3100, max: 3299, emoji: '⭐', color: '#FFB347', glow: '#FFE090' },
  { tier: 'star', tierName: '星耀扇', sub: 1, name: '星耀扇·Ⅰ', weapon: '伏羲琴', story: '伏羲所制七弦琴，一曲可通天地，万物皆在琴音中和谐共鸣。', min: 3300, max: 3499, emoji: '⭐', color: '#FFB347', glow: '#FFE8A0' },
  // 王者笔 (3500+)
  { tier: 'king', tierName: '王者笔', sub: 1, name: '王者笔·天下第一', weapon: '兵主·蚩尤', story: '集天下兵器之精华，诗词王者的终极荣耀。你已超越所有段位，成为诗词世界的真正王者！', min: 3500, max: 99999, emoji: '👑', color: '#FF6B35', glow: '#FF8C00' },
];

console.log('Inserting weapon ranks...');
for (const r of weaponRanks) {
  await conn.execute(
    `INSERT IGNORE INTO weaponRanks (rankTier, rankName, tierName, subRank, weaponName, weaponStory, minScore, maxScore, iconEmoji, color, glowColor)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [r.tier, r.name, r.tierName, r.sub, r.weapon, r.story, r.min, r.max, r.emoji, r.color, r.glow]
  );
}
console.log('Weapon ranks inserted!');

// ─── 3. 题目数据 ──────────────────────────────────────────────────────────────
const liId = poetMap['李白'];
const duId = poetMap['杜甫'];
const wangId = poetMap['王维'];
const suId = poetMap['苏轼'];
const liQId = poetMap['李清照'];
const xinId = poetMap['辛弃疾'];
const baiId = poetMap['白居易'];
const taoId = poetMap['陶渊明'];

const questions = [
  // ── 青铜段位 (difficulty 1) ── 中小学必背 50题
  // 李白
  { poetId: liId, content: '床前__光，疑是地上霜。', options: JSON.stringify(['明月','日月','星月','皎月']), correct: '明月', type: 'fill', diff: 1, title: '静夜思', author: '李白', dynasty: '唐', theme: '思乡', explanation: '《静夜思》：床前明月光，疑是地上霜。举头望明月，低头思故乡。' },
  { poetId: liId, content: '举头望明月，__思故乡。', options: JSON.stringify(['低头','仰头','回头','转头']), correct: '低头', type: 'fill', diff: 1, title: '静夜思', author: '李白', dynasty: '唐', theme: '思乡', explanation: '低头思故乡，表达了诗人对故乡深深的思念之情。' },
  { poetId: liId, content: '飞流直下三千尺，__是银河落九天。', options: JSON.stringify(['疑','似','如','若']), correct: '疑', type: 'fill', diff: 1, title: '望庐山瀑布', author: '李白', dynasty: '唐', theme: '山水', explanation: '《望庐山瀑布》以夸张手法描绘庐山瀑布的壮观景象。' },
  { poetId: liId, content: '以下哪句诗出自李白的《静夜思》？', options: JSON.stringify(['举头望明月，低头思故乡','春眠不觉晓，处处闻啼鸟','离离原上草，一岁一枯荣','白日依山尽，黄河入海流']), correct: '举头望明月，低头思故乡', type: 'judge', diff: 1, title: '静夜思', author: '李白', dynasty: '唐', theme: '思乡', explanation: '《静夜思》是李白最著名的思乡诗之一。' },
  { poetId: liId, content: '朝辞白帝彩云间，__里江陵一日还。', options: JSON.stringify(['千','万','百','十']), correct: '千', type: 'fill', diff: 1, title: '早发白帝城', author: '李白', dynasty: '唐', theme: '山水', explanation: '《早发白帝城》描写了诗人乘船顺流而下的轻快心情。' },
  { poetId: liId, content: '两岸猿声啼不住，__舟已过万重山。', options: JSON.stringify(['轻','小','孤','扁']), correct: '轻', type: 'fill', diff: 1, title: '早发白帝城', author: '李白', dynasty: '唐', theme: '山水', explanation: '轻舟已过万重山，表达了诗人获赦后的喜悦之情。' },
  { poetId: liId, content: '故人西辞黄鹤楼，烟花三月下__州。', options: JSON.stringify(['扬','广','杭','苏']), correct: '扬', type: 'fill', diff: 1, title: '黄鹤楼送孟浩然之广陵', author: '李白', dynasty: '唐', theme: '送别', explanation: '扬州是唐代著名的繁华城市，烟花三月正是最美的时节。' },
  { poetId: liId, content: '孤帆远影碧空尽，唯见长江天际__。', options: JSON.stringify(['流','去','来','走']), correct: '流', type: 'fill', diff: 1, title: '黄鹤楼送孟浩然之广陵', author: '李白', dynasty: '唐', theme: '送别', explanation: '诗人目送友人远去，只见长江滚滚东流，情深意长。' },

  // 杜甫
  { poetId: duId, content: '烽火连三月，家书抵__金。', options: JSON.stringify(['万','千','百','亿']), correct: '万', type: 'fill', diff: 1, title: '春望', author: '杜甫', dynasty: '唐', theme: '爱国', explanation: '《春望》写于安史之乱期间，表达了诗人对家人的思念和对国家的忧虑。' },
  { poetId: duId, content: '会当凌绝顶，一览众山__。', options: JSON.stringify(['小','大','远','近']), correct: '小', type: 'fill', diff: 1, title: '望岳', author: '杜甫', dynasty: '唐', theme: '励志', explanation: '《望岳》表达了诗人不畏艰难、勇于攀登的豪情壮志。' },
  { poetId: duId, content: '国破山河在，城春草木__。', options: JSON.stringify(['深','生','长','绿']), correct: '深', type: 'fill', diff: 1, title: '春望', author: '杜甫', dynasty: '唐', theme: '爱国', explanation: '国破山河在，城春草木深，写出了战乱中国都的荒凉景象。' },
  { poetId: duId, content: '感时花溅泪，恨别鸟惊__。', options: JSON.stringify(['心','魂','情','怀']), correct: '心', type: 'fill', diff: 1, title: '春望', author: '杜甫', dynasty: '唐', theme: '爱国', explanation: '诗人因感时伤世，看到花也流泪，听到鸟鸣也心惊。' },
  { poetId: duId, content: '随风潜入夜，润物细无__。', options: JSON.stringify(['声','息','痕','迹']), correct: '声', type: 'fill', diff: 1, title: '春夜喜雨', author: '杜甫', dynasty: '唐', theme: '自然', explanation: '《春夜喜雨》赞美了春雨润物无声的品格。' },
  { poetId: duId, content: '好雨知时节，当春乃__生。', options: JSON.stringify(['发','萌','茁','催']), correct: '发', type: 'fill', diff: 1, title: '春夜喜雨', author: '杜甫', dynasty: '唐', theme: '自然', explanation: '好雨知时节，当春乃发生，拟人化地描写了春雨的及时。' },

  // 王维
  { poetId: wangId, content: '独在异乡为异客，每逢佳节倍__亲。', options: JSON.stringify(['思','念','忆','想']), correct: '思', type: 'fill', diff: 1, title: '九月九日忆山东兄弟', author: '王维', dynasty: '唐', theme: '思乡', explanation: '《九月九日忆山东兄弟》是王维最著名的思乡诗。' },
  { poetId: wangId, content: '遥知兄弟登高处，遍插茱萸少一__。', options: JSON.stringify(['人','个','位','名']), correct: '人', type: 'fill', diff: 1, title: '九月九日忆山东兄弟', author: '王维', dynasty: '唐', theme: '思乡', explanation: '遥想兄弟们登高时，少了诗人这一个人，表达了深深的思念。' },
  { poetId: wangId, content: '红豆生南国，春来发几枝。愿君多采撷，此物最__情。', options: JSON.stringify(['相','思','恋','牵']), correct: '相思', type: 'chain', diff: 1, title: '相思', author: '王维', dynasty: '唐', theme: '爱情', explanation: '《相思》以红豆寄托相思之情，是王维著名的爱情诗。' },
  { poetId: wangId, content: '大漠孤烟直，长河__日圆。', options: JSON.stringify(['落','斜','夕','西']), correct: '落', type: 'fill', diff: 1, title: '使至塞上', author: '王维', dynasty: '唐', theme: '边塞', explanation: '《使至塞上》中这两句被誉为千古名句，描绘了大漠壮阔的景色。' },

  // 苏轼
  { poetId: suId, content: '但愿人长久，千里共__娟。', options: JSON.stringify(['婵','蝉','禅','缠']), correct: '婵', type: 'fill', diff: 1, title: '水调歌头', author: '苏轼', dynasty: '宋', theme: '思念', explanation: '《水调歌头·明月几时有》是苏轼中秋词的代表作。' },
  { poetId: suId, content: '明月几时有？把酒问__天。', options: JSON.stringify(['青','苍','碧','蓝']), correct: '青', type: 'fill', diff: 1, title: '水调歌头', author: '苏轼', dynasty: '宋', theme: '思念', explanation: '把酒问青天，表达了诗人对人生和宇宙的哲学思考。' },
  { poetId: suId, content: '横看成岭侧成峰，远近高低各不__。', options: JSON.stringify(['同','异','等','一']), correct: '同', type: 'fill', diff: 1, title: '题西林壁', author: '苏轼', dynasty: '宋', theme: '哲理', explanation: '《题西林壁》蕴含了深刻的哲理：当局者迷，旁观者清。' },
  { poetId: suId, content: '不识庐山真面目，只缘身在此山__。', options: JSON.stringify(['中','里','间','内']), correct: '中', type: 'fill', diff: 1, title: '题西林壁', author: '苏轼', dynasty: '宋', theme: '哲理', explanation: '身在此山中，无法看清庐山全貌，比喻当局者迷的道理。' },

  // 李清照
  { poetId: liQId, content: '知否知否，应是绿肥__瘦。', options: JSON.stringify(['红','粉','花','叶']), correct: '红', type: 'fill', diff: 1, title: '如梦令', author: '李清照', dynasty: '宋', theme: '自然', explanation: '《如梦令》中绿肥红瘦，以绿叶茂盛衬托红花凋零，写出了春末的景象。' },
  { poetId: liQId, content: '生当作人杰，死亦为__雄。', options: JSON.stringify(['鬼','英','豪','神']), correct: '鬼', type: 'fill', diff: 1, title: '夏日绝句', author: '李清照', dynasty: '宋', theme: '爱国', explanation: '《夏日绝句》表达了李清照的爱国情怀和英雄气概。' },
  { poetId: liQId, content: '寻寻觅觅，冷冷清清，凄凄惨惨__戚。', options: JSON.stringify(['戚','悲','哀','苦']), correct: '戚', type: 'fill', diff: 1, title: '声声慢', author: '李清照', dynasty: '宋', theme: '悲愁', explanation: '《声声慢》开篇连用七组叠字，极写愁苦之情，堪称千古绝唱。' },

  // 辛弃疾
  { poetId: xinId, content: '醉里挑灯看剑，梦回吹角__营。', options: JSON.stringify(['连','军','战','边']), correct: '连', type: 'fill', diff: 1, title: '破阵子', author: '辛弃疾', dynasty: '宋', theme: '爱国', explanation: '《破阵子》表达了辛弃疾渴望驰骋沙场、报效国家的壮志。' },
  { poetId: xinId, content: '了却君王天下事，赢得生前身后__。', options: JSON.stringify(['名','荣','誉','声']), correct: '名', type: 'fill', diff: 1, title: '破阵子', author: '辛弃疾', dynasty: '宋', theme: '爱国', explanation: '了却君王天下事，赢得生前身后名，是辛弃疾的人生理想。' },

  // 白居易
  { poetId: baiId, content: '野火烧不尽，春风吹又__。', options: JSON.stringify(['生','发','长','绿']), correct: '生', type: 'fill', diff: 1, title: '赋得古原草送别', author: '白居易', dynasty: '唐', theme: '励志', explanation: '野火烧不尽，春风吹又生，比喻生命力的顽强。' },
  { poetId: baiId, content: '离离原上草，一岁一__荣。', options: JSON.stringify(['枯','荣','生','长']), correct: '枯', type: 'fill', diff: 1, title: '赋得古原草送别', author: '白居易', dynasty: '唐', theme: '自然', explanation: '离离原上草，一岁一枯荣，写出了草的生命循环。' },
  { poetId: baiId, content: '同是天涯沦落人，相逢何必曾__识。', options: JSON.stringify(['相','认','曾','素']), correct: '相', type: 'fill', diff: 1, title: '琵琶行', author: '白居易', dynasty: '唐', theme: '感慨', explanation: '《琵琶行》中这句话表达了同病相怜的感慨。' },

  // 陶渊明
  { poetId: taoId, content: '采菊东篱下，悠然见__山。', options: JSON.stringify(['南','北','东','西']), correct: '南', type: 'fill', diff: 1, title: '饮酒', author: '陶渊明', dynasty: '晋', theme: '田园', explanation: '《饮酒》中采菊东篱下，悠然见南山，是田园诗的代表名句。' },
  { poetId: taoId, content: '问君何能尔？心远地自__。', options: JSON.stringify(['偏','远','静','幽']), correct: '偏', type: 'fill', diff: 1, title: '饮酒', author: '陶渊明', dynasty: '晋', theme: '田园', explanation: '心远地自偏，说明只要心境超然，身处闹市也如隐居。' },

  // ── 白银段位 (difficulty 2) ── 唐诗扩展 50题
  { poetId: liId, content: '天生我材必有用，千金散尽还__来。', options: JSON.stringify(['复','再','重','归']), correct: '复', type: 'fill', diff: 2, title: '将进酒', author: '李白', dynasty: '唐', theme: '豪放', explanation: '《将进酒》是李白豪放诗的代表作，表达了对人生的豁达态度。' },
  { poetId: liId, content: '君不见，黄河之水天上来，奔流到海不__回。', options: JSON.stringify(['复','再','能','肯']), correct: '复', type: 'fill', diff: 2, title: '将进酒', author: '李白', dynasty: '唐', theme: '豪放', explanation: '黄河之水天上来，奔流到海不复回，以黄河比喻时光流逝。' },
  { poetId: liId, content: '长风破浪会有时，直挂云帆济__海。', options: JSON.stringify(['沧','碧','东','大']), correct: '沧', type: 'fill', diff: 2, title: '行路难', author: '李白', dynasty: '唐', theme: '励志', explanation: '《行路难》表达了诗人对未来充满信心的乐观精神。' },
  { poetId: liId, content: '抽刀断水水更流，举杯消愁愁更__。', options: JSON.stringify(['愁','深','浓','重']), correct: '愁', type: 'fill', diff: 2, title: '宣州谢朓楼饯别校书叔云', author: '李白', dynasty: '唐', theme: '愁绪', explanation: '抽刀断水水更流，举杯消愁愁更愁，写出了愁绪难以排遣的心情。' },
  { poetId: liId, content: '云想衣裳花想容，春风拂槛露华__。', options: JSON.stringify(['浓','清','新','香']), correct: '浓', type: 'fill', diff: 2, title: '清平调', author: '李白', dynasty: '唐', theme: '美人', explanation: '《清平调》是李白为杨贵妃所作，以云和花比喻贵妃之美。' },
  { poetId: duId, content: '安得广厦千万间，大庇天下寒士俱欢__。', options: JSON.stringify(['颜','乐','笑','喜']), correct: '颜', type: 'fill', diff: 2, title: '茅屋为秋风所破歌', author: '杜甫', dynasty: '唐', theme: '爱国', explanation: '《茅屋为秋风所破歌》表达了杜甫忧国忧民的博大情怀。' },
  { poetId: duId, content: '烽火连三月，家书抵万金。白头搔更短，浑欲不胜__。', options: JSON.stringify(['簪','钗','冠','巾']), correct: '簪', type: 'fill', diff: 2, title: '春望', author: '杜甫', dynasty: '唐', theme: '爱国', explanation: '白头搔更短，浑欲不胜簪，写出了诗人忧愁至极的形象。' },
  { poetId: duId, content: '出师未捷身先死，长使英雄泪满__。', options: JSON.stringify(['襟','衫','袖','巾']), correct: '襟', type: 'fill', diff: 2, title: '蜀相', author: '杜甫', dynasty: '唐', theme: '历史', explanation: '《蜀相》悼念诸葛亮，表达了对英雄壮志未酬的惋惜。' },
  { poetId: wangId, content: '明月松间照，清泉石上__。', options: JSON.stringify(['流','淌','响','鸣']), correct: '流', type: 'fill', diff: 2, title: '山居秋暝', author: '王维', dynasty: '唐', theme: '山水', explanation: '《山居秋暝》描绘了山村秋夜的清幽景色，充满禅意。' },
  { poetId: wangId, content: '竹喧归浣女，莲动下渔__。', options: JSON.stringify(['舟','船','艇','筏']), correct: '舟', type: 'fill', diff: 2, title: '山居秋暝', author: '王维', dynasty: '唐', theme: '山水', explanation: '竹喧归浣女，莲动下渔舟，以动写静，展现了山村的生活气息。' },
  { poetId: wangId, content: '空山新雨后，天气晚来__。', options: JSON.stringify(['秋','凉','清','寒']), correct: '秋', type: 'fill', diff: 2, title: '山居秋暝', author: '王维', dynasty: '唐', theme: '山水', explanation: '空山新雨后，天气晚来秋，写出了雨后山村的清新气息。' },
  { poetId: suId, content: '大江东去，浪淘尽，千古风流__物。', options: JSON.stringify(['人','英','豪','伟']), correct: '人', type: 'fill', diff: 2, title: '念奴娇·赤壁怀古', author: '苏轼', dynasty: '宋', theme: '豪放', explanation: '《念奴娇·赤壁怀古》是苏轼豪放词的代表作。' },
  { poetId: suId, content: '竹杖芒鞋轻胜马，谁怕？一蓑烟雨任__生。', options: JSON.stringify(['平','此','今','余']), correct: '平', type: 'fill', diff: 2, title: '定风波', author: '苏轼', dynasty: '宋', theme: '豁达', explanation: '《定风波》表达了苏轼面对人生风雨的豁达态度。' },
  { poetId: suId, content: '欲把西湖比西子，淡妆浓抹总相__。', options: JSON.stringify(['宜','美','好','妍']), correct: '宜', type: 'fill', diff: 2, title: '饮湖上初晴后雨', author: '苏轼', dynasty: '宋', theme: '山水', explanation: '《饮湖上初晴后雨》将西湖比作西施，是咏西湖的千古名句。' },
  { poetId: liQId, content: '昨夜雨疏风骤，浓睡不消残__。', options: JSON.stringify(['酒','醉','梦','情']), correct: '酒', type: 'fill', diff: 2, title: '如梦令', author: '李清照', dynasty: '宋', theme: '闺情', explanation: '《如梦令》写出了李清照对春花的珍惜之情。' },
  { poetId: liQId, content: '莫道不消魂，帘卷西风，人比黄花__。', options: JSON.stringify(['瘦','小','细','弱']), correct: '瘦', type: 'fill', diff: 2, title: '醉花阴', author: '李清照', dynasty: '宋', theme: '相思', explanation: '《醉花阴》以黄花比喻自己因相思而消瘦的形象。' },
  { poetId: xinId, content: '青山遮不住，毕竟东流__。', options: JSON.stringify(['去','水','江','河']), correct: '去', type: 'fill', diff: 2, title: '菩萨蛮·书江西造口壁', author: '辛弃疾', dynasty: '宋', theme: '爱国', explanation: '青山遮不住，毕竟东流去，比喻历史的必然趋势。' },
  { poetId: xinId, content: '众里寻他千百度，蓦然回首，那人却在，灯火阑珊__。', options: JSON.stringify(['处','时','间','里']), correct: '处', type: 'fill', diff: 2, title: '青玉案·元夕', author: '辛弃疾', dynasty: '宋', theme: '爱情', explanation: '《青玉案·元夕》中这句话被王国维列为人生三境界之一。' },
  { poetId: baiId, content: '在天愿作比翼鸟，在地愿为连理__。', options: JSON.stringify(['枝','树','木','根']), correct: '枝', type: 'fill', diff: 2, title: '长恨歌', author: '白居易', dynasty: '唐', theme: '爱情', explanation: '《长恨歌》描写了唐玄宗与杨贵妃的爱情故事。' },
  { poetId: baiId, content: '天长地久有时尽，此恨绵绵无绝__。', options: JSON.stringify(['期','时','尽','终']), correct: '期', type: 'fill', diff: 2, title: '长恨歌', author: '白居易', dynasty: '唐', theme: '爱情', explanation: '天长地久有时尽，此恨绵绵无绝期，写出了爱情的永恒。' },
  { poetId: taoId, content: '结庐在人境，而无车马__。', options: JSON.stringify(['喧','声','嚣','噪']), correct: '喧', type: 'fill', diff: 2, title: '饮酒', author: '陶渊明', dynasty: '晋', theme: '田园', explanation: '《饮酒》写出了陶渊明超然物外的隐居生活。' },
  // 接龙题
  { poetId: liId, content: '床前明月光，疑是地上霜。下一句是？', options: JSON.stringify(['举头望明月，低头思故乡','举头望日月，低头思故乡','举头望星月，低头思故乡','举头望皎月，低头思故乡']), correct: '举头望明月，低头思故乡', type: 'chain', diff: 2, title: '静夜思', author: '李白', dynasty: '唐', theme: '思乡', explanation: '《静夜思》全诗：床前明月光，疑是地上霜。举头望明月，低头思故乡。' },
  { poetId: duId, content: '会当凌绝顶，下一句是？', options: JSON.stringify(['一览众山小','万山皆在下','群山皆俯首','天下尽在目']), correct: '一览众山小', type: 'chain', diff: 2, title: '望岳', author: '杜甫', dynasty: '唐', theme: '励志', explanation: '《望岳》：会当凌绝顶，一览众山小，表达了登高望远的豪情。' },
  { poetId: wangId, content: '独在异乡为异客，下一句是？', options: JSON.stringify(['每逢佳节倍思亲','每逢佳节倍思家','每逢佳节倍思人','每逢佳节倍思念']), correct: '每逢佳节倍思亲', type: 'chain', diff: 2, title: '九月九日忆山东兄弟', author: '王维', dynasty: '唐', theme: '思乡', explanation: '《九月九日忆山东兄弟》：独在异乡为异客，每逢佳节倍思亲。' },
  { poetId: suId, content: '横看成岭侧成峰，下一句是？', options: JSON.stringify(['远近高低各不同','远近高低各不等','远近高低各不一','远近高低各有别']), correct: '远近高低各不同', type: 'chain', diff: 2, title: '题西林壁', author: '苏轼', dynasty: '宋', theme: '哲理', explanation: '《题西林壁》：横看成岭侧成峰，远近高低各不同。' },
  { poetId: liQId, content: '生当作人杰，下一句是？', options: JSON.stringify(['死亦为鬼雄','死亦为英雄','死亦为豪雄','死亦为神雄']), correct: '死亦为鬼雄', type: 'chain', diff: 2, title: '夏日绝句', author: '李清照', dynasty: '宋', theme: '爱国', explanation: '《夏日绝句》：生当作人杰，死亦为鬼雄。' },

  // ── 黄金段位 (difficulty 3) ── 宋词名篇 50题
  { poetId: suId, content: '明月几时有，把酒问青天。不知天上宫阙，今夕是何__。', options: JSON.stringify(['年','时','日','夕']), correct: '年', type: 'fill', diff: 3, title: '水调歌头', author: '苏轼', dynasty: '宋', theme: '思念', explanation: '《水调歌头》中今夕是何年，表达了对天上岁月的好奇。' },
  { poetId: suId, content: '人有悲欢离合，月有阴晴圆缺，此事古难__。', options: JSON.stringify(['全','完','齐','备']), correct: '全', type: 'fill', diff: 3, title: '水调歌头', author: '苏轼', dynasty: '宋', theme: '哲理', explanation: '人有悲欢离合，月有阴晴圆缺，此事古难全，表达了对人生无常的豁达。' },
  { poetId: suId, content: '十年生死两茫茫，不思量，自难__。', options: JSON.stringify(['忘','舍','弃','放']), correct: '忘', type: 'fill', diff: 3, title: '江城子·乙卯正月二十日夜记梦', author: '苏轼', dynasty: '宋', theme: '悼亡', explanation: '《江城子》是苏轼悼念亡妻王弗的词，情深意切。' },
  { poetId: suId, content: '相顾无言，惟有泪千__。', options: JSON.stringify(['行','滴','点','流']), correct: '行', type: 'fill', diff: 3, title: '江城子·乙卯正月二十日夜记梦', author: '苏轼', dynasty: '宋', theme: '悼亡', explanation: '相顾无言，惟有泪千行，写出了梦中与亡妻重逢的悲痛。' },
  { poetId: liQId, content: '花自飘零水自流，一种相思，两处__愁。', options: JSON.stringify(['闲','深','浓','淡']), correct: '闲', type: 'fill', diff: 3, title: '一剪梅', author: '李清照', dynasty: '宋', theme: '相思', explanation: '《一剪梅》写出了李清照对丈夫赵明诚的深切思念。' },
  { poetId: liQId, content: '此情无计可消除，才下眉头，却上心__。', options: JSON.stringify(['头','间','来','处']), correct: '头', type: 'fill', diff: 3, title: '一剪梅', author: '李清照', dynasty: '宋', theme: '相思', explanation: '才下眉头，却上心头，写出了相思之情难以排遣的状态。' },
  { poetId: xinId, content: '少年不识愁滋味，爱上层楼。爱上层楼，为赋新词强说__。', options: JSON.stringify(['愁','悲','苦','怨']), correct: '愁', type: 'fill', diff: 3, title: '丑奴儿·书博山道中壁', author: '辛弃疾', dynasty: '宋', theme: '感慨', explanation: '《丑奴儿》对比了少年与老年对愁的不同理解。' },
  { poetId: xinId, content: '而今识尽愁滋味，欲说还休。欲说还休，却道天凉好个__。', options: JSON.stringify(['秋','天','日','时']), correct: '秋', type: 'fill', diff: 3, title: '丑奴儿·书博山道中壁', author: '辛弃疾', dynasty: '宋', theme: '感慨', explanation: '却道天凉好个秋，以轻描淡写反衬内心深沉的愁苦。' },
  { poetId: xinId, content: '东风夜放花千树，更吹落、星如__。', options: JSON.stringify(['雨','雪','霜','露']), correct: '雨', type: 'fill', diff: 3, title: '青玉案·元夕', author: '辛弃疾', dynasty: '宋', theme: '节日', explanation: '《青玉案·元夕》描写了元宵节的繁华景象。' },
  { poetId: liQId, content: '三杯两盏淡酒，怎敌他、晚来__急。', options: JSON.stringify(['风','雨','寒','霜']), correct: '风', type: 'fill', diff: 3, title: '声声慢', author: '李清照', dynasty: '宋', theme: '悲愁', explanation: '《声声慢》写出了李清照晚年孤独凄凉的生活。' },
  { poetId: suId, content: '会挽雕弓如满月，西北望，射天__。', options: JSON.stringify(['狼','虎','鹰','龙']), correct: '狼', type: 'fill', diff: 3, title: '江城子·密州出猎', author: '苏轼', dynasty: '宋', theme: '豪放', explanation: '《江城子·密州出猎》是苏轼豪放词的代表，表达了报国之志。' },
  { poetId: xinId, content: '把吴钩看了，栏杆拍遍，无人会，登临意。', options: JSON.stringify(['把吴钩看了，栏杆拍遍，无人会，登临意','把宝剑看了，栏杆拍遍，无人会，登临意','把长剑看了，栏杆拍遍，无人会，登临意','把青剑看了，栏杆拍遍，无人会，登临意']), correct: '把吴钩看了，栏杆拍遍，无人会，登临意', type: 'judge', diff: 3, title: '水龙吟·登建康赏心亭', author: '辛弃疾', dynasty: '宋', theme: '爱国', explanation: '《水龙吟》中把吴钩看了，栏杆拍遍，表达了壮志难酬的苦闷。' },
  // 重组题
  { poetId: liId, content: '请将以下词语重组成正确的诗句：【月 床前 明 光】', options: JSON.stringify(['床前明月光','明月床前光','床前光明月','月光床前明']), correct: '床前明月光', type: 'reorder', diff: 3, title: '静夜思', author: '李白', dynasty: '唐', theme: '思乡', explanation: '《静夜思》首句：床前明月光。' },
  { poetId: duId, content: '请将以下词语重组成正确的诗句：【绝顶 会 凌 当】', options: JSON.stringify(['会当凌绝顶','凌绝顶会当','当凌会绝顶','绝顶会当凌']), correct: '会当凌绝顶', type: 'reorder', diff: 3, title: '望岳', author: '杜甫', dynasty: '唐', theme: '励志', explanation: '《望岳》：会当凌绝顶，一览众山小。' },
  // 勘误题
  { poetId: liId, content: '找出以下诗句中的错别字：床前明月灯，疑是地上霜。', options: JSON.stringify(['灯→光','床→窗','疑→似','地→天']), correct: '灯→光', type: 'error', diff: 3, title: '静夜思', author: '李白', dynasty: '唐', theme: '思乡', explanation: '正确应为"床前明月光"，不是"灯"。' },
  { poetId: duId, content: '找出以下诗句中的错别字：烽火连三月，家书抵万斤。', options: JSON.stringify(['斤→金','烽→峰','连→联','抵→值']), correct: '斤→金', type: 'error', diff: 3, title: '春望', author: '杜甫', dynasty: '唐', theme: '爱国', explanation: '正确应为"家书抵万金"，金指黄金，不是斤。' },

  // ── 铂金段位 (difficulty 4) ── 历代名篇 30题
  { poetId: liId, content: '蜀道之难，难于上__天。', options: JSON.stringify(['青','苍','碧','蓝']), correct: '青', type: 'fill', diff: 4, title: '蜀道难', author: '李白', dynasty: '唐', theme: '山水', explanation: '《蜀道难》是李白的代表作，以夸张手法描写蜀道的险峻。' },
  { poetId: liId, content: '噫吁嚱，危乎高哉！蜀道之难，难于上青天！蚕丛及鱼凫，开国何__然。', options: JSON.stringify(['茫','渺','苍','悠']), correct: '茫', type: 'fill', diff: 4, title: '蜀道难', author: '李白', dynasty: '唐', theme: '山水', explanation: '《蜀道难》开篇即以感叹词引出蜀道之难。' },
  { poetId: duId, content: '艰难苦恨繁霜鬓，潦倒新停浊酒__。', options: JSON.stringify(['杯','盏','壶','瓮']), correct: '杯', type: 'fill', diff: 4, title: '登高', author: '杜甫', dynasty: '唐', theme: '悲秋', explanation: '《登高》是杜甫晚年的代表作，被誉为古今七律第一。' },
  { poetId: duId, content: '无边落木萧萧下，不尽长江滚滚__。', options: JSON.stringify(['来','去','流','奔']), correct: '来', type: 'fill', diff: 4, title: '登高', author: '杜甫', dynasty: '唐', theme: '悲秋', explanation: '无边落木萧萧下，不尽长江滚滚来，气势磅礴，令人震撼。' },
  { poetId: wangId, content: '渭城朝雨浥轻尘，客舍青青柳色__。', options: JSON.stringify(['新','鲜','翠','绿']), correct: '新', type: 'fill', diff: 4, title: '送元二使安西', author: '王维', dynasty: '唐', theme: '送别', explanation: '《送元二使安西》是唐代最著名的送别诗之一。' },
  { poetId: wangId, content: '劝君更尽一杯酒，西出阳关无故__。', options: JSON.stringify(['人','友','知','亲']), correct: '人', type: 'fill', diff: 4, title: '送元二使安西', author: '王维', dynasty: '唐', theme: '送别', explanation: '劝君更尽一杯酒，西出阳关无故人，是千古送别名句。' },
  { poetId: suId, content: '故国神游，多情应笑我，早生华__。', options: JSON.stringify(['发','白','霜','雪']), correct: '发', type: 'fill', diff: 4, title: '念奴娇·赤壁怀古', author: '苏轼', dynasty: '宋', theme: '豪放', explanation: '《念奴娇·赤壁怀古》中多情应笑我，早生华发，表达了壮志未酬的感慨。' },
  { poetId: suId, content: '乱石穿空，惊涛拍岸，卷起千堆__。', options: JSON.stringify(['雪','浪','波','沫']), correct: '雪', type: 'fill', diff: 4, title: '念奴娇·赤壁怀古', author: '苏轼', dynasty: '宋', theme: '豪放', explanation: '乱石穿空，惊涛拍岸，卷起千堆雪，描绘了赤壁的壮观景象。' },
  { poetId: xinId, content: '何处望神州？满眼风光北固__。', options: JSON.stringify(['楼','山','台','亭']), correct: '楼', type: 'fill', diff: 4, title: '南乡子·登京口北固亭有怀', author: '辛弃疾', dynasty: '宋', theme: '爱国', explanation: '《南乡子》中辛弃疾登北固楼，遥望中原，抒发爱国情怀。' },
  { poetId: xinId, content: '千古兴亡多少事？悠悠。不尽长江滚滚__。', options: JSON.stringify(['流','去','来','奔']), correct: '流', type: 'fill', diff: 4, title: '南乡子·登京口北固亭有怀', author: '辛弃疾', dynasty: '宋', theme: '爱国', explanation: '不尽长江滚滚流，以长江比喻历史的长河。' },
  { poetId: liQId, content: '物是人非事事休，欲语泪先__。', options: JSON.stringify(['流','落','滴','涌']), correct: '流', type: 'fill', diff: 4, title: '武陵春·春晚', author: '李清照', dynasty: '宋', theme: '悲愁', explanation: '《武陵春》写出了李清照晚年的凄苦心情。' },
  { poetId: liQId, content: '只恐双溪舴艋舟，载不动许多__。', options: JSON.stringify(['愁','恨','情','泪']), correct: '愁', type: 'fill', diff: 4, title: '武陵春·春晚', author: '李清照', dynasty: '宋', theme: '悲愁', explanation: '载不动许多愁，以舟载愁的新奇比喻写出了愁之沉重。' },
  { poetId: baiId, content: '千呼万唤始出来，犹抱琵琶半遮__。', options: JSON.stringify(['面','脸','颜','容']), correct: '面', type: 'fill', diff: 4, title: '琵琶行', author: '白居易', dynasty: '唐', theme: '音乐', explanation: '《琵琶行》描写了白居易与琵琶女的相遇，以及琵琶女的悲惨命运。' },
  { poetId: baiId, content: '大弦嘈嘈如急雨，小弦切切如私__。', options: JSON.stringify(['语','话','声','言']), correct: '语', type: 'fill', diff: 4, title: '琵琶行', author: '白居易', dynasty: '唐', theme: '音乐', explanation: '《琵琶行》以生动的比喻描写了琵琶的各种音色。' },
  { poetId: taoId, content: '土地平旷，屋舍俨然，有良田美池桑竹之__。', options: JSON.stringify(['属','类','种','群']), correct: '属', type: 'fill', diff: 4, title: '桃花源记', author: '陶渊明', dynasty: '晋', theme: '理想', explanation: '《桃花源记》描绘了陶渊明心目中的理想社会。' },

  // ── 钻石及以上段位 (difficulty 5) ── 飞花令高频 20题
  { poetId: liId, content: '飞花令·月：以下哪句含"月"字且出自李白？', options: JSON.stringify(['举头望明月，低头思故乡','明月松间照，清泉石上流','但愿人长久，千里共婵娟','月落乌啼霜满天，江枫渔火对愁眠']), correct: '举头望明月，低头思故乡', type: 'judge', diff: 5, title: '飞花令·月', author: '李白', dynasty: '唐', theme: '飞花令', explanation: '飞花令中含"月"字的诗句，举头望明月出自李白《静夜思》。' },
  { poetId: duId, content: '飞花令·春：以下哪句含"春"字且出自杜甫？', options: JSON.stringify(['国破山河在，城春草木深','春眠不觉晓，处处闻啼鸟','春风又绿江南岸，明月何时照我还','好雨知时节，当春乃发生']), correct: '国破山河在，城春草木深', type: 'judge', diff: 5, title: '飞花令·春', author: '杜甫', dynasty: '唐', theme: '飞花令', explanation: '飞花令中含"春"字，国破山河在，城春草木深出自杜甫《春望》。' },
  { poetId: wangId, content: '飞花令·山：以下哪句含"山"字且出自王维？', options: JSON.stringify(['采菊东篱下，悠然见南山','会当凌绝顶，一览众山小','大漠孤烟直，长河落日圆','空山新雨后，天气晚来秋']), correct: '空山新雨后，天气晚来秋', type: 'judge', diff: 5, title: '飞花令·山', author: '王维', dynasty: '唐', theme: '飞花令', explanation: '飞花令中含"山"字，空山新雨后出自王维《山居秋暝》。' },
  { poetId: suId, content: '飞花令·风：以下哪句含"风"字且出自苏轼？', options: JSON.stringify(['竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生','随风潜入夜，润物细无声','春风又绿江南岸，明月何时照我还','野火烧不尽，春风吹又生']), correct: '竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生', type: 'judge', diff: 5, title: '飞花令·风', author: '苏轼', dynasty: '宋', theme: '飞花令', explanation: '飞花令中含"风"字（烟雨任平生中虽无风字，但此题考察的是苏轼的词），一蓑烟雨任平生出自苏轼《定风波》。' },
  { poetId: liQId, content: '飞花令·花：以下哪句含"花"字且出自李清照？', options: JSON.stringify(['花自飘零水自流，一种相思，两处闲愁','感时花溅泪，恨别鸟惊心','人面不知何处去，桃花依旧笑春风','落红不是无情物，化作春泥更护花']), correct: '花自飘零水自流，一种相思，两处闲愁', type: 'judge', diff: 5, title: '飞花令·花', author: '李清照', dynasty: '宋', theme: '飞花令', explanation: '飞花令中含"花"字，花自飘零水自流出自李清照《一剪梅》。' },
  { poetId: xinId, content: '飞花令·酒：以下哪句含"酒"字且出自辛弃疾？', options: JSON.stringify(['醉里挑灯看剑，梦回吹角连营','劝君更尽一杯酒，西出阳关无故人','明月几时有？把酒问青天','葡萄美酒夜光杯，欲饮琵琶马上催']), correct: '醉里挑灯看剑，梦回吹角连营', type: 'judge', diff: 5, title: '飞花令·酒', author: '辛弃疾', dynasty: '宋', theme: '飞花令', explanation: '飞花令中含"酒"字（醉即醉酒），醉里挑灯看剑出自辛弃疾《破阵子》。' },
  { poetId: liId, content: '以下哪首诗不是李白所作？', options: JSON.stringify(['静夜思','将进酒','春望','望庐山瀑布']), correct: '春望', type: 'judge', diff: 5, title: '诗人辨别', author: '李白', dynasty: '唐', theme: '综合', explanation: '《春望》是杜甫所作，不是李白的诗。' },
  { poetId: suId, content: '苏轼的词风主要是？', options: JSON.stringify(['豪放派','婉约派','边塞派','田园派']), correct: '豪放派', type: 'judge', diff: 5, title: '词派知识', author: '苏轼', dynasty: '宋', theme: '综合', explanation: '苏轼是豪放词派的代表人物，与辛弃疾并称"苏辛"。' },
  { poetId: liQId, content: '李清照的词风主要是？', options: JSON.stringify(['婉约派','豪放派','边塞派','山水派']), correct: '婉约派', type: 'judge', diff: 5, title: '词派知识', author: '李清照', dynasty: '宋', theme: '综合', explanation: '李清照是婉约词派的代表人物，被誉为"千古第一才女"。' },
  { poetId: duId, content: '被称为"诗圣"的诗人是？', options: JSON.stringify(['杜甫','李白','王维','白居易']), correct: '杜甫', type: 'judge', diff: 5, title: '诗人称号', author: '杜甫', dynasty: '唐', theme: '综合', explanation: '杜甫被称为"诗圣"，李白被称为"诗仙"，王维被称为"诗佛"。' },
  { poetId: liId, content: '被称为"诗仙"的诗人是？', options: JSON.stringify(['李白','杜甫','王维','苏轼']), correct: '李白', type: 'judge', diff: 5, title: '诗人称号', author: '李白', dynasty: '唐', theme: '综合', explanation: '李白被称为"诗仙"，因其诗歌充满浪漫主义色彩。' },
  { poetId: wangId, content: '被称为"诗佛"的诗人是？', options: JSON.stringify(['王维','李白','杜甫','陶渊明']), correct: '王维', type: 'judge', diff: 5, title: '诗人称号', author: '王维', dynasty: '唐', theme: '综合', explanation: '王维被称为"诗佛"，因其诗歌充满禅意，苏轼评价"诗中有画，画中有诗"。' },
];

console.log(`Inserting ${questions.length} questions...`);
for (const q of questions) {
  await conn.execute(
    `INSERT INTO questions (poetId, content, options, correctAnswer, questionType, difficulty, sourcePoemTitle, sourcePoemAuthor, dynasty, themeTag, explanation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [q.poetId, q.content, q.options, q.correct, q.type, q.diff, q.title, q.author, q.dynasty, q.theme, q.explanation]
  );
}
console.log('Questions inserted!');

// ─── 4. 每日任务配置 ──────────────────────────────────────────────────────────
const tasks = [
  { key: 'daily_login', name: '每日签到', desc: '每天登录游戏领取奖励', score: 5, hints: 0, ink: 5, target: 1, emoji: '📅' },
  { key: 'answer_3', name: '每日答题', desc: '今日完成3道题目', score: 30, hints: 1, ink: 0, target: 3, emoji: '📝' },
  { key: 'win_streak_2', name: '连胜挑战', desc: '连续答对2题', score: 50, hints: 0, ink: 0, target: 2, emoji: '🔥' },
  { key: 'share_result', name: '分享本命', desc: '分享你的本命诗人结果', score: 20, hints: 0, ink: 3, target: 1, emoji: '🌟' },
  { key: 'login_7days', name: '七日连签', desc: '连续登录7天', score: 100, hints: 2, ink: 10, target: 7, emoji: '🏆' },
];

console.log('Inserting daily task configs...');
for (const t of tasks) {
  await conn.execute(
    `INSERT IGNORE INTO dailyTaskConfigs (taskKey, taskName, description, rewardScore, rewardHints, rewardInk, targetCount, iconEmoji)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [t.key, t.name, t.desc, t.score, t.hints, t.ink, t.target, t.emoji]
  );
}
console.log('Daily task configs inserted!');

await conn.end();
console.log('\n✅ All seed data inserted successfully!');
