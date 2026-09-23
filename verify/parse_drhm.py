import re
import json

text = open('drhm_listen.md', encoding='utf-8').read()

SET_RE = re.compile(r'^## (\d{4})-(\d{2})\uff08第?([一二三四五六七八九十]+)\u5957\uff09')
SEC_RE = re.compile(r'^### Section ([ABC])')
ANS_RE = re.compile(r'^(\d+)\.\s*([A-D])')

sets = {}
cur_key = None
cur_sec = None
for line in text.split('\n'):
    line = line.strip()
    m = SET_RE.match(line)
    if m:
        cur_year = m.group(1)
        cur_month = m.group(2)
        cn = m.group(3)
        cn_map = {'一':'1', '二':'2', '三':'3', '四':'4'}
        cur_set = cn_map.get(cn, '1')
        cur_key = f'{cur_year}_{cur_month}_{cur_set}'
        sets.setdefault(cur_key, {})
        cur_sec = None
        continue
    m2 = SEC_RE.match(line)
    if m2 and cur_key:
        cur_sec = m2.group(1)
        sets[cur_key].setdefault(cur_sec, [])
        continue
    m3 = ANS_RE.match(line)
    if m3 and cur_key and cur_sec:
        sets[cur_key][cur_sec].append(m3.group(2))

# Build Q1..Q25 map
listening_db = {}
for set_key, sections in sets.items():
    answers = {}
    q = 1
    for sec in ['A', 'B', 'C']:
        for ans in sections.get(sec, []):
            answers[str(q)] = ans
            q += 1
    listening_db[set_key] = answers

print("Keys:", sorted(listening_db.keys()))
print(f"Total sets: {len(listening_db)}")
print()
print("=== 关心的 3 套 ===")
for k in ['2025_06_2', '2024_06_2', '2023_12_1']:
    print(f"\n{k}: {len(listening_db.get(k, {}))} answers")
    print(json.dumps(listening_db.get(k, {}), ensure_ascii=False, indent=2))

with open('drhm_listening_db.json', 'w', encoding='utf-8') as f:
    json.dump(listening_db, f, ensure_ascii=False, indent=2)