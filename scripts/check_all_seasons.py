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

# Build season -> players map from players.js
season_players = {}
for p in players_data:
    for season in p.get('seasons', []):
        season_players.setdefault(season, []).append({
            'name': p['fullName'],
            'id': p['id'],
            'has_stats': season in stats_data.get(p['id'], {})
        })

# Sort seasons
all_seasons = sorted(season_players.keys())
print(f'Total seasons in game: {len(all_seasons)}')
print()

for season in all_seasons:
    players = season_players[season]
    total = len(players)
    missing_stats = [p for p in players if not p['has_stats']]
    if missing_stats:
        print(f'{season}: {total} players, {len(missing_stats)} missing stats')
        for p in missing_stats:
            print(f"  - {p['name']}")
    else:
        print(f'{season}: {total} players, OK')
