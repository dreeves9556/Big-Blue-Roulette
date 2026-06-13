import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  footballPlayers,
  FOOTBALL_POSITIONS,
  FOOTBALL_POSITION_LABELS,
} from './data/footballPlayers.js';
import { footballPlayerSeasonStatsById } from './data/footballPlayerSeasonStats.js';
import { ChevronRight, Shuffle, Sparkles, Trophy, RotateCcw, Link2, Download, Users } from 'lucide-react';
import FootballLineupBuilder from './components/FootballLineupBuilder.jsx';
import './App.css';

const EMPTY_LINEUP = { QB: null, RB: null, WR1: null, WR2: null, TE: null, FLEX: null };

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSlotStatPosition(pick, slot) {
  if (pick.playerId === 'randall_cobb' && (slot === 'WR1' || slot === 'WR2' || slot === 'FLEX')) {
    return 'WR';
  }
  if (pick.playerId === 'lynn_bowden_jr' && pick.season === '2019' && (slot === 'QB' || slot === 'FLEX')) {
    return 'QB';
  }
  if (pick.playerId === 'matt_roark' && pick.season === '2011' && (slot === 'QB' || slot === 'FLEX')) {
    return 'QB';
  }
  return pick.primaryPosition;
}

function getPlayablePositions(player, season) {
  const pos = player.primaryPosition;
  const base = [];
  if (pos === 'WR') base.push('WR1', 'WR2', 'FLEX');
  if (pos === 'QB') base.push('QB');
  if (pos === 'RB') base.push('RB', 'FLEX');
  if (pos === 'TE') base.push('TE', 'FLEX');
  // Lynn Bowden Jr. played QB in the 2019 season
  if (player.id === 'lynn_bowden_jr' && season === '2019') {
    if (!base.includes('QB')) base.push('QB');
    if (!base.includes('WR1')) base.push('WR1');
    if (!base.includes('WR2')) base.push('WR2');
    if (!base.includes('FLEX')) base.push('FLEX');
  }
  // Matt Roark played QB in the 2011 season
  if (player.id === 'matt_roark' && season === '2011') {
    if (!base.includes('QB')) base.push('QB');
    if (!base.includes('WR1')) base.push('WR1');
    if (!base.includes('WR2')) base.push('WR2');
    if (!base.includes('FLEX')) base.push('FLEX');
  }
  // Randall Cobb played QB and WR during his Kentucky career
  if (player.id === 'randall_cobb') {
    if (!base.includes('WR1')) base.push('WR1');
    if (!base.includes('WR2')) base.push('WR2');
    if (!base.includes('FLEX')) base.push('FLEX');
  }
  return base;
}

const ALL_FOOTBALL_ERAS = [
  'Collier (1954-1961)',
  'Bradshaw (1962-1968)',
  'Ray (1969-1972)',
  'Curci (1973-1981)',
  'Claiborne (1982-1989)',
  'Curry (1990-1996)',
  'Mumme (1997-2000)',
  'Morriss (2001-2002)',
  'Brooks (2003-2009)',
  'Phillips (2010-2012)',
  'Stoops (2013-2025)',
  'Stein (2026+)',
];

function getFootballEraLabel(season) {
  const year = parseInt(season, 10);
  if (year <= 1961) return 'Collier (1954-1961)';
  if (year <= 1968) return 'Bradshaw (1962-1968)';
  if (year <= 1972) return 'Ray (1969-1972)';
  if (year <= 1981) return 'Curci (1973-1981)';
  if (year <= 1989) return 'Claiborne (1982-1989)';
  if (year <= 1996) return 'Curry (1990-1996)';
  if (year <= 2000) return 'Mumme (1997-2000)';
  if (year <= 2002) return 'Morriss (2001-2002)';
  if (year <= 2009) return 'Brooks (2003-2009)';
  if (year <= 2012) return 'Phillips (2010-2012)';
  if (year <= 2025) return 'Stoops (2013-2025)';
  return 'Stein (2026+)';
}

function getBestFootballSeasonInEra(player, eraLabel) {
  const seasonsInEra = player.seasons.filter((season) => getFootballEraLabel(season) === eraLabel);
  if (seasonsInEra.length === 0) return null;

  let bestSeason = seasonsInEra[0];
  let bestStats = getStatsForDisplay(player, bestSeason);
  let bestValue = -1;

  if (bestStats) {
    bestValue = (bestStats.Yds || 0) + (bestStats.RushYds || 0) + (bestStats.RecYds || 0);
  }

  for (let i = 1; i < seasonsInEra.length; i++) {
    const season = seasonsInEra[i];
    const stats = getStatsForDisplay(player, season);
    if (stats) {
      const value = (stats.Yds || 0) + (stats.RushYds || 0) + (stats.RecYds || 0);
      if (value > bestValue) {
        bestSeason = season;
        bestStats = stats;
        bestValue = value;
      }
    }
  }

  return { season: bestSeason, stats: bestStats };
}

function footballEraHasUsablePlayers(eraLabel, openPositions, draftedPlayerIds, playerIdSet) {
  for (const player of footballPlayers) {
    if (!playerIdSet.has(player.id)) continue;
    if (draftedPlayerIds.has(player.id)) continue;
    const seasonsInEra = player.seasons.filter((season) => getFootballEraLabel(season) === eraLabel);
    if (seasonsInEra.length === 0) continue;
    for (const season of seasonsInEra) {
      const playable = getPlayablePositions(player, season);
      if (!playable.some((pos) => openPositions.includes(pos))) continue;
      if (getStatsForDisplay(player, season) !== null) {
        return true;
      }
    }
  }
  return false;
}

function getStatsForDisplay(player, season) {
  const stats = footballPlayerSeasonStatsById[player.id]?.[season];
  if (!stats) return null;
  const pos = player.primaryPosition;

  // Multi-position players need cross-position stats for proper sorting
  const isMultiPosition =
    player.id === 'randall_cobb' ||
    (player.id === 'lynn_bowden_jr' && season === '2019') ||
    (player.id === 'matt_roark' && season === '2011');

  if (pos === 'QB') {
    return {
      Cmp: stats.Cmp ?? 0, Att: stats.Att ?? 0, 'Cmp%': stats['Cmp%'] ?? 0,
      Yds: stats.Yds ?? 0, TD: stats.TD ?? 0, Int: stats.Int ?? 0,
      'Y/A': stats['Y/A'] ?? 0, Rate: stats.Rate ?? 0,
      RushAtt: stats.RushAtt ?? 0, RushYds: stats.RushYds ?? 0, RushYA: stats.RushYA ?? 0, RushTD: stats.RushTD ?? 0,
      ...(isMultiPosition ? {
        Rec: stats.Rec ?? 0, RecYds: stats.RecYds ?? 0, YPR: stats.YPR ?? 0, RecTD: stats.RecTD ?? 0,
      } : {}),
    };
  }
  if (pos === 'RB') {
    return {
      RushAtt: stats.RushAtt ?? 0, RushYds: stats.RushYds ?? 0, RushYA: stats.RushYA ?? 0, RushTD: stats.RushTD ?? 0,
      Rec: stats.Rec ?? 0, RecYds: stats.RecYds ?? 0, YPR: stats.YPR ?? 0, RecTD: stats.RecTD ?? 0,
    };
  }
  if (pos === 'WR' || pos === 'TE') {
    return {
      Rec: stats.Rec ?? 0, RecYds: stats.RecYds ?? 0, YPR: stats.YPR ?? 0, RecTD: stats.RecTD ?? 0,
      RushAtt: stats.RushAtt ?? 0, RushYds: stats.RushYds ?? 0, RushYA: stats.RushYA ?? 0, RushTD: stats.RushTD ?? 0,
      ...(isMultiPosition ? {
        Cmp: stats.Cmp ?? 0, Att: stats.Att ?? 0, 'Cmp%': stats['Cmp%'] ?? 0,
        Yds: stats.Yds ?? 0, TD: stats.TD ?? 0, Int: stats.Int ?? 0,
        'Y/A': stats['Y/A'] ?? 0, Rate: stats.Rate ?? 0,
      } : {}),
    };
  }
  return stats;
}

const STAT_KEYS_BY_POSITION = {
  QB: [
    { key: 'Yds', label: 'Pass Yds/G' }, { key: 'TD', label: 'Pass TD/G' },
    { key: 'Int', label: 'Int/G' }, { key: 'Cmp%', label: 'Cmp%/G' },
    { key: 'Rate', label: 'Rate' }, { key: 'RushYds', label: 'Rush Yds/G' }, { key: 'RushTD', label: 'Rush TD/G' },
  ],
  RB: [
    { key: 'RushAtt', label: 'Att/G' }, { key: 'RushYds', label: 'Rush Yds/G' },
    { key: 'RushYA', label: 'Y/A' }, { key: 'RushTD', label: 'Rush TD/G' },
    { key: 'Rec', label: 'Rec/G' }, { key: 'RecYds', label: 'Rec Yds/G' },
    { key: 'YPR', label: 'Y/R' }, { key: 'RecTD', label: 'Rec TD/G' },
  ],
  WR: [
    { key: 'Rec', label: 'Rec/G' }, { key: 'RecYds', label: 'Rec Yds/G' },
    { key: 'YPR', label: 'Y/R' }, { key: 'RecTD', label: 'Rec TD/G' },
    { key: 'RushAtt', label: 'Rush Att/G' }, { key: 'RushYds', label: 'Rush Yds/G' },
  ],
  TE: [
    { key: 'Rec', label: 'Rec/G' }, { key: 'RecYds', label: 'Rec Yds/G' },
    { key: 'YPR', label: 'Y/R' }, { key: 'RecTD', label: 'Rec TD/G' },
    { key: 'RushAtt', label: 'Rush Att/G' }, { key: 'RushYds', label: 'Rush Yds/G' },
  ],
};

const SORT_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'position', label: 'Position' },
  { key: 'Yds', label: 'Pass Yds/G' }, { key: 'TD', label: 'Pass TD/G' },
  { key: 'RushYds', label: 'Rush Yds/G' }, { key: 'RushTD', label: 'Rush TD/G' },
  { key: 'Rec', label: 'Rec/G' }, { key: 'RecYds', label: 'Rec Yds/G' }, { key: 'RecTD', label: 'Rec TD/G' },
];

const POSITION_COLORS = {
  QB: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  RB: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  WR1: 'bg-green-500/20 text-green-300 border-green-500/40',
  WR2: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  TE: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  FLEX: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
};

const POSITION_COLORS_HEX = {
  QB: '#3b82f6', RB: '#a855f7', WR1: '#22c55e', WR2: '#14b8a6', TE: '#f43f5e', FLEX: '#f97316',
};

function PositionBadge({ position }) {
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded border ${POSITION_COLORS[position] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
      {position}
    </span>
  );
}

function LineupSlot({ position, pick }) {
  return (
    <div className={`rounded-xl border p-3 transition-all ${pick ? 'bg-green-500/10 border-green-500/35' : 'bg-white/5 border-white/10'}`}>
      <div className="flex items-start justify-between gap-2">
        <PositionBadge position={position} />
        {pick && <span className="text-[10px] uppercase tracking-widest text-green-300">Locked</span>}
      </div>
      <div className="mt-2 min-h-[2.7rem]">
        {pick ? (
          <>
            <div className="text-sm font-semibold text-white leading-tight">{pick.playerName}</div>
            <div className="text-xs text-gray-400 mt-1">{pick.season} &bull; {pick.primaryPosition}</div>
          </>
        ) : (
          <div className="text-xs text-gray-500">Open &bull; {FOOTBALL_POSITION_LABELS[position]}</div>
        )}
      </div>
    </div>
  );
}

function StatGrid({ stats, position }) {
  const keys = STAT_KEYS_BY_POSITION[position] || [];
  return (
    <div className="mt-2 grid grid-cols-4 gap-1">
      {keys.map(({ key, label }) => (
        <div key={key} className="rounded-md bg-black/30 border border-white/10 px-1 py-1 text-center">
          <div className="text-[9px] text-gray-500 uppercase tracking-widest">{label}</div>
          <div className="text-[11px] font-semibold text-white mt-0.5">
            {typeof stats[key] === 'number' ? stats[key].toFixed(1) : stats[key]}
          </div>
        </div>
      ))}
    </div>
  );
}

// Position scoring benchmarks calibrated from dataset p90 percentiles
const POSITION_BENCHMARKS = {
  QB: 132,
  RB: 94,
  WR: 110,
  TE: 95,
  FLEX: 77,
};

const PERFECT_TARGET = 880; // requires near-elite at every position

function getPositionValue(stats, position) {
  if (!stats) return 0;
  if (position === 'QB') {
    return (stats.Yds || 0) * 0.5 + (stats.TD || 0) * 10 + (stats.Rate || 0) * 0.25 + (stats.RushYds || 0) * 0.3;
  }
  if (position === 'RB') {
    return (stats.RushYds || 0) * 0.8 + (stats.RushTD || 0) * 20 + (stats.RushYA || 0) * 5 + (stats.RecYds || 0) * 0.5;
  }
  if (position === 'WR' || position === 'TE') {
    return (stats.RecYds || 0) * 0.9 + (stats.RecTD || 0) * 25 + (stats.YPR || 0) * 1 + (stats.Rec || 0) * 6 + (stats.RushYds || 0) * 0.5;
  }
  return 0;
}

const TE_BONUS = 1.4;

function getFootballProjection(lineup) {
  const picks = FOOTBALL_POSITIONS.map((pos) => lineup[pos]).filter(Boolean);
  if (picks.length !== 6) return null;

  let totalValue = 0;
  const positionValues = {};

  for (const pick of picks) {
    const slot = Object.entries(lineup).find(([_, p]) => p === pick)?.[0];
    const statPos = getSlotStatPosition(pick, slot);
    let value = getPositionValue(pick.stats, statPos);
    // Boost actual TE players when they slot at TE
    if (slot === 'FLEX' && pick.primaryPosition === 'TE') {
      value *= TE_BONUS;
    }
    totalValue += value;
    if (slot) positionValues[slot] = value;
  }

  const rawRatio = totalValue / PERFECT_TARGET;
  const wins = Math.max(
    0,
    Math.min(12, Math.round(12 * Math.pow(Math.min(rawRatio, 1), 2.0)))
  );
  const losses = 12 - wins;

  const tier = (() => {
    if (wins >= 12) return { label: 'NATIONAL CHAMPIONS', color: 'text-yellow-300' };
    if (wins >= 10) return { label: 'PLAYOFF BOUND', color: 'text-green-300' };
    if (wins >= 8) return { label: 'BOWL ELIGIBLE', color: 'text-blue-300' };
    if (wins >= 6) return { label: 'ON THE BUBBLE', color: 'text-purple-300' };
    if (wins >= 4) return { label: 'REBUILDING', color: 'text-orange-400' };
    return { label: 'COACH ON HOT SEAT', color: 'text-red-400' };
  })();

  const analysis = Object.entries(POSITION_BENCHMARKS).map(([pos, bench]) => {
    let val = 0;
    if (pos === 'WR') {
      val = (positionValues.WR1 || 0) + (positionValues.WR2 || 0);
    } else {
      val = positionValues[pos] || 0;
    }
    const ratio = val / bench;
    return { position: pos, value: val, benchmark: bench, ratio };
  }).sort((a, b) => b.ratio - a.ratio);

  const strengths = analysis.slice(0, 2).filter((a) => a.ratio >= 0.935);
  const weaknesses = analysis.slice(-2).filter((a) => a.ratio <= 0.715);

  return {
    wins,
    losses,
    strength: Math.round(totalValue),
    tier,
    positionValues,
    strengths,
    weaknesses,
  };
}

function encodeSharePayload(payload) {
  return btoa(encodeURIComponent(JSON.stringify(payload)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeSharePayload(encoded) {
  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
    const decoded = atob(padded);
    return JSON.parse(decodeURIComponent(decoded));
  } catch {
    return null;
  }
}

function clearShareQueryParam() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('share')) return;
  url.searchParams.delete('share');
  const newSearch = url.searchParams.toString();
  const newUrl = `${url.pathname}${newSearch ? `?${newSearch}` : ''}${url.hash}`;
  window.history.replaceState({}, '', newUrl);
}

function roundRectPolyfill(ctx, x, y, w, h, r) {
  const radius = Array.isArray(r) ? r : [r, r, r, r];
  const [tl, tr, br, bl] = radius.map((v) => Math.min(v, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

function generateFootballShareImage(lineup, projection, gameMode = 'classic') {
  const W = 640;
  const H = 880;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  const rr = (x, y, w, h, r) => {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      roundRectPolyfill(ctx, x, y, w, h, r);
    }
  };

  // Background
  ctx.fillStyle = '#0a0c14';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Top accent bar
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#1d4ed8');
  grad.addColorStop(1, '#3b82f6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 4);

  // Header
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('🏈 BIG BLUE ROULETTE', 24, 40);

  ctx.fillStyle = '#6b7280';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText('Kentucky Football Draft', 24, 58);

  // Mode badge
  const modeBadge = gameMode === 'ballknower'
    ? { text: 'BALL-KNOWER', color: '#2563eb' }
    : { text: 'CLASSIC', color: '#16a34a' };
  ctx.fillStyle = modeBadge.color;
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  const badgeW = ctx.measureText(modeBadge.text).width + 16;
  const badgeX = W - badgeW - 20;
  const badgeY = 70;
  rr(badgeX, badgeY, badgeW, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(modeBadge.text, badgeX + badgeW / 2, badgeY + 14);
  ctx.textAlign = 'left';

  // Tier badge
  const tierColors = {
    'NATIONAL CHAMPIONS': ['#854d0e', '#fde047'],
    'PLAYOFF BOUND': ['#14532d', '#86efac'],
    'BOWL ELIGIBLE': ['#1e3a5f', '#93c5fd'],
    'ON THE BUBBLE': ['#3b0764', '#d8b4fe'],
    'REBUILDING': ['#431407', '#fb923c'],
    'COACH ON HOT SEAT': ['#450a0a', '#fca5a5'],
  };
  const [bgHex, textHex] = tierColors[projection.tier.label] ?? ['#1f2937', '#9ca3af'];

  const tierLabel = projection.tier.label;
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  const tierW = ctx.measureText(tierLabel).width + 24;
  const tierX = W - tierW - 20;
  const tierY = 22;
  ctx.fillStyle = bgHex;
  rr(tierX, tierY, tierW, 26, 6);
  ctx.fill();
  ctx.fillStyle = textHex;
  ctx.textAlign = 'center';
  ctx.fillText(tierLabel, tierX + tierW / 2, tierY + 17);
  ctx.textAlign = 'left';

  // Record
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${projection.wins}-${projection.losses}`, 24, 108);
  ctx.fillStyle = '#6b7280';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillText('Projected Record (of 12)', 24, 124);

  // Team Strength
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Team Strength: ${projection.strength}`, 24, 144);

  // Position values bar
  const slots = ['QB', 'RB', 'WR1', 'WR2', 'TE', 'FLEX'];
  const slotLabels = { QB: 'QB', RB: 'RB', WR1: 'WR1', WR2: 'WR2', TE: 'TE', FLEX: 'Flex' };
  const colW = (W - 48) / 6;
  slots.forEach((key, i) => {
    const bx = 24 + i * colW;
    const by = 156;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    rr(bx, by, colW - 6, 44, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    rr(bx, by, colW - 6, 44, 6);
    ctx.stroke();
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(slotLabels[key], bx + (colW - 6) / 2, by + 13);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText((projection.positionValues[key] || 0).toFixed(1), bx + (colW - 6) / 2, by + 33);
    ctx.textAlign = 'left';
  });

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 216);
  ctx.lineTo(W - 24, 216);
  ctx.stroke();

  // Player cards
  slots.forEach((pos, i) => {
    const pick = lineup[pos];
    if (!pick) return;
    const cx = 24;
    const cy = 228 + i * 104;
    const cardH = 94;
    const cardW = W - 48;

    // Card bg
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    rr(cx, cy, cardW, cardH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    rr(cx, cy, cardW, cardH, 10);
    ctx.stroke();

    // Position color accent left bar
    const posColor = POSITION_COLORS_HEX[pos] ?? '#6b7280';
    ctx.fillStyle = posColor;
    rr(cx, cy, 4, cardH, [10, 0, 0, 10]);
    ctx.fill();

    // Position pill
    ctx.fillStyle = posColor + '33';
    rr(cx + 14, cy + 12, 32, 18, 4);
    ctx.fill();
    ctx.fillStyle = posColor;
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pos, cx + 30, cy + 25);
    ctx.textAlign = 'left';

    // Season label
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillText(pick.season, cx + 52, cy + 25);

    // Player name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(pick.playerName, cx + 14, cy + 52);

    // Stats row
    const statMap = {
      QB: [{ k: 'Yds', l: 'Pass Yds/G' }, { k: 'TD', l: 'Pass TD/G' }, { k: 'Int', l: 'Int/G' }, { k: 'Rate', l: 'Rate' }],
      RB: [{ k: 'RushYds', l: 'Rush Yds/G' }, { k: 'RushTD', l: 'Rush TD/G' }, { k: 'RecYds', l: 'Rec Yds/G' }, { k: 'RecTD', l: 'Rec TD/G' }],
      WR: [{ k: 'Rec', l: 'Rec/G' }, { k: 'RecYds', l: 'Rec Yds/G' }, { k: 'YPR', l: 'Y/R' }, { k: 'RecTD', l: 'Rec TD/G' }],
      TE: [{ k: 'Rec', l: 'Rec/G' }, { k: 'RecYds', l: 'Rec Yds/G' }, { k: 'YPR', l: 'Y/R' }, { k: 'RecTD', l: 'Rec TD/G' }],
    };
    const statKeys = statMap[getSlotStatPosition(pick, pos)] || statMap.WR;
    const statW = (cardW - 28) / statKeys.length;
    statKeys.forEach((sk, si) => {
      const sx = cx + 14 + si * statW;
      const sy = cy + 66;
      ctx.fillStyle = '#4b5563';
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      ctx.fillText(sk.l, sx, sy);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      const val = typeof pick.stats?.[sk.k] === 'number' ? pick.stats[sk.k].toFixed(1) : (pick.stats?.[sk.k] ?? '-');
      ctx.fillText(val, sx, sy + 15);
    });
  });

  // Footer
  ctx.fillStyle = '#374151';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('bigbluehistory.com • Kentucky Football Draft • @BigBlueRoulette', W / 2, H - 14);
  ctx.textAlign = 'left';

  return canvas;
}

function FootballMetricBar({ projection }) {
  const slots = ['QB', 'RB', 'WR1', 'WR2', 'TE', 'FLEX'];
  const labels = { QB: 'QB', RB: 'RB', WR1: 'WR1', WR2: 'WR2', TE: 'TE', FLEX: 'Flex' };
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {slots.map((slot) => (
        <div key={slot} className="rounded-xl bg-black/25 border border-white/10 p-1.5 text-center">
          <div className="text-[9px] tracking-widest text-gray-500 uppercase">{labels[slot]}</div>
          <div className="text-xs font-semibold text-white mt-0.5">{(projection.positionValues[slot] || 0).toFixed(1)}</div>
        </div>
      ))}
    </div>
  );
}

function FootballTeamAnalysis({ projection }) {
  const items = [
    { slot: 'QB', pos: 'QB', label: 'Quarterback Play', high: 'Elite QB Play', mid: 'Solid QB Play', weak: 'QB Needs Work' },
    { slot: 'RB', pos: 'RB', label: 'Ground Game', high: 'Dominant Rushing', mid: 'Adequate Rushing', weak: 'Rushing Struggles' },
    { slot: 'WR1', pos: 'WR', label: 'WR1 Threat', high: 'Explosive WR1', mid: 'Solid WR1', weak: 'WR1 Needs Work' },
    { slot: 'WR2', pos: 'WR', label: 'WR2 Threat', high: 'Explosive WR2', mid: 'Solid WR2', weak: 'WR2 Needs Work' },
    { slot: 'TE', pos: 'TE', label: 'Tight End Threat', high: 'Elite TE Play', mid: 'Solid TE', weak: 'TE Needs Work' },
    { slot: 'FLEX', pos: 'FLEX', label: 'Flex Threat', high: 'Elite Flex Play', mid: 'Solid Flex', weak: 'Flex Is a Liability' },
  ];

  const scored = items.map((item) => ({
    ...item,
    ratio: (projection.positionValues[item.slot] || 0) / POSITION_BENCHMARKS[item.pos],
  })).sort((a, b) => b.ratio - a.ratio);

  const strengths = scored.slice(0, 2);
  const weaknesses = scored.slice(-2);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Team Analysis</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1.5">Strengths</div>
          <ul className="space-y-1.5">
            {strengths.map((s) => (
              <li key={s.slot} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-green-400 mt-0.5">+</span>
                <span>
                  {s.ratio >= 1.0 ? s.high : s.mid}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1.5">Weaknesses</div>
          <ul className="space-y-1.5">
            {weaknesses.map((w) => (
              <li key={w.slot} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">−</span>
                <span>
                  {w.weak}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function FootballIntroScreen({ onStart }) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 text-center animate-fadeIn">
      <div>
        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
          <span>🏈</span> Kentucky Football
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          BIG BLUE <span className="text-blue-400">ROULETTE</span>
        </h1>
        <p className="mt-3 text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
          Spin a random Kentucky coaching era, pick any player from that coach's tenure,
          and fill your six-man skill position lineup.
        </p>
      </div>

      <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left flex flex-col gap-3">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">How It Works</div>
        <div className="text-sm text-gray-300">1. Spin the coaching era roulette.</div>
        <div className="text-sm text-gray-300">2. Pick any player from that coach's era.</div>
        <div className="text-sm text-gray-300">3. Place him into one open position he can play.</div>
        <div className="text-sm text-gray-300">4. TE is a dedicated tight end slot.</div>
        <div className="text-sm text-gray-300">5. FLEX is a flex spot — WRs, RBs, and TEs can slot there.</div>
        <div className="text-sm text-gray-300">6. Fill all six slots to finish your lineup.</div>
      </div>

      <div className="w-full flex flex-col gap-3">
        <button
          onClick={() => onStart('classic')}
          className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl transition-all duration-150 shadow-lg shadow-blue-600/30"
        >
          Play Classic (Stats On)
        </button>
        <button
          onClick={() => onStart('ballknower')}
          className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-white/5 hover:bg-white/10 border border-white/15 active:scale-95 text-white font-bold rounded-xl transition-all duration-150"
        >
          Play Ball-Knower (Stats Hidden) <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onStart('lineupbuilder')}
          className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 active:scale-95 text-teal-200 font-bold rounded-xl transition-all duration-150"
        >
          <Users className="w-4 h-4" />
          Dream Lineup Builder
        </button>
      </div>
    </div>
  );
}

function FootballPlayingScreen({
  gameMode, rouletteEra, currentEra, spinning, openPositions,
  sortMetric, sortDirection, setSortMetric, setSortDirection, sortedRoster,
  selectedPlayer, setSelectedPlayer, selectedPosition, setSelectedPosition,
  selectedPlayerOpenPositions, spinRoulette, placePlayer,
  lineup, usedEras, roundNumber,
}) {
  const [mobileTab, setMobileTab] = useState('draft');
  const [positionFilter, setPositionFilter] = useState(null);

  useEffect(() => {
    setPositionFilter(null);
  }, [currentEra]);

  useEffect(() => {
    if (positionFilter === 'QB') {
      setSortMetric('Yds');
      setSortDirection('desc');
    } else if (positionFilter === 'RB') {
      setSortMetric('RushYds');
      setSortDirection('desc');
    } else if (positionFilter === 'WR') {
      setSortMetric('RecYds');
      setSortDirection('desc');
    }
  }, [positionFilter, setSortMetric, setSortDirection]);

  const filteredRoster = useMemo(() => {
    if (!positionFilter) return sortedRoster;
    return sortedRoster.filter(({ player }) => player.primaryPosition === positionFilter);
  }, [sortedRoster, positionFilter]);

  const POSITION_FILTERS = [
    { key: null, label: 'All' },
    { key: 'QB', label: 'QB' },
    { key: 'RB', label: 'RB' },
    { key: 'WR', label: 'WR' },
    { key: 'TE', label: 'TE' },
  ];

  return (
    <>
      <div className="flex lg:hidden mb-3 rounded-xl border border-white/10 bg-white/5 p-1 gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('draft')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mobileTab === 'draft' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
        >
          Draft
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('lineup')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mobileTab === 'lineup' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
        >
          Lineup ({FOOTBALL_POSITIONS.filter(p => lineup[p]).length}/6)
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className={`bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 animate-fadeIn ${mobileTab === 'lineup' ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-300 font-semibold">Coaching Era Roulette</div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1 min-h-[2.2rem]">
                {rouletteEra ? `${rouletteEra} Wildcats` : 'Spin for a coach'}
              </div>
            </div>
            <button
              onClick={spinRoulette}
              disabled={spinning || openPositions.length === 0 || currentEra}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2.5 text-sm font-bold transition-all"
            >
              {spinning ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Shuffle className="w-4 h-4" />}
              {spinning ? 'Spinning...' : (currentEra ? 'Spin New Era' : 'Spin Roulette')}
            </button>
          </div>

          {spinning && (
            <div className="mb-4 text-sm text-blue-300 bg-blue-500/10 border border-blue-400/30 rounded-xl px-3 py-2 animate-fadeIn">
              Rolling through Kentucky football history...
            </div>
          )}

          {!spinning && currentEra && (
            <>
              <div className="mb-3 text-sm text-gray-400">Choose any player from this era:</div>

              <div className="mb-3 rounded-xl border border-white/10 bg-black/20 p-3 animate-fadeIn">
                <div className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Filter By Position <span className="text-gray-600 normal-case">({filteredRoster.length} shown)</span></div>
                <div className="flex flex-wrap gap-2">
                  {POSITION_FILTERS.map((filter) => {
                    const isActive = positionFilter === filter.key;
                    return (
                      <button
                        key={filter.label}
                        type="button"
                        onClick={() => setPositionFilter(filter.key)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isActive ? 'bg-blue-500/20 border-blue-400/60 text-blue-200' : 'bg-white/5 border-white/15 text-gray-300 hover:bg-white/10'}`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {gameMode === 'classic' && (
                <div className="mb-3 rounded-xl border border-white/10 bg-black/20 p-3 animate-fadeIn">
                  <div className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Sort By</div>
                  <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map((option) => {
                      const isActive = sortMetric === option.key;
                      const directionLabel = isActive ? (sortDirection === 'desc' ? '↓' : '↑') : '';
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => {
                            if (sortMetric === option.key) {
                              setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                              return;
                            }
                            setSortMetric(option.key);
                            setSortDirection('desc');
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isActive ? 'bg-blue-500/20 border-blue-400/60 text-blue-200' : 'bg-white/5 border-white/15 text-gray-300 hover:bg-white/10'}`}
                        >
                          {option.label} {directionLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={`grid grid-cols-1 gap-2 overflow-y-auto pr-1 ${selectedPlayer ? 'max-h-[300px]' : 'max-h-[400px]'}`}>
                {filteredRoster.map(({ player, stats, eraSeason, alreadyDrafted, availableForPlayer, canPlace }) => {
                  const selected = selectedPlayer?.id === player.id;
                  return (
                    <button
                      key={player.id}
                      onClick={() => {
                        if (!canPlace) return;
                        setSelectedPlayer({ ...player, stats, eraSeason });
                        setSelectedPosition(availableForPlayer.length === 1 ? availableForPlayer[0] : null);
                      }}
                      disabled={!canPlace}
                      className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                        selected
                          ? 'bg-blue-500/20 border-blue-400/60'
                          : canPlace
                            ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                            : 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed opacity-70'
                      }`}
                    >
                      <div className="text-sm font-semibold">{player.fullName}</div>
                      {gameMode === 'ballknower' && eraSeason && (
                        <div className="text-[11px] text-gray-400 mt-0.5">{eraSeason}</div>
                      )}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {getPlayablePositions(player, eraSeason).map((position) => (
                          <PositionBadge key={`${player.id}-${position}`} position={position} />
                        ))}
                      </div>
                      {gameMode === 'classic' && stats && (
                        <StatGrid stats={stats} position={player.primaryPosition} />
                      )}
                      {gameMode === 'classic' && !stats && (
                        <div className="mt-2 text-[11px] text-gray-500 italic">Stats unavailable</div>
                      )}
                      {alreadyDrafted && <div className="text-[11px] text-gray-500 mt-1">Already drafted</div>}
                      {!stats && !alreadyDrafted && <div className="text-[11px] text-orange-400/70 mt-1">Stats pending</div>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {selectedPlayer && (
            <div className="mt-4 border border-white/10 rounded-xl p-3 bg-black/30 animate-fadeIn">
              <div className="text-sm text-gray-300">
                Place <span className="font-semibold text-white">{selectedPlayer.fullName}</span> at:
              </div>
              {selectedPlayer.eraSeason && (
                <div className="text-[11px] text-gray-400 mt-1">
                  {selectedPlayer.primaryPosition} &bull; {selectedPlayer.eraSeason}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedPlayerOpenPositions.map((position) => (
                  <button
                    key={position}
                    onClick={() => setSelectedPosition(position)}
                    className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      selectedPosition === position
                        ? 'bg-blue-500/25 border-blue-400 text-blue-200'
                        : 'bg-white/5 border-white/15 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {position} &bull; {FOOTBALL_POSITION_LABELS[position]}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { placePlayer(); setMobileTab('draft'); }}
                disabled={!selectedPosition}
                className="mt-3 w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-all"
              >
                Assign to {selectedPosition || 'Position'}
              </button>
            </div>
          )}

          <div className="mt-6 flex justify-center gap-3 sm:gap-4">
            {FOOTBALL_POSITIONS.map((position) => {
              const pick = lineup[position];
              const initials = pick ? pick.playerName.split(' ').map(n => n[0]).join('') : '';
              const hexColor = POSITION_COLORS_HEX[position];
              return (
                <div key={position} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                      pick ? 'bg-white/10 border-white/30' : 'bg-white/5 border-dashed border-white/20'
                    }`}
                    style={pick ? { borderColor: hexColor } : {}}
                  >
                    {pick ? (
                      <span className="text-white font-bold text-sm sm:text-base">{initials}</span>
                    ) : (
                      <span className="text-white/50 text-xs sm:text-sm font-semibold">{position}</span>
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${pick ? 'text-white' : 'text-white/40'}`}>{position}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className={`bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 h-fit animate-fadeIn ${mobileTab === 'draft' ? 'hidden lg:block' : ''}`}>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Your Lineup</div>
          <div className="grid grid-cols-1 gap-2">
            {FOOTBALL_POSITIONS.map((position) => (
              <LineupSlot key={position} position={position} pick={lineup[position]} />
            ))}
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Open slots: {openPositions.length > 0 ? openPositions.join(', ') : 'None'}
          </div>
          <div className="mt-3 text-xs text-gray-500">Drafted eras: {usedEras.length}</div>

          <button
            type="button"
            onClick={() => setMobileTab('draft')}
            className="lg:hidden mt-4 w-full py-2.5 rounded-lg border border-white/15 text-sm text-gray-300 font-semibold hover:bg-white/10 transition-all"
          >
            &larr; Back to Draft
          </button>
        </section>
      </div>
    </>
  );
}

function FootballFinalLineup({ lineup, onRestart, onCopyShare, shareStatus, gameMode, projection }) {
  const [imageStatus, setImageStatus] = useState('');

  const handleShareImage = useCallback(() => {
    try {
      const canvas = generateFootballShareImage(lineup, projection, gameMode);
      canvas.toBlob((blob) => {
        if (!blob) { setImageStatus('Could not generate image.'); return; }
        const shareData = {
          files: [new File([blob], 'big-blue-roulette-football.png', { type: 'image/png' })],
          title: 'Big Blue Roulette Football',
          text: `My Kentucky football draft went ${projection.wins}-${projection.losses}! ${projection.tier.label} @BigBlueRoulette`,
        };
        if (navigator.canShare && navigator.canShare(shareData)) {
          navigator.share(shareData).catch(() => {
            downloadImage(canvas);
          });
        } else {
          downloadImage(canvas);
        }
      }, 'image/png');
    } catch (err) {
      setImageStatus('Could not generate image.');
      console.error('Share image error:', err);
    }
  }, [lineup, projection, gameMode]);

  function downloadImage(canvas) {
    const link = document.createElement('a');
    link.download = 'big-blue-roulette-football.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    setImageStatus('Image saved!');
    setTimeout(() => setImageStatus(''), 2500);
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 animate-fadeIn">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className={`text-2xl font-black tracking-tight ${projection.tier.color}`}>{projection.tier.label}</div>
        <div className="text-gray-400 text-sm mt-1">Projected Record: <span className="text-white font-semibold">{projection.wins}-{projection.losses}</span> <span className="text-gray-500">(of 12)</span></div>
        <div className="text-xs text-gray-500 mt-1">Team Strength: {projection.strength}</div>
        <div className="text-[11px] text-orange-400 mt-1 uppercase tracking-wider font-semibold">⚠ All Stats Per Game</div>
        {gameMode === 'ballknower' && (
          <div className="text-xs text-blue-300 mt-1">Ball-Knower Mode &bull; No stats shown during draft</div>
        )}
      </div>

      <FootballMetricBar projection={projection} />

      <FootballTeamAnalysis projection={projection} />

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FOOTBALL_POSITIONS.map((position) => {
          const pick = lineup[position];
          if (!pick) return null;
          const posVal = projection.positionValues[position] || 0;
          return (
            <div key={position} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <PositionBadge position={position} />
                <span className="text-xs text-gray-500">{FOOTBALL_POSITION_LABELS[position]}</span>
              </div>
              <div className="text-sm font-semibold text-white">{pick.playerName}</div>
              <div className="text-xs text-gray-400 mt-1">{pick.season} &bull; {pick.primaryPosition}</div>
              {pick.stats && (
                <StatGrid stats={pick.stats} position={getSlotStatPosition(pick, position)} />
              )}
              <div className="mt-2 text-[11px] text-gray-500">Value: {posVal.toFixed(1)} vs {POSITION_BENCHMARKS[getSlotStatPosition(pick, position)]} benchmark</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCopyShare}
          className="flex items-center justify-center gap-2 flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold rounded-xl transition-all duration-150"
        >
          <Link2 className="w-4 h-4" />
          Copy Link
        </button>
        <button
          onClick={handleShareImage}
          className="flex items-center justify-center gap-2 flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold rounded-xl transition-all duration-150"
        >
          <Download className="w-4 h-4" />
          Share Graphic
        </button>
      </div>
      {(shareStatus || imageStatus) && (
        <div className="text-center text-xs text-green-300">{shareStatus || imageStatus}</div>
      )}

      <button
        onClick={onRestart}
        className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl transition-all duration-150"
      >
        <RotateCcw className="w-4 h-4" />
        Draft Again
      </button>
    </div>
  );
}

function FootballSharedLineup({ payload, onStartNew }) {
  const { lineup, projection, mode } = payload;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 animate-fadeIn">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
          Shared Kentucky Football Lineup
        </div>
        <div className={`text-2xl font-black tracking-tight ${projection.tier.color}`}>{projection.tier.label}</div>
        <div className="text-gray-400 text-sm mt-1">Projected Record: <span className="text-white font-semibold">{projection.wins}-{projection.losses}</span> <span className="text-gray-500">(of 12)</span></div>
        <div className="text-[11px] text-orange-400 mt-1 uppercase tracking-wider font-semibold">⚠ All Stats Per Game</div>
      </div>

      <FootballMetricBar projection={projection} />

      <FootballTeamAnalysis projection={projection} />

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FOOTBALL_POSITIONS.map((position) => {
          const pick = lineup[position];
          if (!pick) return null;
          return (
            <div key={position} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <PositionBadge position={position} />
                <span className="text-xs text-gray-500">{FOOTBALL_POSITION_LABELS[position]}</span>
              </div>
              <div className="text-sm font-semibold text-white">{pick.playerName}</div>
              <div className="text-xs text-gray-400 mt-1">{pick.season} &bull; {pick.primaryPosition}</div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onStartNew}
        className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl transition-all duration-150"
      >
        <ChevronRight className="w-4 h-4" />
        Start Your Own Draft
      </button>
    </div>
  );
}

export default function FootballApp() {
  const [phase, setPhase] = useState('intro');
  const [gameMode, setGameMode] = useState('ballknower');
  const [lineup, setLineup] = useState({ ...EMPTY_LINEUP });
  const [currentEra, setCurrentEra] = useState(null);
  const [rouletteEra, setRouletteEra] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [usedEras, setUsedEras] = useState([]);
  const [sortMetric, setSortMetric] = useState('name');
  const [sortDirection, setSortDirection] = useState('desc');
  const [shareStatus, setShareStatus] = useState('');
  const [sharedPayload, setSharedPayload] = useState(null);

  const playerIdSet = useMemo(() => new Set(footballPlayers.map((p) => p.id)), []);

  const openPositions = useMemo(
    () => FOOTBALL_POSITIONS.filter((position) => !lineup[position]),
    [lineup],
  );

  const draftedPlayerIds = useMemo(
    () => new Set(FOOTBALL_POSITIONS.map((position) => lineup[position]?.playerId).filter(Boolean)),
    [lineup],
  );

  const roster = useMemo(
    () => {
      if (!currentEra) return [];
      return footballPlayers.filter(
        (p) =>
          playerIdSet.has(p.id) &&
          p.seasons.some((season) => getFootballEraLabel(season) === currentEra)
      );
    },
    [currentEra, playerIdSet],
  );

  const roundNumber = FOOTBALL_POSITIONS.length - openPositions.length + 1;

  const projection = useMemo(() => getFootballProjection(lineup), [lineup]);

  const selectedPlayerOpenPositions = useMemo(() => {
    if (!selectedPlayer) return [];
    return getPlayablePositions(selectedPlayer, selectedPlayer.eraSeason).filter((position) => openPositions.includes(position));
  }, [selectedPlayer, openPositions]);

  const sortedRoster = useMemo(() => {
    const rows = roster
      .map((player) => {
        const best = getBestFootballSeasonInEra(player, currentEra);
        const stats = best?.stats ?? null;
        const eraSeason = best?.season ?? null;
        const availableForPlayer = eraSeason
          ? getPlayablePositions(player, eraSeason).filter((position) => openPositions.includes(position))
          : [];
        const alreadyDrafted = draftedPlayerIds.has(player.id);
        const canPlace = availableForPlayer.length > 0 && !alreadyDrafted;
        return { player, stats, eraSeason, availableForPlayer, alreadyDrafted, canPlace };
      });

    const activeSortMetric = gameMode === 'classic' ? sortMetric : 'name';
    const activeSortDirection = gameMode === 'classic' ? sortDirection : 'asc';

    rows.sort((a, b) => {
      let comparison = 0;
      if (activeSortMetric === 'name') {
        comparison = a.player.fullName.split(' ').pop().localeCompare(b.player.fullName.split(' ').pop());
      } else if (activeSortMetric === 'position') {
        const posOrder = { QB: 0, RB: 1, WR: 2, TE: 3 };
        comparison = (posOrder[a.player.primaryPosition] ?? 99) - (posOrder[b.player.primaryPosition] ?? 99);
      } else {
        const aValue = a.stats?.[activeSortMetric] ?? -Infinity;
        const bValue = b.stats?.[activeSortMetric] ?? -Infinity;
        comparison = aValue - bValue;
      }
      if (comparison === 0) {
        comparison = a.player.fullName.split(' ').pop().localeCompare(b.player.fullName.split(' ').pop());
      }
      return activeSortDirection === 'asc' ? comparison : -comparison;
    });

    return rows;
  }, [currentEra, draftedPlayerIds, gameMode, openPositions, roster, sortDirection, sortMetric]);

  const eraHasUsablePlayers = useCallback((eraLabel) => {
    return footballEraHasUsablePlayers(eraLabel, openPositions, draftedPlayerIds, playerIdSet);
  }, [openPositions, draftedPlayerIds, playerIdSet]);

  const spinRoulette = useCallback(() => {
    if (spinning || openPositions.length === 0 || currentEra) return;

    const unusedEras = ALL_FOOTBALL_ERAS.filter((era) => !usedEras.includes(era));

    let eraPool = unusedEras.filter((era) => eraHasUsablePlayers(era));
    let isFromUnused = true;

    if (eraPool.length === 0) {
      eraPool = ALL_FOOTBALL_ERAS.filter((era) => eraHasUsablePlayers(era));
      isFromUnused = false;
    }

    if (eraPool.length === 0) {
      eraPool = unusedEras.length > 0 ? unusedEras : ALL_FOOTBALL_ERAS;
      isFromUnused = unusedEras.length > 0;
    }

    if (eraPool.length === 0) return;

    setSpinning(true);
    setCurrentEra(null);
    setSelectedPlayer(null);
    setSelectedPosition(null);

    const intervalId = window.setInterval(() => {
      setRouletteEra(getRandom(eraPool));
    }, 80);

    window.setTimeout(() => {
      window.clearInterval(intervalId);
      const chosenEra = getRandom(eraPool);
      setRouletteEra(chosenEra);
      setCurrentEra(chosenEra);
      setUsedEras((prev) => (isFromUnused ? [...prev, chosenEra] : [chosenEra]));
      setSpinning(false);
    }, 1400);
  }, [spinning, usedEras, openPositions, draftedPlayerIds, playerIdSet, currentEra, eraHasUsablePlayers]);

  const startGame = useCallback((mode) => {
    clearShareQueryParam();
    setSharedPayload(null);
    if (mode === 'lineupbuilder') {
      setPhase('lineupbuilder');
      return;
    }
    setGameMode(mode);
    setLineup({ ...EMPTY_LINEUP });
    setCurrentEra(null);
    setRouletteEra(null);
    setSelectedPlayer(null);
    setSelectedPosition(null);
    setUsedEras([]);
    setPhase('playing');
  }, []);

  const restartGame = useCallback(() => {
    clearShareQueryParam();
    setSharedPayload(null);
    setPhase('intro');
  }, []);

  const copyShareLink = useCallback(async () => {
    if (!projection) return;

    const payload = {
      lineup,
      projection,
      mode: gameMode,
      createdAt: new Date().toISOString(),
      version: 1,
    };

    const encoded = encodeSharePayload(payload);
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('Share link copied.');
    } catch {
      setShareStatus('Could not access clipboard. Copy the URL from your browser bar.');
    }
  }, [lineup, projection, gameMode]);

  useEffect(() => {
    const shareEncoded = new URLSearchParams(window.location.search).get('share');
    if (!shareEncoded) return;

    const decoded = decodeSharePayload(shareEncoded);
    const hasValidLineup = decoded?.lineup && FOOTBALL_POSITIONS.every((position) => decoded.lineup[position]);
    const hasProjection = decoded?.projection?.wins !== undefined && decoded?.projection?.losses !== undefined;

    if (hasValidLineup && hasProjection) {
      setGameMode(decoded.mode === 'classic' ? 'classic' : 'ballknower');
      setSharedPayload(decoded);
      setPhase('shared');
    }
  }, []);

  useEffect(() => {
    if (!shareStatus) return undefined;

    const timeoutId = window.setTimeout(() => setShareStatus(''), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [shareStatus]);

  const placePlayer = useCallback(() => {
    if (!selectedPlayer || !selectedPosition || !currentEra) return;
    if (!openPositions.includes(selectedPosition)) return;
    const stats = getStatsForDisplay(selectedPlayer, selectedPlayer.eraSeason);
    const playablePositions = getPlayablePositions(selectedPlayer, selectedPlayer.eraSeason);
    setLineup((prev) => ({
      ...prev,
      [selectedPosition]: {
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.fullName,
        season: selectedPlayer.eraSeason,
        primaryPosition: selectedPlayer.primaryPosition,
        stats,
        playablePositions,
      },
    }));
    setSelectedPlayer(null);
    setSelectedPosition(null);
    setCurrentEra(null);
    setRouletteEra(null);
    if (openPositions.length === 1) {
      window.setTimeout(() => setPhase('done'), 200);
    }
  }, [currentEra, openPositions, selectedPlayer, selectedPosition]);

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white">
      <header className="sticky top-0 z-50 bg-[#0a0c14]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={restartGame}
            role="button"
            aria-label="Go to home"
          >
            <img src="/logo.png" alt="Big Blue Roulette" className="h-8 w-8 object-contain" />
            <span className="font-black text-white tracking-tight">BIG BLUE ROULETTE</span>
          </div>
          {phase === 'playing' && (
            <div className="text-xs text-gray-400">
              <span className="mr-2 text-blue-300 uppercase tracking-widest">
                {gameMode === 'classic' ? 'Classic' : 'Ball-Knower'}
              </span>
              Round <span className="text-white font-semibold">{roundNumber}</span> of 6
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {phase === 'intro' && <FootballIntroScreen onStart={startGame} />}
        {phase === 'lineupbuilder' && <FootballLineupBuilder onBack={() => setPhase('intro')} />}
        {phase === 'playing' && (
          <FootballPlayingScreen
            gameMode={gameMode}
            rouletteEra={rouletteEra}
            currentEra={currentEra}
            spinning={spinning}
            openPositions={openPositions}
            sortMetric={sortMetric}
            sortDirection={sortDirection}
            setSortMetric={setSortMetric}
            setSortDirection={setSortDirection}
            sortedRoster={sortedRoster}
            selectedPlayer={selectedPlayer}
            setSelectedPlayer={setSelectedPlayer}
            selectedPosition={selectedPosition}
            setSelectedPosition={setSelectedPosition}
            selectedPlayerOpenPositions={selectedPlayerOpenPositions}
            spinRoulette={spinRoulette}
            placePlayer={placePlayer}
            lineup={lineup}
            usedEras={usedEras}
            roundNumber={roundNumber}
          />
        )}
        {phase === 'shared' && sharedPayload && (
          <FootballSharedLineup payload={sharedPayload} onStartNew={startGame} />
        )}
        {phase === 'done' && projection && (
          <FootballFinalLineup lineup={lineup} onRestart={restartGame} onCopyShare={copyShareLink} shareStatus={shareStatus} gameMode={gameMode} projection={projection} />
        )}
      </main>

      <footer className="mt-8 pb-8 text-center text-xs text-gray-600">
        Kentucky Football Stats sourced from Sports-Reference
        <br />
        <span className="mt-2 text-gray-500">Created by Daniel Reeves</span>
        <div className="mt-4">
          <a
            href="https://www.buymeacoffee.com/danielt279y"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all text-gray-300 hover:text-white text-sm font-semibold shadow-sm"
          >
            <span className="text-base">☕</span> Buy me a coffee
          </a>
        </div>
      </footer>
    </div>
  );
}
