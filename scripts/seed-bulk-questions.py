#!/usr/bin/env python3
"""
大规模题目生成脚本
从 chinese-poetry 仓库的各数据集批量生成填空题
策略：从每句诗中随机挑选一个字作为填空，生成4个选项（1个正确+3个干扰项）
"""

import json
import os
import re
import random
import sys
import glob
import mysql.connector

# 数据库连接
DB_URL = os.environ.get("DATABASE_URL", "")
# 解析 mysql://user:pass@host:port/db
import re as _re
m = _re.match(r"mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)", DB_URL)
if not m:
    print("无法解析 DATABASE_URL:", DB_URL[:50])
    sys.exit(1)
conn = mysql.connector.connect(
    user=m.group(1), password=m.group(2),
    host=m.group(3), port=int(m.group(4)), database=m.group(5),
    ssl_disabled=False
)
cursor = conn.cursor()

# 获取诗人ID映射
cursor.execute("SELECT id, name FROM poets")
POET_IDS = {row[1]: row[0] for row in cursor.fetchall()}

# 获取当前最大ID
cursor.execute("SELECT MAX(id) FROM questions")
row = cursor.fetchone()
next_id = (row[0] or 200) + 1

# 常用汉字池（用于生成干扰选项）
COMMON_CHARS = list("月花风雨春秋山水云天日夜人心情思归来去时年岁长深远高明白绿红青黑暗光影声色香味冷热寒暖晴阴晚早朝暮东西南北前后左右上下内外中间")

def clean_line(line: str) -> str:
    """清理诗句，去除标点和注释"""
    # 去除括号内容（注释）
    line = re.sub(r'[（(][^）)]*[）)]', '', line)
    # 去除常见标点
    line = re.sub(r'[，。！？；：、""''「」『』【】〔〕《》〈〉…—～·\s]', '', line)
    return line.strip()

def is_valid_line(line: str) -> bool:
    """判断诗句是否适合出题（长度4-12个汉字）"""
    cleaned = clean_line(line)
    # 只保留汉字
    chars = re.findall(r'[\u4e00-\u9fff]', cleaned)
    return 4 <= len(chars) <= 14

def make_fill_question(line: str, poet_id: int, poet_name: str, title: str, difficulty: int):
    """从一句诗生成一道填空题"""
    # 找到所有汉字位置
    chars = [(i, c) for i, c in enumerate(line) if '\u4e00' <= c <= '\u9fff']
    if len(chars) < 4:
        return None
    
    # 随机选择一个字作为填空（避免选第一个字，因为太容易）
    # 优先选择中间位置的字
    mid_chars = [c for c in chars if c[0] > 1]
    if not mid_chars:
        mid_chars = chars
    idx, correct_char = random.choice(mid_chars)
    
    # 生成题目内容（用 __ 替换选中的字）
    content = line[:idx] + '__' + line[idx+1:]
    
    # 生成干扰选项（从常用字中选3个不同的字）
    distractors = []
    pool = [c for c in COMMON_CHARS if c != correct_char]
    random.shuffle(pool)
    for c in pool:
        if c not in distractors and c != correct_char:
            distractors.append(c)
        if len(distractors) == 3:
            break
    
    if len(distractors) < 3:
        return None
    
    options = [correct_char] + distractors
    random.shuffle(options)
    
    return {
        'content': content,
        'correct': correct_char,
        'options': options,
        'poet_id': poet_id,
        'title': title,
        'poet_name': poet_name,
        'difficulty': difficulty,
    }

def insert_question(q: dict, qid: int):
    cursor.execute(
        """INSERT INTO questions 
        (id, content, questionType, difficulty, correctAnswer, options, poetId, sourcePoemTitle, sourcePoemAuthor)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (qid, q['content'], 'fill', q['difficulty'],
         q['correct'], json.dumps(q['options'], ensure_ascii=False),
         q['poet_id'], q['title'][:100] if q['title'] else None,
         q['poet_name'])
    )

# ─── 数据集处理函数 ────────────────────────────────────────────────────────────

def process_poems(poems, get_author, get_title, get_lines, difficulty_fn, max_per_author=30, max_total=None):
    """通用诗词处理函数"""
    global next_id
    inserted = 0
    author_counts = {}
    
    for poem in poems:
        author = get_author(poem)
        title = get_title(poem)
        lines = get_lines(poem)
        
        if not author or not lines:
            continue
        
        poet_id = POET_IDS.get(author)
        if not poet_id:
            # 尝试模糊匹配
            for name, pid in POET_IDS.items():
                if author in name or name in author:
                    poet_id = pid
                    break
        if not poet_id:
            continue
        
        if author_counts.get(author, 0) >= max_per_author:
            continue
        
        difficulty = difficulty_fn(author, title)
        
        # 从每首诗中最多取2道题
        questions_from_poem = []
        for line in lines:
            if not is_valid_line(line):
                continue
            q = make_fill_question(line, poet_id, author, title, difficulty)
            if q:
                questions_from_poem.append(q)
            if len(questions_from_poem) >= 2:
                break
        
        for q in questions_from_poem:
            insert_question(q, next_id)
            next_id += 1
            inserted += 1
            author_counts[author] = author_counts.get(author, 0) + 1
        
        if max_total and inserted >= max_total:
            break
    
    return inserted

# ─── 1. 全唐诗 ────────────────────────────────────────────────────────────────
print("\n处理全唐诗...")
tang_files = sorted(glob.glob('/home/ubuntu/chinese-poetry/全唐诗/poet.tang.*.json'))
total_tang = 0
for f in tang_files[:20]:  # 取前20个文件（约20000首）
    poems = json.load(open(f, encoding='utf-8'))
    n = process_poems(
        poems,
        get_author=lambda p: p.get('author', ''),
        get_title=lambda p: p.get('title', ''),
        get_lines=lambda p: p.get('paragraphs', []),
        difficulty_fn=lambda a, t: random.choice([2, 3]),
        max_per_author=15,
        max_total=300
    )
    total_tang += n
    if total_tang >= 300:
        break
conn.commit()
print(f"  全唐诗插入: {total_tang} 道")

# ─── 2. 宋词 ──────────────────────────────────────────────────────────────────
print("处理宋词...")
ci_files = sorted(glob.glob('/home/ubuntu/chinese-poetry/宋词/ci.song.*.json'))
total_ci = 0
for f in ci_files[:15]:
    poems = json.load(open(f, encoding='utf-8'))
    n = process_poems(
        poems,
        get_author=lambda p: p.get('author', ''),
        get_title=lambda p: p.get('rhythmic', p.get('title', '')),
        get_lines=lambda p: p.get('paragraphs', []),
        difficulty_fn=lambda a, t: random.choice([3, 4]),
        max_per_author=20,
        max_total=300
    )
    total_ci += n
    if total_ci >= 300:
        break
conn.commit()
print(f"  宋词插入: {total_ci} 道")

# ─── 3. 元曲 ──────────────────────────────────────────────────────────────────
print("处理元曲...")
yuanqu = json.load(open('/home/ubuntu/chinese-poetry/元曲/yuanqu.json', encoding='utf-8'))
total_yq = process_poems(
    yuanqu,
    get_author=lambda p: p.get('author', ''),
    get_title=lambda p: p.get('title', ''),
    get_lines=lambda p: p.get('paragraphs', []),
    difficulty_fn=lambda a, t: random.choice([3, 4]),
    max_per_author=20,
    max_total=200
)
conn.commit()
print(f"  元曲插入: {total_yq} 道")

# ─── 4. 五代诗词-花间集 ────────────────────────────────────────────────────────
print("处理五代诗词-花间集...")
huajian_files = glob.glob('/home/ubuntu/chinese-poetry/五代诗词/huajianji/huajianji-*-juan.json')
total_hj = 0
for f in sorted(huajian_files):
    poems = json.load(open(f, encoding='utf-8'))
    n = process_poems(
        poems,
        get_author=lambda p: p.get('author', ''),
        get_title=lambda p: p.get('rhythmic', p.get('title', '')),
        get_lines=lambda p: p.get('paragraphs', []),
        difficulty_fn=lambda a, t: random.choice([3, 4]),
        max_per_author=30,
        max_total=150
    )
    total_hj += n
    if total_hj >= 150:
        break
conn.commit()
print(f"  花间集插入: {total_hj} 道")

# ─── 5. 五代诗词-南唐 ─────────────────────────────────────────────────────────
print("处理五代诗词-南唐...")
nantang = json.load(open('/home/ubuntu/chinese-poetry/五代诗词/nantang/poetrys.json', encoding='utf-8'))
total_nt = 0
for poem in nantang:
    author = poem.get('author', '')
    title = poem.get('rhythmic', poem.get('title', ''))
    lines = poem.get('paragraphs', [])
    poet_id = POET_IDS.get(author)
    if not poet_id:
        continue
    for line in lines[:3]:
        if not is_valid_line(line):
            continue
        q = make_fill_question(line, poet_id, author, title, 4)
        if q:
            insert_question(q, next_id)
            next_id += 1
            total_nt += 1
conn.commit()
print(f"  南唐插入: {total_nt} 道")

# ─── 6. 纳兰性德 ──────────────────────────────────────────────────────────────
print("处理纳兰性德...")
nalan = json.load(open('/home/ubuntu/chinese-poetry/纳兰性德/纳兰性德诗集.json', encoding='utf-8'))
total_nl = 0
poet_id = POET_IDS.get('纳兰性德')
if poet_id:
    for poem in nalan:
        title = poem.get('title', '')
        lines = poem.get('para', [])
        for line in lines[:2]:
            if not is_valid_line(line):
                continue
            q = make_fill_question(line, poet_id, '纳兰性德', title, random.choice([3, 4]))
            if q:
                insert_question(q, next_id)
                next_id += 1
                total_nl += 1
conn.commit()
print(f"  纳兰性德插入: {total_nl} 道")

# ─── 7. 曹操诗集 ──────────────────────────────────────────────────────────────
print("处理曹操诗集...")
caocao = json.load(open('/home/ubuntu/chinese-poetry/曹操诗集/caocao.json', encoding='utf-8'))
total_cc = 0
poet_id = POET_IDS.get('曹操')
if poet_id:
    for poem in caocao:
        title = poem.get('title', '')
        lines = poem.get('paragraphs', [])
        for line in lines[:3]:
            if not is_valid_line(line):
                continue
            q = make_fill_question(line, poet_id, '曹操', title, random.choice([4, 5]))
            if q:
                insert_question(q, next_id)
                next_id += 1
                total_cc += 1
conn.commit()
print(f"  曹操诗集插入: {total_cc} 道")

# ─── 8. 楚辞 ──────────────────────────────────────────────────────────────────
print("处理楚辞...")
chuci = json.load(open('/home/ubuntu/chinese-poetry/楚辞/chuci.json', encoding='utf-8'))
total_chuci = 0
for poem in chuci:
    author = poem.get('author', '屈原')
    title = poem.get('title', poem.get('section', ''))
    lines = poem.get('content', [])
    poet_id = POET_IDS.get(author)
    if not poet_id:
        poet_id = POET_IDS.get('屈原')
    if not poet_id:
        continue
    for line in lines[:3]:
        if not is_valid_line(line):
            continue
        q = make_fill_question(line, poet_id, author, title, 5)
        if q:
            insert_question(q, next_id)
            next_id += 1
            total_chuci += 1
conn.commit()
print(f"  楚辞插入: {total_chuci} 道")

# ─── 9. 水墨唐诗 ──────────────────────────────────────────────────────────────
print("处理水墨唐诗...")
shuimo = json.load(open('/home/ubuntu/chinese-poetry/水墨唐诗/shuimotangshi.json', encoding='utf-8'))
total_sm = process_poems(
    shuimo,
    get_author=lambda p: p.get('author', ''),
    get_title=lambda p: p.get('title', ''),
    get_lines=lambda p: p.get('paragraphs', []),
    difficulty_fn=lambda a, t: random.choice([2, 3]),
    max_per_author=10,
    max_total=150
)
conn.commit()
print(f"  水墨唐诗插入: {total_sm} 道")

# ─── 10. 幽梦影 ───────────────────────────────────────────────────────────────
print("处理幽梦影...")
youmengying = json.load(open('/home/ubuntu/chinese-poetry/幽梦影/youmengying.json', encoding='utf-8'))
total_ymy = 0
poet_id = POET_IDS.get('张潮')
# 幽梦影是散文格言，每条内容作为一道填空题
for item in youmengying:
    content_raw = item.get('content', '')
    if not content_raw or len(content_raw) < 8:
        continue
    # 找到句子中的汉字
    chars = [(i, c) for i, c in enumerate(content_raw) if '\u4e00' <= c <= '\u9fff']
    if len(chars) < 5:
        continue
    # 选中间一个字
    mid_chars = [c for c in chars if c[0] > 2 and c[0] < len(content_raw) - 2]
    if not mid_chars:
        continue
    idx, correct_char = random.choice(mid_chars)
    content = content_raw[:idx] + '__' + content_raw[idx+1:]
    distractors = []
    pool = [c for c in COMMON_CHARS if c != correct_char]
    random.shuffle(pool)
    for c in pool:
        if c not in distractors:
            distractors.append(c)
        if len(distractors) == 3:
            break
    if len(distractors) < 3:
        continue
    options = [correct_char] + distractors
    random.shuffle(options)
    # 幽梦影无作者ID，使用通用ID
    insert_question({
        'content': content,
        'correct': correct_char,
        'options': options,
        'poet_id': None,
        'title': '幽梦影',
        'poet_name': '张潮',
        'difficulty': 4,
    }, next_id)
    next_id += 1
    total_ymy += 1
    if total_ymy >= 80:
        break
conn.commit()
print(f"  幽梦影插入: {total_ymy} 道")

# ─── 11. 诗经 ─────────────────────────────────────────────────────────────────
print("处理诗经...")
shijing = json.load(open('/home/ubuntu/chinese-poetry/诗经/shijing.json', encoding='utf-8'))
total_sj = 0
for poem in shijing:
    title = poem.get('title', '')
    lines_raw = poem.get('content', [])
    # 诗经每段是完整的，需要拆分
    lines = []
    for para in lines_raw:
        # 按句号、逗号分割
        parts = re.split(r'[，。、；]', para)
        lines.extend([p.strip() for p in parts if p.strip()])
    
    for line in lines[:4]:
        if not is_valid_line(line):
            continue
        q = make_fill_question(line, None, '佚名', title, random.choice([3, 4]))
        if q:
            # 诗经无具体诗人，poetId 设为 None
            q['poet_id'] = None
            insert_question(q, next_id)
            next_id += 1
            total_sj += 1
    if total_sj >= 150:
        break
conn.commit()
print(f"  诗经插入: {total_sj} 道")

# ─── 12. 论语 ─────────────────────────────────────────────────────────────────
print("处理论语...")
lunyu = json.load(open('/home/ubuntu/chinese-poetry/论语/lunyu.json', encoding='utf-8'))
total_ly = 0
for chapter in lunyu:
    paragraphs = chapter.get('paragraphs', [])
    for para in paragraphs:
        # 论语每段是完整的句子，如"子曰：「学而时习之，不亦说乎？」"
        # 提取引号内的内容
        matches = re.findall(r'[「"](.*?)[」"]', para)
        if not matches:
            # 直接使用整段
            matches = [para]
        for text in matches:
            # 按逗号分割
            parts = re.split(r'[，。？！；]', text)
            for part in parts:
                part = part.strip()
                if not is_valid_line(part):
                    continue
                q = make_fill_question(part, None, '孔子', '论语', 4)
                if q:
                    q['poet_id'] = None
                    insert_question(q, next_id)
                    next_id += 1
                    total_ly += 1
                if total_ly >= 80:
                    break
            if total_ly >= 80:
                break
        if total_ly >= 80:
            break
conn.commit()
print(f"  论语插入: {total_ly} 道")

# ─── 13. 蒙学（三字经、千字文、弟子规等） ────────────────────────────────────
print("处理蒙学...")
mengxue_files = {
    '三字经': '/home/ubuntu/chinese-poetry/蒙学/sanzijing-new.json',
    '千字文': '/home/ubuntu/chinese-poetry/蒙学/qianziwen.json',
    '弟子规': '/home/ubuntu/chinese-poetry/蒙学/dizigui.json',
    '声律启蒙': '/home/ubuntu/chinese-poetry/蒙学/shenglvqimeng.json',
}
total_mx = 0
for name, fpath in mengxue_files.items():
    if not os.path.exists(fpath):
        continue
    d = json.load(open(fpath, encoding='utf-8'))
    # 蒙学文件是 dict，取 paragraphs
    if isinstance(d, dict):
        paragraphs = d.get('paragraphs', [])
    elif isinstance(d, list):
        paragraphs = []
        for item in d:
            if isinstance(item, dict):
                paragraphs.extend(item.get('paragraphs', []))
            elif isinstance(item, str):
                paragraphs.append(item)
    else:
        continue
    
    for para in paragraphs:
        if not isinstance(para, str):
            continue
        # 按逗号分割
        parts = re.split(r'[，。、；？！]', para)
        for part in parts:
            part = part.strip()
            if not is_valid_line(part):
                continue
            q = make_fill_question(part, None, '佚名', name, random.choice([1, 2]))
            if q:
                q['poet_id'] = None
                insert_question(q, next_id)
                next_id += 1
                total_mx += 1
        if total_mx >= 150:
            break
    if total_mx >= 150:
        break
conn.commit()
print(f"  蒙学插入: {total_mx} 道")

# ─── 14. 四书五经 ─────────────────────────────────────────────────────────────
print("处理四书五经...")
sishu_files = glob.glob('/home/ubuntu/chinese-poetry/四书五经/*.json')
total_ss = 0
for fpath in sishu_files:
    d = json.load(open(fpath, encoding='utf-8'))
    if isinstance(d, dict):
        items = [d]
    elif isinstance(d, list):
        items = d
    else:
        continue
    for item in items:
        paragraphs = item.get('paragraphs', [])
        title = item.get('chapter', os.path.basename(fpath).replace('.json', ''))
        for para in paragraphs:
            # 繁体转简体（简单处理，直接使用原文）
            parts = re.split(r'[，。、；？！]', para)
            for part in parts:
                part = part.strip()
                if not is_valid_line(part):
                    continue
                q = make_fill_question(part, None, '佚名', title, random.choice([4, 5]))
                if q:
                    q['poet_id'] = None
                    insert_question(q, next_id)
                    next_id += 1
                    total_ss += 1
            if total_ss >= 100:
                break
        if total_ss >= 100:
            break
    if total_ss >= 100:
        break
conn.commit()
print(f"  四书五经插入: {total_ss} 道")

# ─── 15. 御定全唐詩 ───────────────────────────────────────────────────────────
print("处理御定全唐詩...")
yudingfiles = sorted(glob.glob('/home/ubuntu/chinese-poetry/御定全唐詩/json/*.json'))
total_yd = 0
for f in yudingfiles[:10]:
    poems = json.load(open(f, encoding='utf-8'))
    n = process_poems(
        poems,
        get_author=lambda p: p.get('author', ''),
        get_title=lambda p: p.get('title', ''),
        get_lines=lambda p: p.get('paragraphs', []),
        difficulty_fn=lambda a, t: random.choice([3, 4]),
        max_per_author=10,
        max_total=150
    )
    total_yd += n
    if total_yd >= 150:
        break
conn.commit()
print(f"  御定全唐詩插入: {total_yd} 道")

# ─── 汇总 ─────────────────────────────────────────────────────────────────────
cursor.execute("SELECT COUNT(*) FROM questions")
total = cursor.fetchone()[0]
cursor.execute("SELECT difficulty, COUNT(*) FROM questions GROUP BY difficulty ORDER BY difficulty")
by_diff = cursor.fetchall()

print("\n" + "="*50)
print(f"✅ 题库扩充完成！总题目数: {total}")
print("按难度分布:")
for diff, cnt in by_diff:
    print(f"  难度{diff}: {cnt}道")

conn.close()
