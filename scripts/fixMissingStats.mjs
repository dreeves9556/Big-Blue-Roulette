import fs from 'fs/promises';
import { players } from '../src/data/players.js';
import { playerSeasonStatsById } from '../src/data/playerSeasonStats.js';

const PLAYER_PAGE_BASE = 'http://www.bigbluehistory.net/bb/statistics/Players';

// Find missing players
const missingPlayers = players.filter(p => {
  const stats = playerSeasonStatsById[p.id];
  return !stats || Object.keys(stats).length === 0;
});

console.log(`Found ${missingPlayers.length} missing players to fix`);

const roundToTenths = (value) => Math.round(value * 10) / 10;

const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
};

// More robust parser that handles malformed HTML and different table formats
const parseSeasonStats = (html, playerName) => {
  const seasons = {};
  
  // Find all season rows - look for season links like "../stat1982-83.html"
  const seasonMatches = [...html.matchAll(/<A HREF="\.\.\/stat(\d{4}-\d{2})\.html">[^<]*<\/A>/g)];
  
  for (const match of seasonMatches) {
    const season = match[1];
    
    // Find the row containing this season link
    const rowStartIdx = match.index;
    const rowEndMatch = html.slice(rowStartIdx).match(/<\/TR>|<TR><TD><A HREF="\.\.\/stat/);
    const rowEndIdx = rowEndMatch ? rowStartIdx + rowEndMatch.index : rowStartIdx + 500;
    const rowHtml = html.slice(rowStartIdx, rowEndIdx);
    
    // Extract all <TD> values from this row
    const tdMatches = [...rowHtml.matchAll(/<TD>([^<]*)<\/TD>/g)];
    const values = tdMatches.map(m => {
      const num = parseFloat(m[1]);
      return isNaN(num) ? 0 : num;
    });
    
    // Detect table format based on number of columns
    // Old format (pre-1980s): 12 columns - no steals, blocks, or turnovers
    // New format (1980s+): 15 columns - includes steals, blocks, turnovers
    
    if (values.length >= 12 && values[0] > 0) {
      const games = values[0];
      const totalRebounds = values[8] || 0;
      const totalAssists = values[9] || 0;
      
      // Calculate points from FG and FT (FG*2 + FT is more reliable than the total points column)
      // values[2] = FG made, values[5] = FT made
      const totalPoints = (values[2] * 2) + values[5];
      
      let totalSteals = 0;
      let totalBlocks = 0;
      
      if (values.length >= 15) {
        // New format with steals/blocks/TO
        // TD[10] = Steals, TD[11] = Blocks, TD[12] = Fouls, TD[13] = TO, TD[14] = Points
        totalSteals = values[10] || 0;
        totalBlocks = values[11] || 0;
      } else {
        // Old format without steals/blocks
        // TD[10] = Fouls, TD[11] = Total Points
        totalSteals = 0;
        totalBlocks = 0;
      }
      
      seasons[season] = {
        pts: roundToTenths(totalPoints / games),
        reb: roundToTenths(totalRebounds / games),
        ast: roundToTenths(totalAssists / games),
        stl: roundToTenths(totalSteals / games),
        blk: roundToTenths(totalBlocks / games),
        games: Math.round(games)
      };
      
      console.log(`  ${season}: ${seasons[season].pts} PPG, ${seasons[season].reb} RPG (${games} games, ${values.length} cols)`);
    }
  }
  
  return seasons;
};

const main = async () => {
  const newStats = { ...playerSeasonStatsById };
  const resolved = [];
  const stillMissing = [];
  
  for (let i = 0; i < missingPlayers.length; i++) {
    const player = missingPlayers[i];
    const urlName = player.id.split('_').map(s => 
      s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    ).join('_');
    const url = `${PLAYER_PAGE_BASE}/${urlName}.html`;
    
    console.log(`\n[${i + 1}/${missingPlayers.length}] ${player.fullName}`);
    console.log(`  URL: ${url}`);
    
    try {
      const html = await fetchText(url);
      
      if (!html) {
        console.log(`  -> 404 Not Found`);
        stillMissing.push(player);
        continue;
      }
      
      const stats = parseSeasonStats(html, player.fullName);
      const seasonCount = Object.keys(stats).length;
      
      if (seasonCount > 0) {
        console.log(`  -> SUCCESS: ${seasonCount} seasons`);
        newStats[player.id] = stats;
        resolved.push({ id: player.id, name: player.fullName, seasons: seasonCount });
      } else {
        console.log(`  -> No seasons found`);
        stillMissing.push(player);
      }
    } catch (e) {
      console.log(`  -> Error: ${e.message}`);
      stillMissing.push(player);
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Write updated stats
  const outputPath = new URL('../src/data/playerSeasonStats.js', import.meta.url);
  const outputContent = `export const playerSeasonStatsById = ${JSON.stringify(newStats, null, 2)};\n`;
  await fs.writeFile(outputPath, outputContent, 'utf8');
  
  console.log(`\n\n=== COMPLETE ===`);
  console.log(`Resolved: ${resolved.length}`);
  console.log(`Still missing: ${stillMissing.length}`);
  console.log(`Coverage: ${208 + resolved.length}/301 (${(((208 + resolved.length) / 301) * 100).toFixed(1)}%)`);
  
  if (resolved.length > 0) {
    console.log(`\nResolved players:`);
    resolved.forEach(r => console.log(`  - ${r.name}: ${r.seasons} seasons`));
  }
};

main().catch(e => {
  console.error(e);
  process.exit(1);
});
