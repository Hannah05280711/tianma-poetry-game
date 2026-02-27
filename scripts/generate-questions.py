#!/usr/bin/env python3
"""
从 chinese-poetry 数据集自动生成诗词题目
数据源：元曲、花间集（五代诗词）、南唐二主、曹操诗集、纳兰性德、楚辞
生成题型：填空题（挖词）、作者匹配题、朝代判断题
"""

import json
import random
import re
import os
import mysql.connector
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env")

DATA_DIR = "/home/ubuntu/chinese-poetry-data"

# ─── 诗人 ID 映射（与数据库中的 poets 表对应）───────────────────────────────
# 从数据库查询实际 ID
POET_NAME_MAP = {
    # 元曲
    "关汉卿": None, "马致远": None, "张养浩": None, "白朴": None, "郑光祖": None,
    "王实甫": None, "乔吉": None, "张可久": None,
    # 花间集/五代
    "温庭筠": None, "韦庄": None, "冯延巳": None, "李煜": None, "李璟": None,
    "花蕊夫人": None,
    # 曹操
    "曹操": None,
    # 纳兰性德
    "纳兰性德": None,
    # 楚辞（屈原）
    "屈原": None,
}

# 难度映射
DIFFICULTY_MAP = {
    "元曲": 3,       # 黄金关
    "花间集": 3,     # 黄金关
    "南唐": 3,       # 黄金关
    "曹操": 4,       # 铂金关
    "纳兰性德": 3,   # 黄金关
    "楚辞": 5,       # 王者关
}

# 题型分布
QUESTION_TYPES = ["fill", "fill", "fill", "choice_author", "choice_dynasty"]

def clean_text(text):
    """清理文本，去除注释、标点等"""
    # 去除括号内容
    text = re.sub(r'[（(][^）)]*[）)]', '', text)
    # 去除方括号
    text = re.sub(r'[【\[][^\]】]*[】\]]', '', text)
    # 去除多余空格
    text = text.strip()
    return text

def get_sentence_parts(paragraphs):
    """从段落中提取合适的句子（4-12字的句子）"""
    sentences = []
    for para in paragraphs:
        # 按标点分割
        parts = re.split(r'[，。！？；、\n]', para)
        for part in parts:
            part = clean_text(part)
            if 4 <= len(part) <= 14:
                sentences.append(part)
    return sentences

def make_fill_question(sentence, author, title, poet_id, difficulty, source_name):
    """生成填空题：挖去句子中的一个词（2-3字）"""
    if len(sentence) < 5:
        return None
    
    # 找合适的挖空位置（避免首尾）
    candidates = []
    for start in range(1, len(sentence) - 2):
        for length in [2, 3]:
            end = start + length
            if end <= len(sentence) - 1:
                word = sentence[start:end]
                # 避免挖掉标点
                if not re.search(r'[，。！？；、\s]', word):
                    candidates.append((start, end, word))
    
    if not candidates:
        return None
    
    # 随机选择挖空位置
    start, end, answer = random.choice(candidates)
    content = sentence[:start] + "___" + sentence[end:]
    
    # 生成干扰选项（从其他句子中随机取同长度词）
    return {
        "content": f'填入空缺处：「{content}」',
        "answer": answer,
        "type": "fill",
        "author": author,
        "title": title,
        "poet_id": poet_id,
        "difficulty": difficulty,
        "source": source_name,
        "sentence": sentence,
    }

def make_author_question(sentence, correct_author, all_authors, title, poet_id, difficulty, source_name):
    """生成作者匹配题"""
    wrong_authors = [a for a in all_authors if a != correct_author]
    if len(wrong_authors) < 3:
        return None
    
    options = [correct_author] + random.sample(wrong_authors, 3)
    random.shuffle(options)
    
    return {
        "content": f'「{sentence}」的作者是？',
        "answer": correct_author,
        "options": options,
        "type": "choice_author",
        "author": correct_author,
        "title": title,
        "poet_id": poet_id,
        "difficulty": difficulty,
        "source": source_name,
    }

def make_dynasty_question(title, author, correct_dynasty, all_dynasties, poet_id, difficulty, source_name):
    """生成朝代判断题"""
    wrong_dynasties = [d for d in all_dynasties if d != correct_dynasty]
    if len(wrong_dynasties) < 3:
        return None
    
    options = [correct_dynasty] + random.sample(wrong_dynasties, 3)
    random.shuffle(options)
    
    return {
        "content": f'{author}的《{title}》属于哪个朝代的作品？',
        "answer": correct_dynasty,
        "options": options,
        "type": "choice_dynasty",
        "author": author,
        "title": title,
        "poet_id": poet_id,
        "difficulty": difficulty,
        "source": source_name,
    }

def load_yuanqu():
    """加载元曲数据"""
    path = f"{DATA_DIR}/元曲/yuanqu.json"
    data = json.load(open(path, encoding='utf-8'))
    print(f"元曲：{len(data)} 条")
    return data

def load_huajianji():
    """加载花间集数据"""
    import glob
    files = sorted(glob.glob(f"{DATA_DIR}/五代诗词/huajianji/huajianji-*-juan.json"))
    all_data = []
    for f in files:
        d = json.load(open(f, encoding='utf-8'))
        all_data.extend(d)
    print(f"花间集：{len(all_data)} 条")
    return all_data

def load_nantang():
    """加载南唐二主数据"""
    path = f"{DATA_DIR}/五代诗词/nantang/poetrys.json"
    data = json.load(open(path, encoding='utf-8'))
    print(f"南唐二主：{len(data)} 条")
    return data

def load_caocao():
    """加载曹操诗集"""
    path = f"{DATA_DIR}/曹操诗集/caocao.json"
    data = json.load(open(path, encoding='utf-8'))
    print(f"曹操诗集：{len(data)} 条")
    return data

def load_nalan():
    """加载纳兰性德"""
    path = f"{DATA_DIR}/纳兰性德/纳兰性德诗集.json"
    data = json.load(open(path, encoding='utf-8'))
    print(f"纳兰性德：{len(data)} 条")
    return data

def load_chuci():
    """加载楚辞"""
    path = f"{DATA_DIR}/楚辞/chuci.json"
    data = json.load(open(path, encoding='utf-8'))
    print(f"楚辞：{len(data)} 条")
    return data

def generate_distractors(answer, all_words, count=3):
    """生成干扰选项（与答案同长度的词）"""
    target_len = len(answer)
    candidates = [w for w in all_words if len(w) == target_len and w != answer]
    if len(candidates) < count:
        # 补充常见词
        fallbacks = {
            2: ["明月", "春风", "秋水", "白云", "青山", "红叶", "寒梅", "玉露", "金风", "碧波",
                "花落", "雁归", "霜降", "雪飞", "烟雨", "江南", "塞北", "长安", "洛阳", "扬州"],
            3: ["不知处", "何处去", "无人问", "空自愁", "又一年", "望断肠", "泪满衫", "梦难成",
                "天涯路", "故园情", "相思苦", "离别恨", "春已去", "月如钩"],
        }
        extras = fallbacks.get(target_len, ["其他", "不知", "无处", "空余"])
        candidates.extend([e for e in extras if e != answer])
    
    selected = random.sample(candidates[:50], min(count, len(candidates)))
    while len(selected) < count:
        selected.append(f"选项{len(selected)+1}")
    return selected

def main():
    # 连接数据库
    db_url = os.environ.get("DATABASE_URL", "")
    # 解析 mysql://user:pass@host:port/dbname?ssl=...
    import re as re2
    m = re2.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)', db_url)
    if not m:
        print("无法解析 DATABASE_URL:", db_url[:50])
        return
    
    conn = mysql.connector.connect(
        user=m.group(1), password=m.group(2),
        host=m.group(3), port=int(m.group(4)),
        database=m.group(5),
        ssl_disabled=False,
        ssl_verify_cert=False,
        ssl_verify_identity=False,
        connection_timeout=30
    )
    cursor = conn.cursor(dictionary=True)
    
    # 获取数据库中的诗人 ID
    cursor.execute("SELECT id, name FROM poets")
    poets_in_db = {row['name']: row['id'] for row in cursor.fetchall()}
    print(f"数据库中诗人：{list(poets_in_db.keys())}")
    
    # 更新 POET_NAME_MAP
    for name in POET_NAME_MAP:
        POET_NAME_MAP[name] = poets_in_db.get(name)
    
    # 获取现有题目数量
    cursor.execute("SELECT COUNT(*) as cnt FROM questions")
    existing = cursor.fetchone()['cnt']
    print(f"现有题目：{existing} 道")
    
    # ─── 收集所有词汇用于生成干扰选项 ───────────────────────────────────────
    all_words_2 = []  # 2字词
    all_words_3 = []  # 3字词
    
    # ─── 生成题目 ─────────────────────────────────────────────────────────────
    questions = []
    all_dynasties = ["唐", "宋", "元", "明", "清", "五代", "先秦", "汉", "魏晋"]
    
    # 收集所有作者用于干扰选项
    all_authors_pool = list(poets_in_db.keys()) + [
        "欧阳修", "晏殊", "柳永", "秦观", "周邦彦", "姜夔", "吴文英",
        "贺知章", "张九龄", "孟浩然", "王昌龄", "高适", "岑参", "韩愈",
        "刘禹锡", "柳宗元", "杜牧", "李商隐", "温庭筠", "韦庄"
    ]
    
    # ─── 1. 元曲 ──────────────────────────────────────────────────────────────
    print("\n处理元曲...")
    yuanqu_data = load_yuanqu()
    yuanqu_authors = list(set(d.get('author', '') for d in yuanqu_data if d.get('author')))
    
    # 只取有作者信息的，且作者在数据库中的
    yuanqu_selected = [d for d in yuanqu_data if d.get('author') in poets_in_db or d.get('author') in yuanqu_authors]
    random.shuffle(yuanqu_selected)
    
    yuanqu_count = 0
    for item in yuanqu_selected[:200]:
        author = item.get('author', '佚名')
        title = item.get('title', '无题')
        paragraphs = item.get('paragraphs', [])
        poet_id = POET_NAME_MAP.get(author) or poets_in_db.get(author)
        
        sentences = get_sentence_parts(paragraphs)
        if not sentences:
            continue
        
        # 收集词汇
        for s in sentences:
            for i in range(len(s)-1):
                all_words_2.append(s[i:i+2])
            for i in range(len(s)-2):
                all_words_3.append(s[i:i+3])
        
        # 生成填空题
        for sentence in sentences[:2]:
            q = make_fill_question(sentence, author, title, poet_id, 3, "元曲")
            if q:
                questions.append(q)
                yuanqu_count += 1
                if yuanqu_count >= 80:
                    break
        
        # 生成作者题
        if len(sentences) > 0 and yuanqu_count < 100:
            q = make_author_question(sentences[0], author, yuanqu_authors + list(poets_in_db.keys()), title, poet_id, 3, "元曲")
            if q:
                questions.append(q)
                yuanqu_count += 1
        
        if yuanqu_count >= 100:
            break
    
    print(f"元曲生成：{yuanqu_count} 道")
    
    # ─── 2. 花间集 ────────────────────────────────────────────────────────────
    print("\n处理花间集...")
    huajianji_data = load_huajianji()
    huajianji_authors = list(set(d.get('author', '') for d in huajianji_data))
    
    huajianji_count = 0
    for item in huajianji_data:
        author = item.get('author', '佚名')
        title = item.get('title', '无题')
        paragraphs = item.get('paragraphs', [])
        poet_id = POET_NAME_MAP.get(author) or poets_in_db.get(author)
        
        sentences = get_sentence_parts(paragraphs)
        if not sentences:
            continue
        
        for sentence in sentences[:2]:
            q = make_fill_question(sentence, author, title, poet_id, 3, "花间集")
            if q:
                questions.append(q)
                huajianji_count += 1
        
        if len(sentences) > 0:
            q = make_author_question(sentences[0], author, huajianji_authors + list(poets_in_db.keys()), title, poet_id, 3, "花间集")
            if q:
                questions.append(q)
                huajianji_count += 1
        
        if huajianji_count >= 80:
            break
    
    print(f"花间集生成：{huajianji_count} 道")
    
    # ─── 3. 南唐二主 ──────────────────────────────────────────────────────────
    print("\n处理南唐二主...")
    nantang_data = load_nantang()
    nantang_authors = ["李煜", "李璟"]
    
    nantang_count = 0
    for item in nantang_data:
        author = item.get('author', '佚名')
        title = item.get('title', '无题')
        paragraphs = item.get('paragraphs', [])
        poet_id = POET_NAME_MAP.get(author) or poets_in_db.get(author)
        
        sentences = get_sentence_parts(paragraphs)
        if not sentences:
            continue
        
        for sentence in sentences[:3]:
            q = make_fill_question(sentence, author, title, poet_id, 3, "南唐")
            if q:
                questions.append(q)
                nantang_count += 1
        
        if nantang_count >= 40:
            break
    
    print(f"南唐二主生成：{nantang_count} 道")
    
    # ─── 4. 曹操诗集 ──────────────────────────────────────────────────────────
    print("\n处理曹操诗集...")
    caocao_data = load_caocao()
    
    caocao_count = 0
    for item in caocao_data:
        author = "曹操"
        title = item.get('title', '无题')
        paragraphs = item.get('paragraphs', [])
        poet_id = POET_NAME_MAP.get(author) or poets_in_db.get(author)
        
        sentences = get_sentence_parts(paragraphs)
        if not sentences:
            continue
        
        for sentence in sentences[:3]:
            q = make_fill_question(sentence, author, title, poet_id, 4, "曹操诗集")
            if q:
                questions.append(q)
                caocao_count += 1
        
        # 作者题（曹操 vs 其他汉魏诗人）
        if len(sentences) > 0:
            wrong_authors = ["曹植", "曹丕", "王粲", "陈琳", "刘桢", "阮籍", "嵇康", "陶渊明"]
            q = make_author_question(sentences[0], author, [author] + wrong_authors, title, poet_id, 4, "曹操诗集")
            if q:
                questions.append(q)
                caocao_count += 1
    
    print(f"曹操诗集生成：{caocao_count} 道")
    
    # ─── 5. 纳兰性德 ──────────────────────────────────────────────────────────
    print("\n处理纳兰性德...")
    nalan_data = load_nalan()
    
    nalan_count = 0
    for item in nalan_data:
        author = "纳兰性德"
        title = item.get('title', '无题')
        # 纳兰性德数据用 para 字段
        paragraphs = item.get('para', item.get('paragraphs', []))
        poet_id = POET_NAME_MAP.get(author) or poets_in_db.get(author)
        
        sentences = get_sentence_parts(paragraphs)
        if not sentences:
            continue
        
        for sentence in sentences[:2]:
            q = make_fill_question(sentence, author, title, poet_id, 3, "纳兰性德")
            if q:
                questions.append(q)
                nalan_count += 1
        
        # 作者题
        if len(sentences) > 0:
            wrong_authors = ["苏轼", "辛弃疾", "李清照", "晏几道", "秦观", "柳永", "周邦彦", "姜夔"]
            q = make_author_question(sentences[0], author, [author] + wrong_authors, title, poet_id, 3, "纳兰性德")
            if q:
                questions.append(q)
                nalan_count += 1
        
        if nalan_count >= 60:
            break
    
    print(f"纳兰性德生成：{nalan_count} 道")
    
    # ─── 6. 楚辞 ──────────────────────────────────────────────────────────────
    print("\n处理楚辞...")
    chuci_data = load_chuci()
    
    chuci_count = 0
    for item in chuci_data:
        author = item.get('author', '屈原')
        title = item.get('title', '无题')
        paragraphs = item.get('content', item.get('paragraphs', []))
        poet_id = POET_NAME_MAP.get(author) or poets_in_db.get(author)
        
        if isinstance(paragraphs, str):
            paragraphs = [paragraphs]
        
        sentences = get_sentence_parts(paragraphs)
        if not sentences:
            continue
        
        for sentence in sentences[:2]:
            q = make_fill_question(sentence, author, title, poet_id, 5, "楚辞")
            if q:
                questions.append(q)
                chuci_count += 1
        
        if chuci_count >= 30:
            break
    
    print(f"楚辞生成：{chuci_count} 道")
    
    # ─── 补充干扰选项 ─────────────────────────────────────────────────────────
    print(f"\n共生成 {len(questions)} 道题目，正在补充干扰选项...")
    
    # 去重词汇
    all_words_2 = list(set(all_words_2))
    all_words_3 = list(set(all_words_3))
    
    # 为填空题生成选项
    final_questions = []
    for q in questions:
        if q['type'] == 'fill':
            answer = q['answer']
            answer_len = len(answer)
            word_pool = all_words_2 if answer_len == 2 else all_words_3
            distractors = generate_distractors(answer, word_pool, 3)
            options = [answer] + distractors
            random.shuffle(options)
            q['options'] = options
        
        # 确保有4个选项
        if 'options' not in q or len(q['options']) < 4:
            continue
        
        final_questions.append(q)
    
    print(f"有效题目：{len(final_questions)} 道")
    
    # ─── 插入数据库 ───────────────────────────────────────────────────────────
    print("\n插入数据库...")
    
    # 题型映射
    type_map = {
        'fill': 'fill',
        'choice_author': 'choice',
        'choice_dynasty': 'choice',
    }
    
    # 默认诗人 ID（李白）
    DEFAULT_POET_ID = 1
    
    # 标签映射
    tag_map = {
        '元曲': '元曲,元代,散曲',
        '花间集': '花间集,五代,词',
        '南唐': '南唐,五代,词',
        '曹操诗集': '曹操,汉末,乐府',
        '纳兰性德': '纳兰性德,清代,词',
        '楚辞': '楚辞,先秦,屈原',
    }
    
    inserted = 0
    skipped = 0
    
    for q in final_questions:
        try:
            options_json = json.dumps(q['options'], ensure_ascii=False)
            tags = tag_map.get(q['source'], q['source'])
            
            cursor.execute("""
                INSERT INTO questions 
                (content, questionType, options, correctAnswer, difficulty, 
                 sourcePoemTitle, sourcePoemAuthor, poetId, themeTag, explanation)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                q['content'],
                type_map.get(q['type'], 'fill'),
                options_json,
                q['answer'],
                q['difficulty'],
                q.get('title', ''),
                q.get('author', ''),
                q.get('poet_id') or DEFAULT_POET_ID,
                tags,
                f"出自{q.get('author', '')}《{q.get('title', '')}》",
            ))
            inserted += 1
        except Exception as e:
            skipped += 1
            if skipped <= 3:
                print(f"  跳过: {e}")
    
    conn.commit()
    
    # 最终统计
    cursor.execute("SELECT COUNT(*) as cnt FROM questions")
    total = cursor.fetchone()['cnt']
    
    print(f"\n✅ 完成！")
    print(f"  新增：{inserted} 道")
    print(f"  跳过：{skipped} 道")
    print(f"  数据库总题目：{total} 道")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    random.seed(42)
    main()
