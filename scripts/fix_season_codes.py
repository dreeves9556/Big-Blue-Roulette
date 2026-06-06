#!/usr/bin/env python3
"""Normalize season codes: convert short (00-01) to long (2000-01) format."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from add_season import extract_literal, update_file

# Load data
with open('src/data/players.js') as f:
    players_text = f.read()
with open('src/data/playerSeasonStats.js') as f:
    stats_text = f.read()

players, _, _ = extract_literal(players_text, 'players', '[', ']')
stats, _, _ = extract_literal(stats_text, 'playerSeasonStatsById', '{', '}')

def to_long(season):
    if len(season) == 7 and season[4] == '-':
        return season  # Already long
    if len(season) == 5 and season[2] == '-':
        yr = int(season[:2])
        return f'19{season}' if yr >= 50 else f'20{season}'
    return season

# Fix players.js: remove short codes where long exists, or rename short to long
players_fixed = 0
for p in players:
    seasons = p.get('seasons', [])
    new_seasons = []
    seen = set()
    for s in seasons:
        long_s = to_long(s)
        if long_s not in seen:
            new_seasons.append(long_s)
            seen.add(long_s)
        else:
            players_fixed += 1
    p['seasons'] = sorted(new_seasons)

# Fix playerSeasonStats.js: rename short codes to long
stats_fixed = 0
for pid in list(stats.keys()):
    seasons = stats[pid]
    new_seasons = {}
    for s, data in seasons.items():
        long_s = to_long(s)
        if long_s in new_seasons:
            # Already exists - keep the one with more games if duplicate
            if data.get('games', 0) > new_seasons[long_s].get('games', 0):
                new_seasons[long_s] = data
            stats_fixed += 1
        else:
            new_seasons[long_s] = data
    stats[pid] = new_seasons

print(f'Fixed {players_fixed} duplicate seasons in players.js')
print(f'Fixed {stats_fixed} duplicate seasons in playerSeasonStats.js')

# Write back
update_file(Path('src/data/players.js'), 'players', '[', ']', players)
update_file(Path('src/data/playerSeasonStats.js'), 'playerSeasonStatsById', '{', '}', stats)
print('Done!')
