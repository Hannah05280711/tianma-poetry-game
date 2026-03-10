/**
 * 每日轮换数据配置
 * 包含春日诗歌、图标、颜色等每日更新的内容
 * 使用基于日期的确定性选择，确保同一天所有用户看到相同内容
 */

export interface DailyRotationItem {
  id: number;
  poem: string;
  author: string;
  icon: string;
  iconEmoji: string;
  colorHex: string;
  colorName: string;
  description: string;
}

/**
 * 春日主题诗歌集合（7首）
 * 每首诗都与春天、生命、希望相关
 */
export const SPRING_POEMS: DailyRotationItem[] = [
  {
    id: 0,
    poem: "春风又绿江南岸，明月何时照我还",
    author: "王安石《泊船瓜洲》",
    icon: "🌱",
    iconEmoji: "🌱",
    colorHex: "#10B981",
    colorName: "翠绿",
    description: "春风拂过，万物复苏，生命在绿意中萌发",
  },
  {
    id: 1,
    poem: "春眠不觉晓，处处闻啼鸟",
    author: "孟浩然《春晓》",
    icon: "🐦",
    iconEmoji: "🐦",
    colorHex: "#06B6D4",
    colorName: "青蓝",
    description: "春日清晨，鸟鸣声声入耳，唤醒沉睡的世界",
  },
  {
    id: 2,
    poem: "春色满园关不住，一枝红杏出墙来",
    author: "叶绍翁《游园不值》",
    icon: "🌸",
    iconEmoji: "🌸",
    colorHex: "#EC4899",
    colorName: "桃红",
    description: "春花烂漫，生机勃勃，美好无处不在",
  },
  {
    id: 3,
    poem: "春来不觉晓，花落知多少",
    author: "孟浩然《春晓》",
    icon: "🌼",
    iconEmoji: "🌼",
    colorHex: "#F59E0B",
    colorName: "金黄",
    description: "春日花开，绚烂绽放，每一朵都是生命的礼物",
  },
  {
    id: 4,
    poem: "竹外桃花三两枝，春江水暖鸭先知",
    author: "苏轼《惠崇春江晚景》",
    icon: "🦆",
    iconEmoji: "🦆",
    colorHex: "#3B82F6",
    colorName: "天蓝",
    description: "春江水暖，万物苏醒，自然的和谐在此刻显现",
  },
  {
    id: 5,
    poem: "春风十里扬州路，卷上珠帘总不如",
    author: "杜牧《赠别》",
    icon: "🌷",
    iconEmoji: "🌷",
    colorHex: "#A855F7",
    colorName: "紫罗",
    description: "春风拂过，带来温暖和希望，一切都在变好",
  },
  {
    id: 6,
    poem: "春日迟迟，卉木萋萋。仓庚喈喈，采蘩祁祁",
    author: "《诗经·小雅·出车》",
    icon: "🌿",
    iconEmoji: "🌿",
    colorHex: "#14B8A6",
    colorName: "青翠",
    description: "春日到来，草木繁茂，鸟鸣声声，生命在此刻最灿烂",
  },
];

/**
 * 根据日期获取当日的轮换数据
 * 使用日期的哈希值确保同一天所有用户看到相同内容
 * @param date 日期对象，默认为今天
 * @returns 当日的轮换数据
 */
export function getTodayRotation(date: Date = new Date()): DailyRotationItem {
  // 计算从2026年1月1日到今天的天数
  const baseDate = new Date(2026, 0, 1);
  const daysSinceBase = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // 使用模运算确保循环轮换
  const index = daysSinceBase % SPRING_POEMS.length;
  return SPRING_POEMS[index];
}

/**
 * 获取指定日期的轮换数据
 * @param year 年份
 * @param month 月份（1-12）
 * @param day 日期（1-31）
 * @returns 该日期的轮换数据
 */
export function getRotationByDate(year: number, month: number, day: number): DailyRotationItem {
  const date = new Date(year, month - 1, day);
  return getTodayRotation(date);
}

/**
 * 获取接下来N天的轮换数据
 * @param days 天数
 * @returns 轮换数据数组
 */
export function getUpcomingRotations(days: number = 7): DailyRotationItem[] {
  const result: DailyRotationItem[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    result.push(getTodayRotation(date));
  }
  
  return result;
}

/**
 * 获取当前日期的中文描述
 * @param date 日期对象
 * @returns 中文日期描述
 */
export function getDateDescription(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const weekDay = weekDays[date.getDay()];
  
  return `${month}月${day}日 · 周${weekDay}`;
}

/**
 * 验证轮换数据的完整性
 * @returns 是否所有必要字段都已配置
 */
export function validateRotationData(): boolean {
  return SPRING_POEMS.every(item =>
    item.poem &&
    item.author &&
    item.icon &&
    item.iconEmoji &&
    item.colorHex &&
    item.colorName &&
    item.description
  );
}

/**
 * 获取所有可用的颜色列表
 * @returns 颜色数组
 */
export function getAllColors(): Array<{ hex: string; name: string }> {
  return SPRING_POEMS.map(item => ({
    hex: item.colorHex,
    name: item.colorName,
  }));
}

/**
 * 获取所有可用的图标列表
 * @returns 图标数组
 */
export function getAllIcons(): string[] {
  return SPRING_POEMS.map(item => item.iconEmoji);
}
