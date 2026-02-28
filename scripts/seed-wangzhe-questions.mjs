/**
 * 补充王者关（difficulty=5）飞花令题目
 * 格式：飞花令·[关键字]：以下哪句含"[字]"字且出自[诗人]？
 * 目标：从12道扩充到50+道，支持多局不重复
 */
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 飞花令题目数据
// 格式：{ keyword, poet, correct, wrong1, wrong2, wrong3, poetId }
// poetId 对应数据库中的诗人ID（需要先查询）
const POET_IDS = {};
const [poets] = await conn.execute('SELECT id, name FROM poets');
for (const p of poets) {
  POET_IDS[p.name] = p.id;
}
console.log('诗人ID映射:', POET_IDS);

const questions = [
  // 李白
  { keyword: '水', poet: '李白', correct: '桃花潭水深千尺，不及汪伦送我情', wrong: ['水光潋滟晴方好，山色空蒙雨亦奇', '君不见黄河之水天上来，奔流到海不复回', '问君能有几多愁，恰似一江春水向东流'] },
  { keyword: '云', poet: '李白', correct: '云想衣裳花想容，春风拂槛露华浓', wrong: ['黄鹤一去不复返，白云千载空悠悠', '行到水穷处，坐看云起时', '只在此山中，云深不知处'] },
  { keyword: '天', poet: '李白', correct: '飞流直下三千尺，疑是银河落九天', wrong: ['天街小雨润如酥，草色遥看近却无', '春眠不觉晓，处处闻啼鸟', '天下伤心处，劳劳送客亭'] },
  { keyword: '酒', poet: '李白', correct: '人生得意须尽欢，莫使金樽空对月', wrong: ['劝君更尽一杯酒，西出阳关无故人', '葡萄美酒夜光杯，欲饮琵琶马上催', '明日隔山岳，世事两茫茫'] },
  { keyword: '江', poet: '李白', correct: '孤帆远影碧空尽，唯见长江天际流', wrong: ['大江东去，浪淘尽，千古风流人物', '滚滚长江东逝水，浪花淘尽英雄', '江碧鸟逾白，山青花欲燃'] },
  { keyword: '夜', poet: '李白', correct: '举杯邀明月，对影成三人', wrong: ['夜来风雨声，花落知多少', '姑苏城外寒山寺，夜半钟声到客船', '烽火连三月，家书抵万金'] },

  // 杜甫
  { keyword: '花', poet: '杜甫', correct: '感时花溅泪，恨别鸟惊心', wrong: ['花自飘零水自流，一种相思，两处闲愁', '落红不是无情物，化作春泥更护花', '人面不知何处去，桃花依旧笑春风'] },
  { keyword: '雨', poet: '杜甫', correct: '随风潜入夜，润物细无声', wrong: ['清明时节雨纷纷，路上行人欲断魂', '空山新雨后，天气晚来秋', '夜来风雨声，花落知多少'] },
  { keyword: '风', poet: '杜甫', correct: '烽火连三月，家书抵万金', wrong: ['春风又绿江南岸，明月何时照我还', '野火烧不尽，春风吹又生', '羌笛何须怨杨柳，春风不度玉门关'] },
  { keyword: '山', poet: '杜甫', correct: '会当凌绝顶，一览众山小', wrong: ['采菊东篱下，悠然见南山', '空山新雨后，天气晚来秋', '横看成岭侧成峰，远近高低各不同'] },
  { keyword: '秋', poet: '杜甫', correct: '无边落木萧萧下，不尽长江滚滚来', wrong: ['自古逢秋悲寂寥，我言秋日胜春朝', '枯藤老树昏鸦，小桥流水人家', '停车坐爱枫林晚，霜叶红于二月花'] },

  // 王维
  { keyword: '鸟', poet: '王维', correct: '月出惊山鸟，时鸣春涧中', wrong: ['两个黄鹂鸣翠柳，一行白鹭上青天', '春眠不觉晓，处处闻啼鸟', '蝉噪林逾静，鸟鸣山更幽'] },
  { keyword: '水', poet: '王维', correct: '行到水穷处，坐看云起时', wrong: ['桃花潭水深千尺，不及汪伦送我情', '水光潋滟晴方好，山色空蒙雨亦奇', '问君能有几多愁，恰似一江春水向东流'] },
  { keyword: '日', poet: '王维', correct: '大漠孤烟直，长河落日圆', wrong: ['日照香炉生紫烟，遥看瀑布挂前川', '白日依山尽，黄河入海流', '日出江花红胜火，春来江水绿如蓝'] },
  { keyword: '松', poet: '王维', correct: '明月松间照，清泉石上流', wrong: ['大雪压青松，青松挺且直', '松下问童子，言师采药去', '岁寒，然后知松柏之后凋也'] },

  // 苏轼
  { keyword: '月', poet: '苏轼', correct: '但愿人长久，千里共婵娟', wrong: ['举头望明月，低头思故乡', '床前明月光，疑是地上霜', '明月几时有，把酒问青天'] },
  { keyword: '水', poet: '苏轼', correct: '大江东去，浪淘尽，千古风流人物', wrong: ['桃花潭水深千尺，不及汪伦送我情', '水光潋滟晴方好，山色空蒙雨亦奇', '问君能有几多愁，恰似一江春水向东流'] },
  { keyword: '竹', poet: '苏轼', correct: '宁可食无肉，不可居无竹', wrong: ['竹外桃花三两枝，春江水暖鸭先知', '独坐幽篁里，弹琴复长啸', '咬定青山不放松，立根原在破岩中'] },
  { keyword: '雪', poet: '苏轼', correct: '欲把西湖比西子，淡妆浓抹总相宜', wrong: ['忽如一夜春风来，千树万树梨花开', '柴门闻犬吠，风雪夜归人', '孤舟蓑笠翁，独钓寒江雪'] },

  // 李清照
  { keyword: '风', poet: '李清照', correct: '昨夜雨疏风骤，浓睡不消残酒', wrong: ['春风又绿江南岸，明月何时照我还', '野火烧不尽，春风吹又生', '羌笛何须怨杨柳，春风不度玉门关'] },
  { keyword: '酒', poet: '李清照', correct: '三杯两盏淡酒，怎敌他、晚来风急', wrong: ['劝君更尽一杯酒，西出阳关无故人', '葡萄美酒夜光杯，欲饮琵琶马上催', '人生得意须尽欢，莫使金樽空对月'] },
  { keyword: '雁', poet: '李清照', correct: '云中谁寄锦书来？雁字回时，月满西楼', wrong: ['塞下秋来风景异，衡阳雁去无留意', '征蓬出汉塞，归雁入胡天', '乡书何处达，归雁洛阳边'] },
  { keyword: '梅', poet: '李清照', correct: '墙角数枝梅，凌寒独自开', wrong: ['疏影横斜水清浅，暗香浮动月黄昏', '遥知不是雪，为有暗香来', '零落成泥碾作尘，只有香如故'] },

  // 辛弃疾
  { keyword: '月', poet: '辛弃疾', correct: '明月别枝惊鹊，清风半夜鸣蝉', wrong: ['举头望明月，低头思故乡', '床前明月光，疑是地上霜', '但愿人长久，千里共婵娟'] },
  { keyword: '山', poet: '辛弃疾', correct: '青山遮不住，毕竟东流去', wrong: ['采菊东篱下，悠然见南山', '会当凌绝顶，一览众山小', '横看成岭侧成峰，远近高低各不同'] },
  { keyword: '灯', poet: '辛弃疾', correct: '众里寻他千百度，蓦然回首，那人却在灯火阑珊处', wrong: ['何当共剪西窗烛，却话巴山夜雨时', '春蚕到死丝方尽，蜡炬成灰泪始干', '举杯邀明月，对影成三人'] },
  { keyword: '英雄', poet: '辛弃疾', correct: '了却君王天下事，赢得生前身后名', wrong: ['大江东去，浪淘尽，千古风流人物', '生当作人杰，死亦为鬼雄', '男儿何不带吴钩，收取关山五十州'] },

  // 白居易
  { keyword: '春', poet: '白居易', correct: '日出江花红胜火，春来江水绿如蓝', wrong: ['国破山河在，城春草木深', '春眠不觉晓，处处闻啼鸟', '春风又绿江南岸，明月何时照我还'] },
  { keyword: '雪', poet: '白居易', correct: '绿蚁新醅酒，红泥小火炉', wrong: ['忽如一夜春风来，千树万树梨花开', '柴门闻犬吠，风雪夜归人', '孤舟蓑笠翁，独钓寒江雪'] },
  { keyword: '花', poet: '白居易', correct: '乱花渐欲迷人眼，浅草才能没马蹄', wrong: ['感时花溅泪，恨别鸟惊心', '花自飘零水自流，一种相思，两处闲愁', '落红不是无情物，化作春泥更护花'] },

  // 陶渊明
  { keyword: '菊', poet: '陶渊明', correct: '采菊东篱下，悠然见南山', wrong: ['不是花中偏爱菊，此花开尽更无花', '待到秋来九月八，我花开后百花杀', '宁可枝头抱香死，何曾吹落北风中'] },
  { keyword: '酒', poet: '陶渊明', correct: '结庐在人境，而无车马喧', wrong: ['劝君更尽一杯酒，西出阳关无故人', '葡萄美酒夜光杯，欲饮琵琶马上催', '人生得意须尽欢，莫使金樽空对月'] },

  // 柳永
  { keyword: '雨', poet: '柳永', correct: '今宵酒醒何处？杨柳岸，晓风残月', wrong: ['清明时节雨纷纷，路上行人欲断魂', '空山新雨后，天气晚来秋', '夜来风雨声，花落知多少'] },
  { keyword: '秋', poet: '柳永', correct: '多情自古伤离别，更那堪冷落清秋节', wrong: ['自古逢秋悲寂寥，我言秋日胜春朝', '枯藤老树昏鸦，小桥流水人家', '停车坐爱枫林晚，霜叶红于二月花'] },

  // 曹操
  { keyword: '月', poet: '曹操', correct: '月明星稀，乌鹊南飞', wrong: ['举头望明月，低头思故乡', '床前明月光，疑是地上霜', '但愿人长久，千里共婵娟'] },
  { keyword: '海', poet: '曹操', correct: '东临碣石，以观沧海', wrong: ['海上生明月，天涯共此时', '春江潮水连海平，海上明月共潮生', '君不见黄河之水天上来，奔流到海不复回'] },

  // 纳兰性德
  { keyword: '雪', poet: '纳兰性德', correct: '风一更，雪一更，聒碎乡心梦不成', wrong: ['忽如一夜春风来，千树万树梨花开', '柴门闻犬吠，风雪夜归人', '孤舟蓑笠翁，独钓寒江雪'] },
  { keyword: '人', poet: '纳兰性德', correct: '人生若只如初见，何事秋风悲画扇', wrong: ['人生自古谁无死，留取丹心照汗青', '人面不知何处去，桃花依旧笑春风', '人有悲欢离合，月有阴晴圆缺'] },

  // 屈原
  { keyword: '香', poet: '屈原', correct: '扈江离与辟芷兮，纫秋兰以为佩', wrong: ['疏影横斜水清浅，暗香浮动月黄昏', '遥知不是雪，为有暗香来', '零落成泥碾作尘，只有香如故'] },

  // 陆游
  { keyword: '梅', poet: '陆游', correct: '零落成泥碾作尘，只有香如故', wrong: ['墙角数枝梅，凌寒独自开', '疏影横斜水清浅，暗香浮动月黄昏', '遥知不是雪，为有暗香来'] },
  { keyword: '剑', poet: '陆游', correct: '夜阑卧听风吹雨，铁马冰河入梦来', wrong: ['了却君王天下事，赢得生前身后名', '男儿何不带吴钩，收取关山五十州', '生当作人杰，死亦为鬼雄'] },

  // 王昌龄
  { keyword: '月', poet: '王昌龄', correct: '秦时明月汉时关，万里长征人未还', wrong: ['举头望明月，低头思故乡', '床前明月光，疑是地上霜', '但愿人长久，千里共婵娟'] },

  // 孟浩然
  { keyword: '春', poet: '孟浩然', correct: '春眠不觉晓，处处闻啼鸟', wrong: ['国破山河在，城春草木深', '日出江花红胜火，春来江水绿如蓝', '春风又绿江南岸，明月何时照我还'] },

  // 王之涣
  { keyword: '黄河', poet: '王之涣', correct: '白日依山尽，黄河入海流', wrong: ['君不见黄河之水天上来，奔流到海不复回', '大漠孤烟直，长河落日圆', '黄河远上白云间，一片孤城万仞山'] },

  // 杜牧
  { keyword: '秋', poet: '杜牧', correct: '停车坐爱枫林晚，霜叶红于二月花', wrong: ['自古逢秋悲寂寥，我言秋日胜春朝', '枯藤老树昏鸦，小桥流水人家', '无边落木萧萧下，不尽长江滚滚来'] },
  { keyword: '春', poet: '杜牧', correct: '清明时节雨纷纷，路上行人欲断魂', wrong: ['国破山河在，城春草木深', '春眠不觉晓，处处闻啼鸟', '日出江花红胜火，春来江水绿如蓝'] },
];

// 查看现有最大ID
const [maxIdRow] = await conn.execute('SELECT MAX(id) as maxId FROM questions');
let nextId = (maxIdRow[0].maxId || 100) + 1;

let inserted = 0;
for (const q of questions) {
  const poetId = POET_IDS[q.poet] ?? null;
  if (!poetId) {
    console.log(`跳过：找不到诗人 ${q.poet}`);
    continue;
  }
  const content = `飞花令·${q.keyword}：以下哪句含"${q.keyword}"字且出自${q.poet}？`;
  const options = JSON.stringify([q.correct, ...q.wrong].sort(() => Math.random() - 0.5));
  await conn.execute(
    'INSERT INTO questions (id, content, questionType, difficulty, correctAnswer, options, poetId, sourcePoemTitle, sourcePoemAuthor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [nextId++, content, 'judge', 5, q.correct, options, poetId, null, q.poet]
  );
  inserted++;
}

console.log(`\n✅ 成功插入 ${inserted} 道王者关题目`);

// 验证
const [total] = await conn.execute('SELECT COUNT(*) as cnt FROM questions WHERE difficulty=5');
console.log(`王者关现有题目总数: ${total[0].cnt}`);

await conn.end();
