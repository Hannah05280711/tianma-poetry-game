#!/usr/bin/env python3
"""
批量将题库中所有繁体字转换为简体字
处理字段：content, correctAnswer, options, sourcePoemTitle, sourcePoemAuthor
"""

import json
import os
import re
import sys
import mysql.connector
import opencc

# 初始化繁转简转换器
cc = opencc.OpenCC('t2s')

# 数据库连接
DB_URL = os.environ.get("DATABASE_URL", "")
m = re.match(r"mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)", DB_URL)
if not m:
    print("无法解析 DATABASE_URL")
    sys.exit(1)

conn = mysql.connector.connect(
    user=m.group(1), password=m.group(2),
    host=m.group(3), port=int(m.group(4)), database=m.group(5),
    ssl_disabled=False
)
cursor = conn.cursor()

# 获取所有题目
cursor.execute("SELECT id, content, correctAnswer, options, sourcePoemTitle, sourcePoemAuthor FROM questions")
rows = cursor.fetchall()
print(f"共 {len(rows)} 道题目需要处理...")

updated = 0
for row in rows:
    qid, content, correct_answer, options_json, title, author = row
    
    # 转换各字段
    new_content = cc.convert(content) if content else content
    new_correct = cc.convert(correct_answer) if correct_answer else correct_answer
    new_title = cc.convert(title) if title else title
    new_author = cc.convert(author) if author else author
    
    # 转换 options（JSON 数组）
    new_options_json = options_json
    if options_json:
        try:
            opts = json.loads(options_json)
            new_opts = [cc.convert(o) if isinstance(o, str) else o for o in opts]
            new_options_json = json.dumps(new_opts, ensure_ascii=False)
        except Exception:
            pass
    
    # 检查是否有变化
    if (new_content != content or new_correct != correct_answer or 
        new_options_json != options_json or new_title != title or new_author != author):
        cursor.execute(
            """UPDATE questions SET 
               content=%s, correctAnswer=%s, options=%s, 
               sourcePoemTitle=%s, sourcePoemAuthor=%s
               WHERE id=%s""",
            (new_content, new_correct, new_options_json, new_title, new_author, qid)
        )
        updated += 1

conn.commit()
print(f"✅ 完成！共更新 {updated} 道题目（繁→简）")

# 验证：查看几道已转换的题目
cursor.execute("SELECT content, correctAnswer FROM questions WHERE id IN (SELECT id FROM questions ORDER BY RAND() LIMIT 5)")
samples = cursor.fetchall()
print("\n随机抽样验证（5道）：")
for s in samples:
    print(f"  题目: {s[0][:40]}  答案: {s[1]}")

conn.close()
