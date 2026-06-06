import fs from 'fs/promises';
import { playerSeasonStatsById } from '../src/data/playerSeasonStats.js';

const PLAYER_PAGE_BASE = 'http://www.bigbluehistory.net/bb/statistics/Players';

const TARGETS = [
  { id: 'bird_jerry', name: 'Jerry Bird' },
  { id: 'burrow_bob', name: 'Bob Burrow' },
  { id: 'evans_billy', name: 'Billy Evans' },
  { id: 'cohen_sid', name: 'Sid Cohen' },
  { id: 'tsioropoulos_lou', name: 'Lou Tsioropoulos' },
];

const roundToTenths = (value) => Math.round(value * 10) / 10;

const fetchText = async (url) => {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    return res.text();
  } catch { return null; }
};

// Parse BBH table, handling malformed HTML
const parseBBHTable = (html) => {
  const tableMatch = html.match(/<TABLE BORDER>([\s\S]*?)<\/TABLE>/);
  if (!tableMatch) return null;

  const tableHtml = tableMatch[1];
  const seasonRegex = /<A HREF="\.\.\/stat(\d{4}-\d{2})\.html">[^<]*<\/A>/g;
  const seasonMatches = [...tableHtml.matchAll(seasonRegex)];
  // Find total row by locating <B>Total</B> first
  const totalIdx = tableHtml.indexOf('<B>Total</B>');
  const totalMatch = totalIdx >= 0 ? tableHtml.slice(totalIdx - 20).match(/<TR>[\s\S]*?<\/TR>/) : null;

  let totals = null;
  if (totalMatch) {
    const totalTds = [...totalMatch[0].matchAll(/<TD>(?:<I>)?([^<]+)(?:<\/I>)?<\/TD>/g)]
      .map(m => parseFloat(m[1].trim().replace(/,/g, '')))
      .filter(n => !isNaN(n));
    totals = totalTds;
  }

  const seasons = {};
  for (let i = 0; i < seasonMatches.length; i++) {
    const match = seasonMatches[i];
    const season = match[1];
    const startIdx = match.index;
    const endIdx = i + 1 < seasonMatches.length ? seasonMatches[i + 1].index : (totalIdx >= 0 ? totalIdx : tableHtml.length);
    const rowHtml = tableHtml.slice(startIdx, endIdx);
    const tds = [...rowHtml.matchAll(/<TD>([^<]*)<\/TD>/g)].map(m => m[1].trim()).filter(v => v !== '' && v !== '-');
    seasons[season] = { tds };
  }

  return { seasons, totals };
};

// Column mapping for BBH tables (columns after season link)
// Format A: Games, FG, FGA, %, FT, FTA, %, Reb, F, Points  (10 cols)
// Format B: Games, FG, FGA, %, FT, FTA, %, Reb, Asst, F, Points  (11 cols)
const computeStats = (tds, season) => {
  const numTds = tds.length;
  const nums = tds.map(v => parseFloat(v)).filter(n => !isNaN(n));
  if (nums.length < 6) return null; // Need at least games, FG, FGA, FT, FTA

  const games = nums[0];
  const fg = nums[1];
  const fga = nums[2];
  const ft = nums[4];
  const fta = nums[5];

  // Points from FG and FT (more reliable than total points column)
  const totalPoints = (fg * 2) + ft;

  // Determine format
  let rebIdx = 7;
  let astIdx = -1;
  let fIdx = 8;
  let ptsIdx = 9;

  if (numTds >= 11) {
    // Format B with assists
    astIdx = 8;
    fIdx = 9;
    ptsIdx = 10;
  }

  // If we have enough values, use them directly
  let totalRebounds = nums[rebIdx] || 0;
  let totalAssists = astIdx >= 0 && nums[astIdx] ? nums[astIdx] : 0;
  let totalFouls = nums[fIdx] || 0;

  // If points column exists and differs from computed, use computed
  if (ptsIdx < numTds && nums[ptsIdx]) {
    // verify
    const ptsFromCol = nums[ptsIdx];
    if (Math.abs(ptsFromCol - totalPoints) > 1) {
      console.log(`    Warning: computed pts (${totalPoints}) differs from column (${ptsFromCol})`);
    }
  }

  return {
    pts: roundToTenths(totalPoints / games),
    reb: roundToTenths(totalRebounds / games),
    ast: roundToTenths(totalAssists / games),
    stl: 0,
    blk: 0,
    games: Math.round(games),
  };
};

const main = async () => {
  const newStats = { ...playerSeasonStatsById };
  const results = [];

  for (const target of TARGETS) {
    console.log(`\n=== ${target.name} (${target.id}) ===`);
    const url = `${PLAYER_PAGE_BASE}/${target.id.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('_')}.html`;
    const html = await fetchText(url);
    if (!html) {
      console.log('  Page not found');
      continue;
    }

    const parsed = parseBBHTable(html);
    if (!parsed) {
      console.log('  No table found');
      continue;
    }

    const playerStats = {};
    let completeSeasons = 0;
    let partialSeasons = 0;

    for (const [season, data] of Object.entries(parsed.seasons)) {
      console.log(`  ${season}: ${data.tds.length} TD values [${data.tds.join(' | ')}]`);
      const stats = computeStats(data.tds, season);
      if (stats) {
        playerStats[season] = stats;
        completeSeasons++;
        console.log(`    -> OK: ${stats.pts} PPG, ${stats.reb} RPG, ${stats.ast} APG`);
      } else {
        partialSeasons++;
        console.log(`    -> PARTIAL: only ${data.tds.length} values`);
      }
    }

    // Try to backfill partial seasons from totals
    if (parsed.totals && partialSeasons > 0) {
      console.log(`  Total row: [${parsed.totals.join(' | ')}]`);
      // TODO: backfill logic
    }

    if (Object.keys(playerStats).length > 0) {
      newStats[target.id] = { ...newStats[target.id], ...playerStats };
      results.push({ id: target.id, name: target.name, seasons: Object.keys(playerStats) });
    }
  }

  // Write updated stats
  const outputPath = new URL('../src/data/playerSeasonStats.js', import.meta.url);
  const outputContent = `export const playerSeasonStatsById = ${JSON.stringify(newStats, null, 2)};\n`;
  await fs.writeFile(outputPath, outputContent, 'utf8');

  console.log('\n=== RESCUE COMPLETE ===');
  console.log(`Updated ${results.length} players`);
  for (const r of results) {
    console.log(`  - ${r.name}: ${r.seasons.join(', ')}`);
  }
};

main().catch(e => {
  console.error(e);
  process.exit(1);
});
