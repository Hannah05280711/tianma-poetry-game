/**
 * V2 数据填充脚本：解救樊登·诗词闯关
 * 21关（7个兵器段位×3小关）+ 24张诗人卡牌
 */
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// ============================================================
// 1. 关卡数据（21关）
// ============================================================
const stages = [
  // ── 青铜剑 ──
  {
    stageNumber: 1, tierKey: "bronze", subLevel: 1,
    stageName: "青铜剑·初试锋芒", weaponEmoji: "🗡️", difficulty: 1,
    storyBefore: "樊登在研读古籍时，突然被一道黑光卷入诗词秘境。毒龙低吼：「想救他？先过我这一关！」\n\n你拾起地上一把锈迹斑斑的青铜剑，深吸一口气……",
    storyAfter: "「不错，」毒龙冷笑，「但这只是开始。」\n\n樊登的声音从远处传来：「朋友，我在这里！继续前进！」"
  },
  {
    stageNumber: 2, tierKey: "bronze", subLevel: 2,
    stageName: "青铜剑·诗海初航", weaponEmoji: "🗡️", difficulty: 1,
    storyBefore: "穿过第一道封印，眼前出现一片古朴的竹林。毒龙的爪印烙在每一根竹节上，诗句被扭曲成乱码。\n\n「还原这些诗句，才能继续前行！」",
    storyAfter: "竹林恢复了生机，诗句重新流淌在竹节之间。\n\n一张泛黄的地图从竹叶中飘落——樊登留下的指引。"
  },
  {
    stageNumber: 3, tierKey: "bronze", subLevel: 3,
    stageName: "青铜剑·破茧而出", weaponEmoji: "🗡️", difficulty: 2,
    storyBefore: "地图指向一座古老的石门。门上刻满了唐诗，却有几处被毒龙的毒液腐蚀。\n\n「填补这些残缺，石门才会开启！」",
    storyAfter: "石门轰然洞开！青铜剑在光芒中升华，你感到诗词的力量在体内涌动。\n\n「青铜剑·已觉醒」——你迈入了白银之境。"
  },

  // ── 白银枪 ──
  {
    stageNumber: 4, tierKey: "silver", subLevel: 1,
    stageName: "白银枪·银光乍现", weaponEmoji: "🔱", difficulty: 2,
    storyBefore: "白银之境，云雾缭绕。毒龙的第二道封印将樊登困在一座诗词迷宫中。\n\n「只有真正懂诗的人，才能找到出路。」\n\n你握紧白银枪，踏入迷宫……",
    storyAfter: "迷宫的墙壁轰然倒塌，樊登的轮廓在雾中若隐若现。\n\n「快了，再坚持一下！」他的声音更近了。"
  },
  {
    stageNumber: 5, tierKey: "silver", subLevel: 2,
    stageName: "白银枪·寒光破雾", weaponEmoji: "🔱", difficulty: 2,
    storyBefore: "迷宫深处，一座诗词擂台拦住去路。毒龙的爪牙守在台上：\n\n「能答出这些诗句，才有资格继续！」",
    storyAfter: "擂台守卫灰飞烟灭，白银枪划破迷雾，射出一道银光。\n\n樊登的书卷从天而降，上面写着：「诗词是心灵的铠甲。」"
  },
  {
    stageNumber: 6, tierKey: "silver", subLevel: 3,
    stageName: "白银枪·月华如练", weaponEmoji: "🔱", difficulty: 3,
    storyBefore: "月光下，毒龙现出真身——一条银鳞巨龙，将樊登困在诗词结界中。\n\n「用你的诗词之力，打破这道结界！」",
    storyAfter: "结界碎裂，银光四射！白银枪化为一道流星，直刺毒龙心脏。\n\n「白银枪·已觉醒」——黄金之境的大门缓缓打开。"
  },

  // ── 黄金刀 ──
  {
    stageNumber: 7, tierKey: "gold", subLevel: 1,
    stageName: "黄金刀·金芒初显", weaponEmoji: "⚔️", difficulty: 3,
    storyBefore: "黄金之境，金光万丈。毒龙的第三道封印将整座诗词圣殿封锁。\n\n「这里供奉着千年诗魂，你敢亵渎吗？」\n\n你举起黄金刀，以诗词之名，踏入圣殿……",
    storyAfter: "圣殿的封印松动了，金色的诗句从墙壁上飘落，化为光芒护卫着你。\n\n樊登的声音穿透封印：「我感受到了你的力量！」"
  },
  {
    stageNumber: 8, tierKey: "gold", subLevel: 2,
    stageName: "黄金刀·斩断枷锁", weaponEmoji: "⚔️", difficulty: 3,
    storyBefore: "圣殿深处，樊登被金色锁链缚住。每一道锁链都刻着一句诗，答对方能斩断。\n\n「十道诗锁，一道都不能错！」",
    storyAfter: "锁链一道道断裂，樊登的身影越来越清晰。\n\n「还有最后一道封印……」他低声说道。"
  },
  {
    stageNumber: 9, tierKey: "gold", subLevel: 3,
    stageName: "黄金刀·金光普照", weaponEmoji: "⚔️", difficulty: 3,
    storyBefore: "最后一道金色封印，由毒龙亲自守护。\n\n「你已经走了很远，但这里才是真正的考验！」\n\n黄金刀在你手中发出耀眼的光芒……",
    storyAfter: "封印轰然崩塌！黄金刀化为金龙，与毒龙激战。\n\n「黄金刀·已觉醒」——铂金之境的传送门出现在眼前。"
  },

  // ── 铂金戟 ──
  {
    stageNumber: 10, tierKey: "platinum", subLevel: 1,
    stageName: "铂金戟·霜刃出鞘", weaponEmoji: "🏆", difficulty: 3,
    storyBefore: "铂金之境，寒气逼人。毒龙在这里布下了最精妙的诗词陷阱——每一步都是考验。\n\n「能走到这里，你已非凡人。但铂金之试，非同小可！」",
    storyAfter: "陷阱一一破解，铂金戟在寒光中熠熠生辉。\n\n前方传来樊登的读书声——他在用诗词抵御毒龙的侵蚀。"
  },
  {
    stageNumber: 11, tierKey: "platinum", subLevel: 2,
    stageName: "铂金戟·凌霜傲骨", weaponEmoji: "🏆", difficulty: 4,
    storyBefore: "樊登的读书声越来越微弱，毒龙的毒液正在侵蚀他的记忆。\n\n「每答对一题，就能还他一段记忆！」",
    storyAfter: "樊登的声音重新变得清晰有力：「《将进酒》……《静夜思》……我记起来了！」\n\n他的眼中重新燃起了光芒。"
  },
  {
    stageNumber: 12, tierKey: "platinum", subLevel: 3,
    stageName: "铂金戟·破阵而出", weaponEmoji: "🏆", difficulty: 4,
    storyBefore: "毒龙布下「诗词迷阵」，百条诗句交织成网，将樊登困在正中央。\n\n「能破此阵者，方为诗词真传人！」",
    storyAfter: "迷阵破解！铂金戟化为一道光柱，直冲云霄。\n\n「铂金戟·已觉醒」——钻石之境的封印开始松动。"
  },

  // ── 钻石弓 ──
  {
    stageNumber: 13, tierKey: "diamond", subLevel: 1,
    stageName: "钻石弓·星光凝聚", weaponEmoji: "💎", difficulty: 4,
    storyBefore: "钻石之境，星光璀璨。毒龙将樊登封印在一颗巨大的诗词水晶中。\n\n「想打碎这颗水晶？用你的诗词之力！」\n\n钻石弓在你手中颤动，仿佛在呼应着星光……",
    storyAfter: "水晶出现了裂缝，樊登在水晶中向你挥手。\n\n「我能看到你了！再加把劲！」"
  },
  {
    stageNumber: 14, tierKey: "diamond", subLevel: 2,
    stageName: "钻石弓·光芒万丈", weaponEmoji: "💎", difficulty: 4,
    storyBefore: "水晶的裂缝越来越大，但毒龙召唤出「诗词幻影」——每一个幻影都是一道难题。\n\n「打败所有幻影，水晶才会彻底碎裂！」",
    storyAfter: "幻影消散，水晶碎裂成无数钻石，化为钻石弓上的箭矢。\n\n「这些箭矢，将成为你最后的武器！」"
  },
  {
    stageNumber: 15, tierKey: "diamond", subLevel: 3,
    stageName: "钻石弓·穿云破日", weaponEmoji: "💎", difficulty: 4,
    storyBefore: "钻石箭矢蓄势待发，毒龙亲自出手，用「千年诗阵」阻拦。\n\n「你的诗词之力，能穿透这道阵吗？」",
    storyAfter: "钻石箭矢穿透诗阵，射中毒龙要害！\n\n「钻石弓·已觉醒」——星耀之境的大门在星光中徐徐开启。"
  },

  // ── 星耀扇 ──
  {
    stageNumber: 16, tierKey: "star", subLevel: 1,
    stageName: "星耀扇·繁星引路", weaponEmoji: "✨", difficulty: 4,
    storyBefore: "星耀之境，繁星如海。毒龙受伤后，将所有力量注入最后的封印。\n\n「就算你到了这里，也无法打破我的终极封印！」\n\n星耀扇在你手中展开，每一片扇骨都刻着一句千古名诗……",
    storyAfter: "星光汇聚，封印出现了第一道裂痕。\n\n樊登在封印内高声吟诵：「长风破浪会有时，直挂云帆济沧海！」"
  },
  {
    stageNumber: 17, tierKey: "star", subLevel: 2,
    stageName: "星耀扇·诗魂共鸣", weaponEmoji: "✨", difficulty: 5,
    storyBefore: "封印的裂痕在扩大，但毒龙拼死抵抗，召唤出历代诗人的「诗魂幻象」。\n\n「这些诗魂将永远守护这道封印！除非……你能与他们共鸣！」",
    storyAfter: "诗魂幻象一一消散，化为星光融入星耀扇。\n\n「我感受到了——李白、杜甫、苏轼……他们都在帮助你！」樊登激动地喊道。"
  },
  {
    stageNumber: 18, tierKey: "star", subLevel: 3,
    stageName: "星耀扇·星河倒流", weaponEmoji: "✨", difficulty: 5,
    storyBefore: "最后一道星耀封印，汇聚了毒龙千年的诗词之力。\n\n「用你所学的一切，打破这道封印！」\n\n星耀扇展开，繁星倒流……",
    storyAfter: "封印轰然崩塌，星河倒流！\n\n「星耀扇·已觉醒」——王者之境的金门在万丈金光中缓缓开启。"
  },

  // ── 王者笔 ──
  {
    stageNumber: 19, tierKey: "king", subLevel: 1,
    stageName: "王者笔·天命之笔", weaponEmoji: "👑", difficulty: 5,
    storyBefore: "王者之境，金光万丈。毒龙已是强弩之末，但它将最后的力量化为「诗词终极考验」。\n\n「王者之笔，书写天命。你，配吗？」\n\n你握起王者笔，笔尖流淌出金色的诗句……",
    storyAfter: "毒龙的力量开始崩溃，樊登的封印出现了决定性的裂缝。\n\n「就差最后一步了！」"
  },
  {
    stageNumber: 20, tierKey: "king", subLevel: 2,
    stageName: "王者笔·笔走龙蛇", weaponEmoji: "👑", difficulty: 5,
    storyBefore: "毒龙垂死挣扎，将自身化为「诗词黑洞」，吞噬一切诗句。\n\n「你的诗词之力，能填满这个黑洞吗？」\n\n王者笔在你手中燃烧，化为一支金色的火焰……",
    storyAfter: "黑洞被诗词之力填满，轰然爆炸！\n\n毒龙发出最后的怒吼：「不可能……我千年的封印……」"
  },
  {
    stageNumber: 21, tierKey: "king", subLevel: 3,
    stageName: "王者笔·书写传奇", weaponEmoji: "👑", difficulty: 5,
    storyBefore: "最终决战！毒龙的封印只剩最后一层，樊登就在眼前。\n\n「用你所有的诗词力量，写下这个时代最伟大的篇章！」\n\n王者笔高举，金光照耀整个诗词秘境……",
    storyAfter: "毒龙的封印彻底崩塌，化为漫天诗句，飘散在空中。\n\n樊登从封印中走出，拍了拍你的肩膀：\n\n「谢谢你。诗词，从来都不只是文字——它是我们与千年前那些灵魂的对话。」\n\n「王者笔·已觉醒」\n\n🎉 恭喜你完成了「解救樊登·诗词闯关」全部21关！"
  }
];

// ============================================================
// 2. 诗人卡牌数据（24张）
// ============================================================
const cardData = [
  { poetName: "李白", dynasty: "唐", rarity: "epic", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/李白_f83099ea.png", description: "诗仙李白，豪放飘逸，天才横溢。", signaturePoem: "举头望明月，低头思故乡" },
  { poetName: "杜甫", dynasty: "唐", rarity: "epic", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/杜甫_38067a23.png", description: "诗圣杜甫，忧国忧民，沉郁顿挫。", signaturePoem: "烽火连三月，家书抵万金" },
  { poetName: "王维", dynasty: "唐", rarity: "epic", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/王维_d42245cf.png", description: "诗佛王维，禅意山水，诗中有画。", signaturePoem: "大漠孤烟直，长河落日圆" },
  { poetName: "白居易", dynasty: "唐", rarity: "rare", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/白居易_8caa22bd.png", description: "平易近人，诗风通俗，老妪能解。", signaturePoem: "野火烧不尽，春风吹又生" },
  { poetName: "孟浩然", dynasty: "唐", rarity: "rare", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/孟浩然_18ea09ff.png", description: "田园诗人，隐逸山林，清淡自然。", signaturePoem: "春眠不觉晓，处处闻啼鸟" },
  { poetName: "王昌龄", dynasty: "唐", rarity: "rare", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/王昌龄_1ef281cd.png", description: "七绝圣手，边塞豪情，情深意切。", signaturePoem: "秦时明月汉时关，万里长征人未还" },
  { poetName: "李商隐", dynasty: "唐", rarity: "rare", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/李商隐_2ab20b18.png", description: "朦胧诗人，情感细腻，意境深远。", signaturePoem: "春蚕到死丝方尽，蜡炬成灰泪始干" },
  { poetName: "韩愈", dynasty: "唐", rarity: "rare", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/韩愈_5a075157.png", description: "文起八代之衰，道济天下之溺。", signaturePoem: "业精于勤荒于嬉，行成于思毁于随" },
  { poetName: "柳宗元", dynasty: "唐", rarity: "rare", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/柳宗元_1d5138aa.png", description: "永州司马，山水散文，孤寂清冷。", signaturePoem: "千山鸟飞绝，万径人踪灭" },
  { poetName: "高适", dynasty: "唐", rarity: "rare", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/高适_7ddf23a8.png", description: "边塞诗人，豪迈悲壮，功名志远。", signaturePoem: "莫愁前路无知己，天下谁人不识君" },
  { poetName: "岑参", dynasty: "唐", rarity: "rare", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/岑参_95410dd6.png", description: "边塞奇才，想象瑰丽，气势磅礴。", signaturePoem: "忽如一夜春风来，千树万树梨花开" },
  { poetName: "孟郊", dynasty: "唐", rarity: "common", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/孟郊_8a06196c.png", description: "苦吟诗人，字字血泪，情真意切。", signaturePoem: "谁言寸草心，报得三春晖" },
  { poetName: "温庭筠", dynasty: "唐", rarity: "common", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/温庭筠_40ef2fb6.png", description: "花间词祖，绮丽婉约，香艳精工。", signaturePoem: "梳洗罢，独倚望江楼" },
  { poetName: "张九龄", dynasty: "唐", rarity: "common", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/张九龄_7cd7057c.png", description: "开元贤相，风度翩翩，诗风清雅。", signaturePoem: "海上生明月，天涯共此时" },
  { poetName: "陈子昂", dynasty: "唐", rarity: "common", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/陈子昂_57125020.png", description: "初唐革新，慷慨悲歌，风骨峻拔。", signaturePoem: "前不见古人，后不见来者" },
  { poetName: "骆宾王", dynasty: "唐", rarity: "common", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/骆宾王_d8e13b37.png", description: "初唐四杰，七岁咏鹅，才华早显。", signaturePoem: "鹅鹅鹅，曲项向天歌" },
  { poetName: "韦应物", dynasty: "唐", rarity: "common", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/韦应物_4426724b.png", description: "清新淡远，山水田园，平和冲淡。", signaturePoem: "春潮带雨晚来急，野渡无人舟自横" },
  { poetName: "沈佺期", dynasty: "唐", rarity: "common", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/沈佺期_021f372a.png", description: "律诗奠基，格律严谨，宫廷诗风。", signaturePoem: "可怜闺里月，长在汉家营" },
  { poetName: "杜审言", dynasty: "唐", rarity: "common", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/杜审言_0217cc4f.png", description: "杜甫祖父，律诗先驱，工整典雅。", signaturePoem: "独有宦游人，偏惊物候新" },
  { poetName: "常建", dynasty: "唐", rarity: "common", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/常建_ee31a864.png", description: "山水幽静，禅意悠远，清幽脱俗。", signaturePoem: "曲径通幽处，禅房花木深" },
  { poetName: "元结", dynasty: "唐", rarity: "common", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/元结_1c592b6f.png", description: "古文运动先驱，关注民生，质朴刚健。", signaturePoem: "系舟摇酒尾，结缆卧沙头" },
  { poetName: "綦毋潜", dynasty: "唐", rarity: "common", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/綦毋潜_f98ced53.png", description: "盛唐隐逸，山水清幽，淡泊名利。", signaturePoem: "春风摇荡自东来，更入空山万树开" },
  { poetName: "邱为", dynasty: "唐", rarity: "common", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/邱为_2b6fc0bd.png", description: "田园诗人，清新质朴，自然恬淡。", signaturePoem: "树树皆秋色，山山唯落晖" },
  { poetName: "唐玄宗", dynasty: "唐", rarity: "epic", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663387089743/4LhGieFmaH5SRJ3NvGaeQq/唐玄宗_9dd43600.png", description: "开元盛世，天子诗人，风流倜傥。", signaturePoem: "云想衣裳花想容，春风拂槛露华浓" }
];

// ============================================================
// 执行填充
// ============================================================
console.log("🚀 开始填充 V2 数据...\n");

// 清空旧数据
await connection.execute("DELETE FROM v2Stages");
await connection.execute("DELETE FROM poetCards");
console.log("✅ 旧数据已清空");

// 插入关卡
for (const s of stages) {
  await connection.execute(
    `INSERT INTO v2Stages (stageNumber, tierKey, subLevel, stageName, storyBefore, storyAfter, difficulty, questionsPerRound, weaponEmoji)
     VALUES (?, ?, ?, ?, ?, ?, ?, 10, ?)`,
    [s.stageNumber, s.tierKey, s.subLevel, s.stageName, s.storyBefore, s.storyAfter, s.difficulty, s.weaponEmoji]
  );
}
console.log(`✅ 插入 ${stages.length} 个关卡`);

// 插入卡牌
for (const c of cardData) {
  await connection.execute(
    `INSERT INTO poetCards (poetName, dynasty, imageUrl, rarity, description, signaturePoem)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [c.poetName, c.dynasty, c.imageUrl, c.rarity, c.description, c.signaturePoem]
  );
}
console.log(`✅ 插入 ${cardData.length} 张诗人卡牌`);

await connection.end();
console.log("\n🎉 V2 数据填充完成！");
