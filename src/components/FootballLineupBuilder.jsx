import { useCallback, useMemo, useState } from 'react';
import {
  footballPlayers,
  footballAllSeasons,
  footballSeasonPlayersMap,
} from '../data/footballPlayers.js';
import { footballPlayerSeasonStatsById } from '../data/footballPlayerSeasonStats.js';
import { Search, X, Users, RotateCcw, Download } from 'lucide-react';

const SLOTS = ['QB', 'RB', 'WR1', 'WR2', 'FLEX'];
const SLOT_LABELS = {
  QB: 'Quarterback',
  RB: 'Running Back',
  WR1: 'Wide Receiver 1',
  WR2: 'Wide Receiver 2',
  FLEX: 'Flex',
};

const SLOT_COLORS = {
  QB: 'border-blue-500/40 bg-blue-500/10',
  RB: 'border-purple-500/40 bg-purple-500/10',
  WR1: 'border-green-500/40 bg-green-500/10',
  WR2: 'border-teal-500/40 bg-teal-500/10',
  FLEX: 'border-orange-500/40 bg-orange-500/10',
};

const SLOT_ACCENT_HEX = {
  QB: '#3b82f6', RB: '#a855f7', WR1: '#22c55e', WR2: '#14b8a6', FLEX: '#f97316',
};

const POSITION_ORDER = { QB: 0, RB: 1, WR: 2, TE: 3 };

const SLOT_ALLOWED_POSITIONS = {
  QB: ['QB'],
  RB: ['RB'],
  WR1: ['WR'],
  WR2: ['WR'],
  FLEX: ['WR', 'RB', 'TE'],
};

const POSITION_BENCHMARKS = { QB: 120, RB: 85, WR: 100, FLEX: 70 };
const PERFECT_TARGET = 700;
const TE_BONUS = 1.4;

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

function getFootballProjection(lineup) {
  const picks = SLOTS.map((pos) => lineup[pos]).filter(Boolean);
  if (picks.length !== 5) return null;

  let totalValue = 0;
  const positionValues = {};

  for (const pick of picks) {
    let value = getPositionValue(pick.stats, pick.primaryPosition);
    const slot = Object.entries(lineup).find(([_, p]) => p === pick)?.[0];
    if (slot === 'FLEX' && pick.primaryPosition === 'TE') {
      value *= TE_BONUS;
    }
    totalValue += value;
    if (slot) positionValues[slot] = value;
  }

  const rawRatio = totalValue / PERFECT_TARGET;
  const wins = Math.max(0, Math.min(12, Math.round(12 * Math.pow(Math.min(rawRatio, 1), 2.0))));
  const losses = 12 - wins;

  const tier = (() => {
    if (wins >= 12) return { label: 'NATIONAL CHAMPIONS', color: 'text-yellow-300' };
    if (wins >= 10) return { label: 'PLAYOFF BOUND', color: 'text-green-300' };
    if (wins >= 8) return { label: 'BOWL ELIGIBLE', color: 'text-blue-300' };
    if (wins >= 6) return { label: 'BUBBLE TEAM', color: 'text-purple-300' };
    if (wins >= 4) return { label: 'REBUILDING', color: 'text-orange-400' };
    return { label: 'COACH ON HOT SEAT', color: 'text-red-400' };
  })();

  return { wins, losses, strength: Math.round(totalValue), tier, positionValues };
}

function getComedyVerdict(lineup, projection) {
  const picks = SLOTS.map((pos) => lineup[pos]).filter(Boolean);
  if (picks.length !== 5 || !projection) return null;

  for (const pick of picks) {
    const name = pick.playerName.toLowerCase();
    if (name.includes('tim') && name.includes('couch')) {
      return { emoji: '📞', text: 'The Browns are already on the phone.' };
    }
    if (name.includes('randall') && name.includes('cobb')) {
      return { emoji: '⚡', text: 'He played QB, WR, and returner. We are letting him do all three.' };
    }
    if (name.includes('lynn') && name.includes('bowden')) {
      return { emoji: '🎯', text: 'A quarterback-wide-receiver-flex. Absolute chaos.' };
    }
    if (name.includes('will') && name.includes('levis')) {
      return { emoji: '🥪', text: 'Mayo in the coffee. Mayo in the stats.' };
    }
    if (name.includes('benny') && name.includes('snell')) {
      return { emoji: '🏈', text: 'Benny Snell football. That is the entire tweet.' };
    }
  }

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

  const years = picks.map((p) => parseInt(p.season));
  const eraSpan = Math.max(...years) - Math.min(...years);

  if (maxExact === 5) {
    return { emoji: '🪞', text: `Five clones of the same ${topName} season. The locker room is just one very confused man.` };
  }
  if (maxExact >= 3) {
    return { emoji: '👯', text: `${maxExact} copies of the exact same season? The NCAA compliance office just got a tip.` };
  }
  if (maxPlayer === 5) {
    return { emoji: '🌀', text: `A ${topName} for every era. You built a multiverse, not a lineup.` };
  }
  if (maxPlayer >= 3) {
    return { emoji: '🧬', text: `You really said "${topName}, ${topName}, and more ${topName}." We respect the commitment.` };
  }
  if (eraSpan >= 60) {
    return { emoji: '🕰️', text: `${eraSpan} years between your oldest and newest pick. The playbook is written in cursive.` };
  }

  const w = projection.wins;
  if (w >= 12) return { emoji: '🏆', text: 'Undefeated cheat code. Vegas refuses to take action on this team.' };
  if (w >= 10) return { emoji: '🔥', text: 'Playoff lock. SEC coaches are sending your film to the league office.' };
  if (w >= 8) return { emoji: '💪', text: 'Bowl eligible and dangerous. Bring the marching band.' };
  if (w >= 6) return { emoji: '🙂', text: 'Bubble team vibes. You are one controversial targeting call away from Shreveport.' };
  if (w >= 4) return { emoji: '😬', text: 'Rebuilding year. The message boards are already calling for a new OC.' };
  return { emoji: '💀', text: 'This roster lost to Vanderbilt. Twice. Start over.' };
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

function rr(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    roundRectPolyfill(ctx, x, y, w, h, r);
  }
}

function generateFootballDreamRosterImage(lineup, projection, verdict) {
  const W = 640;
  const H = 780;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  ctx.fillStyle = '#0f121a';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(59,130,246,0.04)';
  ctx.lineWidth = 2;
  for (let i = -H; i < W; i += 28) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }

  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#1d4ed8');
  grad.addColorStop(0.5, '#3b82f6');
  grad.addColorStop(1, '#60a5fa');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 6);

  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  const tagLabel = '★ JUST FOR FUN — NOT AN OFFICIAL DRAFT';
  const tagW = ctx.measureText(tagLabel).width + 24;
  ctx.fillStyle = 'rgba(59,130,246,0.18)';
  rr(ctx, 24, 22, tagW, 24, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(96,165,250,0.5)';
  ctx.lineWidth = 1;
  rr(ctx, 24, 22, tagW, 24, 12);
  ctx.stroke();
  ctx.fillStyle = '#93c5fd';
  ctx.textAlign = 'left';
  ctx.fillText(tagLabel, 36, 38);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.fillText('DREAM ROSTER', 24, 86);
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('QB / RB / 2×WR / Flex • Any season', 24, 108);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 40px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${projection.wins}-${projection.losses}`, W - 24, 92);
  ctx.fillStyle = '#4b5563';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${projection.tier.label} · ${projection.strength} STR`, W - 24, 110);
  ctx.textAlign = 'left';

  const slots = ['QB', 'RB', 'WR1', 'WR2', 'FLEX'];
  const slotLabels = { QB: 'QB', RB: 'RB', WR1: 'WR1', WR2: 'WR2', FLEX: 'Flex' };
  const colW = (W - 48) / 5;
  slots.forEach((key, i) => {
    const bx = 24 + i * colW;
    const by = 128;
    ctx.fillStyle = 'rgba(59,130,246,0.08)';
    rr(ctx, bx, by, colW - 6, 44, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(96,165,250,0.18)';
    ctx.lineWidth = 1;
    rr(ctx, bx, by, colW - 6, 44, 6);
    ctx.stroke();
    ctx.fillStyle = '#4b5563';
    ctx.font = '9px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(slotLabels[key], bx + (colW - 6) / 2, by + 13);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText((projection.positionValues[key] || 0).toFixed(1), bx + (colW - 6) / 2, by + 33);
    ctx.textAlign = 'left';
  });

  ctx.strokeStyle = 'rgba(96,165,250,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 188);
  ctx.lineTo(W - 24, 188);
  ctx.stroke();

  slots.forEach((pos, i) => {
    const pick = lineup[pos];
    if (!pick) return;
    const cx = 24;
    const cy = 200 + i * 104;
    const cardH = 94;
    const cardW = W - 48;

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    rr(ctx, cx, cy, cardW, cardH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    rr(ctx, cx, cy, cardW, cardH, 10);
    ctx.stroke();

    const posColor = SLOT_ACCENT_HEX[pos] ?? '#6b7280';
    ctx.fillStyle = posColor;
    rr(ctx, cx, cy, 4, cardH, [10, 0, 0, 10]);
    ctx.fill();

    ctx.fillStyle = posColor + '33';
    rr(ctx, cx + 14, cy + 12, 32, 18, 4);
    ctx.fill();
    ctx.fillStyle = posColor;
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pos, cx + 30, cy + 25);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#6b7280';
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${pick.season} · ${pick.primaryPosition}`, cx + 52, cy + 25);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(pick.playerName, cx + 14, cy + 52);

    const statMap = {
      QB: [{ k: 'Yds', l: 'Pass Yds/G' }, { k: 'TD', l: 'Pass TD/G' }, { k: 'Int', l: 'Int/G' }, { k: 'Rate', l: 'Rate' }],
      RB: [{ k: 'RushYds', l: 'Rush Yds/G' }, { k: 'RushTD', l: 'Rush TD/G' }, { k: 'RecYds', l: 'Rec Yds/G' }, { k: 'RecTD', l: 'Rec TD/G' }],
      WR: [{ k: 'Rec', l: 'Rec/G' }, { k: 'RecYds', l: 'Rec Yds/G' }, { k: 'YPR', l: 'Y/R' }, { k: 'RecTD', l: 'Rec TD/G' }],
      TE: [{ k: 'Rec', l: 'Rec/G' }, { k: 'RecYds', l: 'Rec Yds/G' }, { k: 'YPR', l: 'Y/R' }, { k: 'RecTD', l: 'Rec TD/G' }],
    };
    const statKeys = statMap[pick.primaryPosition] || statMap.WR;
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

  if (verdict) {
    const boxX = 24;
    const boxW = W - 48;
    const boxY = 728;
    const boxH = 38;
    ctx.fillStyle = 'rgba(59,130,246,0.12)';
    rr(ctx, boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(96,165,250,0.3)';
    ctx.lineWidth = 1;
    rr(ctx, boxX, boxY, boxW, boxH, 8);
    ctx.stroke();

    ctx.font = '18px system-ui, -apple-system, sans-serif';
    ctx.fillText(verdict.emoji, boxX + 12, boxY + 25);

    ctx.fillStyle = '#bfdbfe';
    ctx.font = 'italic 12px system-ui, -apple-system, sans-serif';
    const lines = wrapText(ctx, verdict.text, boxW - 56).slice(0, 2);
    const startY = boxY + (lines.length === 1 ? 23 : 16);
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, boxX + 42, startY + idx * 15);
    });
  }

  ctx.fillStyle = '#374151';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BIG BLUE ROULETTE · Football Dream Lineup Builder (for fun only)', W / 2, H - 12);
  ctx.textAlign = 'left';

  return canvas;
}

export default function FootballLineupBuilder({ onBack }) {
  const [lineup, setLineup] = useState(() => {
    const initial = {};
    SLOTS.forEach((s) => { initial[s] = null; });
    return initial;
  });
  const [activeSlot, setActiveSlot] = useState('QB');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('year');
  const [sortDir, setSortDir] = useState('desc');
  const [imageStatus, setImageStatus] = useState('');

  const filledCount = useMemo(() => SLOTS.filter((s) => lineup[s]).length, [lineup]);
  const projection = useMemo(() => getFootballProjection(lineup), [lineup]);
  const verdict = useMemo(() => getComedyVerdict(lineup, projection), [lineup, projection]);

  const draftedPlayerIds = useMemo(() => {
    return new Set(SLOTS.map((s) => lineup[s]?.playerId).filter(Boolean));
  }, [lineup]);

  const handleShareImage = useCallback(() => {
    if (!projection) return;
    const canvas = generateFootballDreamRosterImage(lineup, projection, verdict);
    const download = () => {
      const link = document.createElement('a');
      link.download = 'football-dream-roster.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      setImageStatus('Image saved!');
      setTimeout(() => setImageStatus(''), 2500);
    };
    canvas.toBlob((blob) => {
      if (!blob) { setImageStatus('Could not generate image.'); return; }
      const shareData = {
        files: [new File([blob], 'football-dream-roster.png', { type: 'image/png' })],
        title: 'My Kentucky Football Dream Roster',
        text: 'My just-for-fun Kentucky football dream roster!',
      };
      if (navigator.canShare && navigator.canShare(shareData)) {
        navigator.share(shareData).catch(() => download());
      } else {
        download();
      }
    }, 'image/png');
  }, [lineup, projection, verdict]);

  const seasons = useMemo(() => {
    return [...footballAllSeasons].sort((a, b) => parseInt(a) - parseInt(b));
  }, []);

  const roster = useMemo(() => {
    if (!selectedSeason) return [];
    return footballSeasonPlayersMap[selectedSeason] || [];
  }, [selectedSeason]);

  const allPlayerSeasons = useMemo(() => {
    const rows = [];
    for (const season of seasons) {
      const seasonRoster = footballSeasonPlayersMap[season] || [];
      for (const player of seasonRoster) {
        const stats = getStatsForDisplay(player, season);
        rows.push({ player, season, stats, hasStats: stats !== null });
      }
    }
    return rows;
  }, [seasons]);

  const sortedRoster = useMemo(() => {
    let rows;
    if (selectedSeason) {
      rows = roster.map((player) => {
        const stats = getStatsForDisplay(player, selectedSeason);
        return { player, season: selectedSeason, stats, hasStats: stats !== null };
      });
    } else {
      rows = allPlayerSeasons;
    }

    rows.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'name') {
        comparison = getLastName(a.player.fullName).localeCompare(getLastName(b.player.fullName));
      } else if (sortKey === 'year') {
        comparison = a.season.localeCompare(b.season);
        if (comparison === 0) {
          comparison = (POSITION_ORDER[a.player.primaryPosition] ?? 99) - (POSITION_ORDER[b.player.primaryPosition] ?? 99);
        }
        if (comparison === 0) {
          comparison = getLastName(a.player.fullName).localeCompare(getLastName(b.player.fullName));
        }
      } else if (sortKey === 'position') {
        comparison = (POSITION_ORDER[a.player.primaryPosition] ?? 99) - (POSITION_ORDER[b.player.primaryPosition] ?? 99);
        if (comparison === 0) {
          comparison = a.season.localeCompare(b.season);
        }
        if (comparison === 0) {
          comparison = getLastName(a.player.fullName).localeCompare(getLastName(b.player.fullName));
        }
      } else {
        const aVal = a.stats?.[sortKey] ?? -Infinity;
        const bVal = b.stats?.[sortKey] ?? -Infinity;
        comparison = aVal - bVal;
        if (comparison === 0) {
          comparison = getLastName(a.player.fullName).localeCompare(getLastName(b.player.fullName));
        }
        if (comparison === 0) {
          comparison = a.season.localeCompare(b.season);
        }
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    // Filter by allowed positions for the active slot
    const allowedPositions = SLOT_ALLOWED_POSITIONS[activeSlot] || [];
    rows = rows.filter((r) => allowedPositions.includes(r.player.primaryPosition));

    // No duplicate players
    rows = rows.filter((r) => !draftedPlayerIds.has(r.player.id));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return rows.filter((r) => r.player.fullName.toLowerCase().includes(q));
    }
    return rows;
  }, [roster, allPlayerSeasons, sortKey, sortDir, searchQuery, selectedSeason, activeSlot, draftedPlayerIds]);

  function assignPlayer(slot, player, season) {
    const stats = getStatsForDisplay(player, season);
    const updated = {
      ...lineup,
      [slot]: {
        playerId: player.id,
        playerName: player.fullName,
        season,
        primaryPosition: player.primaryPosition,
        stats,
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
    setActiveSlot('QB');
    setSelectedSeason('');
    setSearchQuery('');
  }

  function StatGrid({ stats, position }) {
    const keys = (() => {
      if (position === 'QB') {
        return [
          { key: 'Yds', label: 'Pass Yds/G' }, { key: 'TD', label: 'Pass TD/G' },
          { key: 'Int', label: 'Int/G' }, { key: 'Rate', label: 'Rate' },
        ];
      }
      if (position === 'RB') {
        return [
          { key: 'RushYds', label: 'Rush Yds/G' }, { key: 'RushTD', label: 'Rush TD/G' },
          { key: 'RecYds', label: 'Rec Yds/G' }, { key: 'RecTD', label: 'Rec TD/G' },
        ];
      }
      return [
        { key: 'Rec', label: 'Rec/G' }, { key: 'RecYds', label: 'Rec Yds/G' },
        { key: 'YPR', label: 'Y/R' }, { key: 'RecTD', label: 'Rec TD/G' },
      ];
    })();

    return (
      <div className="mt-2 grid grid-cols-4 gap-1">
        {keys.map(({ key, label }) => (
          <div key={key} className="rounded-md bg-black/30 border border-white/10 px-1 py-1 text-center">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest">{label}</div>
            <div className="text-[11px] font-semibold text-white mt-0.5">
              {typeof stats?.[key] === 'number' ? stats[key].toFixed(1) : stats?.[key] ?? '-'}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sortOptions = [
    { key: 'year', label: 'Year' },
    { key: 'position', label: 'Position' },
    { key: 'name', label: 'Name' },
    { key: 'Yds', label: 'Pass Yds' },
    { key: 'TD', label: 'Pass TD' },
    { key: 'RushYds', label: 'Rush Yds' },
    { key: 'RushTD', label: 'Rush TD' },
    { key: 'RecYds', label: 'Rec Yds' },
    { key: 'RecTD', label: 'Rec TD' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-5 animate-fadeIn">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-2">
            <Users className="w-3.5 h-3.5" />
            Just For Fun
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Dream Lineup Builder</h2>
          <p className="text-sm text-gray-400 mt-1">
            QB, RB, two WRs, and a flex. No duplicate players. Any season.
          </p>
        </div>
        <button
          onClick={onBack}
          className="shrink-0 px-4 py-2 rounded-lg border border-white/15 text-gray-300 hover:bg-white/10 text-sm font-semibold transition-all"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-5 items-start">
        <div className="flex flex-col gap-4">
          {projection ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <div className={`text-xl font-black tracking-tight ${projection.tier.color}`}>{projection.tier.label}</div>
              <div className="text-gray-400 text-sm mt-1">
                Projected Record: <span className="text-white font-semibold">{projection.wins}-{projection.losses}</span> <span className="text-gray-500">(of 12)</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Strength Rating: {projection.strength}</div>
              <div className="grid grid-cols-5 gap-1.5 mt-3">
                {SLOTS.map((slot) => (
                  <div key={slot} className="rounded-lg bg-black/25 border border-white/10 p-1.5 text-center">
                    <div className="text-[9px] tracking-widest text-gray-500 uppercase">{slot}</div>
                    <div className="text-xs font-semibold text-white mt-0.5">{(projection.positionValues[slot] || 0).toFixed(1)}</div>
                  </div>
                ))}
              </div>
              {verdict && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-left">
                  <span className="text-xl leading-none shrink-0">{verdict.emoji}</span>
                  <p className="text-sm text-blue-100/90 leading-snug">{verdict.text}</p>
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
            {SLOTS.map((slot) => {
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
                        ? SLOT_COLORS[slot]
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
                        <div className="text-sm font-bold text-white">{(getPositionValue(pick.stats, pick.primaryPosition) || 0).toFixed(1)}</div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-widest">VAL</div>
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
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-500/40 text-blue-200 text-sm font-bold transition-all"
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
            {sortOptions.map((opt) => {
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
            {sortedRoster.map(({ player, season, stats, hasStats }) => (
              <button
                key={`${player.id}-${season}`}
                onClick={() => assignPlayer(activeSlot, player, season)}
                className="w-full rounded-xl border px-3.5 py-3 text-left transition-all bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">{player.fullName}</div>
                  <div className="text-[11px] text-gray-500">{season}</div>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{player.primaryPosition}</div>
                {hasStats && stats && <StatGrid stats={stats} position={player.primaryPosition} />}
                {!hasStats && <div className="mt-1 text-[11px] text-orange-400/70">Stats unavailable</div>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
