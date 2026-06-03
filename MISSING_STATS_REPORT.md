# Kentucky Basketball Draft - Missing Player Stats Report

## Summary (1950+ Era)
- **App era:** 1950-51 to 2024-25 (pre-1950 seasons excluded)
- **Total players in modern era:** 278
- **Players WITH real stats:** 273
- **Players WITHOUT real stats:** 5
- **Coverage:** 98.2%

## Changes Made
1. **Removed synthetic stats fallback** - App now only uses real stats from Big Blue History
2. **Players without stats are marked unavailable** - They show "Stats unavailable" and "Stats pending" badges
3. **Minimum year set to 1950** - Excludes pre-1950 era with incomplete data
4. **Build successful** - Production build completed with 98.2% real stat coverage

## Intensive Scrape Results
Successfully scraped **65 additional players** from Big Blue History:
- **Kenny Walker** (4 seasons) - "Sky" Walker, 1980s legend
- **Rex Chapman** (2 seasons) - 1986-88, 15.1 & 16.5 PPG
- **Dan Issel** (3 seasons) - 16.4, 26.6, 33.9 PPG progression
- **Unforgettables** - Pelphrey, Farmer, Woods, Feldhaus complete
- **Pat Riley, Louie Dampier, Cotton Nash** - 1960s stars
- **Cliff Hagan, Frank Ramsey** - 1950s legends
- **60+ more players** from 1950s-1990s

## Still Missing (4 players - post-1950 only)

### Missing from Big Blue History (need manual research)
| Player | ID | Position | Seasons |
|--------|-----|----------|---------|
| Steve Lochmueller | lockmueller_steve | C | 1978-79, 1979-80, 1980-81 |
| Jimmy Dan Conner | conner_jimmydan | SG | 1972-73, 1973-74, 1974-75 |
| Walter Hirsch | hirsch_walter | PF | 1950-51 |
| C.M. Newton | newton_cm | SF | 1950-51 |

**UPDATE (June 3, 2026):** 
- Bill Spivey now has both 1949-50 (19.3 PPG) and 1950-51 seasons
- Extensive 1950s stats corrections applied from Sports-Reference
- See `1950s_STATS_SANITY_CHECK_REPORT.md` for full details

## Alternative Sources for Remaining 4
1. **UK Athletics Media Guides** (1970s) - Conner and Lochmueller stats
2. **Sports-Reference** - May have partial data
3. **Newspaper Archives** - Lexington Herald-Leader for 1950-51 season

## Key Stats Now Available
| Player | Best Season | PPG | RPG | APG |
|--------|-------------|-----|-----|-----|
| Dan Issel | 1969-70 | 33.9 | 13.2 | 1.4 |
| Kenny Walker | 1984-85 | 22.9 | 10.2 | 1.3 |
| Rex Chapman | 1987-88 | 16.5 | 2.5 | 3.2 |
| Cotton Nash | 1963-64 | 22.8 | 2.3 | 1.0 |
| Jack Givens | 1976-77 | 18.2 | 4.3 | 2.0 |

## Technical Implementation
- Fixed parser handles **12-column** (pre-1980) and **15-column** (1980+) table formats
- Points calculated as: `FG × 2 + FT` (more reliable)
- Pre-1980s: No steals/blocks data (not tracked in that era)
- Build: 98.2% real stat coverage for 1950+ era
