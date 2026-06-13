import { useCallback, useEffect, useMemo, useState } from 'react';
import { allSeasons, players, POSITIONS, POSITION_LABELS, seasonPlayersMap } from './data/players.js';
import { playerSeasonStatsById } from './data/playerSeasonStats.js';
import { ChevronRight, Download, Link2, RotateCcw, Shuffle, Sparkles, Trophy, Hash, MapPin, HelpCircle, Users, Calculator, ArrowLeft } from 'lucide-react';
import './App.css';
import JerseyGame from './components/JerseyGame.jsx';
import HometownGame from './components/HometownGame.jsx';
import TwentyQuestionsGame from './components/TwentyQuestionsGame.jsx';
import LineupBuilder from './components/LineupBuilder.jsx';
import PerfectPlayerGame from './components/PerfectPlayerGame.jsx';

const POSITION_FLEXIBILITY = {
  PG: ['PG', 'SG'],
  SG: ['PG', 'SG', 'SF'],
  SF: ['SG', 'SF', 'PF'],
  PF: ['SF', 'PF', 'C'],
  C: ['PF', 'C'],
  F: ['SF', 'PF'],
  G: ['PG', 'SG'],
};

const EMPTY_LINEUP = {
  PG: null,
  SG: null,
  SF: null,
  PF: null,
  C: null,
};

const EMPTY_TOTALS = {
  pts: 0,
  reb: 0,
  ast: 0,
  stl: 0,
  blk: 0,
};

const POSITION_METRIC_BASE = {
  PG: { pts: 17.5, reb: 4.4, ast: 7.8, stl: 1.5, blk: 0.2 },
  SG: { pts: 21.4, reb: 4.7, ast: 4.2, stl: 1.3, blk: 0.3 },
  SF: { pts: 20.1, reb: 6.1, ast: 3.9, stl: 1.2, blk: 0.6 },
  PF: { pts: 18.8, reb: 8.3, ast: 3.0, stl: 1.0, blk: 1.0 },
  C: { pts: 20.3, reb: 10.2, ast: 2.4, stl: 0.8, blk: 1.9 },
};

const METRIC_LABELS = {
  pts: 'PPG',
  reb: 'RPG',
  ast: 'APG',
  stl: 'SPG',
  blk: 'BPG',
};

const SORT_OPTIONS = [
  { key: 'pts', label: 'PPG' },
  { key: 'reb', label: 'RPG' },
  { key: 'ast', label: 'APG' },
  { key: 'stl', label: 'SPG' },
  { key: 'blk', label: 'BPG' },
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function roundToTenths(value) {
  return Math.round(value * 10) / 10;
}

function getLastName(fullName) {
  return fullName.split(' ').pop();
}

function hashString(value) {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getSeasonStartYear(season) {
  const [startYearString] = season.split('-');
  return Number.parseInt(startYearString, 10);
}

function getEraAdjustment(year) {
  if (year < 1970) {
    return { pts: 0.92, reb: 1.04, ast: 0.9, stl: 0.78, blk: 0.76 };
  }

  if (year < 1980) {
    return { pts: 0.94, reb: 1.03, ast: 0.92, stl: 0.82, blk: 0.8 };
  }

  if (year < 1990) {
    return { pts: 0.97, reb: 1.0, ast: 0.96, stl: 0.9, blk: 0.9 };
  }

  if (year < 2000) {
    return { pts: 1.0, reb: 0.98, ast: 1.0, stl: 1.0, blk: 1.0 };
  }

  if (year < 2010) {
    return { pts: 1.03, reb: 0.96, ast: 1.04, stl: 1.05, blk: 1.03 };
  }

  if (year < 2020) {
    return { pts: 1.05, reb: 0.95, ast: 1.08, stl: 1.1, blk: 1.06 };
  }

  return { pts: 1.08, reb: 0.94, ast: 1.12, stl: 1.12, blk: 1.08 };
}

function getSpread(seed, shift, range) {
  const normalized = ((seed >>> shift) & 255) / 255;
  return (normalized - 0.5) * range;
}

function estimatePlayerMetrics(player, season) {
  // Only use real stats from Big Blue History - no synthetic fallback
  const realStats = playerSeasonStatsById[player.id]?.[season];
  if (realStats) {
    const year = parseInt(season.split('-')[0]);
    
    // For 1980+, use actual stats
    if (year >= 1980) {
      return {
        pts: realStats.pts ?? 0,
        reb: realStats.reb ?? 0,
        ast: realStats.ast ?? 0,
        stl: realStats.stl ?? 0,
        blk: realStats.blk ?? 0,
      };
    }
    
    // Pre-1980: Use real PTS/REB with era adjustment, era-estimated AST/STL/BLK based on position
    // (Assists were not officially tracked before 1983-84, so many players show ast=0)
    const positionEstimates = {
      'PG': { ast: 3.5, stl: 1.2, blk: 0.1 },
      'SG': { ast: 2.0, stl: 1.0, blk: 0.2 },
      'SF': { ast: 1.5, stl: 0.8, blk: 0.4 },
      'PF': { ast: 1.0, stl: 0.5, blk: 0.8 },
      'C':  { ast: 0.5, stl: 0.4, blk: 1.5 },
    };

    const estimates = positionEstimates[player.primaryPosition] || { ast: 1.0, stl: 0.5, blk: 0.3 };
    const era = getEraAdjustment(year);

    const rawAst = realStats.ast ?? 0;
    const ast = rawAst > 0 ? rawAst * era.ast : estimates.ast * era.ast;

    return {
      pts: (realStats.pts ?? 0) * era.pts,
      reb: (realStats.reb ?? 0) * era.reb,
      ast: roundToTenths(ast),
      stl: estimates.stl * era.stl,
      blk: estimates.blk * era.blk,
    };
  }

  // Return null if no real stats available (player will show as unavailable)
  return null;
}

// Benchmarks calibrated from 30 national champions (1996-2026)
const BENCHMARKS = {
  pts: 80.8,
  reb: 39,
  ast: 16.5,
  stl: 7.7,
  blk: 5.0,
};

const STAT_WEIGHTS = {
  pts: 0.44,
  reb: 0.27,
  ast: 0.18,
  stl: 0.07,
  blk: 0.04,
};

// 82-0 style: scale steals/blocks up if some players have 0 (missing data)
function adjustDefensiveStats(picks) {
  const stlCount = picks.filter((p) => p.metrics.stl > 0).length;
  const blkCount = picks.filter((p) => p.metrics.blk > 0).length;

  const totalStl = picks.reduce((sum, p) => sum + p.metrics.stl, 0);
  const totalBlk = picks.reduce((sum, p) => sum + p.metrics.blk, 0);

  return {
    stl: totalStl * (stlCount > 0 ? 5 / stlCount : 1),
    blk: totalBlk * (blkCount > 0 ? 5 / blkCount : 1),
  };
}

function getStrengthsAndWeaknesses(totals) {
  const thresholds = {
    pts: { benchmark: 80.8, strengthPct: 0.88, weaknessPct: 0.58, strong: 'Elite Scoring', weak: 'Offensive Struggles' },
    reb: { benchmark: 39,   strengthPct: 0.88, weaknessPct: 0.58, strong: 'Dominant Rebounding', weak: 'Rebounding Issues' },
    ast: { benchmark: 16.5, strengthPct: 0.85, weaknessPct: 0.55, strong: 'Great Ball Movement', weak: 'Ball Movement Issues' },
    stl: { benchmark: 7.7,  strengthPct: 0.82, weaknessPct: 0.50, strong: 'Disruptive Defense', weak: 'Lack of Defensive Pressure' },
    blk: { benchmark: 5.0,  strengthPct: 0.80, weaknessPct: 0.45, strong: 'Strong Rim Protection', weak: 'Weak Rim Protection' },
  };

  const strengths = [];
  const weaknesses = [];

  for (const [key, t] of Object.entries(thresholds)) {
    const val = totals[key];
    if (val >= t.benchmark * t.strengthPct) {
      strengths.push(t.strong);
    } else if (val <= t.benchmark * t.weaknessPct) {
      weaknesses.push(t.weak);
    }
  }

  return { strengths, weaknesses };
}

// 82-0 tier thresholds scaled from 82 games to 40 games
function getProjectionTier(wins) {
  if (wins >= 40) return { label: 'NATIONAL CHAMPIONS', color: 'text-yellow-300' };
  if (wins >= 35) return { label: 'FINAL FOUR', color: 'text-green-300' };
  if (wins >= 30) return { label: 'ELITE EIGHT', color: 'text-blue-300' };
  if (wins >= 28) return { label: 'SWEET SIXTEEN', color: 'text-purple-300' };
  if (wins >= 24) return { label: 'FIRST ROUND', color: 'text-orange-300' };
  if (wins >= 20) return { label: 'BUBBLE TEAM', color: 'text-orange-400' };
  return { label: 'MISSED TOURNAMENT', color: 'text-red-400' };
}

function buildProjection(lineup) {
  const picks = POSITIONS.map((position) => lineup[position]).filter(Boolean);

  if (picks.length !== POSITIONS.length) {
    return null;
  }

  const totals = picks.reduce((accumulator, pick) => ({
    pts: accumulator.pts + pick.metrics.pts,
    reb: accumulator.reb + pick.metrics.reb,
    ast: accumulator.ast + pick.metrics.ast,
    stl: accumulator.stl + pick.metrics.stl,
    blk: accumulator.blk + pick.metrics.blk,
  }), EMPTY_TOTALS);

  const adjusted = adjustDefensiveStats(picks);

  const teamOvr = roundToTenths(
    100 * (
      (totals.pts / BENCHMARKS.pts) * STAT_WEIGHTS.pts +
      (totals.reb / BENCHMARKS.reb) * STAT_WEIGHTS.reb +
      (totals.ast / BENCHMARKS.ast) * STAT_WEIGHTS.ast +
      (adjusted.stl / BENCHMARKS.stl) * STAT_WEIGHTS.stl +
      (adjusted.blk / BENCHMARKS.blk) * STAT_WEIGHTS.blk
    )
  );

  const PERFECT_TARGET = 106.7;
  const wins = Math.max(
    0,
    Math.min(40, Math.round(40 * Math.pow(Math.min(teamOvr / PERFECT_TARGET, 1), 1.15)))
  );
  const losses = 40 - wins;

  return {
    wins,
    losses,
    strength: teamOvr,
    tier: getProjectionTier(wins),
    totals: {
      pts: roundToTenths(totals.pts),
      reb: roundToTenths(totals.reb),
      ast: roundToTenths(totals.ast),
      stl: roundToTenths(totals.stl),
      blk: roundToTenths(totals.blk),
    },
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

function getPlayablePositions(player) {
  if (Array.isArray(player.positions) && player.positions.length > 0) {
    return player.positions;
  }

  const GUARD_MAX_HEIGHT = 81; // 6'9" in inches
  const basePositions = POSITION_FLEXIBILITY[player.primaryPosition] || [player.primaryPosition];
  
  // Players taller than 6'9" cannot play PG or SG
  if (player.height && player.height > GUARD_MAX_HEIGHT) {
    return basePositions.filter(pos => pos !== 'PG' && pos !== 'SG');
  }
  
  return basePositions;
}

function getPickPlayablePositions(pick) {
  if (!pick) return [];
  if (Array.isArray(pick.playablePositions) && pick.playablePositions.length > 0) {
    return pick.playablePositions;
  }

  return POSITION_FLEXIBILITY[pick.primaryPosition] || [pick.primaryPosition];
}

function seasonHasUsablePlayers(season, openPositions, draftedPlayerIds, playerIdSet) {
  const roster = seasonPlayersMap[season] || [];
  for (const player of roster) {
    if (!playerIdSet.has(player.id)) continue;
    if (draftedPlayerIds.has(player.id)) continue;
    const playable = getPlayablePositions(player);
    if (!playable.some((pos) => openPositions.includes(pos))) continue;
    if (estimatePlayerMetrics(player, season) !== null) {
      return true;
    }
  }
  return false;
}

function PositionBadge({ position }) {
  const colors = {
    PG: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    SG: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    SF: 'bg-green-500/20 text-green-300 border-green-500/40',
    PF: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    C: 'bg-red-500/20 text-red-300 border-red-500/40',
  };

  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded border ${colors[position] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
      {position}
    </span>
  );
}

function LineupSlot({ position, pick, onStartMove, isMoveSource }) {
  return (
    <div className={`rounded-xl border p-3 transition-all ${pick ? 'bg-green-500/10 border-green-500/35' : 'bg-white/5 border-white/10'} ${isMoveSource ? 'ring-2 ring-blue-400/60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <PositionBadge position={position} />
        {pick && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-green-300">Locked</span>
            {onStartMove && (
              <button
                type="button"
                onClick={onStartMove}
                className={`text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border transition-all ${isMoveSource ? 'text-blue-200 border-blue-400/60 bg-blue-500/20' : 'text-gray-300 border-white/20 hover:bg-white/10'}`}
              >
                {isMoveSource ? 'Moving' : 'Move'}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="mt-2 min-h-[2.7rem]">
        {pick ? (
          <>
            <div className="text-sm font-semibold text-white leading-tight">{pick.playerName}</div>
            <div className="text-xs text-gray-400 mt-1">{pick.season} • {pick.primaryPosition} base</div>
          </>
        ) : (
          <div className="text-xs text-gray-500">Open • {POSITION_LABELS[position]}</div>
        )}
      </div>
    </div>
  );
}

function MetricBar({ totals }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {Object.entries(METRIC_LABELS).map(([key, label]) => (
        <div key={key} className="rounded-xl bg-black/25 border border-white/10 p-1.5 text-center">
          <div className="text-[9px] tracking-widest text-gray-500 uppercase">{label}</div>
          <div className="text-xs font-semibold text-white mt-0.5">{totals[key].toFixed(1)}</div>
        </div>
      ))}
    </div>
  );
}

function SharedLineup({ payload, onStartNew }) {
  const { lineup, projection } = payload;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 animate-fadeIn">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
          Shared Kentucky Lineup
        </div>
        <div className={`text-2xl font-black tracking-tight ${projection.tier.color}`}>{projection.tier.label}</div>
        <div className="text-gray-400 text-sm mt-1">Projected Record: <span className="text-white font-semibold">{projection.wins}-{projection.losses}</span> <span className="text-gray-500">(of 40)</span></div>
      </div>

      <MetricBar totals={projection.totals} />

      <TeamAnalysis totals={projection.totals} />

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {POSITIONS.map((position) => {
          const pick = lineup[position];

          return (
            <div key={position} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <PositionBadge position={position} />
                <span className="text-xs text-gray-500">{POSITION_LABELS[position]}</span>
              </div>
              <div className="text-sm font-semibold text-white">{pick.playerName}</div>
              <div className="text-xs text-gray-400 mt-1">{pick.season} • listed {pick.primaryPosition}</div>
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

function IntroScreen({ onStart, perfectPlayerUnlocked }) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 text-center animate-fadeIn">
      <div>
        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
          <span>🏀</span> Kentucky Basketball
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          BIG BLUE <span className="text-blue-400">ROULETTE</span>
        </h1>
        <p className="mt-3 text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
          Spin a random Kentucky season, pick any player from that roster,
          and place him into any position he can play.
        </p>
      </div>

      <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left flex flex-col gap-3">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">How It Works</div>
        <div className="text-sm text-gray-300">1. Spin the year roulette.</div>
        <div className="text-sm text-gray-300">2. Pick any player on that season's roster.</div>
        <div className="text-sm text-gray-300">3. Place him into one open position he can play.</div>
        <div className="text-sm text-gray-300">4. Fill all five slots to finish your lineup.</div>
      </div>

      <div className="w-full flex flex-col gap-4">
        {/* Main Modes */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Main Modes</div>
          <button
            onClick={() => onStart('classic')}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl transition-all duration-150 shadow-lg shadow-blue-600/30"
          >
            Play Classic (Stats On)
          </button>
          <button
            onClick={() => onStart('hoopIQ')}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-white/5 hover:bg-white/10 border border-white/15 active:scale-95 text-white font-bold rounded-xl transition-all duration-150"
          >
            Play HoopIQ (Stats Hidden) <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStart('mattjones')}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold rounded-xl transition-all duration-150 shadow-lg shadow-red-600/30"
          >
            Matt Jones Mode (No Dan Issel)
          </button>
        </div>

        {perfectPlayerUnlocked && (
          <div className="flex flex-col gap-3 animate-fadeIn">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Perfect Player</div>
            <button
              onClick={() => onStart('perfectplayer')}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 active:scale-95 text-yellow-200 font-bold rounded-xl transition-all duration-150"
            >
              <Trophy className="w-4 h-4" />
              Perfect Player
            </button>
          </div>
        )}

        {/* Mini Games */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mini Games</div>
          <button
            onClick={() => onStart('jersey')}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 active:scale-95 text-purple-200 font-bold rounded-xl transition-all duration-150"
          >
            <Hash className="w-4 h-4" />
            Jersey Guesser
          </button>
          <button
            onClick={() => onStart('hometown')}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 active:scale-95 text-green-200 font-bold rounded-xl transition-all duration-150"
          >
            <MapPin className="w-4 h-4" />
            Hometown Guesser
          </button>
          <button
            onClick={() => onStart('twentyquestions')}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 active:scale-95 text-amber-200 font-bold rounded-xl transition-all duration-150"
          >
            <HelpCircle className="w-4 h-4" />
            20 Questions
          </button>
          <button
            onClick={() => onStart('lineupbuilder')}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 active:scale-95 text-teal-200 font-bold rounded-xl transition-all duration-150"
          >
            <Users className="w-4 h-4" />
            Dream Lineup Builder
          </button>
        </div>

        <div className="h-px bg-white/10 my-2" />
        <button
          onClick={() => onStart('howitworks')}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/15 active:scale-95 text-gray-300 font-semibold rounded-xl transition-all duration-150"
        >
          <Calculator className="w-4 h-4" />
          How the Algorithm Works
        </button>
      </div>
    </div>
  );
}

function StatRow({ label, weight, benchmark, color }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-black/25 border border-white/10 px-3 py-2.5">
      <div className={`text-xs font-bold w-12 ${color}`}>{label}</div>
      <div className="flex-1">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full ${color.replace('text-', 'bg-')}`} style={{ width: `${weight * 100}%` }} />
        </div>
      </div>
      <div className="text-xs text-gray-300 font-semibold w-10 text-right">{Math.round(weight * 100)}%</div>
      <div className="text-[11px] text-gray-500 w-24 text-right">champ avg {benchmark}</div>
    </div>
  );
}

function HowItWorks({ onBack }) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-fadeIn">
      <button
        type="button"
        onClick={onBack}
        className="self-start inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to menu
      </button>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
          <Calculator className="w-3.5 h-3.5" /> Under the Hood
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">How the Algorithm Works</h1>
        <p className="mt-2 text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
          At its heart, Big Blue Roulette is a math game. You're not really coaching, you're
          trying to assemble five real Kentucky seasons whose <span className="text-white font-semibold">combined box-score numbers</span> add up to a championship-caliber team.
        </p>
      </div>

      {/* Step 1: the raw numbers */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black">1</span>
          <div className="text-sm font-bold text-white uppercase tracking-widest">Each player brings real stats</div>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          Every pick uses that player's <span className="text-white font-semibold">actual per-game numbers</span> from the season you drafted
          him: points, rebounds, assists, steals, and blocks. Older seasons (pre-1980) are nudged with a small era
          adjustment, and missing steal/block data is estimated from the player's position. Your five starters' stats
          are then <span className="text-white font-semibold">added together</span> into one team line.
        </p>
      </div>

      {/* Step 2: weighting */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black">2</span>
          <div className="text-sm font-bold text-white uppercase tracking-widest">Stats are weighted &amp; scored</div>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          Not every stat matters equally. Your team total in each category is compared against the
          <span className="text-white font-semibold"> average of 30 national champions</span> (1996&ndash;2026), then blended together
          using these weights to produce a single <span className="text-white font-semibold">Team Strength rating</span>:
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <StatRow label="PTS" weight={STAT_WEIGHTS.pts} benchmark={BENCHMARKS.pts} color="text-blue-300" />
          <StatRow label="REB" weight={STAT_WEIGHTS.reb} benchmark={BENCHMARKS.reb} color="text-green-300" />
          <StatRow label="AST" weight={STAT_WEIGHTS.ast} benchmark={BENCHMARKS.ast} color="text-purple-300" />
          <StatRow label="STL" weight={STAT_WEIGHTS.stl} benchmark={BENCHMARKS.stl} color="text-orange-300" />
          <StatRow label="BLK" weight={STAT_WEIGHTS.blk} benchmark={BENCHMARKS.blk} color="text-red-300" />
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mt-1">
          Scoring carries the most weight, then rebounding and playmaking. Steals and blocks matter least, but a
          team with zero rim protection still gets dinged.
        </p>
      </div>

      {/* Step 3: wins */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black">3</span>
          <div className="text-sm font-bold text-white uppercase tracking-widest">Strength becomes a record</div>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          That Team Strength rating is mapped onto a <span className="text-white font-semibold">40-game season</span>. The closer you get
          to a perfect, balanced champion line, the more wins you bank, which sets your tournament tier:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {[
            { w: '40 W', t: 'National Champions', c: 'text-yellow-300' },
            { w: '35+ W', t: 'Final Four', c: 'text-green-300' },
            { w: '30+ W', t: 'Elite Eight', c: 'text-blue-300' },
            { w: '28+ W', t: 'Sweet Sixteen', c: 'text-purple-300' },
            { w: '24+ W', t: 'First Round', c: 'text-orange-300' },
            { w: '20+ W', t: 'Bubble Team', c: 'text-orange-400' },
            { w: '< 20 W', t: 'Missed Tournament', c: 'text-red-400' },
          ].map((row) => (
            <div key={row.t} className="flex items-center justify-between rounded-lg bg-black/25 border border-white/10 px-3 py-2">
              <span className="text-xs text-gray-400 font-semibold">{row.w}</span>
              <span className={`text-xs font-bold ${row.c}`}>{row.t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 4: positions */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black">4</span>
          <div className="text-sm font-bold text-white uppercase tracking-widest">Why natural position matters</div>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          A player's <span className="text-yellow-300 font-semibold">★ natural position</span> is where he actually played. You can slide him to
          an adjacent spot (a point guard can play the two; a power forward can play the three or center), but a
          player taller than 6&apos;9&quot; can&apos;t be jammed into a guard slot.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          The real lesson is <span className="text-white font-semibold">balance</span>. Each position naturally supplies different numbers, guards
          pile up assists and steals, forwards and centers own the glass and block shots. Stack five high scorers
          who can&apos;t rebound and your champion-average comparison falls apart in REB and BLK. A complete, well-rounded
          five almost always out-scores a lopsided collection of stars.
        </p>
      </div>

      {/* The honest caveat */}
      <div className="bg-amber-500/5 border border-amber-500/25 rounded-2xl p-5 text-left flex flex-col gap-2">
        <div className="text-sm font-bold text-amber-300 uppercase tracking-widest">A note on nuance</div>
        <p className="text-sm text-gray-300 leading-relaxed">
          It&apos;s genuinely hard to code the nuance that makes a great player great, leadership, clutch shot-making,
          on-ball defense, locker-room fit, or how two stars actually mesh on the floor. A box score can&apos;t capture
          all of that. So treat this as what it is: a fun <span className="text-white font-semibold">math game</span> about building the most
          balanced, statistically complete team you can from Kentucky&apos;s history, not the final word on who was truly best.
        </p>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl transition-all duration-150"
      >
        Got it, let&apos;s draft
      </button>
    </div>
  );
}

const POSITION_COLORS_HEX = {
  PG: '#3b82f6',
  SG: '#a855f7',
  SF: '#22c55e',
  PF: '#f97316',
  C: '#ef4444',
};

function generateShareImage(lineup, projection, isMattJonesMode = false, isStatsHidden = false) {
  const W = 640;
  const H = 760;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = '#0a0c14';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Top accent bar - red for Matt Jones Mode, blue otherwise
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  if (isMattJonesMode) {
    grad.addColorStop(0, '#dc2626');
    grad.addColorStop(1, '#ef4444');
  } else {
    grad.addColorStop(0, '#1d4ed8');
    grad.addColorStop(1, '#3b82f6');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 4);

  // Header
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('🏀 BIG BLUE ROULETTE', 24, 40);

  ctx.fillStyle = '#6b7280';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText('Kentucky Wildcats All-Time Draft', 24, 58);

  // Matt Jones Mode badge
  if (isMattJonesMode) {
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    const badgeText = 'MATT JONES MODE';
    const badgeW = ctx.measureText(badgeText).width + 16;
    const badgeX = W - badgeW - 20;
    const badgeY = 70;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + 14);
    ctx.textAlign = 'left';
  }

  // Stats Hidden badge
  if (isStatsHidden) {
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    const badgeText = 'STATS HIDDEN';
    const badgeW = ctx.measureText(badgeText).width + 16;
    const badgeX = W - badgeW - 20;
    const badgeY = 70;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + 14);
    ctx.textAlign = 'left';
  }

  // Tier badge
  const tierColors = {
    'NATIONAL CHAMPIONS': ['#854d0e', '#fde047'],
    'FINAL FOUR': ['#14532d', '#86efac'],
    'ELITE EIGHT': ['#1e3a5f', '#93c5fd'],
    'SWEET SIXTEEN': ['#3b0764', '#d8b4fe'],
    'FIRST ROUND': ['#431407', '#fb923c'],
    'BUBBLE TEAM': ['#431407', '#f97316'],
    'MISSED TOURNAMENT': ['#450a0a', '#fca5a5'],
  };
  const [bgHex, textHex] = tierColors[projection.tier.label] ?? ['#1f2937', '#9ca3af'];

  const tierLabel = projection.tier.label;
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  const tierW = ctx.measureText(tierLabel).width + 24;
  const tierX = W - tierW - 20;
  const tierY = 22;
  ctx.fillStyle = bgHex;
  ctx.beginPath();
  ctx.roundRect(tierX, tierY, tierW, 26, 6);
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
  ctx.fillText('Projected Record (of 40)', 24, 124);

  // Totals bar
  const metrics = ['pts', 'reb', 'ast', 'stl', 'blk'];
  const metricLabels = { pts: 'PPG', reb: 'RPG', ast: 'APG', stl: 'SPG', blk: 'BPG' };
  const colW = (W - 48) / 5;
  metrics.forEach((key, i) => {
    const bx = 24 + i * colW;
    const by = 140;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(bx, by, colW - 6, 44, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, colW - 6, 44, 6);
    ctx.stroke();
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(metricLabels[key], bx + (colW - 6) / 2, by + 13);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText(projection.totals[key].toFixed(1), bx + (colW - 6) / 2, by + 33);
    ctx.textAlign = 'left';
  });

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 200);
  ctx.lineTo(W - 24, 200);
  ctx.stroke();

  // Player cards
  POSITIONS.forEach((pos, i) => {
    const pick = lineup[pos];
    if (!pick) return;
    const cx = 24;
    const cy = 212 + i * 104;
    const cardH = 94;
    const cardW = W - 48;

    // Card bg
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, 10);
    ctx.stroke();

    // Position color accent left bar
    ctx.fillStyle = POSITION_COLORS_HEX[pos] ?? '#6b7280';
    ctx.beginPath();
    ctx.roundRect(cx, cy, 4, cardH, [10, 0, 0, 10]);
    ctx.fill();

    // Position pill
    const pillColor = POSITION_COLORS_HEX[pos] ?? '#6b7280';
    ctx.fillStyle = pillColor + '33';
    ctx.beginPath();
    ctx.roundRect(cx + 14, cy + 12, 32, 18, 4);
    ctx.fill();
    ctx.fillStyle = pillColor;
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
    const statKeys = ['pts', 'reb', 'ast', 'stl', 'blk'];
    const statW = (cardW - 28) / statKeys.length;
    statKeys.forEach((key, si) => {
      const sx = cx + 14 + si * statW;
      const sy = cy + 66;
      ctx.fillStyle = '#4b5563';
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      ctx.fillText(metricLabels[key], sx, sy);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(pick.metrics[key].toFixed(1), sx, sy + 15);
    });
  });

  // Footer
  ctx.fillStyle = '#374151';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('bigbluehistory.com • Kentucky Wildcats Draft • @BigBlueRoulette', W / 2, H - 14);
  ctx.textAlign = 'left';

  return canvas;
}

function TeamAnalysis({ totals }) {
  const items = [
    { key: 'pts', label: 'Scoring', high: 'Elite Scoring', mid: 'Solid Scoring', benchmark: BENCHMARKS.pts },
    { key: 'reb', label: 'Rebounding', high: 'Dominant Rebounding', mid: 'Solid Rebounding', benchmark: BENCHMARKS.reb },
    { key: 'ast', label: 'Playmaking', high: 'Elite Playmaking', mid: 'Adequate Playmaking', benchmark: BENCHMARKS.ast },
    { key: 'stl', label: 'Perimeter D', high: 'High Pressure Defense', mid: 'Decent Perimeter D', benchmark: BENCHMARKS.stl },
    { key: 'blk', label: 'Interior D', high: 'Strong Rim Protection', mid: 'Moderate Rim Protection', benchmark: BENCHMARKS.blk },
  ].map((item) => ({ ...item, ratio: totals[item.key] / item.benchmark }))
    .sort((a, b) => b.ratio - a.ratio);

  const strengths = items.slice(0, 2);
  const weaknesses = items.slice(-2);

  const strengthLabel = (item) => {
    if (item.ratio >= 0.82) return item.high;
    if (item.ratio >= 0.58) return item.mid;
    return `Best attribute: ${item.label}`;
  };

  const weaknessLabel = (item) => {
    if (item.ratio <= 0.52) return `Weak ${item.label}`;
    if (item.ratio <= 0.68) return `${item.label} needs work`;
    return `Could improve ${item.label}`;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Team Analysis</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1.5">Strengths</div>
          <ul className="space-y-1.5">
            {strengths.map((s) => (
              <li key={s.key} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-green-400 mt-0.5">+</span>
                <span>
                  {strengthLabel(s)}
                  <span className="text-gray-500 text-xs ml-1">({totals[s.key].toFixed(1)} {METRIC_LABELS[s.key]})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1.5">Weaknesses</div>
          <ul className="space-y-1.5">
            {weaknesses.map((w) => (
              <li key={w.key} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">−</span>
                <span>
                  {weaknessLabel(w)}
                  <span className="text-gray-500 text-xs ml-1">({totals[w.key].toFixed(1)} {METRIC_LABELS[w.key]})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function FinalLineup({ lineup, projection, onRestart, onCopyShare, shareStatus, isMattJonesMode, isStatsHidden }) {
  const [imageStatus, setImageStatus] = useState('');

  const handleShareImage = useCallback(() => {
    const canvas = generateShareImage(lineup, projection, isMattJonesMode, isStatsHidden);
    canvas.toBlob((blob) => {
      if (!blob) { setImageStatus('Could not generate image.'); return; }
      const shareData = {
        files: [new File([blob], 'big-blue-roulette.png', { type: 'image/png' })],
        title: 'Big Blue Roulette',
        text: `My Kentucky draft went ${projection.wins}-${projection.losses}! ${projection.tier.label} @BigBlueRoulette`,
      };
      if (navigator.canShare && navigator.canShare(shareData)) {
        navigator.share(shareData).catch(() => {
          downloadImage(canvas);
        });
      } else {
        downloadImage(canvas);
      }
    }, 'image/png');
  }, [lineup, projection]);

  function downloadImage(canvas) {
    const link = document.createElement('a');
    link.download = 'big-blue-roulette.png';
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
        <div className="text-gray-400 text-sm mt-1">Projected Record: <span className="text-white font-semibold">{projection.wins}-{projection.losses}</span> <span className="text-gray-500">(of 40)</span></div>
        <div className="text-xs text-gray-500 mt-1">Strength Rating: {projection.strength}</div>
      </div>

      <MetricBar totals={projection.totals} />

      <TeamAnalysis totals={projection.totals} />

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {POSITIONS.map((position) => {
          const pick = lineup[position];

          return (
            <div key={position} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <PositionBadge position={position} />
                <span className="text-xs text-gray-500">{POSITION_LABELS[position]}</span>
              </div>
              <div className="text-sm font-semibold text-white">{pick.playerName}</div>
              <div className="text-xs text-gray-400 mt-1">{pick.season} • listed {pick.primaryPosition}</div>
              <div className="text-[11px] text-gray-500 mt-1">
                {pick.metrics.pts.toFixed(1)} / {pick.metrics.reb.toFixed(1)} / {pick.metrics.ast.toFixed(1)} / {pick.metrics.stl.toFixed(1)} / {pick.metrics.blk.toFixed(1)}
              </div>
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

function PlayingScreen({
  gameMode, rouletteSeason, currentSeason, spinning, openPositions,
  sortMetric, sortDirection, setSortMetric, setSortDirection, sortedRoster,
  selectedPlayer, setSelectedPlayer, selectedPosition, setSelectedPosition,
  selectedPlayerOpenPositions, spinRoulette, placePlayer,
  lineup, repositioningFrom, setRepositioningFrom, moveOrSwapPlayer, isMoveLegal,
  usedSeasons, roundNumber,
}) {
  const [mobileTab, setMobileTab] = useState('draft');

  return (
    <>
      {/* Mobile tab bar */}
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
          Lineup ({POSITIONS.filter(p => lineup[p]).length}/5)
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Draft panel */}
        <section className={`bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 animate-fadeIn ${mobileTab === 'lineup' ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-300 font-semibold">Year Roulette</div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1 min-h-[2.2rem]">
                {rouletteSeason ? `${rouletteSeason} Wildcats` : 'Spin for a season'}
              </div>
            </div>
            <button
              onClick={spinRoulette}
              disabled={spinning || openPositions.length === 0 || currentSeason}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2.5 text-sm font-bold transition-all"
            >
              {spinning ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Shuffle className="w-4 h-4" />}
              {spinning ? 'Spinning...' : (currentSeason ? 'Spin New Year' : 'Spin Roulette')}
            </button>
          </div>


          {spinning && (
            <div className="mb-4 text-sm text-blue-300 bg-blue-500/10 border border-blue-400/30 rounded-xl px-3 py-2 animate-fadeIn">
              Rolling through Kentucky history...
            </div>
          )}

          {!spinning && currentSeason && (
            <>
              <div className="mb-3 text-sm text-gray-400">Choose any player from this roster:</div>

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
                {sortedRoster.map(({ player, metrics: playerMetrics, alreadyDrafted, availableForPlayer, canPlace, hasStats }) => {
                  const selected = selectedPlayer?.id === player.id;
                  return (
                    <button
                      key={player.id}
                      onClick={() => {
                        if (!canPlace) return;
                        setSelectedPlayer({ ...player, metrics: playerMetrics });
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
                      <div className="mt-1 flex flex-wrap gap-1">
                        {getPlayablePositions(player).map((position) => (
                          <div key={`${player.id}-${position}`} className="relative">
                            <PositionBadge position={position} />
                            {position === player.primaryPosition && (
                              <span className="absolute -top-1 -right-1 text-[8px] text-yellow-300">★</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {gameMode === 'classic' && hasStats && (
                        <div className="mt-2 grid grid-cols-5 gap-1">
                          {Object.entries(METRIC_LABELS).map(([key, label]) => (
                            <div key={`${player.id}-${key}`} className="rounded-md bg-black/30 border border-white/10 px-1 py-1 text-center">
                              <div className="text-[9px] text-gray-500 uppercase tracking-widest">{label}</div>
                              <div className="text-[11px] font-semibold text-white mt-0.5">{playerMetrics[key].toFixed(1)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {gameMode === 'classic' && !hasStats && (
                        <div className="mt-2 text-[11px] text-gray-500 italic">Stats unavailable</div>
                      )}
                      {alreadyDrafted && <div className="text-[11px] text-gray-500 mt-1">Already drafted</div>}
                      {!hasStats && !alreadyDrafted && <div className="text-[11px] text-orange-400/70 mt-1">Stats pending</div>}
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
              {gameMode === 'classic' && selectedPlayer.metrics && (
                <div className="text-[11px] text-gray-400 mt-1">
                  {selectedPlayer.metrics.pts.toFixed(1)} PPG • {selectedPlayer.metrics.reb.toFixed(1)} RPG • {selectedPlayer.metrics.ast.toFixed(1)} APG • {selectedPlayer.metrics.stl.toFixed(1)} SPG • {selectedPlayer.metrics.blk.toFixed(1)} BPG
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
                    {position} • {POSITION_LABELS[position]}
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

          {/* Compact lineup indicator */}
          <div className="mt-6 flex justify-center gap-3 sm:gap-4">
            {POSITIONS.map((position) => {
              const pick = lineup[position];
              const initials = pick ? pick.playerName.split(' ').map(n => n[0]).join('') : '';
              const positionColor = {
                PG: '#3b82f6',
                SG: '#a855f7',
                SF: '#22c55e',
                PF: '#f97316',
                C: '#ef4444'
              }[position];

              return (
                <div key={position} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                      pick
                        ? 'bg-white/10 border-white/30'
                        : 'bg-white/5 border-dashed border-white/20'
                    }`}
                    style={pick ? { borderColor: positionColor } : {}}
                  >
                    {pick ? (
                      <span className="text-white font-bold text-sm sm:text-base">{initials}</span>
                    ) : (
                      <span className="text-white/50 text-xs sm:text-sm font-semibold">{position}</span>
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${pick ? 'text-white' : 'text-white/40'}`}>
                    {position}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Lineup panel */}
        <section className={`bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 h-fit animate-fadeIn ${mobileTab === 'draft' ? 'hidden lg:block' : ''}`}>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Your Lineup</div>
          <div className="grid grid-cols-1 gap-2">
            {POSITIONS.map((position) => (
              <LineupSlot
                key={position}
                position={position}
                pick={lineup[position]}
                isMoveSource={repositioningFrom === position}
                onStartMove={lineup[position] ? () => setRepositioningFrom((prev) => (prev === position ? null : position)) : null}
              />
            ))}
          </div>

          {repositioningFrom && lineup[repositioningFrom] && (
            <div className="mt-3 rounded-xl border border-blue-400/30 bg-blue-500/10 p-3 animate-fadeIn">
              <div className="text-xs text-blue-200 mb-2">
                Move <span className="font-semibold text-white">{lineup[repositioningFrom].playerName}</span> from {repositioningFrom}:
              </div>
              <div className="flex flex-wrap gap-2">
                {POSITIONS.filter((position) => position !== repositioningFrom).map((position) => (
                  <button
                    key={position}
                    type="button"
                    onClick={() => moveOrSwapPlayer(position)}
                    disabled={!isMoveLegal(repositioningFrom, position)}
                    className="px-2.5 py-2 rounded-lg text-xs font-semibold border bg-white/5 border-white/15 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                  >
                    Move to {position}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setRepositioningFrom(null)}
                  className="px-2.5 py-2 rounded-lg text-xs font-semibold border border-white/15 text-gray-300 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            Open slots: {openPositions.length > 0 ? openPositions.join(', ') : 'None'}
          </div>
          <div className="mt-3 text-xs text-gray-500">Drafted years: {usedSeasons.length}</div>

          {/* Mobile: go back to draft button */}
          <button
            type="button"
            onClick={() => setMobileTab('draft')}
            className="lg:hidden mt-4 w-full py-2.5 rounded-lg border border-white/15 text-sm text-gray-300 font-semibold hover:bg-white/10 transition-all"
          >
            ← Back to Draft
          </button>
        </section>
      </div>
    </>
  );
}

export default function App() {
  const [phase, setPhase] = useState('intro');
  const [gameMode, setGameMode] = useState('hoopIQ');
  const [isMattJonesMode, setIsMattJonesMode] = useState(false);
  const [lineup, setLineup] = useState(EMPTY_LINEUP);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [rouletteSeason, setRouletteSeason] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [repositioningFrom, setRepositioningFrom] = useState(null);
  const [usedSeasons, setUsedSeasons] = useState([]);
  const [shareStatus, setShareStatus] = useState('');
  const [sharedPayload, setSharedPayload] = useState(null);
  const [sortMetric, setSortMetric] = useState('pts');
  const [sortDirection, setSortDirection] = useState('desc');
  const [perfectPlayerUnlocked, setPerfectPlayerUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const playerIdSet = useMemo(
    () => new Set(players.map((player) => player.id)),
    [],
  );

  const openPositions = useMemo(
    () => POSITIONS.filter((position) => !lineup[position]),
    [lineup],
  );

  const draftedPlayerIds = useMemo(
    () => new Set(POSITIONS.map((position) => lineup[position]?.playerId).filter(Boolean)),
    [lineup],
  );

  const roster = useMemo(
    () => (currentSeason ? seasonPlayersMap[currentSeason] || [] : []),
    [currentSeason],
  );

  const projection = useMemo(
    () => buildProjection(lineup),
    [lineup],
  );

  const roundNumber = POSITIONS.length - openPositions.length + 1;
  const selectedPlayerOpenPositions = useMemo(() => {
    if (!selectedPlayer) return [];

    return getPlayablePositions(selectedPlayer).filter((position) => openPositions.includes(position));
  }, [selectedPlayer, openPositions]);

  const sortedRoster = useMemo(() => {
    const rows = roster
      .filter((player) => playerIdSet.has(player.id))
      .map((player) => {
        const metrics = estimatePlayerMetrics(player, currentSeason);
        const availableForPlayer = getPlayablePositions(player).filter((position) => openPositions.includes(position));
        const alreadyDrafted = draftedPlayerIds.has(player.id);
        const hasStats = metrics !== null;
        const canPlace = availableForPlayer.length > 0 && !alreadyDrafted && hasStats;

        return {
          player,
          metrics,
          availableForPlayer,
          alreadyDrafted,
          canPlace,
          hasStats,
        };
      });

    const activeSortMetric = gameMode === 'classic' ? sortMetric : 'name';
    const activeSortDirection = gameMode === 'classic' ? sortDirection : 'asc';

    rows.sort((a, b) => {
      let comparison = 0;

      if (activeSortMetric === 'name') {
        comparison = getLastName(a.player.fullName).localeCompare(getLastName(b.player.fullName));
      } else {
        // Handle null metrics - players without stats sort to bottom
        const aValue = a.metrics?.[activeSortMetric] ?? -Infinity;
        const bValue = b.metrics?.[activeSortMetric] ?? -Infinity;
        comparison = aValue - bValue;
      }

      if (comparison === 0) {
        comparison = getLastName(a.player.fullName).localeCompare(getLastName(b.player.fullName));
      }

      return activeSortDirection === 'asc' ? comparison : -comparison;
    });

    return rows;
  }, [
    currentSeason,
    draftedPlayerIds,
    gameMode,
    openPositions,
    playerIdSet,
    roster,
    sortDirection,
    sortMetric,
  ]);

  useEffect(() => {
    const shareEncoded = new URLSearchParams(window.location.search).get('share');
    if (!shareEncoded) return;

    const decoded = decodeSharePayload(shareEncoded);
    const hasValidLineup = decoded?.lineup && POSITIONS.every((position) => decoded.lineup[position]);
    const hasProjection = decoded?.projection?.wins !== undefined && decoded?.projection?.losses !== undefined;

    if (hasValidLineup && hasProjection) {
      setGameMode(decoded.mode === 'classic' ? 'classic' : 'hoopIQ');
      setSharedPayload(decoded);
      setPhase('shared');
    }
  }, []);

  useEffect(() => {
    if (!shareStatus) return undefined;

    const timeoutId = window.setTimeout(() => setShareStatus(''), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [shareStatus]);

  const spinRoulette = useCallback(() => {
    if (spinning || openPositions.length === 0 || currentSeason) return;

    const danIsselSeasons = ['1967-68', '1968-69', '1969-70'];
    
    const unusedSeasons = allSeasons.filter((season) => 
      !usedSeasons.includes(season) && 
      getSeasonStartYear(season) >= 1950 &&
      !(isMattJonesMode && danIsselSeasons.includes(season))
    );
    const allValidSeasons = allSeasons.filter((season) => 
      getSeasonStartYear(season) >= 1950 &&
      !(isMattJonesMode && danIsselSeasons.includes(season))
    );

    console.log('Matt Jones Mode:', isMattJonesMode);
    console.log('Unused seasons count:', unusedSeasons.length);
    console.log('All valid seasons count:', allValidSeasons.length);
    console.log('Open positions:', openPositions);

    let seasonPool = unusedSeasons.filter((season) =>
      seasonHasUsablePlayers(season, openPositions, draftedPlayerIds, playerIdSet)
    );
    let isFromUnused = true;

    console.log('Season pool after first filter:', seasonPool.length);

    if (seasonPool.length === 0) {
      seasonPool = allValidSeasons.filter((season) =>
        seasonHasUsablePlayers(season, openPositions, draftedPlayerIds, playerIdSet)
      );
      isFromUnused = false;
      console.log('Season pool after second filter:', seasonPool.length);
    }

    if (seasonPool.length === 0) {
      seasonPool = unusedSeasons.length > 0 ? unusedSeasons : allValidSeasons;
      isFromUnused = unusedSeasons.length > 0;
      console.log('Season pool after fallback:', seasonPool.length);
    }

    // Final fallback: if still empty, use all seasons without filtering
    if (seasonPool.length === 0) {
      seasonPool = allSeasons.filter((season) => getSeasonStartYear(season) >= 1950);
      isFromUnused = false;
      console.log('Season pool after final fallback:', seasonPool.length);
    }

    // Safety check: if still no seasons, don't spin
    if (seasonPool.length === 0) {
      console.error('No valid seasons available for roulette');
      return;
    }

    setSpinning(true);
    setCurrentSeason(null);
    setSelectedPlayer(null);
    setSelectedPosition(null);

    const intervalId = window.setInterval(() => {
      setRouletteSeason(getRandom(seasonPool));
    }, 80);

    window.setTimeout(() => {
      window.clearInterval(intervalId);
      const chosenSeason = getRandom(seasonPool);
      setRouletteSeason(chosenSeason);
      setCurrentSeason(chosenSeason);
      setUsedSeasons((prev) => (
        isFromUnused ? [...prev, chosenSeason] : [chosenSeason]
      ));
      setSpinning(false);
    }, 1400);
  }, [spinning, usedSeasons, openPositions, draftedPlayerIds, playerIdSet, isMattJonesMode, currentSeason]);

  const startGame = useCallback((mode = 'hoopIQ') => {
    clearShareQueryParam();
    setSharedPayload(null);
    
    if (mode === 'jersey') {
      setPhase('jersey');
      return;
    }
    
    if (mode === 'hometown') {
      setPhase('hometown');
      return;
    }
    
    if (mode === 'twentyquestions') {
      setPhase('twentyquestions');
      return;
    }

    if (mode === 'lineupbuilder') {
      setPhase('lineupbuilder');
      return;
    }

    if (mode === 'perfectplayer') {
      setPhase('perfectplayer');
      return;
    }

    if (mode === 'howitworks') {
      setPhase('howitworks');
      return;
    }

    const normalizedMode = mode === 'classic' || mode === 'mattjones' ? 'classic' : 'hoopIQ';
    setGameMode(normalizedMode);
    setIsMattJonesMode(mode === 'mattjones');
    setLineup(EMPTY_LINEUP);
    setCurrentSeason(null);
    setRouletteSeason(null);
    setSelectedPlayer(null);
    setSelectedPosition(null);
    setRepositioningFrom(null);
    setUsedSeasons([]);
    setShareStatus('');
    setPhase('playing');
  }, []);

  const restartGame = useCallback(() => {
    clearShareQueryParam();
    setSharedPayload(null);
    setRepositioningFrom(null);
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
  }, [gameMode, lineup, projection]);

  const isMoveLegal = useCallback((fromPosition, toPosition) => {
    const fromPick = lineup[fromPosition];
    if (!fromPick) return false;
    if (!getPickPlayablePositions(fromPick).includes(toPosition)) return false;

    const toPick = lineup[toPosition];
    if (!toPick) return true;

    return getPickPlayablePositions(toPick).includes(fromPosition);
  }, [lineup]);

  const moveOrSwapPlayer = useCallback((toPosition) => {
    if (!repositioningFrom || repositioningFrom === toPosition) return;

    setLineup((prev) => {
      const fromPick = prev[repositioningFrom];
      if (!fromPick) return prev;
      if (!getPickPlayablePositions(fromPick).includes(toPosition)) return prev;

      const toPick = prev[toPosition];
      if (toPick && !getPickPlayablePositions(toPick).includes(repositioningFrom)) return prev;

      return {
        ...prev,
        [repositioningFrom]: toPick || null,
        [toPosition]: fromPick,
      };
    });

    setRepositioningFrom(null);
  }, [repositioningFrom]);

  const placePlayer = useCallback(() => {
    if (!selectedPlayer || !selectedPosition || !currentSeason) return;
    if (!openPositions.includes(selectedPosition)) return;

    const estimatedMetrics = selectedPlayer.metrics || estimatePlayerMetrics(selectedPlayer, currentSeason);
    const playablePositions = getPlayablePositions(selectedPlayer);

    setLineup((prev) => ({
      ...prev,
      [selectedPosition]: {
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.fullName,
        season: currentSeason,
        primaryPosition: selectedPlayer.primaryPosition,
        metrics: estimatedMetrics,
        playablePositions,
      },
    }));

    setSelectedPlayer(null);
    setSelectedPosition(null);
    setRepositioningFrom(null);
    setCurrentSeason(null);
    setRouletteSeason(null);

    if (openPositions.length === 1) {
      window.setTimeout(() => setPhase('done'), 200);
    }
  }, [currentSeason, openPositions, selectedPlayer, selectedPosition]);

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
                {isMattJonesMode ? 'Matt Jones Mode' : (gameMode === 'classic' ? 'Classic' : 'HoopIQ')}
              </span>
              Round <span className="text-white font-semibold">{roundNumber}</span> of 5
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {phase === 'intro' && <IntroScreen onStart={startGame} perfectPlayerUnlocked={perfectPlayerUnlocked} />}

        {phase === 'jersey' && <JerseyGame onBack={() => setPhase('intro')} />}

        {phase === 'hometown' && <HometownGame onBack={() => setPhase('intro')} />}

        {phase === 'twentyquestions' && <TwentyQuestionsGame onBack={() => setPhase('intro')} />}

        {phase === 'lineupbuilder' && <LineupBuilder onBack={() => setPhase('intro')} />}

        {phase === 'perfectplayer' && <PerfectPlayerGame onBack={() => setPhase('intro')} />}

        {phase === 'howitworks' && <HowItWorks onBack={() => setPhase('intro')} />}

        {phase === 'shared' && sharedPayload && (
          <SharedLineup payload={sharedPayload} onStartNew={startGame} />
        )}

        {phase === 'playing' && (
          <PlayingScreen
            gameMode={gameMode}
            rouletteSeason={rouletteSeason}
            currentSeason={currentSeason}
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
            repositioningFrom={repositioningFrom}
            setRepositioningFrom={setRepositioningFrom}
            moveOrSwapPlayer={moveOrSwapPlayer}
            isMoveLegal={isMoveLegal}
            usedSeasons={usedSeasons}
            roundNumber={roundNumber}
          />
        )}

        {phase === 'done' && projection && (
          <FinalLineup
            lineup={lineup}
            projection={projection}
            onRestart={restartGame}
            onCopyShare={copyShareLink}
            shareStatus={shareStatus}
            isMattJonesMode={isMattJonesMode}
            isStatsHidden={gameMode === 'hoopIQ'}
          />
        )}
      </main>

      <footer className="mt-8 pb-8 text-center text-xs text-gray-600">
        Data sourced from{' '}
        <a
          href="http://www.bigbluehistory.com/bb/statistics/"
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 hover:text-blue-400 underline"
        >
          bigbluehistory.com
        </a>
        <br />
        <span
          className="mt-2 text-gray-500 cursor-default select-none"
          onClick={() => setShowPasswordModal(true)}
        >
          Created by Daniel Reeves
        </span>
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

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0a0c14] border border-white/15 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Enter Password</h3>
            <p className="text-sm text-gray-400 mb-4">This area is restricted.</p>
            <input
              type="text"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (passwordInput === 'gocats123' || passwordInput === 'Gocats123') {
                    setPerfectPlayerUnlocked(true);
                    setShowPasswordModal(false);
                    setPasswordInput('');
                  } else {
                    setPasswordInput('');
                  }
                }
              }}
              placeholder="Password"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  if (passwordInput === 'gocats123' || passwordInput === 'Gocats123') {
                    setPerfectPlayerUnlocked(true);
                  }
                  setShowPasswordModal(false);
                  setPasswordInput('');
                }}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
              >
                Unlock
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                }}
                className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
