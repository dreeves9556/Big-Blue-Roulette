#!/usr/bin/env python3
"""Remove incorrect season assignments from players.js.

Rules:
- If a player has stats for OTHER seasons but NOT the one they're assigned to,
  remove that season (off-by-one errors like Grady/Mitchell).
- If a player has NO stats at all (pre-1950 phantom players), leave them flagged
  for manual review.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from add_season import extract_literal, update_file

with open('src/data/players.js') as f:
    players, _, _ = extract_literal(f.read(), 'players', '[', ']')
with open('src/data/playerSeasonStats.js') as f:
    stats, _, _ = extract_literal(f.read(), 'playerSeasonStatsById', '{', '}')

removed = []
phantoms = []

for p in players:
    pid = p['id']
    player_stats = stats.get(pid, {})
    seasons = p.get('seasons', [])

    if not player_stats:
        # Player has no stats for ANY season — phantom
        for s in seasons:
            phantom = True
        continue

    # Has stats for at least some seasons — remove any seasons with no stats
    new_seasons = []
    for s in seasons:
        if s in player_stats:
            new_seasons.append(s)
        else:
            removed.append({
                'name': p['fullName'],
                'id': pid,
                'season': s,
                'has_stats_for': sorted(player_stats.keys())
            })
    p['seasons'] = sorted(new_seasons)

print(f"Removed {len(removed)} incorrect season assignments")
for r in removed:
    other = ', '.join(r['has_stats_for'])
    print(f"  - {r['name']}: removed {r['season']} (has stats: {other})")

# Write back
update_file(Path('src/data/players.js'), 'players', '[', ']', players)
print("\nUpdated players.js")
