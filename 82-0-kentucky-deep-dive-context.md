# 82-0 Deep Dive Context + Kentucky Wildcats Adaptation Spec

Last updated: 2026-06-03

## 1) Purpose of this file

This document is a practical implementation reference for building our app as a **college basketball Kentucky Wildcats version of 82-0**.

Your stated target behavior:
- Mirror 82-0’s core loop and feel.
- Keep the franchise static (**Kentucky Wildcats**).
- Make roulette randomization only about **year/season**.
- Keep the rest functionally aligned with 82-0 behavior.

---

## 2) Research method + source reliability

### Primary sources reviewed
- `https://www.82-0.com/`
- `https://www.82-0.com/how-to-play`
- `https://www.82-0.com/privacy-policy`
- `https://www.82-0.com/share?id=CA5XGpcrZmmeugwVCmnP`
- Text extraction mirrors used to expose JS-rendered content:
  - `https://r.jina.ai/http://www.82-0.com/`
  - `https://r.jina.ai/http://www.82-0.com/how-to-play`
  - `https://r.jina.ai/http://www.82-0.com/share?id=CA5XGpcrZmmeugwVCmnP`

### Secondary discovery sources
- Web search snippets that reference public behavior (forum/share snippets).

### Known collection limitations
- Some external pages were blocked (`403`) or not found (`404`).
- 82-0 appears heavily client-rendered; direct static fetch often only shows shell/loading text.
- Some dynamics must be inferred from official docs + observable rendered output.

### Confidence scale used in this document
- **High**: explicitly stated by official 82-0 text.
- **Medium**: directly observed from rendered share/mode outputs.
- **Low**: inferred behavior not explicitly documented.

---

## 3) What 82-0 is (product-level model)

82-0 is a fantasy drafting game where users attempt to build a five-player lineup that projects to a perfect 82-0 season.

Core pillars:
1. Slot/roulette randomness per round.
2. Draft constraints (team + decade context).
3. Player selection into 5 basketball positions.
4. Final simulation score/projection using box-score metrics.
5. Social output (shareable lineup/projection).

Confidence: **High**.

---

## 4) Canonical game mechanics (from official pages)

## 4.1 Round structure
From official how-to-play:
- Game consists of **five rounds**, one per position.
- Each round starts with random assignment of **team + decade**.
- User selects one player from that generated bucket.

Confidence: **High**.

## 4.2 Positions
- Lineup uses classical five: `PG`, `SG`, `SF`, `PF`, `C`.

Confidence: **High** (site text + share output).

## 4.3 Modes
- **Classic**: full stats visible while drafting.
- **HoopIQ**: stats hidden; pick from memory/knowledge.

Confidence: **High**.

## 4.4 Skips
Official rules mention:
- One **team skip** per game.
- One **decade skip** per game.

Confidence: **High**.

## 4.5 Simulation data dimensions
Officially listed core metrics:
- `PTS`, `REB`, `AST`, `STL`, `BLK`

Team strength is aggregate across selected players.

Confidence: **High**.

## 4.6 Non-linear projection
Officially states:
- Strength-to-wins relation is **non-linear**.
- Marginal wins get harder as you approach 82.
- Weakness in one category can prevent 82-0.

Confidence: **High**.

## 4.7 Era handling
Officially states:
- Era-adjusted benchmarks are applied.
- Missing old-era defensive data can be estimated fairly.

Confidence: **High**.

---

## 5) Observed UI/UX behavior

## 5.1 Landing/home
Observed in extracted home content:
- Hero: “Can you go 82-0?”
- Explicit mode cards/buttons for Classic and HoopIQ.
- Quick explainer text and links.

Confidence: **High**.

## 5.2 Share page output pattern
Observed in extracted share page:
- “Shared All-Time Team” page.
- **Projected Record** shown (example: `80-2`).
- Grade-like display (example snippet included `S PERFECT` style).
- Full lineup cards with:
  - initials/avatar-like token
  - player name
  - team + decade
  - per-player metric lines (PPG/RPG/APG/SPG/BPG)
- Aggregated totals displayed at bottom.

Confidence: **Medium-High**.

## 5.3 Onboarding/tutorial surface
Extracted home mirror included a “How to Play 82-0” modal-like section with:
- Draft steps
- Position fill guidance
- Team rating explanation

Confidence: **Medium**.

---

## 6) Inferred technical architecture

From privacy policy + behavior:
- Hosting: **Vercel**.
- Backend/auth/storage: **Firebase** (Auth + Firestore).
- Ad stack: **Google AdSense**.
- Client rendering appears JS-heavy.

Confidence: **High** for infra claims, **Medium** for rendering inference.

---

## 7) Important ambiguity/contradiction to account for

### Contradiction detected
- Official how-to-play says lineup finalization requires one player from each decade class.
- A publicly accessible share example showed repeated 1960s players in same lineup.

Possible explanations:
1. Rules changed over time; docs not fully synchronized.
2. Rule applies to a specific mode/version only.
3. Share parser output incomplete/misread in one sample.
4. Historical share generated before rules hardening.

Recommendation for our build:
- Do **not** import decade-diversity rule as hard requirement unless we explicitly want it.
- For Kentucky version, year roulette itself already constrains picks enough.

Confidence: **Medium**.

---

## 8) Kentucky Wildcats adaptation target (directly aligned to your request)

## 8.1 Design principle
Keep 82-0 loop, replace NBA franchise randomness with single-program history randomness.

- 82-0 slot dimensions: `[Team, Decade]`
- Kentucky version slot dimension: `[Kentucky Year]`

## 8.2 Immutable franchise constraint
- Team is always `Kentucky Wildcats`.
- No team roulette.

## 8.3 Roulette behavior
- Spin selects a **season/year** only.
- Show roster for that season.
- User picks any available player from that roster.

## 8.4 Position assignment
- Preserve five-position lineup UX.
- Player can be assigned to positions they can play.
- If model has only one listed position, allow flexible adjacency mapping (already in our app via flexibility map).

## 8.5 Round count
- Keep five rounds / five lineup slots.

## 8.6 Modes parity
Recommended:
- **Classic** mode in v1 (stats/position context visible).
- **HoopIQ** mode optional v2 (hide stats/details, keep names).

## 8.7 Skip adaptation
Original has team skip + decade skip.
Kentucky variant options:

Option A (closest equivalent)
- 1x **year skip** per run.
- 1x **roster reroll** per run (new year immediately).

Option B (simpler)
- 1x **year skip** only.

Recommendation: start with **Option B** for clarity.

---

## 9) Functional spec for our Kentucky app (implementation-oriented)

## 9.1 State machine

`intro -> playing -> done`

Within `playing` per round:
1. Idle (no year selected)
2. Spinning year
3. Year locked / roster visible
4. Player selected
5. Position selected
6. Confirm lock
7. Advance round

## 9.2 Core state objects

```ts
type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'

type LineupPick = {
  playerId: string
  playerName: string
  season: string
  primaryPosition: Position
}

type Lineup = Record<Position, LineupPick | null>
```

Draft session:
- `phase`
- `lineup`
- `currentSeason`
- `rouletteSeason`
- `spinning`
- `selectedPlayer`
- `selectedPosition`
- `usedSeasons`
- optional: `skipsRemaining`

## 9.3 Selection constraints
- Cannot place in occupied slot.
- Cannot draft same player twice in one run.
- Player position eligibility filters available target slots.

## 9.4 Completion condition
- All 5 lineup slots filled -> `done` phase.

---

## 10) Scoring/simulation parity plan

If we want stronger 82-0 parity beyond “fill lineup,” add a projection engine.

### Minimum viable projection (v1)
- Calculate aggregate pseudo-team strength from player stats.
- Map to projected wins with an S-curve / logistic function.

Example template:

```txt
raw = w1*PTS + w2*REB + w3*AST + w4*STL + w5*BLK
norm = eraAdjusted(raw)
wins = round(82 * logistic(alpha*(norm - beta)))
```

Where:
- `eraAdjusted` rescales by season environment baseline.
- `alpha` controls steepness near high-win region.
- `beta` controls midpoint.

### Data requirement for this step
Current local Kentucky data appears to prioritize identity/position; full per-season box metrics may be missing for many entries.
So true 82-0-like projection requires adding per-player peak/season stat fields.

---

## 11) UX parity checklist (what “same way” should mean)

To emulate 82-0 feel:
- Distinct start screen with clear objective.
- Round-based drafting rhythm.
- Animated roulette reveal for year.
- Roster grid with quick-pick interactions.
- Position lock step before commit.
- Final “projected outcome” summary card.
- Shareable result snapshot/link (optional but highly aligned).

---

## 12) Gaps between current Kentucky app and full 82-0 parity

Already present in current app:
- Year roulette flow.
- Roster pick per year.
- Position-aware locking.
- Five-slot completion.

Still needed for deeper parity:
- Optional hidden-stats/HoopIQ mode.
- Skip mechanic UI and limits.
- Projection engine with non-linear win curve.
- Share output route/page.
- Rich per-player stat display (if dataset expanded).

---

## 13) Recommended implementation roadmap

Phase 1 (done/near done)
- Core year roulette + roster pick + lineup lock.

Phase 2
- Add skip mechanic (year skip).
- Add round feedback + stronger transitions.

Phase 3
- Add projection engine + final projected record.
- Add grade/tier display.

Phase 4
- Add share route/output.
- Add HoopIQ mode toggle.

Phase 5
- Add account persistence only if needed (Firebase optional).

---

## 14) Non-goals for Kentucky version (unless requested)

- NBA franchise roulette.
- Mandatory decade diversity constraints.
- Ads/auth infrastructure parity with 82-0.

---

## 15) Final implementation guidance

For this project’s stated objective, define success as:
1. User spins Kentucky year.
2. Drafts one player from that year roster.
3. Assigns to eligible lineup slot.
4. Repeats until lineup complete.
5. Receives a final team outcome screen.

That gives behavioral parity with 82-0 while correctly adapting from NBA multi-team randomness to single-program historical randomness.
