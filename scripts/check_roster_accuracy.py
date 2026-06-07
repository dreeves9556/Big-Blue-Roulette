#!/usr/bin/env python3
"""Check that every (player, season) in players.js has matching stats in playerSeasonStats.js.

Flags players assigned to seasons they have no stats for — the Grady/Mitchell problem.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from add_season import extract_literal

with open('src/data/players.js') as f:
    players, _, _ = extract_literal(f.read(), 'players', '[', ']')
with open('src/data/playerSeasonStats.js') as f:
    stats, _, _ = extract_literal(f.read(), 'playerSeasonStatsById', '{', '}')

mismatches = []
for p in players:
    pid = p['id']
    player_stats = stats.get(pid, {})
    for season in p.get('seasons', []):
        if season not in player_stats:
            mismatches.append({
                'name': p['fullName'],
                'id': pid,
                'season': season,
                'has_stats_for': sorted(player_stats.keys())
            })

if mismatches:
    print(f"WARNING: {len(mismatches)} mismatches found")
    print("(player has season in roster but NO stats for that season)\n")
    # Group by season for easier reading
    by_season = {}
    for m in mismatches:
        by_season.setdefault(m['season'], []).append(m)

    for season in sorted(by_season.keys()):
        entries = by_season[season]
        print(f"{season}: {len(entries)} player(s)")
        for e in entries:
            other_seasons = ', '.join(e['has_stats_for']) if e['has_stats_for'] else 'none'
            print(f"  - {e['name']} (has stats for: {other_seasons})")
        print()
else:
    print("All clear — every roster assignment has matching stats.")
