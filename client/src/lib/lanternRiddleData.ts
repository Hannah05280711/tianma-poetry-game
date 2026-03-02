/**
 * 元宵节灯谜数据库
 * 包含：诗词灯谜、传统文字灯谜、诗人灯谜
 */

export interface LanternRiddle {
  id: number;
  riddle: string;       // 谜面
  hint?: string;        // 提示（可选）
  answer: string;       // 谜底
  type: "poetry" | "word" | "poet" | "classic"; // 类型
  difficulty: 1 | 2 | 3; // 难度：1简单 2中等 3困难
  explanation: string;  // 解析
  options: string[];    // 四个选项（含正确答案）
}

export const LANTERN_RIDDLES: LanternRiddle[] = [
  // ===== 诗词灯谜（谜面是诗句，谜底是诗词相关） =====
  {
    id: 1,
    riddle: "举头望明月，低头思故乡",
    hint: "猜一字",
    answer: "思",
    type: "poetry",
    difficulty: 1,
    explanation: "「举头望明月」在上，「低头思故乡」在下，上下合为「思」字——上面是「田」（月圆如田），下面是「心」（思念之心）。",
    options: ["思", "望", "月", "乡"],
  },
  {
    id: 2,
    riddle: "床前明月光，疑是地上霜",
    hint: "猜一字",
    answer: "霜",
    type: "poetry",
    difficulty: 1,
    explanation: "「疑是地上霜」——谜底就藏在诗句末尾，「霜」字既是诗中意象，也是谜底。",
    options: ["霜", "光", "月", "床"],
  },
  {
    id: 3,
    riddle: "春眠不觉晓，处处闻啼鸟",
    hint: "猜一节气",
    answer: "春分",
    type: "poetry",
    difficulty: 2,
    explanation: "「春眠不觉晓」描述春天昼长夜短，「处处闻啼鸟」是春分时节鸟鸣四起的景象，对应节气「春分」。",
    options: ["春分", "立春", "谷雨", "清明"],
  },
  {
    id: 4,
    riddle: "独在异乡为异客，每逢佳节倍思亲",
    hint: "猜一传统节日",
    answer: "重阳节",
    type: "poetry",
    difficulty: 1,
    explanation: "王维《九月九日忆山东兄弟》，「九月九日」即重阳节，这首诗是重阳节最著名的诗篇。",
    options: ["重阳节", "中秋节", "春节", "清明节"],
  },
  {
    id: 5,
    riddle: "遥知兄弟登高处，遍插茱萸少一人",
    hint: "猜一习俗",
    answer: "登高插茱萸",
    type: "poetry",
    difficulty: 2,
    explanation: "重阳节有登高、插茱萸的习俗，王维此诗描写的正是这一传统。",
    options: ["登高插茱萸", "赏月吃月饼", "包粽子赛龙舟", "贴春联放鞭炮"],
  },
  {
    id: 6,
    riddle: "东风夜放花千树，更吹落，星如雨",
    hint: "猜一节日",
    answer: "元宵节",
    type: "poetry",
    difficulty: 1,
    explanation: "辛弃疾《青玉案·元夕》，描写的正是元宵节夜晚烟花灯火的盛景。",
    options: ["元宵节", "中秋节", "春节", "上元节"],
  },
  {
    id: 7,
    riddle: "去年元夜时，花市灯如昼",
    hint: "猜一活动",
    answer: "赏花灯",
    type: "poetry",
    difficulty: 1,
    explanation: "欧阳修《生查子·元夕》，「花市灯如昼」描写的是元宵节花灯市场灯火通明的赏灯盛况。",
    options: ["赏花灯", "猜灯谜", "放烟花", "舞龙舞狮"],
  },
  {
    id: 8,
    riddle: "众里寻他千百度，蓦然回首，那人却在灯火阑珊处",
    hint: "猜一字",
    answer: "觅",
    type: "poetry",
    difficulty: 3,
    explanation: "「众里寻他千百度」意为苦苦寻找，「觅」字有寻找之意，且「觅」字拆开有「爪」「见」，寻找而后相见。",
    options: ["觅", "寻", "望", "找"],
  },
  {
    id: 9,
    riddle: "春色满园关不住，一枝红杏出墙来",
    hint: "猜一成语",
    answer: "春意盎然",
    type: "poetry",
    difficulty: 2,
    explanation: "叶绍翁《游园不值》，「春色满园」「一枝红杏」描绘春意盎然、生机勃勃的景象。",
    options: ["春意盎然", "春暖花开", "春风得意", "春光明媚"],
  },
  {
    id: 10,
    riddle: "野火烧不尽，春风吹又生",
    hint: "猜一植物",
    answer: "草",
    type: "poetry",
    difficulty: 1,
    explanation: "白居易《赋得古原草送别》，「野火烧不尽，春风吹又生」描写的正是草的顽强生命力。",
    options: ["草", "树", "花", "竹"],
  },

  // ===== 传统文字灯谜 =====
  {
    id: 11,
    riddle: "一口咬掉牛尾巴",
    hint: "猜一字",
    answer: "告",
    type: "word",
    difficulty: 1,
    explanation: "「牛」字去掉下面的「尾」（一横），再加「口」，组成「告」字。",
    options: ["告", "牛", "口", "吉"],
  },
  {
    id: 12,
    riddle: "左边绿，右边红，左右相遇起凉风",
    hint: "猜一字",
    answer: "秋",
    type: "word",
    difficulty: 1,
    explanation: "「左边绿」是「禾」（庄稼），「右边红」是「火」，合在一起是「秋」字，秋天凉风习习。",
    options: ["秋", "春", "夏", "冬"],
  },
  {
    id: 13,
    riddle: "千里相逢",
    hint: "猜一字",
    answer: "重",
    type: "word",
    difficulty: 2,
    explanation: "「千」「里」合在一起组成「重」字（千+里=重），且「重」有「重逢」之意。",
    options: ["重", "里", "千", "逢"],
  },
  {
    id: 14,
    riddle: "有心走不快，见水也不喝",
    hint: "猜一字",
    answer: "忙",
    type: "word",
    difficulty: 2,
    explanation: "「有心」是「忄」（心字旁），「走不快」暗示「亡」（亡命奔走），「忄」+「亡」=「忙」，忙碌时无暇喝水。",
    options: ["忙", "慌", "忆", "怀"],
  },
  {
    id: 15,
    riddle: "七十二小时",
    hint: "猜一字",
    answer: "晶",
    type: "word",
    difficulty: 2,
    explanation: "七十二小时 = 三天，三个「日」（天）叠在一起，就是「晶」字。",
    options: ["晶", "明", "昌", "品"],
  },
  {
    id: 16,
    riddle: "上不在上，下不在下，不可左右，中间安家",
    hint: "猜一字",
    answer: "中",
    type: "word",
    difficulty: 1,
    explanation: "谜面描述的位置特征——既不在上下，也不在左右，只在中间，谜底就是「中」字。",
    options: ["中", "心", "内", "里"],
  },
  {
    id: 17,
    riddle: "一人腰中挂弓箭",
    hint: "猜一字",
    answer: "夷",
    type: "word",
    difficulty: 3,
    explanation: "「大」（一人张开双臂）加「弓」（腰中挂弓），「大」字中间插入「弓」，组成「夷」字。",
    options: ["夷", "射", "弓", "矢"],
  },
  {
    id: 18,
    riddle: "画时圆，写时方，冬时短，夏时长",
    hint: "猜一字",
    answer: "日",
    type: "word",
    difficulty: 1,
    explanation: "「日」字画时是圆（太阳是圆的），写时是方（汉字方块），冬天白昼短，夏天白昼长，正是「日」。",
    options: ["日", "月", "年", "时"],
  },
  {
    id: 19,
    riddle: "有水能养鱼虾，有土能种庄稼，有人不是你我，有马走遍天下",
    hint: "猜一字",
    answer: "也",
    type: "word",
    difficulty: 2,
    explanation: "「也」字加水旁是「池」（养鱼虾），加土旁是「地」（种庄稼），加人旁是「他」（不是你我），加马旁是「驰」（走遍天下）。",
    options: ["也", "之", "乃", "于"],
  },
  {
    id: 20,
    riddle: "说它是牛不是牛，背着房子四处游，有时出来晒太阳，有时躲进房里头",
    hint: "猜一动物",
    answer: "蜗牛",
    type: "word",
    difficulty: 1,
    explanation: "蜗牛背着壳（房子）四处爬行，有时伸出头来，有时缩回壳里，谜底是「蜗牛」。",
    options: ["蜗牛", "乌龟", "螃蟹", "贝壳"],
  },

  // ===== 诗人灯谜 =====
  {
    id: 21,
    riddle: "诗仙，字太白，号青莲居士",
    hint: "猜一诗人",
    answer: "李白",
    type: "poet",
    difficulty: 1,
    explanation: "李白，字太白，号青莲居士，唐代伟大的浪漫主义诗人，被称为「诗仙」。",
    options: ["李白", "杜甫", "王维", "孟浩然"],
  },
  {
    id: 22,
    riddle: "诗圣，忧国忧民，「安得广厦千万间，大庇天下寒士俱欢颜」",
    hint: "猜一诗人",
    answer: "杜甫",
    type: "poet",
    difficulty: 1,
    explanation: "杜甫，字子美，号少陵野老，唐代伟大的现实主义诗人，被称为「诗圣」，此句出自《茅屋为秋风所破歌》。",
    options: ["杜甫", "李白", "白居易", "韩愈"],
  },
  {
    id: 23,
    riddle: "「明月松间照，清泉石上流」，诗中有画，画中有诗",
    hint: "猜一诗人",
    answer: "王维",
    type: "poet",
    difficulty: 1,
    explanation: "王维，字摩诘，唐代著名诗人、画家，苏轼称赞其「诗中有画，画中有诗」，此句出自《山居秋暝》。",
    options: ["王维", "孟浩然", "柳宗元", "韦应物"],
  },
  {
    id: 24,
    riddle: "「大江东去，浪淘尽，千古风流人物」，豪放词派代表",
    hint: "猜一诗人",
    answer: "苏轼",
    type: "poet",
    difficulty: 1,
    explanation: "苏轼，字子瞻，号东坡居士，北宋文学家，豪放词派代表，此句出自《念奴娇·赤壁怀古》。",
    options: ["苏轼", "辛弃疾", "柳永", "欧阳修"],
  },
  {
    id: 25,
    riddle: "「知否知否，应是绿肥红瘦」，婉约词派女词人",
    hint: "猜一诗人",
    answer: "李清照",
    type: "poet",
    difficulty: 1,
    explanation: "李清照，号易安居士，宋代著名女词人，婉约词派代表，此句出自《如梦令》。",
    options: ["李清照", "朱淑真", "花蕊夫人", "薛涛"],
  },
  {
    id: 26,
    riddle: "「醉里挑灯看剑，梦回吹角连营」，爱国词人",
    hint: "猜一诗人",
    answer: "辛弃疾",
    type: "poet",
    difficulty: 1,
    explanation: "辛弃疾，字幼安，号稼轩，南宋爱国词人，豪放派代表，此句出自《破阵子》。",
    options: ["辛弃疾", "陆游", "岳飞", "文天祥"],
  },
  {
    id: 27,
    riddle: "「采菊东篱下，悠然见南山」，归隐田园第一人",
    hint: "猜一诗人",
    answer: "陶渊明",
    type: "poet",
    difficulty: 1,
    explanation: "陶渊明，字元亮，号五柳先生，东晋著名诗人，田园诗派创始人，此句出自《饮酒·其五》。",
    options: ["陶渊明", "谢灵运", "王维", "孟浩然"],
  },
  {
    id: 28,
    riddle: "「路漫漫其修远兮，吾将上下而求索」，楚辞之父",
    hint: "猜一诗人",
    answer: "屈原",
    type: "poet",
    difficulty: 1,
    explanation: "屈原，战国时期楚国诗人，中国文学史上第一位留名的伟大诗人，此句出自《离骚》。",
    options: ["屈原", "宋玉", "贾谊", "庄周"],
  },

  // ===== 经典灯谜 =====
  {
    id: 29,
    riddle: "元宵节前后，猜灯谜的习俗始于哪个朝代？",
    hint: "猜一朝代",
    answer: "汉代",
    type: "classic",
    difficulty: 2,
    explanation: "元宵节猜灯谜的习俗起源于汉代，当时称为「隐语」，后在宋代正式与花灯结合，成为「灯谜」。",
    options: ["汉代", "唐代", "宋代", "明代"],
  },
  {
    id: 30,
    riddle: "元宵节又称「上元节」，「上元」指的是农历哪一天？",
    hint: "猜一日期",
    answer: "正月十五",
    type: "classic",
    difficulty: 1,
    explanation: "农历正月十五是元宵节，又称上元节、小正月、元夕或灯节，是中国传统节日之一。",
    options: ["正月十五", "正月初一", "正月初七", "正月二十"],
  },
  {
    id: 31,
    riddle: "「火树银花合，星桥铁锁开」描写的是哪个节日的夜晚？",
    hint: "猜一节日",
    answer: "元宵节",
    type: "classic",
    difficulty: 1,
    explanation: "苏味道《正月十五夜》，「火树银花」描写元宵节灯火辉煌的盛景，「星桥铁锁开」指夜间开放城门，供百姓赏灯。",
    options: ["元宵节", "中秋节", "春节", "上巳节"],
  },
  {
    id: 32,
    riddle: "元宵节吃汤圆，寓意什么？",
    hint: "猜一寓意",
    answer: "团圆美满",
    type: "classic",
    difficulty: 1,
    explanation: "汤圆圆润饱满，象征家人团圆、生活美满，元宵节吃汤圆寄托了人们对团圆幸福的美好愿望。",
    options: ["团圆美满", "吉祥如意", "健康长寿", "财源广进"],
  },
  {
    id: 33,
    riddle: "「月上柳梢头，人约黄昏后」出自哪首词？",
    hint: "猜一词牌名+作者",
    answer: "《生查子·元夕》欧阳修",
    type: "classic",
    difficulty: 2,
    explanation: "此句出自北宋欧阳修的《生查子·元夕》，描写元宵节夜晚男女相约的浪漫情景，是元宵节词中的名篇。",
    options: ["《生查子·元夕》欧阳修", "《青玉案·元夕》辛弃疾", "《元夕》文天祥", "《上元竹枝词》符曾"],
  },
  {
    id: 34,
    riddle: "「宝马雕车香满路，凤箫声动，玉壶光转，一夜鱼龙舞」出自？",
    hint: "猜一词牌名+作者",
    answer: "《青玉案·元夕》辛弃疾",
    type: "classic",
    difficulty: 2,
    explanation: "此句出自南宋辛弃疾的《青玉案·元夕》，描写元宵节夜晚热闹非凡的盛况，是元宵节最著名的词作之一。",
    options: ["《青玉案·元夕》辛弃疾", "《生查子·元夕》欧阳修", "《元宵》唐寅", "《正月十五夜》苏味道"],
  },
  {
    id: 35,
    riddle: "元宵节舞龙灯的习俗，龙象征什么？",
    hint: "猜一象征含义",
    answer: "吉祥如意、风调雨顺",
    type: "classic",
    difficulty: 1,
    explanation: "龙在中国文化中是吉祥的象征，元宵节舞龙灯寓意祈求新年风调雨顺、国泰民安、吉祥如意。",
    options: ["吉祥如意、风调雨顺", "驱邪避鬼、平安健康", "财源广进、富贵荣华", "子孙繁盛、家族兴旺"],
  },
  {
    id: 36,
    riddle: "猜灯谜时，将谜底贴在灯上叫做什么？",
    hint: "猜一专业术语",
    answer: "打灯谜",
    type: "classic",
    difficulty: 2,
    explanation: "元宵节猜灯谜又叫「打灯谜」，是将谜语写在纸条上贴在花灯上，供游人猜射，猜中者可获奖品。",
    options: ["打灯谜", "射覆", "猜谜", "隐语"],
  },
  {
    id: 37,
    riddle: "「春到人间人似玉，灯烧月下月如银」描写的是哪个节日？",
    hint: "猜一节日",
    answer: "元宵节",
    type: "classic",
    difficulty: 2,
    explanation: "唐寅《元宵》中的诗句，「灯烧月下」描写元宵节花灯与月亮交相辉映的美景。",
    options: ["元宵节", "中秋节", "春节", "上巳节"],
  },
  {
    id: 38,
    riddle: "元宵节放天灯（孔明灯）的习俗，天灯上升寓意什么？",
    hint: "猜一寓意",
    answer: "愿望随灯升天，祈福许愿",
    type: "classic",
    difficulty: 1,
    explanation: "放天灯时，人们将愿望写在灯上，随着天灯冉冉升起，寓意愿望能传达上天，祈求新年诸事顺遂。",
    options: ["愿望随灯升天，祈福许愿", "驱除黑暗，迎接光明", "纪念诸葛亮发明孔明灯", "照亮归路，指引方向"],
  },
  {
    id: 39,
    riddle: "「接汉疑星落，依楼似月悬」中的「汉」指的是什么？",
    hint: "猜一意象",
    answer: "银河（天汉）",
    type: "classic",
    difficulty: 3,
    explanation: "卢照邻《十五夜观灯》，「接汉」即与银河相接，「疑星落」形容灯火繁多如星星落下，描写元宵节灯火与银河相接的壮观景象。",
    options: ["银河（天汉）", "汉朝", "汉水", "汉族"],
  },
  {
    id: 40,
    riddle: "「有灯无月不娱人，有月无灯不算春，春到人间人似玉」，这首诗的作者是？",
    hint: "猜一诗人",
    answer: "唐寅",
    type: "classic",
    difficulty: 2,
    explanation: "此诗出自明代才子唐寅（唐伯虎）的《元宵》，描写元宵节灯与月相映成趣的美景。",
    options: ["唐寅", "文征明", "祝允明", "徐祯卿"],
  },
];

/** 按难度分组获取灯谜 */
export function getRiddlesByDifficulty(difficulty: 1 | 2 | 3): LanternRiddle[] {
  return LANTERN_RIDDLES.filter(r => r.difficulty === difficulty);
}

/** 获取随机灯谜（指定数量，可按类型过滤） */
export function getRandomRiddles(count: number, type?: LanternRiddle["type"]): LanternRiddle[] {
  let pool = type ? LANTERN_RIDDLES.filter(r => r.type === type) : [...LANTERN_RIDDLES];
  // 打乱顺序
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, count);
}

/** 获取元宵节专题灯谜（混合各类型，共10题） */
export function getLanternFestivalRiddles(): LanternRiddle[] {
  // 各类型各取若干
  const poetry = getRandomRiddles(3, "poetry");
  const word = getRandomRiddles(3, "word");
  const poet = getRandomRiddles(2, "poet");
  const classic = getRandomRiddles(2, "classic");
  const all = [...poetry, ...word, ...poet, ...classic];
  // 再次打乱
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j]!, all[i]!];
  }
  return all;
}

/** 元宵节是否在今天或最近3天内 */
export function isLanternFestivalSeason(): boolean {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  // 2026年元宵节：2月22日（农历正月十五）
  // 通用：农历正月十五前后3天（公历2月中旬左右）
  // 简化判断：2月12日-2月25日 或 1月30日-2月10日（春节后两周）
  if (month === 2 && day >= 12 && day <= 25) return true;
  if (month === 2 && day >= 1 && day <= 11) return true;
  if (month === 1 && day >= 28) return true;
  return false;
}

/** 元宵节彩蛋是否应该显示（正月十五当天或前后各2天） */
export function shouldShowLanternEgg(): boolean {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  // 2026年元宵节：2月22日
  if (month === 2 && day >= 20 && day <= 24) return true;
  return false;
}
