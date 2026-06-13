import re, json, urllib.request

url = 'http://www.bigbluehistory.com/bb/statistics/playersjersey.html'
html = urllib.request.urlopen(url).read().decode('utf-8', errors='ignore')

from_page = {}

# Find all number anchors and extract sections
anchors = list(re.finditer(r'<A NAME="(\d+)">#\s*\d+</A>', html, re.IGNORECASE))
for i, m in enumerate(anchors):
    num = m.group(1)
    start = m.start()
    end = anchors[i+1].start() if i+1 < len(anchors) else len(html)
    section = html[start:end]
    players = re.findall(r'<A HREF\s*=\s*"Players/[^"]+">([^<]+)</A>', section, re.IGNORECASE)
    from_page[num] = [p.strip() for p in players]

# Read players.js
with open('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/players.js') as f:
    content = f.read()

# Extract individual player objects
blocks = re.findall(r'\{[\s\S]*?"id"[\s\S]*?\}', content)
file_players = []
for block in blocks:
    idm = re.search(r'"id"\s*:\s*"([^"]+)"', block)
    namem = re.search(r'"fullName"\s*:\s*"([^"]+)"', block)
    jerseym = re.search(r'"jerseyNumber"\s*:\s*"([^"]+)"', block)
    if idm and namem:
        file_players.append({'id': idm.group(1), 'name': namem.group(1), 'jersey': jerseym.group(1) if jerseym else None})

def norm(n):
    return re.sub(r'\s+(Jr\.?|Sr\.?|I{1,3})$', '', n, flags=re.I).replace('.', '').lower().strip()

name_to_page = {}
for num, names in from_page.items():
    for name in names:
        name_to_page.setdefault(norm(name), []).append(num)

mismatches = []
missing_page = []
matched = []

for p in file_players:
    if not p['jersey']:
        continue
    n = norm(p['name'])
    page_nums = name_to_page.get(n)
    if not page_nums:
        missing_page.append(p)
    elif p['jersey'] not in page_nums:
        mismatches.append({**p, 'page_jerseys': page_nums})
    else:
        matched.append(p)

missing_file = []
for num, names in from_page.items():
    for name in names:
        n = norm(name)
        if not any(norm(fp['name']) == n for fp in file_players):
            missing_file.append({'name': name, 'jersey': num})

print(f'Matched: {len(matched)}, Mismatches: {len(mismatches)}, Missing from page: {len(missing_page)}, Missing from file: {len(missing_file)}')

print('\n=== MISMATCHES ===')
for m in mismatches:
    print(f"{m['name']} (id: {m['id']}): file #{m['jersey']}, page #{', '.join(m['page_jerseys'])}")

with open('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/jersey_mismatches.json', 'w') as f:
    json.dump({'mismatches': mismatches, 'missingFromPage': missing_page, 'missingFromFile': missing_file}, f, indent=2)
print('Wrote jersey_mismatches.json')
