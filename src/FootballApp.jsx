import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  footballPlayers,
  FOOTBALL_POSITIONS,
  FOOTBALL_POSITION_LABELS,
  footballAllSeasons,
  footballSeasonPlayersMap,
} from './data/footballPlayers.js';
import { footballPlayerSeasonStatsById } from './data/footballPlayerSeasonStats.js';
import { ChevronRight, Shuffle, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import './App.css';

const EMPTY_LINEUP = { QB: null, RB: null, WR1: null, WR2: null, FLEX: null };

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getPlayablePositions(player, season) {
  const pos = player.primaryPosition;
  const base = [];
  if (pos === 'WR') base.push('WR1', 'WR2', 'FLEX');
  if (pos === 'QB') base.push('QB');
  if (pos === 'RB') base.push('RB', 'FLEX');
  if (pos === 'TE') base.push('FLEX');
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
  return base;
}

function getStatsForDisplay(player, season) {
  const stats = footballPlayerSeasonStatsById[player.id]?.[season];
  if (!stats) return null;
  const pos = player.primaryPosition;
  if (pos === 'QB') {
    return {
      Cmp: stats.Cmp ?? 0, Att: stats.Att ?? 0, 'Cmp%': stats['Cmp%'] ?? 0,
      Yds: stats.Yds ?? 0, TD: stats.TD ?? 0, Int: stats.Int ?? 0,
      'Y/A': stats['Y/A'] ?? 0, Rate: stats.Rate ?? 0,
      RushAtt: stats.RushAtt ?? 0, RushYds: stats.RushYds ?? 0, RushTD: stats.RushTD ?? 0,
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
      RushAtt: stats.RushAtt ?? 0, RushYds: stats.RushYds ?? 0,
    };
  }
  return stats;
}

const STAT_KEYS_BY_POSITION = {
  QB: [
    { key: 'Yds', label: 'Pass Yds' }, { key: 'TD', label: 'Pass TD' },
    { key: 'Int', label: 'Int' }, { key: 'Cmp%', label: 'Cmp%' },
    { key: 'Rate', label: 'Rate' }, { key: 'RushYds', label: 'Rush Yds' }, { key: 'RushTD', label: 'Rush TD' },
  ],
  RB: [
    { key: 'RushAtt', label: 'Att' }, { key: 'RushYds', label: 'Rush Yds' },
    { key: 'RushYA', label: 'Y/A' }, { key: 'RushTD', label: 'Rush TD' },
    { key: 'Rec', label: 'Rec' }, { key: 'RecYds', label: 'Rec Yds' },
    { key: 'YPR', label: 'Y/R' }, { key: 'RecTD', label: 'Rec TD' },
  ],
  WR: [
    { key: 'Rec', label: 'Rec' }, { key: 'RecYds', label: 'Rec Yds' },
    { key: 'YPR', label: 'Y/R' }, { key: 'RecTD', label: 'Rec TD' },
    { key: 'RushAtt', label: 'Rush Att' }, { key: 'RushYds', label: 'Rush Yds' },
  ],
  TE: [
    { key: 'Rec', label: 'Rec' }, { key: 'RecYds', label: 'Rec Yds' },
    { key: 'YPR', label: 'Y/R' }, { key: 'RecTD', label: 'Rec TD' },
    { key: 'RushAtt', label: 'Rush Att' }, { key: 'RushYds', label: 'Rush Yds' },
  ],
};

const SORT_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'position', label: 'Position' },
  { key: 'Yds', label: 'Pass Yds' }, { key: 'TD', label: 'Pass TD' },
  { key: 'RushYds', label: 'Rush Yds' }, { key: 'RushTD', label: 'Rush TD' },
  { key: 'Rec', label: 'Rec' }, { key: 'RecYds', label: 'Rec Yds' }, { key: 'RecTD', label: 'Rec TD' },
];

const POSITION_COLORS = {
  QB: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  RB: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  WR1: 'bg-green-500/20 text-green-300 border-green-500/40',
  WR2: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  FLEX: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
};

const POSITION_COLORS_HEX = {
  QB: '#3b82f6', RB: '#a855f7', WR1: '#22c55e', WR2: '#14b8a6', FLEX: '#f97316',
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
  QB: 120,
  RB: 85,
  WR: 100,
  FLEX: 70,
};

const PERFECT_TARGET = 550; // hard to reach; requires near-p95 at every position

function getPositionValue(stats, position) {
  if (!stats) return 0;
  if (position === 'QB') {
    return (stats.Yds || 0) * 0.5 + (stats.TD || 0) * 10 + (stats.Rate || 0) * 0.25 + (stats.RushYds || 0) * 0.3;
  }
  if (position === 'RB') {
    return (stats.RushYds || 0) * 0.8 + (stats.RushTD || 0) * 20 + (stats.RushYA || 0) * 5 + (stats.RecYds || 0) * 0.5;
  }
  if (position === 'WR' || position === 'TE') {
    return (stats.RecYds || 0) * 0.9 + (stats.RecTD || 0) * 25 + (stats.YPR || 0) * 2 + (stats.Rec || 0) * 6 + (stats.RushYds || 0) * 0.5;
  }
  return 0;
}

const TE_BONUS = 1.4;

function getFootballProjection(lineup) {
  const picks = FOOTBALL_POSITIONS.map((pos) => lineup[pos]).filter(Boolean);
  if (picks.length !== 5) return null;

  let totalValue = 0;
  const positionValues = {};

  for (const pick of picks) {
    let value = getPositionValue(pick.stats, pick.primaryPosition);
    const slot = Object.entries(lineup).find(([_, p]) => p === pick)?.[0];
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
    Math.min(12, Math.round(12 * Math.pow(rawRatio, 1.5)))
  );
  const losses = 12 - wins;

  const tier = (() => {
    if (wins >= 12) return { label: 'NATIONAL CHAMPIONS', color: 'text-yellow-300' };
    if (wins >= 10) return { label: 'PLAYOFF BOUND', color: 'text-green-300' };
    if (wins >= 8) return { label: 'BOWL ELIGIBLE', color: 'text-blue-300' };
    if (wins >= 6) return { label: 'BUBBLE TEAM', color: 'text-purple-300' };
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

  const strengths = analysis.slice(0, 2).filter((a) => a.ratio >= 0.85);
  const weaknesses = analysis.slice(-2).filter((a) => a.ratio <= 0.65);

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

function FootballMetricBar({ projection }) {
  const slots = ['QB', 'RB', 'WR1', 'WR2', 'FLEX'];
  const labels = { QB: 'QB', RB: 'RB', WR1: 'WR1', WR2: 'WR2', FLEX: 'Flex' };
  return (
    <div className="grid grid-cols-5 gap-1.5">
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
    { slot: 'FLEX', pos: 'TE', label: 'Flex Threat', high: 'Elite Flex Play', mid: 'Solid Flex', weak: 'Flex Is a Liability' },
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
          Spin a random Kentucky football season, pick any player from that roster,
          and fill your five-man skill position lineup.
        </p>
      </div>

      <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left flex flex-col gap-3">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">How It Works</div>
        <div className="text-sm text-gray-300">1. Spin the year roulette.</div>
        <div className="text-sm text-gray-300">2. Pick any player on that season's roster.</div>
        <div className="text-sm text-gray-300">3. Place him into one open position he can play.</div>
        <div className="text-sm text-gray-300">4. FLEX is a flex spot — WRs, RBs, and TEs can slot there.</div>
        <div className="text-sm text-gray-300">5. Fill all five slots to finish your lineup.</div>
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
      </div>
    </div>
  );
}

function FootballPlayingScreen({
  gameMode, rouletteSeason, currentSeason, spinning, openPositions,
  sortMetric, sortDirection, setSortMetric, setSortDirection, sortedRoster,
  selectedPlayer, setSelectedPlayer, selectedPosition, setSelectedPosition,
  selectedPlayerOpenPositions, spinRoulette, placePlayer,
  lineup, usedSeasons, roundNumber,
}) {
  const [mobileTab, setMobileTab] = useState('draft');
  const [positionFilter, setPositionFilter] = useState(null);

  useEffect(() => {
    setPositionFilter(null);
  }, [currentSeason]);

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
          Lineup ({FOOTBALL_POSITIONS.filter(p => lineup[p]).length}/5)
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
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
              Rolling through Kentucky football history...
            </div>
          )}

          {!spinning && currentSeason && (
            <>
              <div className="mb-3 text-sm text-gray-400">Choose any player from this roster:</div>

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
                {filteredRoster.map(({ player, stats, alreadyDrafted, availableForPlayer, canPlace }) => {
                  const selected = selectedPlayer?.id === player.id;
                  return (
                    <button
                      key={player.id}
                      onClick={() => {
                        if (!canPlace) return;
                        setSelectedPlayer({ ...player, stats });
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
                        {getPlayablePositions(player, currentSeason).map((position) => (
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
              {gameMode === 'classic' && selectedPlayer.stats && (
                <div className="text-[11px] text-gray-400 mt-1">
                  {selectedPlayer.primaryPosition} &bull; {selectedPlayer.season}
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
          <div className="mt-3 text-xs text-gray-500">Drafted years: {usedSeasons.length}</div>

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

function FootballFinalLineup({ lineup, onRestart, gameMode, projection }) {
  const picks = FOOTBALL_POSITIONS.map((pos) => lineup[pos]).filter(Boolean);
  const uniqueSeasons = new Set(picks.map((p) => p.season)).size;
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
              {pick.stats && gameMode === 'classic' && (
                <StatGrid stats={pick.stats} position={pick.primaryPosition} />
              )}
              <div className="mt-2 text-[11px] text-gray-500">Value: {posVal.toFixed(1)} vs {POSITION_BENCHMARKS[pick.primaryPosition]} benchmark</div>
            </div>
          );
        })}
      </div>

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

export default function FootballApp({ onUnlockFootball }) {
  const [phase, setPhase] = useState('intro');
  const [gameMode, setGameMode] = useState('ballknower');
  const [lineup, setLineup] = useState({ ...EMPTY_LINEUP });
  const [currentSeason, setCurrentSeason] = useState(null);
  const [rouletteSeason, setRouletteSeason] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [usedSeasons, setUsedSeasons] = useState([]);
  const [sortMetric, setSortMetric] = useState('name');
  const [sortDirection, setSortDirection] = useState('desc');

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
    () => (currentSeason ? footballSeasonPlayersMap[currentSeason] || [] : []),
    [currentSeason],
  );

  const roundNumber = FOOTBALL_POSITIONS.length - openPositions.length + 1;

  const projection = useMemo(() => getFootballProjection(lineup), [lineup]);

  const selectedPlayerOpenPositions = useMemo(() => {
    if (!selectedPlayer) return [];
    return getPlayablePositions(selectedPlayer, currentSeason).filter((position) => openPositions.includes(position));
  }, [selectedPlayer, openPositions, currentSeason]);

  const sortedRoster = useMemo(() => {
    const rows = roster
      .filter((player) => playerIdSet.has(player.id))
      .map((player) => {
        const stats = getStatsForDisplay(player, currentSeason);
        const availableForPlayer = getPlayablePositions(player, currentSeason).filter((position) => openPositions.includes(position));
        const alreadyDrafted = draftedPlayerIds.has(player.id);
        const canPlace = availableForPlayer.length > 0 && !alreadyDrafted;
        return { player, stats, availableForPlayer, alreadyDrafted, canPlace };
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
        const aStats = getStatsForDisplay(a.player, currentSeason);
        const bStats = getStatsForDisplay(b.player, currentSeason);
        const aValue = aStats?.[activeSortMetric] ?? -Infinity;
        const bValue = bStats?.[activeSortMetric] ?? -Infinity;
        comparison = aValue - bValue;
      }
      if (comparison === 0) {
        comparison = a.player.fullName.split(' ').pop().localeCompare(b.player.fullName.split(' ').pop());
      }
      return activeSortDirection === 'asc' ? comparison : -comparison;
    });

    return rows;
  }, [currentSeason, draftedPlayerIds, gameMode, openPositions, playerIdSet, roster, sortDirection, sortMetric]);

  const seasonHasUsablePlayers = useCallback((season) => {
    const seasonRoster = footballSeasonPlayersMap[season] || [];
    for (const player of seasonRoster) {
      if (!playerIdSet.has(player.id)) continue;
      if (draftedPlayerIds.has(player.id)) continue;
      const playable = getPlayablePositions(player, season);
      if (!playable.some((pos) => openPositions.includes(pos))) continue;
      return true;
    }
    return false;
  }, [openPositions, draftedPlayerIds, playerIdSet]);

  const spinRoulette = useCallback(() => {
    if (spinning || openPositions.length === 0 || currentSeason) return;
    const unusedSeasons = footballAllSeasons.filter((season) => !usedSeasons.includes(season));
    const allValidSeasons = [...footballAllSeasons];
    let seasonPool = unusedSeasons.filter((season) => seasonHasUsablePlayers(season));
    let isFromUnused = true;
    if (seasonPool.length === 0) {
      seasonPool = allValidSeasons.filter((season) => seasonHasUsablePlayers(season));
      isFromUnused = false;
    }
    if (seasonPool.length === 0) {
      seasonPool = unusedSeasons.length > 0 ? unusedSeasons : allValidSeasons;
      isFromUnused = unusedSeasons.length > 0;
    }
    if (seasonPool.length === 0) return;

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
      setUsedSeasons((prev) => (isFromUnused ? [...prev, chosenSeason] : [chosenSeason]));
      setSpinning(false);
    }, 1400);
  }, [spinning, usedSeasons, openPositions, draftedPlayerIds, playerIdSet, currentSeason, seasonHasUsablePlayers]);

  const startGame = useCallback((mode) => {
    setGameMode(mode);
    setLineup({ ...EMPTY_LINEUP });
    setCurrentSeason(null);
    setRouletteSeason(null);
    setSelectedPlayer(null);
    setSelectedPosition(null);
    setUsedSeasons([]);
    setPhase('playing');
  }, []);

  const restartGame = useCallback(() => {
    setPhase('intro');
  }, []);

  const placePlayer = useCallback(() => {
    if (!selectedPlayer || !selectedPosition || !currentSeason) return;
    if (!openPositions.includes(selectedPosition)) return;
    const stats = getStatsForDisplay(selectedPlayer, currentSeason);
    const playablePositions = getPlayablePositions(selectedPlayer, currentSeason);
    setLineup((prev) => ({
      ...prev,
      [selectedPosition]: {
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.fullName,
        season: currentSeason,
        primaryPosition: selectedPlayer.primaryPosition,
        stats,
        playablePositions,
      },
    }));
    setSelectedPlayer(null);
    setSelectedPosition(null);
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
                {gameMode === 'classic' ? 'Classic' : 'Ball-Knower'}
              </span>
              Round <span className="text-white font-semibold">{roundNumber}</span> of 5
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {phase === 'intro' && <FootballIntroScreen onStart={startGame} />}
        {phase === 'playing' && (
          <FootballPlayingScreen
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
            usedSeasons={usedSeasons}
            roundNumber={roundNumber}
          />
        )}
        {phase === 'done' && projection && (
          <FootballFinalLineup lineup={lineup} onRestart={restartGame} gameMode={gameMode} projection={projection} />
        )}
      </main>

      <footer className="mt-8 pb-8 text-center text-xs text-gray-600">
        Kentucky Football Stats sourced from Sports-Reference
        <button
          onClick={onUnlockFootball}
          className="mt-2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-0"
        >
          Created by Daniel Reeves
        </button>
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
