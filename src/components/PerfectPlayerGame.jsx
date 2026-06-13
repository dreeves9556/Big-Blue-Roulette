import { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, RotateCcw, Sparkles, Eye, EyeOff, Trophy, ChevronRight, Target, TrendingUp, Users, Download } from 'lucide-react';
import { allSeasons, seasonPlayersMap } from '../data/players.js';
import { playerSeasonStatsById } from '../data/playerSeasonStats.js';
import { perfectPlayer } from '../data/naismithWinners.js';

// Game phases
const PHASES = {
  INTRO: 'intro',
  PLAYING: 'playing',
  SELECTING_PLAYER: 'selecting_player',
  SELECTING_ATTRIBUTE: 'selecting_attribute',
  COMPLETE: 'complete',
};

// Attribute selection status
const createEmptySelection = () => ({
  scoring: null,
  rebounding: null,
  playmaking: null,
  defense: null,
});

const ATTRIBUTES = [
  { key: 'scoring', label: 'Scoring (PTS)', shortLabel: 'Scoring', sourceStats: ['pts'] },
  { key: 'rebounding', label: 'Rebounding (REB)', shortLabel: 'Rebounding', sourceStats: ['trb'] },
  { key: 'playmaking', label: 'Playmaking (AST)', shortLabel: 'Playmaking', sourceStats: ['ast'] },
  { key: 'defense', label: 'Defense (STL + BLK)', shortLabel: 'Defense', sourceStats: ['stl', 'blk'] },
];

// Tier levels for achievement display
// 166% = Kentucky Cap (Issel+Burrow+Ulis+Anderson theoretical max) with 75th percentile targets
const TIERS = [
  { threshold: 166, name: 'Best Possible', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', desc: '166% (Kentucky Cap)' },
  { threshold: 150, name: 'GOAT', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', desc: '150-165%' },
  { threshold: 130, name: 'All-Time Legend', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', desc: '130-149%' },
  { threshold: 110, name: 'Naismith Winner', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', desc: '110-129%' },
  { threshold: 100, name: '1st Team All-American', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', desc: '100-109%' },
  { threshold: 90, name: '2nd Team All-American', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', desc: '90-99%' },
  { threshold: 0, name: 'All-SEC', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', desc: '<90%' },
];

function getTierFromScore(score) {
  return TIERS.find(t => score >= t.threshold) || TIERS[TIERS.length - 1];
}

function roundToTenths(value) {
  return Math.round(value * 10) / 10;
}

function formatStat(value) {
  if (value === null || value === undefined || value === 0) return '-';
  return value.toFixed(1);
}

function getStatColor(value, perfect) {
  if (!value || !perfect) return 'text-gray-500';
  const percentage = perfect > 0 ? value / perfect : 0;
  if (percentage >= 0.95) return 'text-green-400';
  if (percentage >= 0.8) return 'text-blue-400';
  if (percentage >= 0.6) return 'text-yellow-400';
  return 'text-gray-400';
}

function getSeasonStartYear(season) {
  const [startYearString] = season.split('-');
  return Number.parseInt(startYearString, 10);
}

function getEraAdjustment(year) {
  if (year < 1970) return { pts: 0.92, reb: 1.04, ast: 0.9, stl: 0.78, blk: 0.76 };
  if (year < 1980) return { pts: 0.94, reb: 1.03, ast: 0.92, stl: 0.82, blk: 0.8 };
  if (year < 1990) return { pts: 0.97, reb: 1.0, ast: 0.96, stl: 0.9, blk: 0.9 };
  if (year < 2000) return { pts: 1.0, reb: 0.98, ast: 1.0, stl: 1.0, blk: 1.0 };
  if (year < 2010) return { pts: 1.03, reb: 0.96, ast: 1.04, stl: 1.05, blk: 1.03 };
  if (year < 2020) return { pts: 1.05, reb: 0.95, ast: 1.08, stl: 1.1, blk: 1.06 };
  return { pts: 1.08, reb: 0.94, ast: 1.12, stl: 1.12, blk: 1.08 };
}

function estimatePlayerMetrics(player, season) {
  const realStats = playerSeasonStatsById[player.id]?.[season];
  if (!realStats) return null;

  const year = parseInt(season.split('-')[0]);
  
  // For 1980+, use actual stats directly
  if (year >= 1980) {
    return {
      scoring: realStats.pts ?? 0,
      rebounding: realStats.reb ?? 0,
      playmaking: realStats.ast ?? 0,
      defense: (realStats.stl ?? 0) + (realStats.blk ?? 0),
    };
  }
  
  // Pre-1980: estimate missing stats based on position
  const positionEstimates = {
    'PG': { ast: 3.5, stl: 1.2, blk: 0.1 },
    'SG': { ast: 2.0, stl: 1.0, blk: 0.2 },
    'SF': { ast: 1.5, stl: 0.8, blk: 0.4 },
    'PF': { ast: 1.0, stl: 0.5, blk: 0.8 },
    'C':  { ast: 0.5, stl: 0.4, blk: 1.5 },
    'G':  { ast: 2.5, stl: 1.1, blk: 0.15 },
    'F':  { ast: 1.2, stl: 0.6, blk: 0.6 },
  };

  const estimates = positionEstimates[player.primaryPosition] || { ast: 1.0, stl: 0.5, blk: 0.3 };
  const era = getEraAdjustment(year);

  const rawAst = realStats.ast ?? 0;
  const ast = rawAst > 0 ? rawAst * era.ast : estimates.ast * era.ast;
  
  const rawStl = realStats.stl ?? 0;
  const stl = rawStl > 0 ? rawStl * era.stl : estimates.stl * era.stl;
  
  const rawBlk = realStats.blk ?? 0;
  const blk = rawBlk > 0 ? rawBlk * era.blk : estimates.blk * era.blk;

  return {
    scoring: (realStats.pts ?? 0) * era.pts,
    rebounding: (realStats.reb ?? 0) * era.reb,
    playmaking: roundToTenths(ast),
    defense: roundToTenths(stl + blk),
  };
}

function getLastName(fullName) {
  return fullName.split(' ').pop();
}

export default function PerfectPlayerGame({ onBack }) {
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [gameMode, setGameMode] = useState(null);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [rouletteSeason, setRouletteSeason] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [usedSeasons, setUsedSeasons] = useState([]);
  const [selections, setSelections] = useState(createEmptySelection());
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [imageStatus, setImageStatus] = useState('');
  
  // Sort filter for player selection
  const [sortByAttribute, setSortByAttribute] = useState(null);
  
  // Skip season (one per game - can use it any round, but only once total)
  const [skipUsed, setSkipUsed] = useState(false);

  const remainingAttributes = useMemo(() => {
    return ATTRIBUTES.filter(attr => selections[attr.key] === null);
  }, [selections]);

  const filledAttributes = useMemo(() => {
    return ATTRIBUTES.filter(attr => selections[attr.key] !== null);
  }, [selections]);

  const currentPlayer = useMemo(() => {
    const player = {};
    ATTRIBUTES.forEach(attr => {
      player[attr.key] = selections[attr.key]?.value || 0;
    });
    return player;
  }, [selections]);

  const completionPercentage = useMemo(() => {
    return Math.round((filledAttributes.length / ATTRIBUTES.length) * 100);
  }, [filledAttributes]);

  const startGame = useCallback((mode) => {
    setGameMode(mode);
    setPhase(PHASES.PLAYING);
    setCurrentSeason(null);
    setRouletteSeason(null);
    setUsedSeasons([]);
    setSelections(createEmptySelection());
    setSelectedPlayer(null);
    setAvailablePlayers([]);
    setShowComparison(false);
    setSortByAttribute(null);
  }, []);

  const resetGame = useCallback(() => {
    setPhase(PHASES.INTRO);
    setGameMode(null);
    setCurrentSeason(null);
    setRouletteSeason(null);
    setUsedSeasons([]);
    setSelections(createEmptySelection());
    setSelectedPlayer(null);
    setAvailablePlayers([]);
    setShowComparison(false);
    setSortByAttribute(null);
    setSkipUsed(false);
  }, []);

  const spinRoulette = useCallback(() => {
    if (spinning || remainingAttributes.length === 0) return;

    setSpinning(true);
    setCurrentSeason(null);
    setSelectedPlayer(null);

    const minYear = 1950;
    const validSeasons = allSeasons.filter(s => {
      const year = getSeasonStartYear(s);
      return year >= minYear && !usedSeasons.includes(s);
    });
    
    const fallbackSeasons = allSeasons.filter(s => getSeasonStartYear(s) >= minYear);
    const seasonPool = validSeasons.length > 0 ? validSeasons : fallbackSeasons;

    const intervalId = window.setInterval(() => {
      setRouletteSeason(seasonPool[Math.floor(Math.random() * seasonPool.length)]);
    }, 80);

    window.setTimeout(() => {
      window.clearInterval(intervalId);
      const chosenSeason = seasonPool[Math.floor(Math.random() * seasonPool.length)];
      setRouletteSeason(chosenSeason);
      setCurrentSeason(chosenSeason);
      setUsedSeasons(prev => [...prev, chosenSeason]);
      
      const playersInSeason = seasonPlayersMap[chosenSeason] || [];
      const playersWithStats = playersInSeason.map(p => ({
        ...p,
        metrics: estimatePlayerMetrics(p, chosenSeason),
      })).filter(p => p.metrics !== null);
      
      setAvailablePlayers(playersWithStats.sort((a, b) => 
        getLastName(a.fullName).localeCompare(getLastName(b.fullName))
      ));
      
      setSpinning(false);
      setPhase(PHASES.SELECTING_PLAYER);
    }, 1400);
  }, [spinning, remainingAttributes.length, usedSeasons]);

  const skipSeason = useCallback(() => {
    if (skipUsed || !currentSeason || spinning) return;
    
    // Remove current season from used list so it can be spun again later
    setUsedSeasons(prev => prev.filter(s => s !== currentSeason));
    setCurrentSeason(null);
    setRouletteSeason(null);
    setAvailablePlayers([]);
    setSortByAttribute(null);
    setSkipUsed(true);
    setPhase(PHASES.PLAYING);
  }, [skipUsed, currentSeason, spinning]);

  const selectPlayer = useCallback((player) => {
    setSelectedPlayer(player);
    setPhase(PHASES.SELECTING_ATTRIBUTE);
  }, []);

  const selectAttribute = useCallback((attrKey) => {
    if (!selectedPlayer || !currentSeason) return;

    setSelections(prev => ({
      ...prev,
      [attrKey]: {
        season: currentSeason,
        player: selectedPlayer.fullName,
        playerId: selectedPlayer.id,
        value: selectedPlayer.metrics[attrKey],
      },
    }));

    setSelectedPlayer(null);
    setSortByAttribute(null);
    // Note: skipUsed is NOT reset here - it's once per game, not per round
    
    const newRemaining = ATTRIBUTES.filter(a => a.key !== attrKey && selections[a.key] === null);
    if (newRemaining.length === 0) {
      setPhase(PHASES.COMPLETE);
    } else {
      setPhase(PHASES.PLAYING);
      setCurrentSeason(null);
      setRouletteSeason(null);
      setAvailablePlayers([]);
    }
  }, [selectedPlayer, currentSeason, selections]);

  const calculatePerfectionScore = useCallback(() => {
    let totalScore = 0;
    ATTRIBUTES.forEach(attr => {
      const current = currentPlayer[attr.key] || 0;
      const target = perfectPlayer[attr.key] || 1;
      const ratio = current / target;
      totalScore += ratio;
    });
    return Math.round((totalScore / ATTRIBUTES.length) * 100);
  }, [currentPlayer]);

  // Generate share image for Perfect Player mode
  const generatePerfectPlayerShareImage = useCallback((score, tier, isBlindMode) => {
    // FORCE 640x640 aspect ratio at 2x scale for Retina
    const width = 640;
    const height = 640;
    const scale = 2;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;   // 1280
    canvas.height = height * scale; // 1280
    const ctx = canvas.getContext('2d');

    // Scale the context to match
    ctx.scale(scale, scale);

    // Ensure the background completely fills the new square
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    // Accent bar at Y=0
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#ca8a04');
    grad.addColorStop(1, '#facc15');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, 4);

    // Helper for rounded rectangles
    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    };

    // 2. HEADER (Y: 30-90px) - CENTERED
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('🏀 PERFECT PLAYER', width / 2, 48);

    ctx.fillStyle = '#6b7280';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText('KENTUCKY WILDCATS ULTIMATE BUILD', width / 2, 70);

    // Blind Mode badge
    if (isBlindMode) {
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      const badgeText = 'STATS HIDDEN';
      const badgeW = ctx.measureText(badgeText).width + 20;
      const badgeX = (width - badgeW) / 2;
      ctx.fillStyle = 'rgba(124, 58, 237, 0.2)';
      roundRect(badgeX, 78, badgeW, 18, 9);
      ctx.fill();
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#c4b5fd';
      ctx.fillText(badgeText, width / 2, 90);
    }

    // 3. HERO SCORE CARD (Y: 110-230px)
    const tierStyles = {
      'Best Possible': { bg: 'rgba(239, 68, 68, 0.12)', glow: 'rgba(239, 68, 68, 0.4)', text: '#f87171', border: '#ef4444' },
      'GOAT': { bg: 'rgba(168, 85, 247, 0.12)', glow: 'rgba(168, 85, 247, 0.4)', text: '#c084fc', border: '#a855f7' },
      'All-Time Legend': { bg: 'rgba(249, 115, 22, 0.12)', glow: 'rgba(249, 115, 22, 0.4)', text: '#fb923c', border: '#f97316' },
      'Naismith Winner': { bg: 'rgba(234, 179, 8, 0.12)', glow: 'rgba(234, 179, 8, 0.4)', text: '#facc15', border: '#eab308' },
      '1st Team All-American': { bg: 'rgba(59, 130, 246, 0.12)', glow: 'rgba(59, 130, 246, 0.4)', text: '#93c5fd', border: '#3b82f6' },
      '2nd Team All-American': { bg: 'rgba(6, 182, 212, 0.12)', glow: 'rgba(6, 182, 212, 0.4)', text: '#67e8f9', border: '#06b6d4' },
      'All-SEC': { bg: 'rgba(34, 197, 94, 0.12)', glow: 'rgba(34, 197, 94, 0.4)', text: '#4ade80', border: '#22c55e' },
    };
    const ts = tierStyles[tier.name] ?? { bg: 'rgba(31,41,55,0.5)', glow: 'rgba(0,0,0,0)', text: '#9ca3af', border: '#374151' };

    // Hero card background
    const heroX = 40, heroY = 112, heroW = width - 80, heroH = 120;
    ctx.fillStyle = ts.bg;
    roundRect(heroX, heroY, heroW, heroH, 16);
    ctx.fill();
    ctx.strokeStyle = ts.border;
    ctx.lineWidth = 1.5;
    roundRect(heroX, heroY, heroW, heroH, 16);
    ctx.stroke();

    // Big score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${score}%`, width / 2, heroY + 60);

    // Tier badge pill (inside hero card)
    const tierLabel = tier.name.toUpperCase();
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    const pillW = ctx.measureText(tierLabel).width + 36;
    const pillX = (width - pillW) / 2;
    const pillY = heroY + 78;
    ctx.fillStyle = ts.border;
    roundRect(pillX, pillY, pillW, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tierLabel, width / 2, pillY + 20);

    // 4. PLAYER BUILD CARDS (Y: 255-455px)
    const statUnits = { scoring: 'PPG', rebounding: 'RPG', playmaking: 'APG', defense: 'S+B' };

    ctx.textAlign = 'left';
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('YOUR BUILD', 44, 262);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px system-ui, -apple-system, sans-serif';
    ctx.fillText('VS NAISMITH TARGET', width - 44, 262);

    const cardX = 40;
    const cardW = width - 80;
    const cardH = 54;
    const cardGap = 8;
    let cardY = 274;

    ATTRIBUTES.forEach((attr) => {
      const selection = selections[attr.key];
      if (!selection) return;

      const value = selection.value || 0;
      const unit = statUnits[attr.key] || '';
      const target = perfectPlayer[attr.key] || 1;
      const pctOfTarget = Math.round((value / target) * 100);

      // Card background
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      roundRect(cardX, cardY, cardW, cardH, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      roundRect(cardX, cardY, cardW, cardH, 12);
      ctx.stroke();

      const pad = 16;

      // Attribute label (top-left, small gray)
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(attr.shortLabel.toUpperCase(), cardX + pad, cardY + 19);

      // Player name (bottom-left, blue)
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      const playerName = selection.player.split(' ').pop();
      ctx.fillText(`${playerName} '${selection.season.split('-')[0].slice(-2)}`, cardX + pad, cardY + 40);

      // Stat value + unit (center, top line)
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
      const valText = formatStat(value);
      const valX = cardX + 195;
      ctx.fillText(valText, valX, cardY + 24);
      const valW = ctx.measureText(valText).width;
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.fillText(unit, valX + valW + 5, cardY + 24);

      // Target value (center, bottom line)
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillText(`target ${formatStat(target)}`, valX, cardY + 42);

      // Percentile vs target (right-aligned, color-coded)
      let pctColor = '#ef4444';
      if (pctOfTarget >= 130) pctColor = '#4ade80';
      else if (pctOfTarget >= 100) pctColor = '#facc15';
      else if (pctOfTarget >= 80) pctColor = '#60a5fa';
      ctx.textAlign = 'right';
      ctx.fillStyle = pctColor;
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${pctOfTarget}%`, cardX + cardW - pad, cardY + 28);
      // "of target" sublabel
      ctx.fillStyle = '#4b5563';
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      ctx.fillText('OF TARGET', cardX + cardW - pad, cardY + 42);

      cardY += cardH + cardGap;
    });

    // 5. TIER PROGRESSION (Y: 480-595px) - horizontal compact strip
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('TIER PROGRESSION', 44, cardY + 18);

    const tierDefs = [
      { name: 'All-SEC', short: 'SEC', threshold: 0, color: '#22c55e' },
      { name: '2nd Team All-American', short: '2ND TEAM', threshold: 90, color: '#06b6d4' },
      { name: '1st Team All-American', short: '1ST TEAM', threshold: 100, color: '#3b82f6' },
      { name: 'Naismith Winner', short: 'NAISMITH', threshold: 110, color: '#eab308' },
      { name: 'All-Time Legend', short: 'LEGEND', threshold: 130, color: '#f97316' },
      { name: 'GOAT', short: 'GOAT', threshold: 150, color: '#a855f7' },
      { name: 'Best Possible', short: 'BEST', threshold: 166, color: '#ef4444' },
    ];

    const stripY = cardY + 30;
    const stripX = 40;
    const stripW = width - 80;
    const segW = stripW / tierDefs.length;
    const segH = 48;

    tierDefs.forEach((t, i) => {
      const isCurrent = tier.name === t.name;
      const isSurpassed = score >= t.threshold && !isCurrent;
      const segX = stripX + i * segW;

      // Segment background
      if (isCurrent) {
        ctx.fillStyle = t.color;
        roundRect(segX + 2, stripY, segW - 4, segH, 8);
        ctx.fill();
      } else if (isSurpassed) {
        ctx.fillStyle = 'rgba(34,197,94,0.15)';
        roundRect(segX + 2, stripY, segW - 4, segH, 8);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        roundRect(segX + 2, stripY, segW - 4, segH, 8);
        ctx.fill();
      }

      // Tier short name
      ctx.textAlign = 'center';
      ctx.fillStyle = isCurrent ? '#ffffff' : isSurpassed ? t.color : '#4b5563';
      ctx.font = isCurrent ? 'bold 10px system-ui, -apple-system, sans-serif' : '9px system-ui, -apple-system, sans-serif';
      ctx.fillText(t.short, segX + segW / 2, stripY + 20);

      // Status icon / threshold
      if (isCurrent) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${score}%`, segX + segW / 2, stripY + 38);
      } else if (isSurpassed) {
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        ctx.fillText('✓', segX + segW / 2, stripY + 38);
      } else {
        ctx.fillStyle = '#374151';
        ctx.font = '9px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${t.threshold}%`, segX + segW / 2, stripY + 38);
      }
    });

    // 6. FOOTER
    ctx.fillStyle = '#4b5563';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('bigblueroulette.com', width / 2, 622);

    return canvas;
  }, [selections]);

  // Handle sharing the image
  const handleShareImage = useCallback(() => {
    const score = calculatePerfectionScore();
    const tier = getTierFromScore(score);
    const canvas = generatePerfectPlayerShareImage(score, tier, gameMode === 'hidden');
    
    canvas.toBlob((blob) => {
      if (!blob) { setImageStatus('Could not generate image.'); return; }
      
      // Try to use native share if available
      const shareData = {
        files: [new File([blob], 'perfect-player.png', { type: 'image/png' })],
        title: 'Perfect Player Mode',
        text: `I built a ${score}% Perfect Player in Kentucky Wildcats mode! ${tier.name} @BigBlueRoulette`,
      };
      
      if (navigator.canShare && navigator.canShare(shareData)) {
        navigator.share(shareData).catch(() => {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'perfect-player.png';
          a.click();
          URL.revokeObjectURL(url);
          setImageStatus('Image downloaded!');
        });
      } else {
        // Download fallback
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'perfect-player.png';
        a.click();
        URL.revokeObjectURL(url);
        setImageStatus('Image downloaded!');
      }
      
      setTimeout(() => setImageStatus(''), 2500);
    });
  }, [calculatePerfectionScore, gameMode, generatePerfectPlayerShareImage]);

  if (phase === PHASES.INTRO) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 text-center animate-fadeIn">
        <button
          onClick={onBack}
          className="self-start inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to menu
        </button>

        <div>
          <div className="inline-flex items-center gap-2 bg-yellow-600/20 border border-yellow-500/30 text-yellow-300 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
            <Trophy className="w-3.5 h-3.5" /> Perfect Player Mode
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Build The <span className="text-yellow-400">Perfect</span> Player
          </h1>
          <p className="mt-3 text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
            Spin for Kentucky seasons, pick players from the roster, 
            and steal their best stats to build the ultimate Wildcat.
          </p>
        </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left flex flex-col gap-3">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">How It Works</div>
          <div className="text-sm text-gray-300">1. Spin the year roulette (Kentucky seasons).</div>
          <div className="text-sm text-gray-300">2. Pick any player from that season's roster.</div>
          <div className="text-sm text-gray-300">3. Steal ONE stat from that player.</div>
          <div className="text-sm text-gray-300">4. Build from 4 different players to create perfection!</div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => startGame('visible')}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-yellow-600 hover:bg-yellow-500 active:scale-95 text-white font-bold rounded-xl transition-all duration-150 shadow-lg shadow-yellow-600/30"
          >
            <Eye className="w-4 h-4" />
            Play with Stats Visible
          </button>
          <button
            onClick={() => startGame('hidden')}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-white/5 hover:bg-white/10 border border-white/15 active:scale-95 text-white font-bold rounded-xl transition-all duration-150"
          >
            <EyeOff className="w-4 h-4" />
            Play Blind (Hidden Stats) <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">The Algorithm</div>
          <p className="text-sm text-gray-300 leading-relaxed">
            Your final score is calculated by comparing your build against the 
            <span className="text-yellow-400 font-medium"> statistical averages of all Naismith Award winners </span>
            from 1969 to 2026. 
          </p>
          <p className="text-sm text-gray-400 mt-2">
            The targets are hidden - draft strategically to build the ultimate Kentucky player!
          </p>
        </div>
      </div>
    );
  }

  if (phase === PHASES.COMPLETE) {
    const perfectionScore = calculatePerfectionScore();
    
    const tier = getTierFromScore(perfectionScore);
    
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 animate-fadeIn">
        <button
          onClick={() => setPhase(PHASES.PLAYING)}
          className="self-start inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-600/20 border border-green-500/30 text-green-300 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
            <Trophy className="w-3.5 h-3.5" /> Complete!
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Your Kentucky Perfect Player
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            Target Score: <span className="text-yellow-400 font-bold">{perfectionScore}%</span>
          </p>
        </div>

        {/* Achievement Tier */}
        <div className={`w-full ${tier.bg} border-2 ${tier.border} rounded-2xl p-6 text-center`}>
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Achievement Unlocked</div>
          <div className={`text-4xl font-black ${tier.color} tracking-tight`}>
            {tier.name}
          </div>
          <div className="text-sm text-gray-400 mt-2">
            {perfectionScore >= 166 ? 'The absolute perfect Kentucky draft - perfection achieved!' :
             perfectionScore >= 150 ? 'The greatest Kentucky build of all time!' :
             perfectionScore >= 130 ? 'Legendary status - transcendent player!' :
             perfectionScore >= 110 ? 'National Player of the Year caliber!' :
             perfectionScore >= 100 ? 'Elite college basketball talent!' :
             perfectionScore >= 90 ? 'Outstanding all-around player!' :
             'Keep practicing your draft skills!'}
          </div>
        </div>

        {/* Tier Ladder */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">Tier Progression</div>
          <div className="space-y-1.5">
            {TIERS.slice(0, -1).map((t) => {
              const isAchieved = perfectionScore >= t.threshold;
              const isCurrent = tier.name === t.name;
              return (
                <div 
                  key={t.name}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    isCurrent ? `${t.bg} ${t.border} border-2` : 
                    isAchieved ? `${t.bg} ${t.border} border opacity-60` : 
                    'bg-white/5 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${t.color}`}>{t.name}</span>
                    {isCurrent && <span className="text-[10px] text-white bg-white/20 px-1.5 py-0.5 rounded">YOU ARE HERE</span>}
                    {isAchieved && !isCurrent && <span className="text-[10px] text-green-400">✓</span>}
                  </div>
                  <span className="text-xs text-gray-400">{t.desc}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <span className="text-sm text-gray-400">Your Score: </span>
            <span className="text-xl font-bold text-yellow-400">{perfectionScore}%</span>
          </div>
        </div>

        <div className="w-full bg-gradient-to-br from-blue-600/20 to-yellow-500/20 border-2 border-blue-500/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white">Kentucky Build</h2>
            <Users className="w-5 h-5 text-blue-400" />
          </div>

          <div className="space-y-3">
            {ATTRIBUTES.map(attr => {
              const selection = selections[attr.key];
              const perfect = perfectPlayer[attr.key];
              const percentage = selection?.value ? (selection.value / perfect) * 100 : 0;
              
              return (
                <div key={attr.key} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-gray-400 font-medium">{attr.shortLabel}</div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          percentage >= 95 ? 'bg-green-400' : 
                          percentage >= 80 ? 'bg-blue-400' : 
                          percentage >= 60 ? 'bg-yellow-400' : 'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-bold text-white">
                      {formatStat(selection?.value, attr.key)}
                    </span>
                  </div>
                  <div className="w-8 text-xs text-gray-500">
                    {selection?.season?.split('-')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          {showComparison ? 'Hide Results' : 'See How You Did'}
        </button>

        {showComparison && (
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Your Build vs The Algorithm</div>
            <div className="space-y-2">
              {ATTRIBUTES.map(attr => {
                const selection = selections[attr.key];
                const yourValue = selection?.value || 0;
                const perfectValue = perfectPlayer[attr.key];
                const diff = yourValue - perfectValue;
                
                return (
                  <div key={attr.key} className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-gray-300">{attr.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-blue-400" title={selection?.player}>
                        {selection?.player?.split(' ').pop()} ({selection?.season?.split('-')[0]})
                      </span>
                      <span className="text-sm text-white font-medium">{formatStat(yourValue, attr.key)}</span>
                      <span className="text-xs text-gray-500">vs</span>
                      <span className="text-sm text-yellow-400 font-medium">{formatStat(perfectValue, attr.key)}</span>
                      <span className={`text-xs font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {diff >= 0 ? '+' : ''}{formatStat(diff, attr.key)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleShareImage}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold rounded-xl transition-all duration-150"
          >
            <Download className="w-4 h-4" />
            Share Graphic
          </button>
          <button
            onClick={resetGame}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl transition-all duration-150"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          {imageStatus && (
            <div className="text-center text-xs text-green-300">{imageStatus}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4 animate-fadeIn">
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => setPhase(PHASES.INTRO)}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Menu
        </button>
        <div className="text-xs text-gray-400">
          {filledAttributes.length}/{ATTRIBUTES.length} Attributes
        </div>
      </div>

      {gameMode === 'visible' && (
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-yellow-500 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      )}

      <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Your Player So Far</h3>
          {gameMode === 'visible' && (
            <span className="text-xs text-yellow-400 font-medium">{completionPercentage}% Complete</span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ATTRIBUTES.map(attr => {
            const selection = selections[attr.key];
            const isFilled = selection !== null;
            return (
              <div key={attr.key} className={`text-center p-2 rounded-lg ${isFilled ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5'}`}>
                <div className="text-[10px] text-gray-500 uppercase">{attr.shortLabel}</div>
                <div className={`text-sm font-bold ${isFilled ? 'text-white' : 'text-gray-600'}`}>
                  {gameMode === 'visible' ? formatStat(selection?.value) : (isFilled ? '?' : '-')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {phase === PHASES.PLAYING && (
        <div className="w-full flex flex-col items-center gap-4 py-4">
          <div className="w-full bg-gradient-to-b from-white/10 to-white/5 border-2 border-white/20 rounded-2xl p-8 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Kentucky Season Roulette</div>
            <div className={`text-4xl font-black text-white transition-all ${spinning ? 'animate-pulse' : ''}`}>
              {rouletteSeason || (spinning ? '' : '---')}
            </div>
          </div>

          <button
            onClick={spinRoulette}
            disabled={spinning || remainingAttributes.length === 0}
            className="flex items-center justify-center gap-2 w-full max-w-xs py-4 px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed active:scale-95 text-white font-bold rounded-xl transition-all duration-150 shadow-lg shadow-blue-600/30"
          >
            <Sparkles className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
            {spinning ? 'Spinning...' : 'SPIN FOR SEASON'}
          </button>

          {remainingAttributes.length === 0 && (
            <div className="text-sm text-green-400 font-medium">
              All attributes filled! View your perfect player.
            </div>
          )}
        </div>
      )}

      {phase === PHASES.SELECTING_PLAYER && currentSeason && (
        <div className="w-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-5 animate-fadeIn">
          <div className="text-center mb-4">
            <div className="text-xs text-blue-400 uppercase tracking-widest mb-1">{currentSeason}</div>
            <h3 className="text-lg font-bold text-white">Select a Player</h3>
            <p className="text-sm text-gray-400">
              {availablePlayers.length} players with stats available
            </p>
          </div>

          {/* Skip Season Button */}
          {!skipUsed && (
            <button
              onClick={skipSeason}
              className="w-full mb-4 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-sm font-medium rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>↻</span> Skip This Season (Once Per Game)
            </button>
          )}

          {gameMode === 'visible' && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 uppercase mb-2">Sort by Attribute</div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSortByAttribute(null)}
                  className={`px-2 py-1 text-xs font-medium rounded-lg transition-all ${
                    sortByAttribute === null 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  Name
                </button>
                {ATTRIBUTES.filter(a => selections[a.key] === null).map(attr => (
                  <button
                    key={attr.key}
                    onClick={() => setSortByAttribute(attr.key)}
                    className={`px-2 py-1 text-xs font-medium rounded-lg transition-all ${
                      sortByAttribute === attr.key 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    {attr.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-2">
            {availablePlayers
              .sort((a, b) => {
                if (!sortByAttribute) {
                  return getLastName(a.fullName).localeCompare(getLastName(b.fullName));
                }
                const aVal = a.metrics?.[sortByAttribute] || 0;
                const bVal = b.metrics?.[sortByAttribute] || 0;
                return bVal - aVal;
              })
              .map(player => (
                <button
                  key={player.id}
                  onClick={() => selectPlayer(player)}
                  className="w-full p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-left transition-all active:scale-95"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{player.fullName}</div>
                      <div className="text-xs text-gray-400">{player.primaryPosition} {player.jerseyNumber && `• #${player.jerseyNumber}`}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  {gameMode === 'visible' && player.metrics && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ATTRIBUTES.filter(a => selections[a.key] === null).slice(0, 4).map(attr => (
                        <span key={attr.key} className={`text-[10px] px-2 py-1 rounded-full ${
                          sortByAttribute === attr.key ? 'bg-yellow-500/30 text-yellow-200' : 'bg-white/10 text-gray-300'
                        }`}>
                          {attr.shortLabel}: {formatStat(player.metrics[attr.key])}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}

      {phase === PHASES.SELECTING_ATTRIBUTE && selectedPlayer && (
        <div className="w-full bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/30 rounded-2xl p-5 animate-fadeIn">
          <div className="text-center mb-4">
            <div className="text-xs text-yellow-400 uppercase tracking-widest mb-1">{currentSeason}</div>
            <h3 className="text-xl font-black text-white">{selectedPlayer.fullName}</h3>
            <p className="text-sm text-gray-400">{selectedPlayer.primaryPosition}</p>
          </div>

          <div className="text-sm text-gray-300 text-center mb-4">
            Select <span className="text-yellow-400 font-bold">ONE</span> stat to steal:
          </div>

          {/* Back to player list */}
          <button
            onClick={() => {
              setSelectedPlayer(null);
              setPhase(PHASES.SELECTING_PLAYER);
            }}
            className="w-full mb-3 py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-gray-300 text-sm font-medium rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Pick Different Player
          </button>

          <div className="grid grid-cols-2 gap-2">
            {ATTRIBUTES.map(attr => {
              const isFilled = selections[attr.key] !== null;
              const value = selectedPlayer.metrics?.[attr.key];
              const perfect = perfectPlayer[attr.key];
              
              if (gameMode === 'hidden' && !isFilled) {
                return (
                  <button
                    key={attr.key}
                    onClick={() => selectAttribute(attr.key)}
                    disabled={isFilled}
                    className={`p-3 rounded-xl text-left transition-all ${
                      isFilled 
                        ? 'bg-gray-800/50 border border-gray-700 cursor-not-allowed' 
                        : 'bg-white/10 hover:bg-white/20 border border-white/20 active:scale-95'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-400">Hidden</span>
                    </div>
                    <div className="text-sm font-bold text-white mt-1">{attr.shortLabel}</div>
                  </button>
                );
              }

              return (
                <button
                  key={attr.key}
                  onClick={() => !isFilled && selectAttribute(attr.key)}
                  disabled={isFilled}
                  className={`p-3 rounded-xl text-left transition-all ${
                    isFilled 
                      ? 'bg-white/5 border border-white/10 cursor-not-allowed' 
                      : 'bg-white/10 hover:bg-white/20 border border-white/20 active:scale-95'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{attr.shortLabel}</span>
                    {isFilled && gameMode === 'visible' && <span className="text-xs text-green-400">✓</span>}
                  </div>
                  {gameMode === 'visible' ? (
                    <div className={`text-lg font-bold ${getStatColor(value, perfect)}`}>
                      {formatStat(value, attr.key)}
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-gray-500">
                      {isFilled ? '?' : 'Select'}
                    </div>
                  )}
                  {gameMode === 'visible' && !isFilled && perfect > 0 && (
                    <div className="w-full bg-white/10 rounded-full h-1 mt-2">
                      <div 
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${Math.min(100, (value / perfect) * 100)}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {gameMode === 'hidden' && (
            <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-xs text-gray-400 text-center">
                Pick based on the player's reputation.
              </p>
            </div>
          )}
        </div>
      )}

      {usedSeasons.length > 0 && (
        <div className="w-full">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Used Seasons</div>
          <div className="flex flex-wrap gap-1">
            {usedSeasons.map((season) => (
              <span 
                key={season} 
                className="text-[10px] px-2 py-1 bg-white/5 text-gray-400 rounded-full"
              >
                {season}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
