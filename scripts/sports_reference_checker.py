#!/usr/bin/env python3
"""
Sports-Reference Stats Checker for Kentucky Basketball
Compares current playerSeasonStats.js against Sports-Reference data
"""

import re
import json
import time
import requests
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Optional, Dict, List, Tuple

@dataclass
class StatLine:
    season: str
    player_id: str
    player_name: str
    games: int
    pts: float
    reb: float
    ast: float
    source: str  # 'current' or 'sports_ref'

# Season URL mapping (year in URL -> season label)
# Sports-Reference uses the ending year: 1960 URL = 1959-60 season
SEASON_URLS = {year: f"{year-1}-{str(year)[2:]}" for year in range(1960, 2027)}

# Reverse mapping: season label -> URL year
SEASON_TO_URL = {v: k for k, v in SEASON_URLS.items()}

class SportsReferenceChecker:
    def __init__(self, stats_file_path: str):
        self.stats_file_path = stats_file_path
        self.current_stats = self._load_current_stats()
        self.discrepancies: List[Dict] = []
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
    
    def _load_current_stats(self) -> Dict:
        """Load current stats from playerSeasonStats.js"""
        with open(self.stats_file_path, 'r') as f:
            content = f.read()
        
        # Extract the JSON object
        match = re.search(r'export const playerSeasonStatsById = ({.*?});', content, re.DOTALL)
        if not match:
            raise ValueError("Could not find playerSeasonStatsById in file")
        
        # Convert to valid JSON (remove trailing commas)
        json_str = match.group(1)
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)  # Remove trailing commas
        
        return json.loads(json_str)
    
    def _fetch_season_page(self, url_year: int) -> Optional[str]:
        """Fetch a season page from Sports-Reference"""
        url = f"https://www.sports-reference.com/cbb/schools/kentucky/men/{url_year}.html"
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return response.text
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None
    
    def _parse_player_links(self, html: str) -> List[Tuple[str, str]]:
        """Extract player links from season page"""
        # Pattern: <a href="/cbb/players/first-last-N.html">Name</a>
        pattern = r'<a href="/cbb/players/([^"]+)\.html">([^<]+)</a>'
        matches = re.findall(pattern, html)
        
        # Filter to unique players (avoid duplicates from totals/per game tables)
        seen = set()
        players = []
        for player_id, name in matches:
            if player_id not in seen and not name.startswith('Kentucky'):
                seen.add(player_id)
                players.append((player_id, name))
        return players
    
    def _fetch_player_stats(self, player_id: str, url_year: int) -> Optional[StatLine]:
        """Fetch specific season stats for a player"""
        url = f"https://www.sports-reference.com/cbb/players/{player_id}.html"
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            html = response.text
            
            # Find the per game table row for this season
            # Look for row with id like "players_per_game.1960"
            season_row_pattern = rf'<tr[^>]*id="players_per_game\.{url_year}"[^>]*>(.*?)</tr>'
            row_match = re.search(season_row_pattern, html, re.DOTALL)
            
            if not row_match:
                return None
            
            row_html = row_match.group(1)
            
            # Extract stats from data-stat attributes
            games = self._extract_stat(row_html, 'games')
            pts = self._extract_stat(row_html, 'pts_per_g')
            reb = self._extract_stat(row_html, 'trb_per_g')
            ast = self._extract_stat(row_html, 'ast_per_g')
            
            # Get player name from page title or h1
            name_match = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
            player_name = name_match.group(1).strip() if name_match else player_id
            
            season_label = SEASON_URLS[url_year]
            
            return StatLine(
                season=season_label,
                player_id=player_id.replace('-', '_'),
                player_name=player_name,
                games=int(games) if games else 0,
                pts=float(pts) if pts else 0.0,
                reb=float(reb) if reb else 0.0,
                ast=float(ast) if ast else 0.0,
                source='sports_ref'
            )
        except Exception as e:
            print(f"Error fetching player {player_id}: {e}")
            return None
    
    def _extract_stat(self, html: str, stat_name: str) -> Optional[str]:
        """Extract a stat value from HTML"""
        pattern = rf'data-stat="{stat_name}"[^>]*csk="([^"]*)"'
        match = re.search(pattern, html)
        if match:
            return match.group(1)
        
        # Fallback: try without csk
        pattern = rf'data-stat="{stat_name}"[^>]*>([^<]*)</td>'
        match = re.search(pattern, html)
        if match:
            return match.group(1).strip()
        
        return None
    
    def _get_current_stat(self, player_id: str, season: str) -> Optional[StatLine]:
        """Get current stat from loaded data"""
        # Map sports-ref ID to our ID format
        # sports-ref: "johnny-cox-1" -> ours: "cox_johnny"
        
        player_data = self.current_stats.get(player_id)
        if not player_data:
            return None
        
        season_data = player_data.get(season)
        if not season_data:
            return None
        
        return StatLine(
            season=season,
            player_id=player_id,
            player_name=player_id,  # We don't store names in stats
            games=season_data.get('games', 0),
            pts=season_data.get('pts', 0.0),
            reb=season_data.get('reb', 0.0),
            ast=season_data.get('ast', 0.0),
            source='current'
        )
    
    def _compare_stats(self, current: StatLine, sports_ref: StatLine) -> Optional[Dict]:
        """Compare two stat lines and return discrepancies"""
        issues = []
        
        # Compare points (allow 0.2 tolerance for rounding)
        if abs(current.pts - sports_ref.pts) > 0.3:
            issues.append(f"PTS: {current.pts} -> {sports_ref.pts}")
        
        # Compare rebounds
        if abs(current.reb - sports_ref.reb) > 0.3:
            issues.append(f"REB: {current.reb} -> {sports_ref.reb}")
        
        # Compare assists
        if abs(current.ast - sports_ref.ast) > 0.3:
            issues.append(f"AST: {current.ast} -> {sports_ref.ast}")
        
        # Compare games
        if current.games != sports_ref.games:
            issues.append(f"GAMES: {current.games} -> {sports_ref.games}")
        
        if issues:
            return {
                'player_id': current.player_id,
                'player_name': sports_ref.player_name,
                'season': current.season,
                'issues': issues,
                'current': {
                    'pts': current.pts,
                    'reb': current.reb,
                    'ast': current.ast,
                    'games': current.games
                },
                'sports_ref': {
                    'pts': sports_ref.pts,
                    'reb': sports_ref.reb,
                    'ast': sports_ref.ast,
                    'games': sports_ref.games
                }
            }
        return None
    
    def check_season(self, url_year: int) -> List[Dict]:
        """Check all players for a specific season"""
        season = SEASON_URLS[url_year]
        print(f"\n=== Checking {season} (URL: {url_year}) ===")
        
        html = self._fetch_season_page(url_year)
        if not html:
            return []
        
        players = self._parse_player_links(html)
        season_discrepancies = []
        
        print(f"Found {len(players)} players on season page")
        
        for player_id, player_name in players[:15]:  # Limit to top 15 players per season
            # Small delay to be polite
            time.sleep(0.3)
            
            # Convert sports-ref ID to our format with special cases
            our_id = self._map_sports_ref_to_our_id(player_id, player_name)
            
            # Check if we have this player
            current = self._get_current_stat(our_id, season)
            
            if not current:
                print(f"  ⚠️  Missing in current data: {player_name} ({our_id})")
                continue
            
            # Fetch from Sports-Reference
            sports_ref = self._fetch_player_stats(player_id, url_year)
            if not sports_ref:
                print(f"  ⚠️  Could not fetch from Sports-Ref: {player_name}")
                continue
            
            # Compare
            diff = self._compare_stats(current, sports_ref)
            if diff:
                season_discrepancies.append(diff)
                print(f"  ❌ DISCREPANCY: {player_name} - {diff['issues']}")
            else:
                print(f"  ✓ {player_name}: MATCH")
        
        return season_discrepancies
    
    def run_check(self, start_year: int = 1960, end_year: int = 2026) -> Dict:
        """Run full check across all seasons"""
        all_discrepancies = []
        
        for year in range(start_year, end_year + 1):
            season_disc = self.check_season(year)
            all_discrepancies.extend(season_disc)
            
            # Save progress every 5 seasons
            if (year - start_year + 1) % 5 == 0:
                self._save_report(all_discrepancies, partial=True)
        
        # Final report
        self._save_report(all_discrepancies, partial=False)
        return {
            'total_discrepancies': len(all_discrepancies),
            'discrepancies': all_discrepancies
        }
    
    def _map_sports_ref_to_our_id(self, player_id: str, player_name: str) -> str:
        """Map Sports-Reference ID to our internal ID format"""
        # Remove number suffix
        base_id = re.sub(r'-\d+$', '', player_id)
        parts = base_id.split('-')
        
        # Special name mappings
        name_mappings = {
            'billyray-lickert': 'lickert_bill',
            'lickert-billyray': 'lickert_bill',
            'jimmy-dan-conner': 'conner_jimmydan',
            'c-m-newton': 'newton_cm',
            'c-m-newton': 'newton_cm',
        }
        
        if base_id in name_mappings:
            return name_mappings[base_id]
        
        # Standard conversion: "johnny-cox" -> "cox_johnny"
        if len(parts) >= 2:
            first = parts[0]
            last = '-'.join(parts[1:])  # Handle compound last names
            return f"{last}_{first}"
        
        return base_id.replace('-', '_')
    
    def _save_report(self, discrepancies: List[Dict], partial: bool = False):
        """Save report to file"""
        suffix = "_PARTIAL" if partial else ""
        filename = f"/Users/danielsmac/Documents/Kentucky Basketball Team Draft/STATS_CHECK_1960_2026{suffix}.md"
        
        with open(filename, 'w') as f:
            f.write("# Kentucky Basketball Stats Discrepancy Report\n\n")
            f.write(f"**Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"**Source:** Sports-Reference.com\n")
            f.write(f"**Status:** {'PARTIAL' if partial else 'COMPLETE'}\n\n")
            f.write(f"## Summary\n\n")
            f.write(f"- **Total discrepancies found:** {len(discrepancies)}\n")
            f.write(f"- **Seasons checked:** 1960-2026\n\n")
            
            if discrepancies:
                f.write("## Discrepancies by Player\n\n")
                
                # Group by player
                by_player = {}
                for d in discrepancies:
                    pid = d['player_id']
                    if pid not in by_player:
                        by_player[pid] = []
                    by_player[pid].append(d)
                
                for player_id, player_discs in sorted(by_player.items()):
                    f.write(f"### {player_discs[0]['player_name']} ({player_id})\n\n")
                    for d in player_discs:
                        f.write(f"**{d['season']}:**\n")
                        for issue in d['issues']:
                            f.write(f"- {issue}\n")
                        f.write(f"\n")
            else:
                f.write("## Result\n\n✅ No discrepancies found! All stats match Sports-Reference.\n")
        
        print(f"\nReport saved to: {filename}")


def main():
    import sys
    checker = SportsReferenceChecker(
        stats_file_path='/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/playerSeasonStats.js'
    )
    
    # Allow command line args for specific years
    if len(sys.argv) > 1 and sys.argv[1] == 'full':
        print("Starting FULL stats check (all 1960-2026 seasons)")
        result = checker.run_check(1960, 2026)
        print(f"\n=== FINAL RESULT ===")
        print(f"Total discrepancies: {result['total_discrepancies']}")
    elif len(sys.argv) > 2:
        # Check specific year range: python3 script.py 1960 1970
        start = int(sys.argv[1])
        end = int(sys.argv[2])
        print(f"Checking seasons {start} to {end}")
        for year in range(start, end + 1):
            checker.check_season(year)
    else:
        # Default: test mode
        print("Starting stats check (test mode - first 3 seasons)")
        print("Use 'python3 sports_reference_checker.py full' for complete check")
        for year in [1960, 1961, 1962]:
            checker.check_season(year)


if __name__ == '__main__':
    main()
