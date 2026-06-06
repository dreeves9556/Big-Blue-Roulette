import { useCallback, useMemo, useState } from 'react';
import { allSeasons, players, seasonPlayersMap } from '../data/players.js';
import { playerSeasonStatsById } from '../data/playerSeasonStats.js';
import { Search, X, Users, RotateCcw, Download } from 'lucide-react';

const SLOTS = ['S1', 'S2', 'S3', 'S4', 'S5'];
const SLOT_LABELS = {
  S1: 'Slot 1',
  S2: 'Slot 2',
  S3: 'Slot 3',
  S4: 'Slot 4',
  S5: 'Slot 5',
};

const METRIC_LABELS = {
  pts: 'PPG',
  reb: 'RPG',
  ast: 'APG',
  stl: 'SPG',
  blk: 'BPG',
};

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

const EMPTY_TOTALS = {
  pts: 0,
  reb: 0,
  ast: 0,
  stl: 0,
  blk: 0,
};

function roundToTenths(value) {
  return Math.round(value * 10) / 10;
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

function estimatePlayerMetrics(player, season) {
  const realStats = playerSeasonStatsById[player.id]?.[season];
  if (realStats) {
    const year = parseInt(season.split('-')[0]);
    if (year >= 1980) {
      return {
        pts: realStats.pts ?? 0,
        reb: realStats.reb ?? 0,
        ast: realStats.ast ?? 0,
        stl: realStats.stl ?? 0,
        blk: realStats.blk ?? 0,
      };
    }
    const positionEstimates = {
      PG: { ast: 3.5, stl: 1.2, blk: 0.1 },
      SG: { ast: 2.0, stl: 1.0, blk: 0.2 },
      SF: { ast: 1.5, stl: 0.8, blk: 0.4 },
      PF: { ast: 1.0, stl: 0.5, blk: 0.8 },
      C:  { ast: 0.5, stl: 0.4, blk: 1.5 },
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
  return null;
}

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

function getComedyVerdict(lineup, projection) {
  const picks = SLOTS.map((slot) => lineup[slot]).filter(Boolean);
  if (picks.length !== SLOTS.length || !projection) return null;

  // Easter eggs — highest priority, checked in slot order
  const names = picks.map((p) => p.playerName.toLowerCase());
  const allBrandonGarrison = names.every((n) => n.includes('brandon') && n.includes('garrison'));
  if (allBrandonGarrison) {
    return { emoji: '🔥', text: 'IT\'S BG TIME, BABY' };
  }
  for (const slot of SLOTS) {
    const pick = lineup[slot];
    if (!pick) continue;
    const name = pick.playerName.toLowerCase();
    if (name.includes('saul') && name.includes('smith')) {
      return { emoji: '😅', text: 'Man, Ryan Lemond is not going to like this' };
    }
    if (name.includes('brad') && name.includes('calipari')) {
      return { emoji: '🤫', text: 'I feel like this is a little more given than earned' };
    }
    if (name.includes('karl-anthony') && name.includes('towns')) {
      return { emoji: '💅', text: 'Let\'s all take some shots of air' };
    }
    if (name.includes('jeff') && name.includes('brassow')) {
      return { emoji: '📢', text: 'Brassow..... BRASSOW' };
    }
    if (name.includes('ramel') && name.includes('bradley')) {
      return { emoji: '🍰', text: 'Shoutout Cheesecake' };
    }
    if (name.includes('lukasz') && name.includes('obrzut')) {
      return { emoji: '🎙️', text: 'Remember that time Woo reported live from a colonoscopy?' };
    }
    if (name.includes('demarcus') && name.includes('cousins')) {
      return { emoji: '🤵', text: 'Hello Mr. President, dis DeMarcus Cousins' };
    }
    if ((name.includes('aaron') && name.includes('harrison')) || (name.includes('andrew') && name.includes('harrison'))) {
      return { emoji: '🧬', text: 'First they split a zygote, now they are splitting defenders' };
    }
    if (name.includes('antwain') && name.includes('barbour')) {
      return { emoji: '🦋', text: 'What up butterfly' };
    }
    if (name.includes('heshimu') && name.includes('evans')) {
      return { emoji: '⚔️', text: 'Heshimu means warrior (not really though)' };
    }
  }

  // Duplicate detection
  const exactKey = (p) => `${p.playerId}|${p.season}`;
  const exactCounts = {};
  const playerCounts = {};
  picks.forEach((p) => {
    exactCounts[exactKey(p)] = (exactCounts[exactKey(p)] || 0) + 1;
    playerCounts[p.playerId] = (playerCounts[p.playerId] || 0) + 1;
  });
  const maxExact = Math.max(...Object.values(exactCounts));
  const maxPlayer = Math.max(...Object.values(playerCounts));
  const topName = picks.find((p) => playerCounts[p.playerId] === maxPlayer)?.playerName || 'this guy';

  // Position spread
  const positions = picks.map((p) => p.primaryPosition);
  const allSamePosition = positions.every((pos) => pos === positions[0]);

  // Era spread
  const years = picks.map((p) => getSeasonStartYear(p.season));
  const eraSpan = Math.max(...years) - Math.min(...years);

  // Composition-based gags take priority over tier gags
  if (maxExact === 5) {
    return { emoji: '🪞', text: `Five clones of the same ${topName} season. The locker room is just one very confused man.` };
  }
  if (maxExact >= 3) {
    return { emoji: '👯', text: `${maxExact} copies of the exact same player? Bold strategy. The refs are filing a complaint.` };
  }
  if (maxPlayer === 5) {
    return { emoji: '🌀', text: `A ${topName} for every era. You built a multiverse, not a lineup. Snap.` };
  }
  if (maxPlayer >= 3) {
    return { emoji: '🧬', text: `You really said "${topName}, ${topName}, and more ${topName}." We respect the commitment.` };
  }
  if (allSamePosition) {
    return { emoji: '📏', text: `Five ${positions[0]}'s and zero regrets. Inbounding the ball is now a team-wide mystery.` };
  }
  if (eraSpan >= 60) {
    return { emoji: '🕰️', text: `${eraSpan} years between your oldest and newest pick. Half this team has never seen a shot clock.` };
  }

  // Tier-based one-liners
  const w = projection.wins;
  if (w >= 40) return { emoji: '🏆', text: 'Undefeated cheat code. Vegas refuses to take action on this team.' };
  if (w >= 35) return { emoji: '🔥', text: 'Final Four lock. Other coaches just call timeout and cry.' };
  if (w >= 30) return { emoji: '💪', text: 'Elite Eight squad. Dangerous, deep, and slightly illegal in three states.' };
  if (w >= 28) return { emoji: '🙂', text: 'Sweet Sixteen vibes. Solid! Nobody is writing a 30-for-30 about it, though.' };
  if (w >= 24) return { emoji: '😬', text: 'A first-round flameout in the making. Pack light for the tournament.' };
  if (w >= 20) return { emoji: '🫠', text: 'Bubble team energy. Your selection-Sunday blood pressure says hello.' };
  return { emoji: '💀', text: 'This roster missed the tournament and possibly the bus. Try... literally anyone else.' };
}

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
  const picks = SLOTS.map((slot) => lineup[slot]).filter(Boolean);
  if (picks.length !== SLOTS.length) return null;

  const totals = picks.reduce((acc, pick) => ({
    pts: acc.pts + pick.metrics.pts,
    reb: acc.reb + pick.metrics.reb,
    ast: acc.ast + pick.metrics.ast,
    stl: acc.stl + pick.metrics.stl,
    blk: acc.blk + pick.metrics.blk,
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
  const wins = Math.max(0, Math.min(40, Math.round(40 * Math.pow(Math.min(teamOvr / PERFECT_TARGET, 1), 1.15))));
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

function getLastName(fullName) {
  return fullName.split(' ').pop();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function generateDreamRosterImage(lineup, projection, verdict) {
  const W = 640;
  const H = 780;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // Background — warm dark tone to differentiate from the blue official graphic
  ctx.fillStyle = '#120d08';
  ctx.fillRect(0, 0, W, H);

  // Diagonal hatch pattern (clearly "fun"/unofficial)
  ctx.strokeStyle = 'rgba(251,191,36,0.04)';
  ctx.lineWidth = 2;
  for (let i = -H; i < W; i += 28) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }

  // Top accent bar — amber/gold gradient
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#b45309');
  grad.addColorStop(0.5, '#f59e0b');
  grad.addColorStop(1, '#fbbf24');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 6);

  // "JUST FOR FUN" pill
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  const tagLabel = '★ JUST FOR FUN — NOT AN OFFICIAL DRAFT';
  const tagW = ctx.measureText(tagLabel).width + 24;
  ctx.fillStyle = 'rgba(245,158,11,0.18)';
  ctx.beginPath();
  ctx.roundRect(24, 22, tagW, 24, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(251,191,36,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(24, 22, tagW, 24, 12);
  ctx.stroke();
  ctx.fillStyle = '#fcd34d';
  ctx.textAlign = 'left';
  ctx.fillText(tagLabel, 36, 38);

  // Big title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.fillText('DREAM ROSTER', 24, 86);
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('No rules • No positions • Any season', 24, 108);

  // Record block (right aligned)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 40px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${projection.wins}-${projection.losses}`, W - 24, 92);
  ctx.fillStyle = '#9a7b3f';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${projection.tier.label} · ${projection.strength} RTG`, W - 24, 110);
  ctx.textAlign = 'left';

  // Totals bar
  const metrics = ['pts', 'reb', 'ast', 'stl', 'blk'];
  const metricLabels = { pts: 'PPG', reb: 'RPG', ast: 'APG', stl: 'SPG', blk: 'BPG' };
  const colW = (W - 48) / 5;
  metrics.forEach((key, i) => {
    const bx = 24 + i * colW;
    const by = 128;
    ctx.fillStyle = 'rgba(245,158,11,0.08)';
    ctx.beginPath();
    ctx.roundRect(bx, by, colW - 6, 44, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251,191,36,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, colW - 6, 44, 6);
    ctx.stroke();
    ctx.fillStyle = '#9a7b3f';
    ctx.font = '9px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(metricLabels[key], bx + (colW - 6) / 2, by + 13);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText(projection.totals[key].toFixed(1), bx + (colW - 6) / 2, by + 33);
    ctx.textAlign = 'left';
  });

  // Divider
  ctx.strokeStyle = 'rgba(251,191,36,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 188);
  ctx.lineTo(W - 24, 188);
  ctx.stroke();

  const slotAccents = ['#3b82f6', '#a855f7', '#22c55e', '#f97316', '#ef4444'];

  // Player cards
  SLOTS.forEach((slot, i) => {
    const pick = lineup[slot];
    if (!pick) return;
    const cx = 24;
    const cy = 200 + i * 104;
    const cardH = 94;
    const cardW = W - 48;

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251,191,36,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, 10);
    ctx.stroke();

    // Left accent bar
    ctx.fillStyle = slotAccents[i];
    ctx.beginPath();
    ctx.roundRect(cx, cy, 4, cardH, [10, 0, 0, 10]);
    ctx.fill();

    // Slot pill
    ctx.fillStyle = 'rgba(251,191,36,0.15)';
    ctx.beginPath();
    ctx.roundRect(cx + 14, cy + 12, 60, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SLOT ${i + 1}`, cx + 44, cy + 24);
    ctx.textAlign = 'left';

    // Season + position
    ctx.fillStyle = '#9a7b3f';
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${pick.season} · ${pick.primaryPosition}`, cx + 82, cy + 24);

    // Player name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(pick.playerName, cx + 14, cy + 52);

    // Stats row
    const statW = (cardW - 28) / metrics.length;
    metrics.forEach((key, si) => {
      const sx = cx + 14 + si * statW;
      const sy = cy + 66;
      ctx.fillStyle = '#6b5a33';
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      ctx.fillText(metricLabels[key], sx, sy);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(pick.metrics[key].toFixed(1), sx, sy + 15);
    });
  });

  // Comedic verdict box
  if (verdict) {
    const boxX = 24;
    const boxW = W - 48;
    const boxY = 728;
    const boxH = 38;
    ctx.fillStyle = 'rgba(245,158,11,0.12)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251,191,36,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.stroke();

    ctx.font = '18px system-ui, -apple-system, sans-serif';
    ctx.fillText(verdict.emoji, boxX + 12, boxY + 25);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'italic 12px system-ui, -apple-system, sans-serif';
    const lines = wrapText(ctx, verdict.text, boxW - 56).slice(0, 2);
    const startY = boxY + (lines.length === 1 ? 23 : 16);
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, boxX + 42, startY + idx * 15);
    });
  }

  // Footer
  ctx.fillStyle = '#6b5a33';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BIG BLUE ROULETTE · Dream Lineup Builder (for fun only)', W / 2, H - 12);
  ctx.textAlign = 'left';

  return canvas;
}

export default function LineupBuilder({ onBack }) {
  const [lineup, setLineup] = useState(() => {
    const initial = {};
    SLOTS.forEach((s) => { initial[s] = null; });
    return initial;
  });
  const [activeSlot, setActiveSlot] = useState('S1');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('pts');
  const [sortDir, setSortDir] = useState('desc');
  const [imageStatus, setImageStatus] = useState('');

  const filledCount = useMemo(() => SLOTS.filter((s) => lineup[s]).length, [lineup]);
  const projection = useMemo(() => buildProjection(lineup), [lineup]);
  const verdict = useMemo(() => getComedyVerdict(lineup, projection), [lineup, projection]);

  const handleShareImage = useCallback(() => {
    if (!projection) return;
    const canvas = generateDreamRosterImage(lineup, projection, verdict);
    const download = () => {
      const link = document.createElement('a');
      link.download = 'dream-roster.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      setImageStatus('Image saved!');
      setTimeout(() => setImageStatus(''), 2500);
    };
    canvas.toBlob((blob) => {
      if (!blob) { setImageStatus('Could not generate image.'); return; }
      const shareData = {
        files: [new File([blob], 'dream-roster.png', { type: 'image/png' })],
        title: 'My Kentucky Dream Roster',
        text: 'My just-for-fun Kentucky dream roster!',
      };
      if (navigator.canShare && navigator.canShare(shareData)) {
        navigator.share(shareData).catch(() => download());
      } else {
        download();
      }
    }, 'image/png');
  }, [lineup, projection, verdict]);

  const seasons = useMemo(() => {
    return allSeasons.filter((s) => getSeasonStartYear(s) >= 1950);
  }, []);

  const roster = useMemo(() => {
    if (!selectedSeason) return [];
    return seasonPlayersMap[selectedSeason] || [];
  }, [selectedSeason]);

  const allPlayerSeasons = useMemo(() => {
    const rows = [];
    for (const season of seasons) {
      const seasonRoster = seasonPlayersMap[season] || [];
      for (const player of seasonRoster) {
        const metrics = estimatePlayerMetrics(player, season);
        if (metrics) {
          rows.push({ player, season, metrics, hasStats: true });
        }
      }
    }
    return rows;
  }, [seasons]);

  const sortedRoster = useMemo(() => {
    let rows;
    if (selectedSeason) {
      rows = roster.map((player) => {
        const metrics = estimatePlayerMetrics(player, selectedSeason);
        return { player, season: selectedSeason, metrics, hasStats: metrics !== null };
      });
    } else {
      rows = allPlayerSeasons;
    }

    rows.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'name') {
        comparison = getLastName(a.player.fullName).localeCompare(getLastName(b.player.fullName));
      } else {
        const aVal = a.metrics?.[sortKey] ?? -Infinity;
        const bVal = b.metrics?.[sortKey] ?? -Infinity;
        comparison = aVal - bVal;
      }
      if (comparison === 0) {
        comparison = a.player.fullName.localeCompare(b.player.fullName);
      }
      if (comparison === 0) {
        comparison = a.season.localeCompare(b.season);
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return rows.filter((r) => r.player.fullName.toLowerCase().includes(q));
    }
    return rows;
  }, [roster, allPlayerSeasons, sortKey, sortDir, searchQuery, selectedSeason]);

  function assignPlayer(slot, player, season) {
    const metrics = estimatePlayerMetrics(player, season);
    if (!metrics) return;
    const updated = {
      ...lineup,
      [slot]: {
        playerId: player.id,
        playerName: player.fullName,
        season,
        primaryPosition: player.primaryPosition,
        metrics,
      },
    };
    setLineup(updated);
    const nextEmpty = SLOTS.find((s) => !updated[s]);
    setActiveSlot(nextEmpty || slot);
  }

  function clearSlot(slot) {
    setLineup((prev) => ({ ...prev, [slot]: null }));
    setActiveSlot(slot);
  }

  function resetAll() {
    const empty = {};
    SLOTS.forEach((s) => { empty[s] = null; });
    setLineup(empty);
    setActiveSlot(null);
    setSelectedSeason('');
    setSearchQuery('');
  }

  const slotColors = [
    'border-blue-500/40 bg-blue-500/10',
    'border-purple-500/40 bg-purple-500/10',
    'border-green-500/40 bg-green-500/10',
    'border-orange-500/40 bg-orange-500/10',
    'border-red-500/40 bg-red-500/10',
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-600/20 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-2">
            <Users className="w-3.5 h-3.5" />
            Just For Fun
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Dream Lineup Builder</h2>
          <p className="text-sm text-gray-400 mt-1">
            No rules. No positions. Pick anyone from any season — even duplicates.
          </p>
        </div>
        <button
          onClick={onBack}
          className="shrink-0 px-4 py-2 rounded-lg border border-white/15 text-gray-300 hover:bg-white/10 text-sm font-semibold transition-all"
        >
          Back
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-5 items-start">
        {/* LEFT: Lineup + projection */}
        <div className="flex flex-col gap-4">
          {projection ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <div className={`text-xl font-black tracking-tight ${projection.tier.color}`}>{projection.tier.label}</div>
              <div className="text-gray-400 text-sm mt-1">
                Projected Record: <span className="text-white font-semibold">{projection.wins}-{projection.losses}</span> <span className="text-gray-500">(of 40)</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Strength Rating: {projection.strength}</div>
              <div className="grid grid-cols-5 gap-1.5 mt-3">
                {Object.entries(METRIC_LABELS).map(([key, label]) => (
                  <div key={key} className="rounded-lg bg-black/25 border border-white/10 p-1.5 text-center">
                    <div className="text-[9px] tracking-widest text-gray-500 uppercase">{label}</div>
                    <div className="text-xs font-semibold text-white mt-0.5">{projection.totals[key].toFixed(1)}</div>
                  </div>
                ))}
              </div>
              {verdict && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-left">
                  <span className="text-xl leading-none shrink-0">{verdict.emoji}</span>
                  <p className="text-sm text-amber-100/90 leading-snug">{verdict.text}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-sm text-gray-300 font-semibold">{filledCount} / 5 slots filled</div>
              <div className="text-xs text-gray-500 mt-1">Fill all five to reveal your projected record.</div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {SLOTS.map((slot, idx) => {
              const pick = lineup[slot];
              const isActive = activeSlot === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setActiveSlot(slot)}
                  className={`text-left rounded-xl border p-3 transition-all ${
                    isActive
                      ? 'ring-2 ring-blue-400/60 border-blue-400/40 bg-blue-500/10'
                      : pick
                        ? slotColors[idx]
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{SLOT_LABELS[slot]}</span>
                    {pick && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); clearSlot(slot); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); clearSlot(slot); } }}
                        className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  {pick ? (
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{pick.playerName}</div>
                        <div className="text-[11px] text-gray-400">{pick.season} • {pick.primaryPosition}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-bold text-white">{pick.metrics.pts.toFixed(1)}</div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-widest">PPG</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1.5 text-sm text-gray-500">
                      {isActive ? 'Choose a player from the right →' : 'Empty — tap to fill'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {projection && (
            <button
              onClick={handleShareImage}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-200 text-sm font-bold transition-all"
            >
              <Download className="w-4 h-4" />
              {imageStatus || 'Share Dream Roster Graphic'}
            </button>
          )}

          {filledCount > 0 && (
            <button
              onClick={resetAll}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/15 text-gray-300 hover:bg-white/10 text-sm font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          )}
        </div>

        {/* RIGHT: Picker */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3 lg:sticky lg:top-20">
          <div className="text-sm font-semibold text-white">
            Picking for <span className="text-blue-300">{SLOT_LABELS[activeSlot] || 'a slot'}</span>
          </div>

          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none"
            style={{ backgroundImage: 'none' }}
          >
            <option value="" className="bg-[#0f111a] text-gray-400">All Seasons</option>
            {[...seasons].reverse().map((s) => (
              <option key={s} value={s} className="bg-[#0f111a]">{s}</option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Type a player name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/15 text-white text-sm pl-9 pr-3 py-2.5 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: 'pts', label: 'PPG' },
              { key: 'reb', label: 'RPG' },
              { key: 'ast', label: 'APG' },
              { key: 'stl', label: 'SPG' },
              { key: 'blk', label: 'BPG' },
              { key: 'name', label: 'Name' },
            ].map((opt) => {
              const isActive = sortKey === opt.key;
              const dirLabel = isActive ? (sortDir === 'desc' ? '↓' : '↑') : '';
              return (
                <button
                  key={opt.key}
                  onClick={() => {
                    if (sortKey === opt.key) {
                      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
                    } else {
                      setSortKey(opt.key);
                      setSortDir('desc');
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isActive ? 'bg-blue-500/20 border-blue-400/60 text-blue-200' : 'bg-white/5 border-white/15 text-gray-300 hover:bg-white/10'}`}
                >
                  {opt.label} {dirLabel}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-gray-500">
            {sortedRoster.length} result{sortedRoster.length !== 1 ? 's' : ''}
            {!selectedSeason && searchQuery.trim() && ' across all seasons'}
            {selectedSeason && ` in ${selectedSeason}`}
          </div>

          <div className="overflow-y-auto pr-1 space-y-2 h-[420px]">
            {sortedRoster.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-6">
                {searchQuery.trim() ? 'No players match that name.' : 'Type a name or pick a season to browse.'}
              </div>
            )}
            {sortedRoster.map(({ player, season, metrics, hasStats }) => (
              <button
                key={`${player.id}-${season}`}
                onClick={() => {
                  if (hasStats) assignPlayer(activeSlot, player, season);
                }}
                disabled={!hasStats}
                className={`w-full rounded-xl border px-3.5 py-3 text-left transition-all ${hasStats ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-white/5 border-white/10 opacity-60 cursor-not-allowed'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">{player.fullName}</div>
                  <div className="text-[11px] text-gray-500">{season}</div>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{player.primaryPosition}</div>
                {hasStats && metrics && (
                  <div className="mt-2 grid grid-cols-5 gap-1">
                    {Object.entries(METRIC_LABELS).map(([key, label]) => (
                      <div key={key} className="rounded-md bg-black/30 border border-white/10 px-1 py-1 text-center">
                        <div className="text-[9px] text-gray-500 uppercase tracking-widest">{label}</div>
                        <div className="text-[11px] font-semibold text-white mt-0.5">{metrics[key].toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                )}
                {!hasStats && (
                  <div className="mt-1 text-[11px] text-orange-400/70">Stats unavailable</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
