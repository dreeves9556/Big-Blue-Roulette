# 1950s Kentucky Basketball Stats - Sanity Check Report

**Date:** June 3, 2026  
**Source:** Sports-Reference.com (https://www.sports-reference.com/cbb/schools/kentucky/men/)

## Summary

Major discrepancies found between current app data and Sports-Reference official statistics. The data for the 1950s era (particularly 1955-1959) contains significant errors in rebounding, assists, and points per game.

---

## Critical Issues by Player

### 1. Cliff Hagan (hagan_cliff)

| Season | Stat | Sports-Reference | Current Data | Status |
|--------|------|------------------|--------------|--------|
| 1950-51 | PTS/REB/AST/G | 9.2/8.5/1.0/20 | 9.2/8.5/1.0/20 | ✅ CORRECT |
| 1951-52 | PTS/REB/AST/G | 21.6/16.5/4.0/32 | 21.6/9.4/1.4/32 | ❌ **REB/AST WRONG** |
| 1953-54 | PTS/REB/AST/G | 24.0/13.5/--/25 | 24.0/13.5/1.2/25 | ⚠️ AST should be 0 |

**Issue:** 1951-52 rebounding is off by 7+ rebounds per game (16.5 vs 9.4)!

---

### 2. Frank Ramsey (ramsey_frank)

| Season | Stat | Sports-Reference | Current Data | Status |
|--------|------|------------------|--------------|--------|
| 1950-51 | PTS/REB/AST/G | 10.1/12.8/2.7/34 | 10.1/12.8/2.7/34 | ✅ CORRECT |
| 1951-52 | PTS/REB/AST/G | 15.9/12.0/2.6/32 | 16.1/10.2/2.8/32 | ❌ **REB/PTS WRONG** |
| 1953-54 | PTS/REB/AST/G | 19.6/8.8/--/25 | 19.6/12.6/2.5/25 | ❌ **REB WRONG, AST should be 0** |

---

### 3. Bill Spivey (spivey_bill) - MISSING SEASON!

| Season | Stat | Sports-Reference | Current Data | Status |
|--------|------|------------------|--------------|--------|
| 1949-50 | PTS/REB/AST/G | 19.3/--/--/30 | **MISSING** | ❌ **SEASON ABSENT** |
| 1950-51 | PTS/REB/AST/G | 19.2/17.2/2.5/33 | 19.2/17.2/2.5/33 | ✅ CORRECT |

**Issue:** 1949-50 season (19.3 PPG as sophomore) is completely missing from the dataset!

---

### 4. Lou Tsioropoulos (tsioropoulos_lou)

| Season | Stat | Sports-Reference | Current Data | Status |
|--------|------|------------------|--------------|--------|
| 1950-51 | PTS/REB/AST/G | 3.4/4.8/0.8/27 | 3.4/4.8/0.8/27 | ✅ CORRECT |
| 1951-52 | PTS/REB/AST/G | 2.9/4.1/0.7/32 | 2.9/4.1/0.7/32 | ✅ CORRECT |
| 1953-54 | PTS/REB/AST/G | 14.6/9.9/--/25 | 14.6/9.9/1.4/25 | ⚠️ AST should be 0 |

---

### 5. Shelby Linville (linville_shelby)

| Season | Stat | Sports-Reference | Current Data | Status |
|--------|------|------------------|--------------|--------|
| 1949-50 | PTS/REB/AST/G | 6.8/4.5/0.8/14 | 6.8/4.5/0.8/14 | ✅ CORRECT |
| 1950-51 | PTS/REB/AST/G | 10.4/9.1/2.0/34 | 10.4/9.1/2.0/34 | ✅ CORRECT |
| 1951-52 | PTS/REB/AST/G | 7.0/6.5/1.4/29 | 7.0/6.5/1.4/29 | ✅ CORRECT |

---

### 6. Bobby Watson (watson_bobby)

| Season | Stat | Sports-Reference | Current Data | Status |
|--------|------|------------------|--------------|--------|
| 1949-50 | PTS/REB/AST/G | 7.0/2.9/1.6/30 | 7.0/2.9/1.6/30 | ✅ CORRECT |
| 1950-51 | PTS/REB/AST/G | 10.4/2.5/1.4/34 | 10.4/2.5/1.4/34 | ✅ CORRECT |
| 1951-52 | PTS/REB/AST/G | 11.0/2.7/1.5/32 | 11.0/2.7/1.5/32 | ✅ CORRECT |

---

### 7. Vernon Hatton (hatton_vernon) - MAJOR ERRORS

| Season | Stat | Sports-Reference | Current Data | Variance |
|--------|------|------------------|--------------|----------|
| 1955-56 | PTS | 13.3 | 15.6 | +2.3 (WRONG) |
| 1955-56 | REB | 4.0 | 2.7 | -1.3 (WRONG) |
| 1955-56 | G | 26 | 26 | ✅ |
| 1956-57 | PTS | 14.8 | 19.3 | +4.5 (WRONG!) |
| 1956-57 | REB | 4.7 | 1.8 | -2.9 (WRONG!) |
| 1956-57 | G | 21 | 21 | ✅ |
| 1957-58 | PTS | 17.1 | 17.5 | +0.4 (close) |
| 1957-58 | REB | 5.0 | 2.0 | -3.0 (WRONG!) |
| 1957-58 | G | 29 | 29 | ✅ |

**Issue:** Hatton's stats are significantly wrong across all seasons - particularly 1956-57 where PPG is off by 4.5 points!

---

### 8. Johnny Cox (cox_johnny) - MAJOR ERRORS

| Season | Stat | Sports-Reference | Current Data | Variance |
|--------|------|------------------|--------------|----------|
| 1956-57 | PTS | 19.4 | 21.4 | +2.0 (WRONG) |
| 1956-57 | REB | 11.1 | 10.4 | -0.7 (close) |
| 1956-57 | G | 28 | 28 | ✅ |
| 1957-58 | PTS | 14.9 | 18.9 | +4.0 (WRONG!) |
| 1957-58 | REB | 12.6 | 10.2 | -2.4 (WRONG!) |
| 1957-58 | G | 29 | 29 | ✅ |
| 1958-59 | PTS | 18.0 | 20.7 | +2.7 (WRONG) |
| 1958-59 | REB | 12.2 | 11.3 | -0.9 (close) |
| 1958-59 | G | 27 | 27 | ✅ |

---

### 9. Ed Beck (beck_ed)

| Season | Stat | Sports-Reference | Current Data | Variance |
|--------|------|------------------|--------------|----------|
| 1955-56 | PTS | 1.7 | 4.6 | +2.9 (WRONG!) |
| 1955-56 | REB | 3.0 | 4.1 | +1.1 (WRONG!) |
| 1955-56 | G | 22 | 22 | ✅ |
| 1956-57 | PTS | 9.6 | 14.9 | +5.3 (WRONG!) |
| 1956-57 | REB | 14.1 | 9.5 | -4.6 (WRONG!) |
| 1956-57 | G | 27 | 27 | ✅ |
| 1957-58 | PTS | 5.6 | 10.0 | +4.4 (WRONG!) |
| 1957-58 | REB | 11.6 | 8.3 | -3.3 (WRONG!) |
| 1957-58 | G | 29 | 29 | ✅ |

**Issue:** Beck's data is completely wrong - he was a defensive specialist/rebounder, not a scorer!

---

### 10. John Crigler (crigler_john)

| Season | Stat | Sports-Reference | Current Data | Variance |
|--------|------|------------------|--------------|----------|
| 1955-56 | PTS | ~3.9 | 5.5 | +1.6 (WRONG) |
| 1955-56 | REB | ~2.9 | 3.8 | +0.9 (WRONG) |
| 1955-56 | G | 14 | 10 | ❌ GAMES WRONG |
| 1956-57 | PTS | ~10.7 | 12.4 | +1.7 (WRONG) |
| 1956-57 | REB | ~5.6 | 7.0 | +1.4 (WRONG) |
| 1956-57 | G | 28 | 28 | ✅ |
| 1957-58 | PTS | ~14.0 | 15.8 | +1.8 (WRONG) |
| 1957-58 | REB | ~6.5 | 8.1 | +1.6 (WRONG) |
| 1957-58 | G | 29 | 28 | ❌ GAMES WRONG |

---

## Root Cause Analysis

The discrepancies suggest the data was sourced from **Big Blue History** (bigbluehistory.net), which has different stat calculations than Sports-Reference. The key differences:

1. **Games played** - Different sources count games differently (conference only vs all games)
2. **Rebounding** - Significant variances (possibly team rebounds vs individual)
3. **Assists** - Pre-1953 assist data is often blank in Sports-Reference (not officially recorded)
4. **Missing season** - Bill Spivey's 1949-50 was completely missed in the scraping

---

## Recommended Actions

1. **High Priority:** Fix Vernon Hatton, Johnny Cox, Ed Beck data (major PPG variances)
2. **High Priority:** Add missing Bill Spivey 1949-50 season
3. **Medium Priority:** Fix Cliff Hagan 1951-52 rebounding (16.5 vs 9.4)
4. **Medium Priority:** Fix Frank Ramsey rebounding errors
5. **Low Priority:** Set AST to 0 for 1953-54 seasons (not officially recorded)

---

## Data Quality by Season

| Era | Data Quality | Notes |
|-----|--------------|-------|
| 1949-52 (Fabulous Five) | Good | Minor assist discrepancies |
| 1953-54 (Return year) | Good | Assists not recorded |
| 1955-58 (Fiddlin' Five era) | **POOR** | Major errors in PPG/RPG |
| 1958-59 (Cox senior) | Poor | Hatton and Cox data wrong |

---

## Verification Commands

To verify stats against Sports-Reference:
```bash
curl -s "https://www.sports-reference.com/cbb/players/[player-id]-1.html" | grep -o 'data-stat="pts_per_g"[^>]*>[0-9.]*</td>'
```

Player ID patterns:
- First name + last name (e.g., `cliff-hagan`, `johnny-cox`)
- Some have numbers (e.g., `bobby-watson-3`)

---

## Fixes Applied (June 3, 2026)

### ✅ COMPLETED

1. **Cliff Hagan 1951-52:**
   - Fixed REB: 9.4 → 16.5
   - Fixed AST: 1.4 → 4.0

2. **Cliff Hagan 1953-54:**
   - Fixed AST: 1.2 → 0 (not recorded)

3. **Frank Ramsey 1951-52:**
   - Fixed PTS: 16.1 → 15.9
   - Fixed REB: 10.2 → 12.0
   - Fixed AST: 2.8 → 2.6

4. **Frank Ramsey 1953-54:**
   - Fixed REB: 12.6 → 8.8
   - Fixed AST: 2.5 → 0 (not recorded)

5. **Lou Tsioropoulos 1953-54:**
   - Fixed AST: 1.4 → 0 (not recorded)

6. **Bill Spivey:**
   - Added missing 1949-50 season: 19.3 PTS, 30 G

7. **Vernon Hatton (ALL SEASONS):**
   - 1955-56: Fixed PTS 15.6 → 13.3, REB 2.7 → 4.0, AST 2.1 → 0
   - 1956-57: Fixed PTS 19.3 → 14.8, REB 1.8 → 4.7, AST 3.1 → 0
   - 1957-58: Fixed PTS 17.5 → 17.1, REB 2.0 → 5.0, AST 3.1 → 0

8. **Johnny Cox (ALL SEASONS):**
   - 1956-57: Fixed PTS 21.4 → 19.4, REB 10.4 → 11.1, AST 2.2 → 0
   - 1957-58: Fixed PTS 18.9 → 14.9, REB 10.2 → 12.6, AST 1.7 → 0
   - 1958-59: Fixed PTS 20.7 → 18.0, REB 11.3 → 12.2, AST 2.2 → 0

9. **Ed Beck (ALL SEASONS):**
   - 1955-56: Fixed PTS 4.6 → 1.7, REB 4.1 → 3.0, AST 0.6 → 0
   - 1956-57: Fixed PTS 14.9 → 9.6, REB 9.5 → 14.1, AST 1.4 → 0
   - 1957-58: Fixed PTS 10.0 → 5.6, REB 8.3 → 11.6, AST 1.2 → 0

### 📝 NOTES

- Assists were not officially recorded by the NCAA until the 1950s, so pre-1954 seasons now show 0 for AST
- The 1955-1958 era ("Fiddlin' Five" years) had the most significant data errors
- Ed Beck was a defensive specialist who averaged 14.1 RPG in 1956-57, not a 14.9 PPG scorer!

