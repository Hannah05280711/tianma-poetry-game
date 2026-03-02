/**
 * 中国传统日历数据库
 * 包含：24节气、传统节日（公历+农历）、诗人生日/纪念日
 * 每个条目配有对应的欢迎诗词和主题标签
 */

export interface CalendarEvent {
  type: "jieqi" | "festival" | "poet_birthday" | "poet_memorial";
  name: string;
  emoji: string;
  /** 诗词引用 */
  poem: string;
  poemAuthor: string;
  /** 副标题/说明 */
  subtitle: string;
  /** 答题主题标签（用于筛选相关题目） */
  themeTag: string;
  /** 主色调 */
  color: string;
  /** 背景渐变 */
  bgGradient: string;
}

// ============================================================
// 24节气（公历日期，每年略有偏差，取常见日期）
// ============================================================
const JIEQI_LIST: Array<{ month: number; day: number; event: CalendarEvent }> = [
  {
    month: 1, day: 5,
    event: {
      type: "jieqi", name: "小寒", emoji: "❄️",
      poem: "小寒时节，梅花独自开。",
      poemAuthor: "节气",
      subtitle: "一候雁北乡，二候鹊始巢，三候雉始鸲",
      themeTag: "冬",
      color: "#4A90D9",
      bgGradient: "linear-gradient(135deg, #E8F4FD 0%, #F0F8FF 100%)",
    },
  },
  {
    month: 1, day: 20,
    event: {
      type: "jieqi", name: "大寒", emoji: "🌨️",
      poem: "大寒岁底庆团圆，腊梅香里辞旧年。",
      poemAuthor: "节气",
      subtitle: "一候鸡乳，二候征鸟厉疾，三候水泽腹坚",
      themeTag: "冬",
      color: "#5B6EAE",
      bgGradient: "linear-gradient(135deg, #EEF0FF 0%, #F5F0FF 100%)",
    },
  },
  {
    month: 2, day: 4,
    event: {
      type: "jieqi", name: "立春", emoji: "🌱",
      poem: "春回大地千山秀，日暖神州万木荣。",
      poemAuthor: "节气",
      subtitle: "一候东风解冻，二候蛰虫始振，三候鱼陟负冰",
      themeTag: "春",
      color: "#52C41A",
      bgGradient: "linear-gradient(135deg, #F6FFED 0%, #FFFBE6 100%)",
    },
  },
  {
    month: 2, day: 19,
    event: {
      type: "jieqi", name: "雨水", emoji: "🌧️",
      poem: "好雨知时节，当春乃发生。随风潜入夜，润物细无声。",
      poemAuthor: "杜甫",
      subtitle: "一候獭祭鱼，二候鸿雁来，三候草木萌动",
      themeTag: "春雨",
      color: "#1890FF",
      bgGradient: "linear-gradient(135deg, #E6F7FF 0%, #F0F5FF 100%)",
    },
  },
  {
    month: 3, day: 6,
    event: {
      type: "jieqi", name: "惊蛰", emoji: "⚡",
      poem: "微雨众卉新，一雷惊蛰始。田家几日闲，耕种从此起。",
      poemAuthor: "韦应物",
      subtitle: "一候桃始华，二候仓庚鸣，三候鹰化为鸠",
      themeTag: "春",
      color: "#FA8C16",
      bgGradient: "linear-gradient(135deg, #FFF7E6 0%, #FFFBE6 100%)",
    },
  },
  {
    month: 3, day: 21,
    event: {
      type: "jieqi", name: "春分", emoji: "🌸",
      poem: "春分雨脚落声微，柳岸斜风带客归。",
      poemAuthor: "徐铉",
      subtitle: "昼夜平分，万物生长",
      themeTag: "春",
      color: "#EB2F96",
      bgGradient: "linear-gradient(135deg, #FFF0F6 0%, #FFF5F5 100%)",
    },
  },
  {
    month: 4, day: 5,
    event: {
      type: "jieqi", name: "清明", emoji: "🌿",
      poem: "清明时节雨纷纷，路上行人欲断魂。借问酒家何处有，牧童遥指杏花村。",
      poemAuthor: "杜牧",
      subtitle: "一候桐始华，二候田鼠化为鹌，三候虹始见",
      themeTag: "清明",
      color: "#389E0D",
      bgGradient: "linear-gradient(135deg, #F6FFED 0%, #FCFFE6 100%)",
    },
  },
  {
    month: 4, day: 20,
    event: {
      type: "jieqi", name: "谷雨", emoji: "🌾",
      poem: "谷雨如丝复似尘，煮瓶浮蜡正尝新。",
      poemAuthor: "陆游",
      subtitle: "一候萍始生，二候鸣鸠拂其羽，三候戴胜降于桑",
      themeTag: "春",
      color: "#7CB305",
      bgGradient: "linear-gradient(135deg, #FCFFE6 0%, #F6FFED 100%)",
    },
  },
  {
    month: 5, day: 6,
    event: {
      type: "jieqi", name: "立夏", emoji: "☀️",
      poem: "绿树阴浓夏日长，楼台倒影入池塘。水晶帘动微风起，满架蔷薇一院香。",
      poemAuthor: "高骈",
      subtitle: "一候蝼蝈鸣，二候蚯蚓出，三候王瓜生",
      themeTag: "夏",
      color: "#FA541C",
      bgGradient: "linear-gradient(135deg, #FFF2E8 0%, #FFF7E6 100%)",
    },
  },
  {
    month: 5, day: 21,
    event: {
      type: "jieqi", name: "小满", emoji: "🌻",
      poem: "小满田塍细麦黄，夏初风物正芬芳。",
      poemAuthor: "欧阳修",
      subtitle: "一候苦菜秀，二候靡草死，三候麦秋至",
      themeTag: "夏",
      color: "#D4B106",
      bgGradient: "linear-gradient(135deg, #FFFBE6 0%, #FFF7E6 100%)",
    },
  },
  {
    month: 6, day: 6,
    event: {
      type: "jieqi", name: "芒种", emoji: "🌾",
      poem: "芒种看今日，螳螂应节生。彤云高下影，鴃鸟往来声。",
      poemAuthor: "元稹",
      subtitle: "一候螳螂生，二候鵙始鸣，三候反舌无声",
      themeTag: "夏",
      color: "#389E0D",
      bgGradient: "linear-gradient(135deg, #F6FFED 0%, #FFFBE6 100%)",
    },
  },
  {
    month: 6, day: 21,
    event: {
      type: "jieqi", name: "夏至", emoji: "🌞",
      poem: "昼晷已云极，宵漏自此长。未及施政教，所忧变炎凉。",
      poemAuthor: "韦应物",
      subtitle: "白昼最长，阳气最盛",
      themeTag: "夏",
      color: "#FA8C16",
      bgGradient: "linear-gradient(135deg, #FFF7E6 0%, #FFF2E8 100%)",
    },
  },
  {
    month: 7, day: 7,
    event: {
      type: "jieqi", name: "小暑", emoji: "🔥",
      poem: "倏忽温风至，因循小暑来。竹喧先觉雨，山暗已闻雷。",
      poemAuthor: "元稹",
      subtitle: "一候温风至，二候蟋蟀居宇，三候鹰始鸷",
      themeTag: "夏",
      color: "#CF1322",
      bgGradient: "linear-gradient(135deg, #FFF1F0 0%, #FFF7E6 100%)",
    },
  },
  {
    month: 7, day: 23,
    event: {
      type: "jieqi", name: "大暑", emoji: "☀️",
      poem: "大暑三秋近，林钟九夏移。桂轮开子夜，萤火照空时。",
      poemAuthor: "元稹",
      subtitle: "一候腐草为萤，二候土润溽暑，三候大雨时行",
      themeTag: "夏",
      color: "#D4380D",
      bgGradient: "linear-gradient(135deg, #FFF2E8 0%, #FFF1F0 100%)",
    },
  },
  {
    month: 8, day: 7,
    event: {
      type: "jieqi", name: "立秋", emoji: "🍂",
      poem: "乳鸦啼散玉屏空，一枕新凉一扇风。睡起秋声无觅处，满阶梧叶月明中。",
      poemAuthor: "刘翰",
      subtitle: "一候凉风至，二候白露降，三候寒蝉鸣",
      themeTag: "秋",
      color: "#D46B08",
      bgGradient: "linear-gradient(135deg, #FFF7E6 0%, #FFF2E8 100%)",
    },
  },
  {
    month: 8, day: 23,
    event: {
      type: "jieqi", name: "处暑", emoji: "🌤️",
      poem: "离离暑云散，袅袅凉风起。池上秋又来，荷花半成子。",
      poemAuthor: "白居易",
      subtitle: "一候鹰乃祭鸟，二候天地始肃，三候禾乃登",
      themeTag: "秋",
      color: "#FA8C16",
      bgGradient: "linear-gradient(135deg, #FFF7E6 0%, #F6FFED 100%)",
    },
  },
  {
    month: 9, day: 8,
    event: {
      type: "jieqi", name: "白露", emoji: "💧",
      poem: "蒹葭苍苍，白露为霜。所谓伊人，在水一方。",
      poemAuthor: "《诗经》",
      subtitle: "一候鸿雁来，二候玄鸟归，三候群鸟养羞",
      themeTag: "秋",
      color: "#096DD9",
      bgGradient: "linear-gradient(135deg, #E6F7FF 0%, #F0F5FF 100%)",
    },
  },
  {
    month: 9, day: 23,
    event: {
      type: "jieqi", name: "秋分", emoji: "🌕",
      poem: "碧云天，黄叶地，秋色连波，波上寒烟翠。",
      poemAuthor: "范仲淹",
      subtitle: "昼夜再次平分，秋意正浓",
      themeTag: "秋",
      color: "#D46B08",
      bgGradient: "linear-gradient(135deg, #FFF7E6 0%, #FFFBE6 100%)",
    },
  },
  {
    month: 10, day: 8,
    event: {
      type: "jieqi", name: "寒露", emoji: "🍁",
      poem: "袅袅凉风动，凄凄寒露零。兰衰花始白，荷破叶犹青。",
      poemAuthor: "白居易",
      subtitle: "一候鸿雁来宾，二候雀入大水为蛤，三候菊有黄华",
      themeTag: "秋",
      color: "#7B3F00",
      bgGradient: "linear-gradient(135deg, #FFF7E6 0%, #FFF2E8 100%)",
    },
  },
  {
    month: 10, day: 23,
    event: {
      type: "jieqi", name: "霜降", emoji: "🌫️",
      poem: "停车坐爱枫林晚，霜叶红于二月花。",
      poemAuthor: "杜牧",
      subtitle: "一候豺乃祭兽，二候草木黄落，三候蛰虫咸俯",
      themeTag: "秋",
      color: "#CF1322",
      bgGradient: "linear-gradient(135deg, #FFF1F0 0%, #FFF7E6 100%)",
    },
  },
  {
    month: 11, day: 7,
    event: {
      type: "jieqi", name: "立冬", emoji: "🍃",
      poem: "冻笔新诗懒写，寒炉美酒时温。醉看墨花月白，恍疑雪满前村。",
      poemAuthor: "李白",
      subtitle: "一候水始冰，二候地始冻，三候雉入大水为蜃",
      themeTag: "冬",
      color: "#4A90D9",
      bgGradient: "linear-gradient(135deg, #E8F4FD 0%, #F0F5FF 100%)",
    },
  },
  {
    month: 11, day: 22,
    event: {
      type: "jieqi", name: "小雪", emoji: "❄️",
      poem: "已讶衾枕冷，复见窗户明。夜深知雪重，时闻折竹声。",
      poemAuthor: "白居易",
      subtitle: "一候虹藏不见，二候天气上升，三候闭塞成冬",
      themeTag: "冬",
      color: "#5B6EAE",
      bgGradient: "linear-gradient(135deg, #EEF0FF 0%, #E8F4FD 100%)",
    },
  },
  {
    month: 12, day: 7,
    event: {
      type: "jieqi", name: "大雪", emoji: "🌨️",
      poem: "忽如一夜春风来，千树万树梨花开。",
      poemAuthor: "岑参",
      subtitle: "一候鹖鴠不鸣，二候虎始交，三候荔挺出",
      themeTag: "冬雪",
      color: "#1D39C4",
      bgGradient: "linear-gradient(135deg, #F0F5FF 0%, #EEF0FF 100%)",
    },
  },
  {
    month: 12, day: 22,
    event: {
      type: "jieqi", name: "冬至", emoji: "🌙",
      poem: "天时人事日相催，冬至阳生春又来。刺绣五纹添弱线，吹葭六管动飞灰。",
      poemAuthor: "杜甫",
      subtitle: "白昼最短，阴极阳生",
      themeTag: "冬",
      color: "#1D39C4",
      bgGradient: "linear-gradient(135deg, #F0F5FF 0%, #EEF0FF 100%)",
    },
  },
];

// ============================================================
// 传统节日（公历固定日期）
// ============================================================
const SOLAR_FESTIVALS: Array<{ month: number; day: number; event: CalendarEvent }> = [
  {
    month: 1, day: 1,
    event: {
      type: "festival", name: "元旦", emoji: "🎊",
      poem: "爆竹声中一岁除，春风送暖入屠苏。千门万户曈曈日，总把新桃换旧符。",
      poemAuthor: "王安石",
      subtitle: "辞旧迎新，万象更新",
      themeTag: "新年",
      color: "#CF1322",
      bgGradient: "linear-gradient(135deg, #FFF1F0 0%, #FFF7E6 100%)",
    },
  },
  {
    month: 3, day: 8,
    event: {
      type: "festival", name: "妇女节", emoji: "🌸",
      poem: "生当作人杰，死亦为鬼雄。至今思项羽，不肯过江东。",
      poemAuthor: "李清照",
      subtitle: "巾帼不让须眉，致敬天下女性",
      themeTag: "李清照",
      color: "#EB2F96",
      bgGradient: "linear-gradient(135deg, #FFF0F6 0%, #FFF5F5 100%)",
    },
  },
  {
    month: 9, day: 9,
    event: {
      type: "festival", name: "重阳节", emoji: "🌼",
      poem: "独在异乡为异客，每逢佳节倍思亲。遥知兄弟登高处，遍插茱萸少一人。",
      poemAuthor: "王维",
      subtitle: "登高望远，思亲怀远",
      themeTag: "重阳",
      color: "#D46B08",
      bgGradient: "linear-gradient(135deg, #FFF7E6 0%, #FFFBE6 100%)",
    },
  },
  {
    month: 10, day: 1,
    event: {
      type: "festival", name: "国庆节", emoji: "🇨🇳",
      poem: "祖国啊，我亲爱的祖国。",
      poemAuthor: "舒婷",
      subtitle: "山河锦绣，盛世华章",
      themeTag: "家国",
      color: "#CF1322",
      bgGradient: "linear-gradient(135deg, #FFF1F0 0%, #FFF7E6 100%)",
    },
  },
];

// ============================================================
// 农历节日（需要当年实际日期，这里用2026年的公历对应日期）
// 注：每年不同，此处为近似值，实际应使用农历转换库
// ============================================================
const LUNAR_FESTIVALS_2026: Array<{ month: number; day: number; event: CalendarEvent }> = [
  // 2026年春节：2月17日
  {
    month: 2, day: 17,
    event: {
      type: "festival", name: "除夕", emoji: "🧧",
      poem: "爆竹声中一岁除，春风送暖入屠苏。千门万户曈曈日，总把新桃换旧符。",
      poemAuthor: "王安石",
      subtitle: "辞旧迎新，阖家团圆",
      themeTag: "新年",
      color: "#CF1322",
      bgGradient: "linear-gradient(135deg, #FFF1F0 0%, #FFF7E6 100%)",
    },
  },
  {
    month: 2, day: 18,
    event: {
      type: "festival", name: "春节", emoji: "🎆",
      poem: "元日烟花爆竹声，万家灯火庆新春。梅花点点迎春雪，岁岁年年总是情。",
      poemAuthor: "节日",
      subtitle: "岁岁年年，万象更新",
      themeTag: "新年",
      color: "#CF1322",
      bgGradient: "linear-gradient(135deg, #FFF1F0 0%, #FFF7E6 100%)",
    },
  },
  // 2026年元宵：3月2日（农历正月十五）
  {
    month: 3, day: 2,
    event: {
      type: "festival", name: "元宵节", emoji: "🏮",
      poem: "去年元夜时，花市灯如昼。月上柳梢头，人约黄昏后。",
      poemAuthor: "欧阳修",
      subtitle: "花灯如昼，月圆人团圆 · 正月十五元宵夜",
      themeTag: "元宵",
      color: "#FA8C16",
      bgGradient: "linear-gradient(135deg, #3D1500 0%, #7A2D00 50%, #3D1500 100%)",
    },
  },
  // 2026年清明：4月5日（已在节气中）
  // 2026年端午：6月19日
  {
    month: 6, day: 19,
    event: {
      type: "festival", name: "端午节", emoji: "🐉",
      poem: "节分端午自谁言，万古传闻为屈原。堪笑楚江空渺渺，不能洗得直臣冤。",
      poemAuthor: "文秀",
      subtitle: "龙舟竞渡，粽香飘飘，纪念屈原",
      themeTag: "屈原",
      color: "#389E0D",
      bgGradient: "linear-gradient(135deg, #F6FFED 0%, #E6FFFB 100%)",
    },
  },
  // 2026年七夕：8月20日
  {
    month: 8, day: 20,
    event: {
      type: "festival", name: "七夕节", emoji: "⭐",
      poem: "迢迢牵牛星，皎皎河汉女。纤纤擢素手，札札弄机杼。",
      poemAuthor: "《古诗十九首》",
      subtitle: "鹊桥相会，天上人间",
      themeTag: "七夕",
      color: "#722ED1",
      bgGradient: "linear-gradient(135deg, #F9F0FF 0%, #EEF0FF 100%)",
    },
  },
  // 2026年中秋：9月25日
  {
    month: 9, day: 25,
    event: {
      type: "festival", name: "中秋节", emoji: "🌕",
      poem: "明月几时有？把酒问青天。不知天上宫阙，今夕是何年。",
      poemAuthor: "苏轼",
      subtitle: "月圆人团圆，千里共婵娟",
      themeTag: "中秋",
      color: "#D46B08",
      bgGradient: "linear-gradient(135deg, #FFF7E6 0%, #FFFBE6 100%)",
    },
  },
  // 2026年重阳：10月22日
  {
    month: 10, day: 22,
    event: {
      type: "festival", name: "重阳节", emoji: "🌼",
      poem: "独在异乡为异客，每逢佳节倍思亲。遥知兄弟登高处，遍插茱萸少一人。",
      poemAuthor: "王维",
      subtitle: "登高望远，思亲怀远",
      themeTag: "重阳",
      color: "#D46B08",
      bgGradient: "linear-gradient(135deg, #FFF7E6 0%, #FFFBE6 100%)",
    },
  },
  // 2026年腊八：1月27日
  {
    month: 1, day: 27,
    event: {
      type: "festival", name: "腊八节", emoji: "🍚",
      poem: "腊八家家煮粥多，大臣特派到雍和。圣慈亦是当今佛，进奉熬成第一锅。",
      poemAuthor: "节日",
      subtitle: "腊八粥香，年味渐浓",
      themeTag: "冬",
      color: "#D46B08",
      bgGradient: "linear-gradient(135deg, #FFF7E6 0%, #FFF2E8 100%)",
    },
  },
];

// ============================================================
// 诗人生日/纪念日（公历近似值）
// ============================================================
const POET_DAYS: Array<{ month: number; day: number; event: CalendarEvent }> = [
  // 李白（701年2月28日）
  {
    month: 2, day: 28,
    event: {
      type: "poet_birthday", name: "李白诞辰", emoji: "🌙",
      poem: "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
      poemAuthor: "李白",
      subtitle: "诗仙李白，字太白，号青莲居士",
      themeTag: "李白",
      color: "#1D39C4",
      bgGradient: "linear-gradient(135deg, #F0F5FF 0%, #EEF0FF 100%)",
    },
  },
  // 杜甫（712年2月12日）
  {
    month: 2, day: 12,
    event: {
      type: "poet_birthday", name: "杜甫诞辰", emoji: "📜",
      poem: "烽火连三月，家书抵万金。白头搔更短，浑欲不胜簪。",
      poemAuthor: "杜甫",
      subtitle: "诗圣杜甫，字子美，忧国忧民",
      themeTag: "杜甫",
      color: "#5B6EAE",
      bgGradient: "linear-gradient(135deg, #EEF0FF 0%, #F0F5FF 100%)",
    },
  },
  // 苏轼（1037年1月8日）
  {
    month: 1, day: 8,
    event: {
      type: "poet_birthday", name: "苏轼诞辰", emoji: "🌊",
      poem: "大江东去，浪淘尽，千古风流人物。",
      poemAuthor: "苏轼",
      subtitle: "东坡居士苏轼，豪放词宗",
      themeTag: "苏轼",
      color: "#096DD9",
      bgGradient: "linear-gradient(135deg, #E6F7FF 0%, #F0F5FF 100%)",
    },
  },
  // 李清照（1084年3月13日）
  {
    month: 3, day: 13,
    event: {
      type: "poet_birthday", name: "李清照诞辰", emoji: "🌸",
      poem: "常记溪亭日暮，沉醉不知归路。兴尽晚回舟，误入藕花深处。",
      poemAuthor: "李清照",
      subtitle: "千古第一才女，婉约词宗",
      themeTag: "李清照",
      color: "#EB2F96",
      bgGradient: "linear-gradient(135deg, #FFF0F6 0%, #FFF5F5 100%)",
    },
  },
  // 白居易（772年2月28日，与李白同日近似）
  {
    month: 1, day: 27,
    event: {
      type: "poet_birthday", name: "白居易诞辰", emoji: "🎵",
      poem: "离离原上草，一岁一枯荣。野火烧不尽，春风吹又生。",
      poemAuthor: "白居易",
      subtitle: "诗魔白居易，字乐天，号香山居士",
      themeTag: "白居易",
      color: "#52C41A",
      bgGradient: "linear-gradient(135deg, #F6FFED 0%, #FCFFE6 100%)",
    },
  },
  // 王维（701年）
  {
    month: 4, day: 1,
    event: {
      type: "poet_birthday", name: "王维诞辰", emoji: "🏔️",
      poem: "空山新雨后，天气晚来秋。明月松间照，清泉石上流。",
      poemAuthor: "王维",
      subtitle: "诗佛王维，字摩诘，诗中有画",
      themeTag: "王维",
      color: "#389E0D",
      bgGradient: "linear-gradient(135deg, #F6FFED 0%, #E6F7FF 100%)",
    },
  },
  // 陶渊明（365年）
  {
    month: 6, day: 15,
    event: {
      type: "poet_birthday", name: "陶渊明诞辰", emoji: "🌿",
      poem: "采菊东篱下，悠然见南山。山气日夕佳，飞鸟相与还。",
      poemAuthor: "陶渊明",
      subtitle: "田园诗祖陶渊明，不为五斗米折腰",
      themeTag: "陶渊明",
      color: "#389E0D",
      bgGradient: "linear-gradient(135deg, #F6FFED 0%, #FCFFE6 100%)",
    },
  },
  // 辛弃疾（1140年5月28日）
  {
    month: 5, day: 28,
    event: {
      type: "poet_birthday", name: "辛弃疾诞辰", emoji: "⚔️",
      poem: "醉里挑灯看剑，梦回吹角连营。八百里分麾下炙，五十弦翻塞外声，沙场秋点兵。",
      poemAuthor: "辛弃疾",
      subtitle: "词中之龙辛弃疾，豪放派大家",
      themeTag: "辛弃疾",
      color: "#CF1322",
      bgGradient: "linear-gradient(135deg, #FFF1F0 0%, #FFF7E6 100%)",
    },
  },
  // 屈原纪念日（农历五月初五，端午节同日）
  // 屈原生日（约公元前340年1月21日）
  {
    month: 1, day: 21,
    event: {
      type: "poet_birthday", name: "屈原诞辰", emoji: "🌊",
      poem: "路漫漫其修远兮，吾将上下而求索。",
      poemAuthor: "屈原",
      subtitle: "楚辞之祖屈原，爱国诗人",
      themeTag: "屈原",
      color: "#096DD9",
      bgGradient: "linear-gradient(135deg, #E6F7FF 0%, #F0F5FF 100%)",
    },
  },
  // 纳兰性德（1655年1月19日）
  {
    month: 1, day: 19,
    event: {
      type: "poet_birthday", name: "纳兰性德诞辰", emoji: "❄️",
      poem: "人生若只如初见，何事秋风悲画扇。等闲变却故人心，却道故人心易变。",
      poemAuthor: "纳兰性德",
      subtitle: "清代词人纳兰性德，满洲第一词人",
      themeTag: "纳兰性德",
      color: "#5B6EAE",
      bgGradient: "linear-gradient(135deg, #EEF0FF 0%, #E8F4FD 100%)",
    },
  },
  // 杜牧（803年4月10日）
  {
    month: 4, day: 10,
    event: {
      type: "poet_birthday", name: "杜牧诞辰", emoji: "🍂",
      poem: "远上寒山石径斜，白云深处有人家。停车坐爱枫林晚，霜叶红于二月花。",
      poemAuthor: "杜牧",
      subtitle: "小杜杜牧，晚唐著名诗人",
      themeTag: "杜牧",
      color: "#D46B08",
      bgGradient: "linear-gradient(135deg, #FFF7E6 0%, #FFF2E8 100%)",
    },
  },
  // 陆游（1125年11月13日）
  {
    month: 11, day: 13,
    event: {
      type: "poet_birthday", name: "陆游诞辰", emoji: "🗡️",
      poem: "死去元知万事空，但悲不见九州同。王师北定中原日，家祭无忘告乃翁。",
      poemAuthor: "陆游",
      subtitle: "南宋爱国诗人陆游，一生忧国",
      themeTag: "陆游",
      color: "#CF1322",
      bgGradient: "linear-gradient(135deg, #FFF1F0 0%, #FFF7E6 100%)",
    },
  },
];

// ============================================================
// 核心查询函数
// ============================================================

export interface TodayCalendarInfo {
  event: CalendarEvent | null;
  /** 是否有今日事件 */
  hasEvent: boolean;
  /** 今日日期描述 */
  dateDesc: string;
}

/**
 * 获取今日日历信息
 * 优先级：传统节日 > 诗人纪念日 > 节气
 */
export function getTodayCalendarInfo(): TodayCalendarInfo {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const dateDesc = `${month}月${day}日`;

  // 查找匹配（优先级：节日 > 诗人 > 节气）
  const allEvents = [
    ...LUNAR_FESTIVALS_2026,
    ...SOLAR_FESTIVALS,
    ...POET_DAYS,
    ...JIEQI_LIST,
  ];

  const match = allEvents.find(e => e.month === month && e.day === day);

  if (match) {
    return { event: match.event, hasEvent: true, dateDesc };
  }

  // 查找最近的节气（前后3天内）
  const nearJieqi = JIEQI_LIST.find(e => {
    const diff = Math.abs((e.month - month) * 30 + (e.day - day));
    return diff <= 2;
  });

  if (nearJieqi) {
    return {
      event: {
        ...nearJieqi.event,
        subtitle: `${nearJieqi.event.name}前后 · ${nearJieqi.event.subtitle}`,
      },
      hasEvent: true,
      dateDesc,
    };
  }

  return { event: null, hasEvent: false, dateDesc };
}

/**
 * 获取当前季节的默认诗词（无节日时使用）
 */
export function getSeasonPoem(): CalendarEvent {
  const month = new Date().getMonth() + 1;

  if (month >= 3 && month <= 5) {
    return {
      type: "jieqi", name: "春日", emoji: "🌸",
      poem: "春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。",
      poemAuthor: "孟浩然",
      subtitle: "春日好时光，诗词正当时",
      themeTag: "春",
      color: "#52C41A",
      bgGradient: "linear-gradient(135deg, #F6FFED 0%, #FFFBE6 100%)",
    };
  } else if (month >= 6 && month <= 8) {
    return {
      type: "jieqi", name: "夏日", emoji: "☀️",
      poem: "接天莲叶无穷碧，映日荷花别样红。",
      poemAuthor: "杨万里",
      subtitle: "夏日荷风，诗意正浓",
      themeTag: "夏",
      color: "#FA8C16",
      bgGradient: "linear-gradient(135deg, #FFF7E6 0%, #FFF2E8 100%)",
    };
  } else if (month >= 9 && month <= 11) {
    return {
      type: "jieqi", name: "秋日", emoji: "🍂",
      poem: "自古逢秋悲寂寥，我言秋日胜春朝。晴空一鹤排云上，便引诗情到碧霄。",
      poemAuthor: "刘禹锡",
      subtitle: "金秋时节，诗意盎然",
      themeTag: "秋",
      color: "#D46B08",
      bgGradient: "linear-gradient(135deg, #FFF7E6 0%, #FFFBE6 100%)",
    };
  } else {
    return {
      type: "jieqi", name: "冬日", emoji: "❄️",
      poem: "墙角数枝梅，凌寒独自开。遥知不是雪，为有暗香来。",
      poemAuthor: "王安石",
      subtitle: "冬日梅香，诗心不减",
      themeTag: "冬",
      color: "#4A90D9",
      bgGradient: "linear-gradient(135deg, #E8F4FD 0%, #F0F5FF 100%)",
    };
  }
}

/**
 * 获取今日展示信息（有节日用节日，否则用季节诗词）
 */
export function getTodayDisplay(): CalendarEvent & { dateDesc: string } {
  const info = getTodayCalendarInfo();
  const event = info.event ?? getSeasonPoem();
  return { ...event, dateDesc: info.dateDesc };
}

/**
 * 获取即将到来的节日（未来7天内）
 */
export function getUpcomingEvents(days = 7): Array<CalendarEvent & { daysUntil: number; dateDesc: string }> {
  const now = new Date();
  const results: Array<CalendarEvent & { daysUntil: number; dateDesc: string }> = [];

  const allEvents = [
    ...LUNAR_FESTIVALS_2026,
    ...SOLAR_FESTIVALS,
    ...POET_DAYS,
    ...JIEQI_LIST,
  ];

  for (const item of allEvents) {
    const eventDate = new Date(now.getFullYear(), item.month - 1, item.day);
    const diff = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0 && diff <= days) {
      results.push({
        ...item.event,
        daysUntil: diff,
        dateDesc: `${item.month}月${item.day}日`,
      });
    }
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}
