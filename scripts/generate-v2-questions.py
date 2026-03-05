import re
import json
import random

def parse_tang_shi(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by poem headers like "010杜甫：佳人"
    poems = re.split(r'\n(\d{3}.*?：.*?)\n', content)
    
    results = []
    for i in range(1, len(poems), 2):
        header = poems[i]
        body = poems[i+1].strip()
        
        # Extract author and title
        match = re.match(r'\d{3}(.*?)：(.*)', header)
        if not match:
            continue
        author = match.group(1).strip()
        title = match.group(2).strip()
        
        # Clean body and split into lines
        lines = [line.strip() for line in body.split('\n') if line.strip() and not line.startswith('更多精彩') and not line.startswith('电脑访问') and not line.startswith('手机访问')]
        
        # Process lines into couplets
        for line in lines:
            # Split by punctuation
            parts = re.split(r'[，。！？；]', line)
            parts = [p.strip() for p in parts if p.strip()]
            
            if len(parts) >= 2:
                for j in range(len(parts) - 1):
                    results.append({
                        'author': author,
                        'title': title,
                        'prev': parts[j],
                        'next': parts[j+1]
                    })
    return results

def generate_questions(couplets, count=500):
    questions = []
    # Filter out very short parts
    valid_couplets = [c for c in couplets if len(c['prev']) >= 3 and len(c['next']) >= 3]
    
    selected = random.sample(valid_couplets, min(count, len(valid_couplets)))
    
    for c in selected:
        # Randomly choose to blank out first or second part
        is_first = random.choice([True, False])
        if is_first:
            # Blank out a word in the first part
            text = c['prev']
            target_idx = random.randint(0, len(text) - 1)
            correct = text[target_idx]
            content = text[:target_idx] + "__" + text[target_idx+1:] + "，" + c['next'] + "。"
        else:
            # Blank out a word in the second part
            text = c['next']
            target_idx = random.randint(0, len(text) - 1)
            correct = text[target_idx]
            content = c['prev'] + "，" + text[:target_idx] + "__" + text[target_idx+1:] + "。"
            
        # Generate distractors from other characters in the same poem or random common characters
        distractors = set()
        common_chars = "的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起实政小比外口前先真明其制活解更打本名真"
        
        while len(distractors) < 3:
            char = random.choice(common_chars)
            if char != correct:
                distractors.add(char)
        
        options = list(distractors) + [correct]
        random.shuffle(options)
        
        questions.append({
            'content': content,
            'options': ",".join(options),
            'correctAnswer': correct,
            'sourcePoemTitle': c['title'],
            'sourcePoemAuthor': c['author'],
            'difficulty': random.randint(1, 5)
        })
    return questions

if __name__ == "__main__":
    couplets = parse_tang_shi('/home/ubuntu/upload/唐诗三百首.txt')
    v2_questions = generate_questions(couplets, 1000)
    
    with open('/home/ubuntu/tianma-poetry-game/scripts/v2_new_questions.json', 'w', encoding='utf-8') as f:
        json.dump(v2_questions, f, ensure_ascii=False, indent=2)
    
    print(f"Generated {len(v2_questions)} questions.")
