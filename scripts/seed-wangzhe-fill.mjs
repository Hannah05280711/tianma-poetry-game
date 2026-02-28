/**
 * 王者关（difficulty=5）高难度填空题
 * 来源：冷僻诗词、生僻字句、不常见名篇
 * 题型：fill（填空），每题只填一个字
 */
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 查询诗人ID
const POET_IDS = {};
const [poets] = await conn.execute('SELECT id, name FROM poets');
for (const p of poets) POET_IDS[p.name] = p.id;

// 高难度填空题数据
// 格式：{ content, correct, options, poet, title }
// content 中用 __ 表示填空位置
const questions = [
  // 李白 - 冷僻名句
  { content: '抽刀断水水更流，举杯__愁愁更愁', correct: '消', options: ['消','销','忘','解'], poet: '李白', title: '宣州谢脁楼饯别校书叔云' },
  { content: '长风破浪会有时，直挂云帆__沧海', correct: '济', options: ['济','渡','越','过'], poet: '李白', title: '行路难' },
  { content: '天生我材必有用，千金散尽__复来', correct: '还', options: ['还','再','复','皆'], poet: '李白', title: '将进酒' },
  { content: '弃我去者，昨日之日不可__', correct: '留', options: ['留','挽','追','回'], poet: '李白', title: '宣州谢脁楼饯别校书叔云' },
  { content: '俱怀逸兴壮思飞，欲上青天__明月', correct: '揽', options: ['揽','摘','取','抱'], poet: '李白', title: '宣州谢脁楼饯别校书叔云' },

  // 杜甫 - 冷僻名句
  { content: '出师未捷身先死，长使英雄__满襟', correct: '泪', options: ['泪','泣','哭','悲'], poet: '杜甫', title: '蜀相' },
  { content: '星垂平野阔，月__大江流', correct: '涌', options: ['涌','映','照','落'], poet: '杜甫', title: '旅夜书怀' },
  { content: '名岂文章著，官应老病__', correct: '休', options: ['休','辞','归','闲'], poet: '杜甫', title: '旅夜书怀' },
  { content: '此曲只应天上有，人间能得几回__', correct: '闻', options: ['闻','听','赏','知'], poet: '杜甫', title: '赠花卿' },
  { content: '烽火连三月，家书抵万__', correct: '金', options: ['金','银','钱','两'], poet: '杜甫', title: '春望' },

  // 王维 - 冷僻名句
  { content: '渭城朝雨浥轻尘，客舍青青柳色__', correct: '新', options: ['新','青','绿','深'], poet: '王维', title: '送元二使安西' },
  { content: '独坐幽篁里，弹琴复长__', correct: '啸', options: ['啸','吟','歌','鸣'], poet: '王维', title: '竹里馆' },
  { content: '深林人不知，明月来相__', correct: '照', options: ['照','映','临','望'], poet: '王维', title: '竹里馆' },
  { content: '劝君更尽一杯酒，西出阳关无故__', correct: '人', options: ['人','友','伴','知'], poet: '王维', title: '送元二使安西' },
  { content: '红豆生南国，春来发几__', correct: '枝', options: ['枝','芽','叶','花'], poet: '王维', title: '相思' },

  // 苏轼 - 冷僻名句
  { content: '人有悲欢离合，月有阴晴__缺', correct: '圆', options: ['圆','晦','明','盈'], poet: '苏轼', title: '水调歌头' },
  { content: '不识庐山真面目，只缘身在此山__', correct: '中', options: ['中','里','内','间'], poet: '苏轼', title: '题西林壁' },
  { content: '横看成岭侧成峰，远近高低各不__', correct: '同', options: ['同','一','齐','等'], poet: '苏轼', title: '题西林壁' },
  { content: '竹外桃花三两枝，春江水暖鸭先__', correct: '知', options: ['知','觉','感','闻'], poet: '苏轼', title: '惠崇春江晚景' },
  { content: '欲把西湖比西子，淡妆浓抹总相__', correct: '宜', options: ['宜','宜','美','好'], poet: '苏轼', title: '饮湖上初晴后雨' },

  // 李清照 - 冷僻名句
  { content: '寻寻觅觅，冷冷清清，凄凄惨惨__戚', correct: '戚', options: ['戚','悲','哀','泣'], poet: '李清照', title: '声声慢' },
  { content: '莫道不销魂，帘卷西风，人比黄花__', correct: '瘦', options: ['瘦','薄','淡','细'], poet: '李清照', title: '醉花阴' },
  { content: '生当作人杰，死亦为鬼__', correct: '雄', options: ['雄','英','豪','杰'], poet: '李清照', title: '夏日绝句' },
  { content: '知否知否，应是绿肥红__', correct: '瘦', options: ['瘦','少','稀','淡'], poet: '李清照', title: '如梦令' },

  // 辛弃疾 - 冷僻名句
  { content: '醉里挑灯看剑，梦回吹角连__', correct: '营', options: ['营','阵','军','旗'], poet: '辛弃疾', title: '破阵子' },
  { content: '把吴钩看了，栏杆拍遍，无人会，登临__意', correct: '客', options: ['客','愁','悲','苦'], poet: '辛弃疾', title: '水龙吟' },
  { content: '稻花香里说丰年，听取蛙声__片', correct: '一', options: ['一','几','数','满'], poet: '辛弃疾', title: '西江月' },
  { content: '七八个星天外，两三点雨山__', correct: '前', options: ['前','间','中','里'], poet: '辛弃疾', title: '西江月' },

  // 白居易 - 冷僻名句
  { content: '同是天涯沦落人，相逢何必曾相__', correct: '识', options: ['识','知','见','遇'], poet: '白居易', title: '琵琶行' },
  { content: '千呼万唤始出来，犹抱琵琶半遮__', correct: '面', options: ['面','脸','容','颜'], poet: '白居易', title: '琵琶行' },
  { content: '在天愿作比翼鸟，在地愿为连理__', correct: '枝', options: ['枝','树','木','根'], poet: '白居易', title: '长恨歌' },
  { content: '回眸一笑百媚生，六宫粉黛无颜__', correct: '色', options: ['色','貌','容','面'], poet: '白居易', title: '长恨歌' },

  // 陆游 - 冷僻名句
  { content: '王师北定中原日，家祭无忘告乃__', correct: '翁', options: ['翁','父','祖','公'], poet: '陆游', title: '示儿' },
  { content: '死去元知万事空，但悲不见九州__', correct: '同', options: ['同','统','一','合'], poet: '陆游', title: '示儿' },
  { content: '山重水复疑无路，柳暗花明又一__', correct: '村', options: ['村','景','境','天'], poet: '陆游', title: '游山西村' },
  { content: '僵卧孤村不自哀，尚思为国戍轮__', correct: '台', options: ['台','疆','边','关'], poet: '陆游', title: '十一月四日风雨大作' },

  // 纳兰性德 - 冷僻名句
  { content: '一生一代一双人，争教两处销魂。相思相望不相__', correct: '亲', options: ['亲','近','逢','见'], poet: '纳兰性德', title: '画堂春' },
  { content: '赌书消得泼茶香，当时只道是寻__', correct: '常', options: ['常','平','普','凡'], poet: '纳兰性德', title: '浣溪沙' },
  { content: '被酒莫惊春睡重，赌书消得泼茶__', correct: '香', options: ['香','味','气','浓'], poet: '纳兰性德', title: '浣溪沙' },

  // 曹操 - 冷僻名句
  { content: '老骥伏枥，志在千里；烈士暮年，壮心不__', correct: '已', options: ['已','止','息','灭'], poet: '曹操', title: '龟虽寿' },
  { content: '神龟虽寿，犹有竟时；腾蛇乘雾，终为土__', correct: '灰', options: ['灰','尘','泥','埃'], poet: '曹操', title: '龟虽寿' },
  { content: '对酒当歌，人生几何？譬如朝露，去日苦__', correct: '多', options: ['多','长','久','短'], poet: '曹操', title: '短歌行' },
  { content: '青青子衿，悠悠我心。但为君故，沉吟至__', correct: '今', options: ['今','此','斯','久'], poet: '曹操', title: '短歌行' },

  // 屈原 - 冷僻名句
  { content: '路漫漫其修远兮，吾将上下而求__', correct: '索', options: ['索','寻','探','觅'], poet: '屈原', title: '离骚' },
  { content: '亦余心之所善兮，虽九死其犹未__', correct: '悔', options: ['悔','惧','怕','止'], poet: '屈原', title: '离骚' },

  // 柳永 - 冷僻名句
  { content: '执手相看泪眼，竟无语凝__', correct: '噎', options: ['噎','咽','塞','结'], poet: '柳永', title: '雨霖铃' },
  { content: '此去经年，应是良辰好景虚__', correct: '设', options: ['设','置','备','有'], poet: '柳永', title: '雨霖铃' },
  { content: '便纵有千种风情，更与何人__', correct: '说', options: ['说','诉','言','讲'], poet: '柳永', title: '雨霖铃' },

  // 李煜 - 冷僻名句
  { content: '剪不断，理还乱，是离愁，别是一番__在心头', correct: '滋', options: ['滋','味','情','苦'], poet: '李煜', title: '相见欢' },
  { content: '林花谢了春红，太匆匆，无奈朝来寒雨晚来__', correct: '风', options: ['风','霜','雪','雨'], poet: '李煜', title: '相见欢' },
  { content: '问君能有几多愁，恰似一江春水向东__', correct: '流', options: ['流','去','逝','走'], poet: '李煜', title: '虞美人' },

  // 温庭筠 - 冷僻名句
  { content: '梳洗罢，独倚望江楼。过尽千帆皆不是，斜晖脉脉水悠__', correct: '悠', options: ['悠','长','远','深'], poet: '温庭筠', title: '望江南' },
  { content: '小山重叠金明灭，鬓云欲度香腮__', correct: '雪', options: ['雪','白','玉','素'], poet: '温庭筠', title: '菩萨蛮' },

  // 晏殊 - 冷僻名句
  { content: '无可奈何花落去，似曾相识燕归__', correct: '来', options: ['来','飞','回','还'], poet: '晏殊', title: '浣溪沙' },
  { content: '一曲新词酒一杯，去年天气旧亭__', correct: '台', options: ['台','阁','楼','轩'], poet: '晏殊', title: '浣溪沙' },

  // 欧阳修 - 冷僻名句
  { content: '醉翁之意不在酒，在乎山水之间__', correct: '也', options: ['也','矣','哉','焉'], poet: '欧阳修', title: '醉翁亭记' },
  { content: '野芳发而幽香，佳木秀而繁__', correct: '阴', options: ['阴','荫','茂','密'], poet: '欧阳修', title: '醉翁亭记' },

  // 秦观 - 冷僻名句
  { content: '两情若是久长时，又岂在朝朝__暮', correct: '暮', options: ['暮','夕','晚','昏'], poet: '秦观', title: '鹊桥仙' },
  { content: '纤云弄巧，飞星传恨，银汉迢迢暗__度', correct: '渡', options: ['渡','越','过','穿'], poet: '秦观', title: '鹊桥仙' },

  // 范仲淹 - 冷僻名句
  { content: '先天下之忧而忧，后天下之乐而__', correct: '乐', options: ['乐','喜','欢','悦'], poet: '范仲淹', title: '岳阳楼记' },
  { content: '浊酒一杯家万里，燕然未勒归无__', correct: '计', options: ['计','期','望','路'], poet: '范仲淹', title: '渔家傲' },
];

// 查看当前最大ID
const [maxRow] = await conn.execute('SELECT MAX(id) as maxId FROM questions');
let nextId = (maxRow[0].maxId || 200) + 1;

let inserted = 0;
for (const q of questions) {
  const poetId = POET_IDS[q.poet] ?? null;
  if (!poetId) {
    console.log(`跳过：找不到诗人 ${q.poet}`);
    continue;
  }
  // 随机打乱选项顺序
  const shuffled = [...q.options].sort(() => Math.random() - 0.5);
  await conn.execute(
    'INSERT INTO questions (id, content, questionType, difficulty, correctAnswer, options, poetId, sourcePoemTitle, sourcePoemAuthor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [nextId++, q.content, 'fill', 5, q.correct, JSON.stringify(shuffled), poetId, q.title, q.poet]
  );
  inserted++;
}

console.log(`\n✅ 成功插入 ${inserted} 道王者关高难度填空题`);

const [total] = await conn.execute('SELECT COUNT(*) as cnt FROM questions WHERE difficulty=5');
console.log(`王者关现有题目总数: ${total[0].cnt}`);

const [allTotal] = await conn.execute('SELECT COUNT(*) as cnt FROM questions');
console.log(`全库题目总数: ${allTotal[0].cnt}`);

await conn.end();
