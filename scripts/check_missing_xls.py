#!/usr/bin/env python3
import sys, json, os, glob
sys.path.insert(0, os.path.dirname(__file__))
from add_season import extract_literal

with open('src/data/players.js') as f:
    players_text = f.read()
with open('src/data/playerSeasonStats.js') as f:
    stats_text = f.read()

players_data, _, _ = extract_literal(players_text, 'players', '[', ']')
stats_data, _, _ = extract_literal(stats_text, 'playerSeasonStatsById', '{', '}')

season_players = {}
for p in players_data:
    for season in p.get('seasons', []):
        season_players.setdefault(season, []).append({
            'name': p['fullName'],
            'id': p['id'],
            'has_stats': season in stats_data.get(p['id'], {})
        })

roster_dir = '/Users/danielsmac/Downloads/Roster Additions'
existing_files = set(os.path.basename(f).replace('.xls', '') for f in glob.glob(os.path.join(roster_dir, '*.xls')))

missing_xls = []
has_xls_but_missing = []

for season in sorted(season_players.keys()):
    players = season_players[season]
    missing = [p for p in players if not p['has_stats']]
    if missing:
        if season in existing_files:
            has_xls_but_missing.append((season, len(missing), len(players)))
        else:
            missing_xls.append((season, len(missing), len(players)))

print('=== Seasons NEEDING an XLS file (missing stats, no XLS) ===')
print(f'Total: {len(missing_xls)} seasons')
print()
for season, miss, total in missing_xls:
    print(f'{season}: {miss}/{total} players missing stats')

if has_xls_but_missing:
    print()
    print('=== Seasons that HAVE an XLS but still missing stats ===')
    for season, miss, total in has_xls_but_missing:
        print(f'{season}: {miss}/{total} players missing stats')
