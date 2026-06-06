#!/usr/bin/env python3
"""
Enrich players.js and playerSeasonStats.js from a single season roster .xls file.

Usage:
    python3 scripts/add_season.py <season-label> <path-to-roster.xls>

Example:
    python3 scripts/add_season.py 1990-91 "/Users/danielsmac/Downloads/Roster Additions/90-91.xls"
"""

import json
import pandas as pd
import re
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.resolve()
PLAYERS_PATH = PROJECT_ROOT / "src" / "data" / "players.js"
STATS_PATH = PROJECT_ROOT / "src" / "data" / "playerSeasonStats.js"


def extract_literal(text, var_name, opener, closer):
    """
    Find 'export const <var_name> = <literal>' in text and return (data, start, end).
    start/end are the indices of the literal in the original text.
    """
    pattern = rf'export const {re.escape(var_name)} = '
    match = re.search(pattern, text)
    if not match:
        raise ValueError(f"Could not find export const {var_name}")
    literal_start = match.end()
    if text[literal_start] != opener:
        raise ValueError(f"Expected '{opener}' after export const {var_name}")

    stack = 0
    in_string = False
    escape = False
    i = literal_start
    while i < len(text):
        ch = text[i]
        if in_string:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == '"':
                in_string = False
            i += 1
            continue

        if ch == '"':
            in_string = True
            i += 1
            continue

        if ch == opener:
            stack += 1
        elif ch == closer:
            stack -= 1
            if stack == 0:
                # literal ends here; include the closing bracket/brace
                literal_end = i + 1
                break
        i += 1
    else:
        raise ValueError(f"Unterminated literal for {var_name}")

    literal = text[literal_start:literal_end]
    return json.loads(literal), literal_start, literal_end


def update_file(filepath, var_name, opener, closer, new_data):
    """Replace the literal in the file with the new JSON data."""
    text = filepath.read_text()
    _, start, end = extract_literal(text, var_name, opener, closer)
    new_json = json.dumps(new_data, indent=2, ensure_ascii=False)
    new_text = text[:start] + new_json + text[end:]
    filepath.write_text(new_text)


def make_id(name):
    parts = name.strip().split()
    if len(parts) < 2:
        return name.lower().replace(" ", "_")
    return f"{parts[-1].lower()}_{parts[0].lower()}"


def process_roster(season, xls_path):
    print(f"Processing {season} from {xls_path}")
    df = pd.read_html(str(xls_path))[0]

    players_data, _, _ = extract_literal(PLAYERS_PATH.read_text(), "players", "[", "]")
    stats_data, _, _ = extract_literal(STATS_PATH.read_text(), "playerSeasonStatsById", "{", "}")

    existing_ids = {p["id"] for p in players_data}

    for _, row in df.iterrows():
        player = str(row.get("Player", "")).strip()
        if not player or player.lower() == "team totals" or player == "nan":
            continue

        pid = make_id(player)
        pos = str(row.get("Pos", "")).strip()
        if pd.isna(row.get("Pos", "")):
            pos = ""

        def num(col):
            v = row.get(col)
            if pd.isna(v):
                return 0.0
            return float(v)

        games = int(num("G")) if not pd.isna(row.get("G")) else 0
        pts = num("PTS")
        trb = num("TRB")
        ast = num("AST")
        stl = num("STL")
        blk = num("BLK")

        # --- Update players.js ---
        if pid in existing_ids:
            p = next(p for p in players_data if p["id"] == pid)
            if season not in p["seasons"]:
                p["seasons"].append(season)
                p["seasons"].sort()
                print(f"  Added {season} to {pid}")
        else:
            players_data.append({
                "id": pid,
                "fullName": player,
                "seasons": [season],
                "primaryPosition": pos
            })
            existing_ids.add(pid)
            print(f"  Added new player {pid} ({player})")

        # --- Update playerSeasonStats.js ---
        if pid not in stats_data:
            stats_data[pid] = {}
        stats_data[pid][season] = {
            "pts": round(pts, 1),
            "reb": round(trb, 1),
            "ast": round(ast, 1),
            "stl": round(stl, 1),
            "blk": round(blk, 1),
            "games": games
        }

    # Sort players by fullName for consistency
    players_data.sort(key=lambda p: p["fullName"])

    # Write
    update_file(PLAYERS_PATH, "players", "[", "]", players_data)
    update_file(STATS_PATH, "playerSeasonStatsById", "{", "}", stats_data)

    # Validate
    r1 = subprocess.run(["node", "-c", str(PLAYERS_PATH)], capture_output=True, text=True)
    r2 = subprocess.run(["node", "-c", str(STATS_PATH)], capture_output=True, text=True)

    if r1.returncode != 0:
        print("SYNTAX ERROR in players.js:", r1.stderr[:300])
        sys.exit(1)
    if r2.returncode != 0:
        print("SYNTAX ERROR in playerSeasonStats.js:", r2.stderr[:300])
        sys.exit(1)

    print("Done. Both files are valid.")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    season_label = sys.argv[1]
    xls_file = Path(sys.argv[2])
    if not xls_file.exists():
        print(f"File not found: {xls_file}")
        sys.exit(1)
    process_roster(season_label, xls_file)
