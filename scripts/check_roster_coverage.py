#!/usr/bin/env python3
"""Check if all roster .xls files are fully represented in the game data."""
import sys, json, os, glob
sys.path.insert(0, os.path.dirname(__file__))
from add_season import extract_literal
import pandas as pd

# Load both data files
with open('src/data/players.js') as f:
    players_text = f.read()
with open('src/data/playerSeasonStats.js') as f:
    stats_text = f.read()

players_data, _, _ = extract_literal(players_text, 'players', '[', ']')
stats_data, _, _ = extract_literal(stats_text, 'playerSeasonStatsById', '{', '}')

players_by_id = {p['id']: p for p in players_data}
players_by_name = {p['fullName']: p for p in players_data}

def make_id(name):
    parts = name.strip().split()
    if len(parts) < 2:
        return name.lower().replace(' ', '_')
    return f"{parts[-1].lower()}_{parts[0].lower()}"

roster_dir = '/Users/danielsmac/Downloads/Roster Additions'
files = sorted(glob.glob(os.path.join(roster_dir, '*.xls')))

for fpath in files:
    fname = os.path.basename(fpath)
    season = fname.replace('.xls', '')

    df = pd.read_html(fpath)[0]
    players = []
    for _, row in df.iterrows():
        player = str(row.get('Player', '')).strip()
        if player and player.lower() != 'team totals' and player != 'nan':
            players.append(player)

    missing_player = []
    missing_stats = []
    for player in players:
        pid = make_id(player)
        if pid not in players_by_id:
            missing_player.append(player)
        elif season not in stats_data.get(pid, {}):
            missing_stats.append(player)

    if missing_player or missing_stats:
        print(f'{season}:')
        if missing_player:
            print(f'  MISSING from players.js: {len(missing_player)}')
            for p in missing_player:
                print(f'    - {p}')
        if missing_stats:
            print(f'  MISSING stats for season: {len(missing_stats)}')
            for p in missing_stats:
                print(f'    - {p}')
    else:
        print(f'{season}: OK ({len(players)} players)')
