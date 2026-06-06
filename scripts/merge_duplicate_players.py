#!/usr/bin/env python3
"""Merge duplicate player entries caused by name formatting differences."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from add_season import extract_literal, update_file

with open('src/data/players.js') as f:
    players, _, _ = extract_literal(f.read(), 'players', '[', ']')
with open('src/data/playerSeasonStats.js') as f:
    stats, _, _ = extract_literal(f.read(), 'playerSeasonStatsById', '{', '}')

dupes = [
    ('stewart_aj', 'stewart_a.j.', 'A.J. Stewart'),
    ('cassady_billyray', 'cassady_billy', 'Billy Ray Cassady'),
    ('newton_cm', 'newton_c.m.', 'C.M. Newton'),
    ('fox_deaaron', "fox_de'aaron", "De'Aaron Fox"),
    ('smith_gj', 'smith_g.j.', 'G.J. Smith'),
    ('blevins_jp', 'blevins_j.p.', 'J.P. Blevins'),
    ('conner_jimmydan', 'conner_jimmy', 'Jimmy Dan Conner'),
    ('killeya_jones_sacha', 'killeya-jones_sacha', 'Sacha Killeya-Jones'),
    ('gilgeous_shai', 'gilgeous-alexander_shai', 'Shai Gilgeous-Alexander'),
]

removed_ids = []

for id1, id2, name in dupes:
    p1 = next((p for p in players if p['id'] == id1), None)
    p2 = next((p for p in players if p['id'] == id2), None)
    if not p1 or not p2:
        print(f'SKIP {name}: one entry missing')
        continue

    # Merge seasons (keep id1, drop id2)
    seasons1 = set(p1.get('seasons', []))
    seasons2 = set(p2.get('seasons', []))
    p1['seasons'] = sorted(seasons1 | seasons2)

    # Merge stats (keep id1, move from id2)
    stats1 = stats.get(id1, {})
    stats2 = stats.get(id2, {})
    for season, data in stats2.items():
        if season not in stats1:
            stats1[season] = data
    stats[id1] = stats1

    # Remove id2 from players and stats
    players = [p for p in players if p['id'] != id2]
    if id2 in stats:
        del stats[id2]
    removed_ids.append(id2)

    print(f'MERGED {name}: kept {id1}, removed {id2}')

print(f'\nRemoved {len(removed_ids)} duplicate entries: {removed_ids}')

# Write back
update_file(Path('src/data/players.js'), 'players', '[', ']', players)
update_file(Path('src/data/playerSeasonStats.js'), 'playerSeasonStatsById', '{', '}', stats)
print('Done!')
