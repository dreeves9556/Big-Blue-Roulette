#!/usr/bin/env python3
"""
Batch Stats Checker - Processes seasons in chunks with long delays
"""

import re
import json
import time
import sys
import requests
from typing import Dict, List, Optional, Tuple

class BatchStatChecker:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Research Project - Kentucky Basketball Stats)'
        })
        self.current_stats = self._load_stats()
        self.discrepancies: List[Dict] = []
        
    def _load_stats(self) -> Dict:
        with open('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/playerSeasonStats.js', 'r') as f:
            content = f.read()
        match = re.search(r'export const playerSeasonStatsById = ({.*?});', content, re.DOTALL)
        if not match:
            raise ValueError("Could not find stats")
        json_str = re.sub(r',(\s*[}\]])', r'\1', match.group(1))
        return json.loads(json_str)
    
    def _fetch(self, url: str, retries: int = 3) -> Optional[str]:
        for attempt in range(retries):
            try:
                time.sleep(2.0)  # Long delay between requests
                response = self.session.get(url, timeout=30)
                if response.status_code == 429:
                    print(f"  Rate limited, waiting 30s...")
                    time.sleep(30)
                    continue
                response.raise_for_status()
                return response.text
            except Exception as e:
                print(f"  Error fetching {url}: {e}")
                if attempt < retries - 1:
                    time.sleep(5)
        return None
    
    def _extract_stat(self, html: str, stat: str) -> Optional[float]:
        patterns = [
            rf'data-stat="{stat}"[^>]*csk="([0-9.]+)"',
            rf'data-stat="{stat}"[^>]*>([0-9.]+)</td>',
            rf'data-stat="{stat}"[^>]*>([0-9.]+)<',
        ]
        for pattern in patterns:
            match = re.search(pattern, html)
            if match:
                try:
                    return float(match.group(1))
                except:
                    pass
        return None
    
    def _get_player_season_html(self, player_id: str, year: int) -> Optional[str]:
        url = f"https://www.sports-reference.com/cbb/players/{player_id}.html"
        html = self._fetch(url)
        if not html:
            return None
        
        # Find the specific season row
        pattern = rf'<tr[^>]*id="players_per_game\.{year}"[^>]*>(.*?)</tr>'
        match = re.search(pattern, html, re.DOTALL)
        if match:
            return match.group(1)
        return None
    
    def check_player_season(self, player_id: str, sr_id: str, year: int, season: str) -> Optional[Dict]:
        """Check a specific player season"""
        
        # Get current data
        player_stats = self.current_stats.get(player_id, {})
        current = player_stats.get(season)
        if not current:
            return {'type': 'missing_in_current', 'player_id': player_id, 'season': season}
        
        # Get Sports-Reference data
        row_html = self._get_player_season_html(sr_id, year)
        if not row_html:
            return {'type': 'not_found_sr', 'player_id': player_id, 'season': season}
        
        sr_games = self._extract_stat(row_html, 'games')
        sr_pts = self._extract_stat(row_html, 'pts_per_g')
        sr_reb = self._extract_stat(row_html, 'trb_per_g')
        sr_ast = self._extract_stat(row_html, 'ast_per_g')
        
        issues = []
        
        if sr_pts is not None and abs(current['pts'] - sr_pts) > 0.5:
            issues.append(f"PTS: {current['pts']:.1f} -> {sr_pts:.1f}")
        
        if sr_reb is not None and abs(current['reb'] - sr_reb) > 0.5:
            issues.append(f"REB: {current['reb']:.1f} -> {sr_reb:.1f}")
        
        if sr_ast is not None and abs(current['ast'] - sr_ast) > 0.5:
            issues.append(f"AST: {current['ast']:.1f} -> {sr_ast:.1f}")
        
        if sr_games is not None and sr_games > 0 and current['games'] != int(sr_games):
            issues.append(f"GAMES: {current['games']} -> {int(sr_games)}")
        
        if issues:
            return {
                'type': 'discrepancy',
                'player_id': player_id,
                'season': season,
                'issues': issues,
                'current': current,
                'sr': {'pts': sr_pts, 'reb': sr_reb, 'ast': sr_ast, 'games': sr_games}
            }
        
        return {'type': 'match', 'player_id': player_id, 'season': season}
    
    def check_season(self, year: int) -> List[Dict]:
        """Check top players for a season"""
        season = f"{year-1}-{str(year)[2:]}"
        print(f"\n=== {season} (checking key players) ===")
        
        # Define key players to check per era
        key_players = {
            # 1960s
            1960: [('mills_don', 'don-mills-1'), ('pursiful_larry', 'larry-pursiful-1'), ('cohen_sid', 'sid-cohen-1')],
            1961: [('pursiful_larry', 'larry-pursiful-1'), ('burchett_carroll', 'carroll-burchett-1'), ('feldhaus_allen', 'allen-feldhaus-1')],
            1962: [('nash_cotton', 'cotton-nash-1'), ('pursiful_larry', 'larry-pursiful-1')],
            1963: [('nash_cotton', 'cotton-nash-1'), ('conley_larry', 'larry-conley-1'), ('embry_randy', 'randy-embry-1')],
            1964: [('nash_cotton', 'cotton-nash-1'), ('conley_larry', 'larry-conley-1'), ('dampier_louie', 'louie-dampier-1')],
            1965: [('dampier_louie', 'louie-dampier-1'), ('riley_pat', 'pat-riley-1'), ('conley_larry', 'larry-conley-1')],
            1966: [('dampier_louie', 'louie-dampier-1'), ('riley_pat', 'pat-riley-1'), ('conley_larry', 'larry-conley-1')],
            1967: [('issel_dan', 'dan-issel-1'), ('dampier_louie', 'louie-dampier-1')],
            1968: [('issel_dan', 'dan-issel-1'), ('givens_jack', 'jack-givens-1')],
            1969: [('issel_dan', 'dan-issel-1'), ('givens_jack', 'jack-givens-1')],
            1970: [('issel_dan', 'dan-issel-1'), ('givens_jack', 'jack-givens-1')],
            # 1970s
            1972: [('givens_jack', 'jack-givens-1'), ('bowie_sam', 'sam-bowie-1')],
            1973: [('givens_jack', 'jack-givens-1')],
            1975: [('flynn_bob', 'bob-flynn-1'), ('grunig_cedric', 'cedric-grunig-1')],
            1976: [('flynn_bob', 'bob-flynn-1')],
            1977: [('robey_rick', 'rick-robey-1'), ('philips_mike', 'mike-phillips-1')],
            1978: [('robey_rick', 'rick-robey-1'), ('givens_jack', 'jack-givens-1'), ('philips_mike', 'mike-phillips-1')],
            1979: [('givens_jack', 'jack-givens-1')],
            # 1980s
            1980: [('grunig_cedric', 'cedric-grunig-1')],
            1981: [('macy_kyle', 'kyle-macy-1')],
            1982: [('macy_kyle', 'kyle-macy-1'), ('turpin_dale', 'dale-turpin-1')],
            1983: [('macy_kyle', 'kyle-macy-1'), ('turpin_dale', 'dale-turpin-1'), ('walker_kenny', 'kenny-walker-1')],
            1984: [('turpin_dale', 'dale-turpin-1'), ('walker_kenny', 'kenny-walker-1')],
            1985: [('walker_kenny', 'kenny-walker-1')],
            1986: [('walker_kenny', 'kenny-walker-1'), ('chapman_rex', 'rex-chapman-1')],
            1987: [('chapman_rex', 'rex-chapman-1')],
            1988: [('chapman_rex', 'rex-chapman-1')],
            # 1990s
            1990: [('mashburn_jamal', 'jamal-mashburn-1'), ('farmer_rich', 'rich-farmer-1')],
            1991: [('mashburn_jamal', 'jamal-mashburn-1'), ('farmer_rich', 'rich-farmer-1'), ('woods_bernard', 'bernard-woods-1')],
            1992: [('mashburn_jamal', 'jamal-mashburn-1'), ('farmer_rich', 'rich-farmer-1'), ('pelphrey_john', 'john-pelphrey-1')],
            1993: [('delk_tony', 'tony-delk-1'), ('mercer_ron', 'ron-mercer-1'), ('anderson_derek', 'derek-anderson-1')],
            1994: [('delk_tony', 'tony-delk-1'), ('walker_antoine', 'antoine-walker-1'), ('mccarty_walter', 'walter-mccarty-1')],
            1995: [('walker_antoine', 'antoine-walker-1'), ('mercer_ron', 'ron-mercer-1'), ('mccarty_walter', 'walter-mccarty-1')],
            1996: [('mercer_ron', 'ron-mercer-1'), ('anderson_derek', 'derek-anderson-1'), ('epps_anthony', 'anthony-epps-1')],
            1997: [('sheppard_jeff', 'jeff-sheppard-1'), ('mohammed_nazr', 'nazr-mohammed-1')],
            1998: [('padgett_scott', 'scott-padgett-1'), ('turner_wayne', 'wayne-turner-1'), ('evans_heshimu', 'heshimu-evans-1')],
            1999: [('padgett_scott', 'scott-padgett-1'), ('magloire_jamaal', 'jamaal-magloire-1')],
            # 2000s
            2000: [('magloire_jamaal', 'jamaal-magloire-1'), ('toppin_jacob', 'jacob-toppin-1')],
            2001: [('tayshaun_prince', 'tayshaun-prince-1'), ('carruth_rashaad', 'rashaad-carruth-1')],
            2002: [('prince_tayshaun', 'tayshaun-prince-1'), ('daniels_erik', 'erik-daniels-1')],
            2003: [('bogans_keith', 'keith-bogans-1'), ('estill_marquis', 'marquis-estill-1')],
            2004: [('fitch_gerald', 'gerald-fitch-1')],
            2005: [('azubuike_kelenna', 'kelenna-azubuike-1'), ('hayes_chuck', 'chuck-hayes-1')],
            2006: [('rondo_rajon', 'rajon-rondo-1'), ('morris_randolph', 'randolph-morris-1')],
            2007: [('morris_randolph', 'randolph-morris-1'), ('crawford_joe', 'joe-crawford-1')],
            2008: [('bradley_ramel', 'ramel-bradley-1'), ('crawford_joe', 'joe-crawford-1')],
            2009: [('meeks_jodie', 'jodie-meeks-1')],
            # 2010s
            2010: [('cousins_demarcus', 'demarcus-cousins-1'), ('wall_john', 'john-wall-1')],
            2011: [('knight_brandon', 'brandon-knight-1'), ('jones_terrence', 'terrence-jones-1')],
            2012: [('davis_anthony', 'anthony-davis-1'), ('kidd_gilchrist_michael', 'michael-kidd-gilchrist-1')],
            2013: [('goodwin_archie', 'archie-goodwin-1'), ('noel_nerlens', 'nerlens-noel-1')],
            2014: [('randle_julius', 'julius-randle-1'), ('harrison_aaron', 'aaron-harrison-1')],
            2015: [('towns_karl_anthony', 'karl-anthony-towns-1'), ('booker_devin', 'devin-booker-1')],
            2016: [('murray_jamal', 'jamal-murray-1'), ('ulis_tyler', 'tyler-ulis-1')],
            2017: [('fox_deaaron', 'deaaron-fox-1'), ('monk_malik', 'malik-monk-1'), ('adebayo_bam', 'bam-adebayo-1')],
            2018: [('knox_kevin', 'kevin-knox-1'), ('gilgeous_alexander_shai', 'shai-gilgeous-alexander-1')],
            2019: [('herro_tyler', 'tyler-herro-1'), ('washington_pj', 'pj-washington-1')],
            # 2020s
            2020: [('maxey_tyrese', 'tyrese-maxey-1'), ('quickley_immanuel', 'immanuel-quickley-1')],
            2021: [('boston_brandon', 'brandon-boston-jr-1'), ('sarr_olivier', 'olivier-sarr-1')],
            2022: [('tshiebwe_oscar', 'oscar-tshiebwe-1')],
            2023: [('reeves_antonio', 'antonio-reeves-1'), ('dillingham_rob', 'rob-dillingham-1')],
            2024: [('oweh_otega', 'otega-oweh-1'), ('reeves_antonio', 'antonio-reeves-1')],
            2025: [('oweh_otega', 'otega-oweh-1')],
            2026: [('aberdeen_denzel', 'denzel-aberdeen-1')],
        }
        
        players = key_players.get(year, [])
        results = []
        
        for our_id, sr_id in players:
            result = self.check_player_season(our_id, sr_id, year, season)
            if result:
                results.append(result)
                if result['type'] == 'discrepancy':
                    print(f"  ❌ {our_id}: {result['issues']}")
                elif result['type'] == 'missing_in_current':
                    print(f"  ⚠️  Missing: {our_id}")
                elif result['type'] == 'match':
                    print(f"  ✓ {our_id}: Match")
        
        return results
    
    def run(self, start_year: int = 1960, end_year: int = 2026):
        all_results = []
        for year in range(start_year, end_year + 1):
            results = self.check_season(year)
            all_results.extend(results)
            
            # Save progress periodically
            if (year - start_year + 1) % 5 == 0:
                self._save_report(all_results, year)
        
        self._save_report(all_results, end_year, final=True)
        return all_results
    
    def _save_report(self, results: List[Dict], year: int, final: bool = False):
        discrepancies = [r for r in results if r['type'] == 'discrepancy']
        missing = [r for r in results if r['type'] == 'missing_in_current']
        
        suffix = "FINAL" if final else f"THRU_{year}"
        filename = f"/Users/danielsmac/Documents/Kentucky Basketball Team Draft/KEY_PLAYERS_CHECK_{suffix}.md"
        
        with open(filename, 'w') as f:
            f.write("# Kentucky Basketball Key Players Stats Check\n\n")
            f.write(f"**Generated:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"**Source:** Sports-Reference.com\n\n")
            f.write(f"## Summary\n\n")
            f.write(f"- **Discrepancies found:** {len(discrepancies)}\n")
            f.write(f"- **Missing players:** {len(missing)}\n")
            f.write(f"- **Checked through:** {year}\n\n")
            
            if discrepancies:
                f.write("## Discrepancies\n\n")
                f.write("| Player | Season | Issues |\n")
                f.write("|--------|--------|--------|\n")
                for d in discrepancies:
                    issues_str = "; ".join(d['issues'])
                    f.write(f"| {d['player_id']} | {d['season']} | {issues_str} |\n")
            
            if missing:
                f.write("\n## Missing Players (in current data)\n\n")
                for m in missing:
                    f.write(f"- {m['player_id']} ({m['season']})\n")
        
        print(f"\nReport saved: {filename}")


def main():
    checker = BatchStatChecker()
    
    if len(sys.argv) > 2:
        start, end = int(sys.argv[1]), int(sys.argv[2])
    else:
        start, end = 1960, 2026
    
    print(f"Checking key players for seasons {start}-{end}")
    print("This will take approximately 15-20 minutes due to rate limiting...")
    
    results = checker.run(start, end)
    
    discrepancies = [r for r in results if r['type'] == 'discrepancy']
    print(f"\n=== COMPLETE ===")
    print(f"Total discrepancies found: {len(discrepancies)}")


if __name__ == '__main__':
    main()
