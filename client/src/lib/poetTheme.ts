/**
 * 诗人专属古风配色系统
 * 每位诗人有独特的主题色调，用于分享卡片、UI 强调色等
 */

export interface PoetTheme {
  primary: string;    // 主色（标题、藏头字、徽章）
  secondary: string;  // 辅助色（分隔线、边框）
  bg1: string;        // 背景渐变起始色
  bg2: string;        // 背景渐变结束色
  accent: string;     // 强调色（诗人名字颜色）
  label: string;      // 契合标签文字色
}

export const POET_THEME_COLORS: Record<string, PoetTheme> = {
  // 李白：月白仙气，青莲居士，青白色调
  "李白": { primary: "#2E6DA4", secondary: "#5B9BD5", bg1: "#EEF6FF", bg2: "#DBEAFE", accent: "#1A4F8A", label: "#2E6DA4" },
  // 杜甫：忧国忧民，山河大地，深棕色调
  "杜甫": { primary: "#5C4033", secondary: "#8B6355", bg1: "#FDF6F0", bg2: "#F5E6D8", accent: "#3E2723", label: "#5C4033" },
  // 王维：诗中有画，青翠山色，翠绿色调
  "王维": { primary: "#2D7D5A", secondary: "#4CAF85", bg1: "#F0FBF5", bg2: "#DCFCE7", accent: "#1B5E40", label: "#2D7D5A" },
  // 苏轼：豪放大气，大江东去，水墨蓝色
  "苏轼": { primary: "#1565C0", secondary: "#42A5F5", bg1: "#EFF8FF", bg2: "#DBEAFE", accent: "#0D47A1", label: "#1565C0" },
  // 李清照：婉约清丽，海棠红梅，粉红色调
  "李清照": { primary: "#B5446E", secondary: "#E879A0", bg1: "#FFF0F6", bg2: "#FCE7F3", accent: "#831843", label: "#B5446E" },
  // 辛弃疾：爱国豪情，剑气山河，次红色调
  "辛弃疾": { primary: "#B71C1C", secondary: "#EF5350", bg1: "#FFF5F5", bg2: "#FEE2E2", accent: "#7F0000", label: "#B71C1C" },
  // 白居易：现实主义，江南风情，吴红色调
  "白居易": { primary: "#C0392B", secondary: "#E74C3C", bg1: "#FFF8F7", bg2: "#FDECEA", accent: "#922B21", label: "#C0392B" },
  // 陶渊明：归隐田园，采菊东篱，绿茂色调
  "陶渊明": { primary: "#4A7C59", secondary: "#76B887", bg1: "#F2FBF4", bg2: "#DCFCE7", accent: "#2D5A3D", label: "#4A7C59" },
  // 屈原：橚江投水，汇求上下，潐蓝色调
  "屈原": { primary: "#1A5276", secondary: "#2E86C1", bg1: "#EBF5FB", bg2: "#D6EAF8", accent: "#0D2B40", label: "#1A5276" },
  // 李商隐：沉郁美丽，无题红豆，深紫色调
  "李商隐": { primary: "#6B2D8B", secondary: "#9B59B6", bg1: "#F9F0FF", bg2: "#F3E8FF", accent: "#4A1A6B", label: "#6B2D8B" },
  // 李煜：春花秋月，江山故国，幽蓝色调
  "李煜": { primary: "#2C5F8A", secondary: "#5B9BD5", bg1: "#EEF6FF", bg2: "#DBEAFE", accent: "#1A3A5C", label: "#2C5F8A" },
  // 孟浩然：隔山隆隆，绿水青山，青翠色调
  "孟浩然": { primary: "#1B7A5A", secondary: "#34A87E", bg1: "#F0FBF7", bg2: "#D1FAE5", accent: "#0F5240", label: "#1B7A5A" },
  // 杜牧：秋天红叶，山行偷坐，欺红色调
  "杜牧": { primary: "#C0392B", secondary: "#E74C3C", bg1: "#FFF5F5", bg2: "#FEE2E2", accent: "#922B21", label: "#C0392B" },
  // 纳兰性德：冰雪情怀，山海关外，冰蓝色调
  "纳兰性德": { primary: "#1A6B8A", secondary: "#2E9EC1", bg1: "#EEF9FF", bg2: "#CCEEFF", accent: "#0D3F55", label: "#1A6B8A" },
  // 陆游：报国情怀，剑门求败，深棕红色调
  "陆游": { primary: "#8B2500", secondary: "#C0392B", bg1: "#FFF3F0", bg2: "#FFE4DC", accent: "#5C1800", label: "#8B2500" },
  // 柳永：浅唱低唱，济南烟雨，烟雨灰蓝色调
  "柳永": { primary: "#546E7A", secondary: "#78909C", bg1: "#F5F8FA", bg2: "#ECEFF1", accent: "#37474F", label: "#546E7A" },
  // 欧阳修：醒翁赋水，山色有无中，翠绿色调
  "欧阳修": { primary: "#2E7D32", secondary: "#43A047", bg1: "#F1FBF2", bg2: "#DCFCE7", accent: "#1B5E20", label: "#2E7D32" },
  // 刘禹锡：汉宫秋月，山上兰花，谷黄色调
  "刘禹锡": { primary: "#B8860B", secondary: "#DAA520", bg1: "#FFFDF0", bg2: "#FEF9C3", accent: "#7A5800", label: "#B8860B" },
  // 曹操：对酒当歌，气吸山河，钢铁灰色调
  "曹操": { primary: "#455A64", secondary: "#607D8B", bg1: "#F4F7F9", bg2: "#ECEFF1", accent: "#263238", label: "#455A64" },
  // 张若虚：春江花月，天海一色，月白色调
  "张若虚": { primary: "#4A6FA5", secondary: "#7BA7D4", bg1: "#EEF5FF", bg2: "#DBEAFE", accent: "#2C4A7A", label: "#4A6FA5" },
  // 王之涣：登鹳雀楼，落霞孤鹜，澄金色调
  "王之涣": { primary: "#C8860C", secondary: "#E6A817", bg1: "#FFFBEB", bg2: "#FEF3C7", accent: "#8A5A00", label: "#C8860C" },
  // 岑参：雪山天山，幽幽幽幽，冰雪白色调
  "岑参": { primary: "#1E6B8A", secondary: "#2E9EC1", bg1: "#EEF9FF", bg2: "#E0F2FE", accent: "#0D3F55", label: "#1E6B8A" },
  // 周邦彦：周密婷约，宫商流音，沉香紫色调
  "周邦彦": { primary: "#7B3F8A", secondary: "#9B59B6", bg1: "#F9F0FF", bg2: "#F3E8FF", accent: "#4A1A6B", label: "#7B3F8A" },
  // 黄庭坚：江西诗派，水墨丹青，湖蓝色调
  "黄庭坚": { primary: "#1B6B8A", secondary: "#2E9EC1", bg1: "#EEF9FF", bg2: "#E0F2FE", accent: "#0D3F55", label: "#1B6B8A" },
  // 姜夔：山水清音，白石道人，沉静灰蓝色调
  "姜夔": { primary: "#4A6B7A", secondary: "#6B8FA0", bg1: "#F2F8FA", bg2: "#E0EEF3", accent: "#2C4A55", label: "#4A6B7A" },
};

/** 获取诗人主题色（没有专属配色则根据契合度回退） */
export function getPoetThemeColor(poetName: string, matchScore: number): PoetTheme {
  const poetTheme = POET_THEME_COLORS[poetName];
  if (poetTheme) return poetTheme;
  // 回退：根据契合度分配色
  if (matchScore >= 90) return { primary: "#C0392B", secondary: "#E74C3C", bg1: "#FFF5F5", bg2: "#FEE2E2", accent: "#922B21", label: "#C0392B" };
  if (matchScore >= 75) return { primary: "#C8960C", secondary: "#E6A817", bg1: "#FFFBEB", bg2: "#FEF3C7", accent: "#8A5A00", label: "#C8960C" };
  if (matchScore >= 60) return { primary: "#2D7D5A", secondary: "#4CAF85", bg1: "#F0FBF5", bg2: "#DCFCE7", accent: "#1B5E40", label: "#2D7D5A" };
  return { primary: "#546E7A", secondary: "#78909C", bg1: "#F5F8FA", bg2: "#ECEFF1", accent: "#37474F", label: "#546E7A" };
}
