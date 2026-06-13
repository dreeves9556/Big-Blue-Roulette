# Perfect Player Mode - Share Graphic Documentation

## Overview
The share graphic is generated using HTML5 Canvas API and provides a visual summary of the player's Perfect Player build to share on social media (Twitter/X, etc.).

## Canvas Specifications
- **Width:** 640px
- **Height:** 800px (taller to accommodate tier ladder)
- **Scale:** 2x for retina displays (actual render: 1280x1600)

## Layout Structure

### Top Section (0-200px)
```
┌─────────────────────────────────────────┐
│ 🏀 PERFECT PLAYER MODE      [BLIND MODE]│  ← 40px
│ Kentucky Wildcats Ultimate Build        │  ← 58px
│                                         │
│              125%                       │  ← 140px (64px font)
│           Final Score                   │  ← 165px
│                                         │
│      [ALL-TIME LEGEND]                  │  ← 210px (tier badge)
└─────────────────────────────────────────┘
```

- Yellow accent bar at top (Perfect Player branding)
- "BLIND MODE" badge (purple) shown only when `isBlindMode=true`
- Large score percentage in center
- Tier badge with color-coded background

### Two-Column Layout (250px-500px)

#### Left Column: Player Build
```
MY KENTUCKY BUILD

SCORING    Issel '69     33.9
REBOUNDING Burrow '55    17.7
PLAYMAKING Ulis '16      7.0
DEFENSE    Anderson '89   7.6
```

- Compact format: Attribute, Player (abbreviated year), Stat value
- Attribute names in gray (10px uppercase)
- Player names in blue with 2-digit year: "Issel '69"
- Stat values right-aligned in bold white

#### Right Column: Tier Progression Ladder
```
TIER PROGRESSION

▓▓▓ BEST POSSIBLE 166%
▓▓▓ GOAT 150% ▶ 125%
▓▓▓ ALL-TIME LEGEND 130% ✓
▓▓▓ NAISMITH WINNER 110% ✓
▓▓▓ 1ST TEAM ALL-AMERICAN 100% ✓
▓▓▓ 2ND TEAM ALL-AMERICAN 90% ✓
```

- Tiers shown from highest (top) to lowest (bottom)
- **Current tier** highlighted with background color and "▶ score%"
- **Surpassed tiers** show green ✓ checkmark
- **Locked tiers** dimmed/gray

### Bottom (780px)
```
         bigblueroulette.com
```

## Color Coding

### Tier Colors
| Tier | Background | Text | Use |
|------|------------|------|-----|
| Best Possible | #7f1d1d (dark red) | #f87171 (light red) | The cap |
| GOAT | #581c87 (dark purple) | #c084fc (light purple) | Elite |
| All-Time Legend | #7c2d12 (dark orange) | #fb923c (orange) | Great |
| Naismith Winner | #713f12 (dark yellow) | #facc15 (yellow) | Very good |
| 1st Team All-American | #1e3a5f (dark blue) | #93c5fd (light blue) | Good |
| 2nd Team All-American | #164e63 (dark cyan) | #67e8f9 (cyan) | Solid |

### Other Colors
- Background: #0a0c14 (dark navy)
- Grid lines: rgba(255,255,255,0.03) (subtle)
- Accent bar: Yellow gradient (#ca8a04 to #facc15)
- Blind mode badge: #7c3aed (purple)

## Share Integration

### Twitter/X Share Text
```
I built a 125% Perfect Player in Kentucky Wildcats mode! All-Time Legend @BigBlueRoulette
```

### Share Data Object
```javascript
{
  files: [File('perfect-player.png', blob)],
  title: 'Perfect Player Mode',
  text: 'I built a 125% Perfect Player... @BigBlueRoulette'
}
```

### Fallback
If native share isn't available:
- Download image as "perfect-player.png"
- Show "Image downloaded!" status message

## Key Design Decisions

1. **Two-column layout:** Shows both the player's 4 picks AND where they rank on the tier ladder
2. **Tier ladder visualization:** Makes it clear what tiers exist and what the player achieved
3. **Abbreviated years:** "Issel '69" instead of "Issel (1969)" saves space
4. **Reverse tier order:** Best tiers at top for visual hierarchy
5. **Blind mode badge:** Bragging rights for playing without seeing stats
6. **Retina support:** 2x canvas scale for crisp images on mobile

## Issues to Consider

1. **Long player names:** May overflow 130px width in left column
2. **Tier name length:** "2nd Team All-American" vs "Naismith Winner" - variable widths
3. **Mobile Twitter crop:** Verify 800px height doesn't get cropped awkwardly
4. **Color contrast:** Ensure tier badge colors are readable

## Future Improvements

- Add mini stat comparison bars (your stat vs target)
- Show the 4 individual attribute percentages (33.9/22.5 = 151%)
- Include Kentucky logo or wildcat icon
- Add season year icons or colors
