import fs from 'fs/promises';
import { players } from '../src/data/players.js';
import { playerSeasonStatsById } from '../src/data/playerSeasonStats.js';

// The 13 missing All-SEC players to scrape
const missingAllSEC = [
  { id: 'evans_billy', fullName: 'Billy Evans', position: 'G' },
  { id: 'burrow_bob', fullName: 'Bob Burrow', position: 'C' },
  { id: 'bird_jerry', fullName: 'Jerry Bird', position: 'F' },
  { id: 'deeken_ted', fullName: 'Ted Deeken', position: 'G' },
  { id: 'casey_mike', fullName: 'Mike Casey', position: 'G' },
  { id: 'andrews_jim', fullName: 'Jim Andrews', position: 'C' },
  { id: 'lyons_ronnie', fullName: 'Ronnie Lyons', position: 'G' },
  { id: 'phillips_mike', fullName: 'Mike Phillips', position: 'C' },
  { id: 'johnson_larry', fullName: 'Larry Johnson', position: 'F' },
  { id: 'lee_james', fullName: 'James Lee', position: 'F' },
  { id: 'ellis_leron', fullName: 'Leron Ellis', position: 'F' },
  { id: 'mills_chris', fullName: 'Chris Mills', position: 'F' },
  { id: 'miller_derrick', fullName: 'Derrick Miller', position: 'G' }
];

const PLAYER_PAGE_BASE = 'http://www.bigbluehistory.net/bb/statistics/Players';
const roundToTenths = (value) => Math.round(value * 10) / 10;

const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
};

const parsePlayerInfo = (html, id) => {
  // Extract jersey number from the page
  const jerseyMatch = html.match(/Jersey Number[^\d]*(\d+)/i);
  const jerseyNumber = jerseyMatch ? jerseyMatch[1] : null;
  
  // Extract height
  const heightMatch = html.match(/(\d+)-(\d+)/);
  let height = null;
  if (heightMatch) {
    const feet = parseInt(heightMatch[1]);
    const inches = parseInt(heightMatch[2]);
    height = (feet * 12) + inches;
  }
  
  // Extract seasons played from roster table or season stats
  const seasonMatches = [...html.matchAll(/<A HREF="\.\.\/stat(\d{4}-\d{2})\.html">[^<]*<\/A>/g)];
  const seasons = [...new Set(seasonMatches.map(m => m[1]))].sort();
  
  return { jerseyNumber, height, seasons };
};

const parseSeasonStats = (html) => {
  const seasons = {};
  const seasonMatches = [...html.matchAll(/<A HREF="\.\.\/stat(\d{4}-\d{2})\.html">[^<]*<\/A>/g)];
  
  for (const match of seasonMatches) {
    const season = match[1];
    const rowStartIdx = match.index;
    const rowEndMatch = html.slice(rowStartIdx).match(/<\/TR>|<TR><TD><A HREF="\.\.\/stat/);
    const rowEndIdx = rowEndMatch ? rowStartIdx + rowEndMatch.index : rowStartIdx + 500;
    const rowHtml = html.slice(rowStartIdx, rowEndIdx);
    
    const tdMatches = [...rowHtml.matchAll(/<TD>([^<]*)<\/TD>/g)];
    const values = tdMatches.map(m => {
      const num = parseFloat(m[1]);
      return isNaN(num) ? 0 : num;
    });
    
    if (values.length >= 12 && values[0] > 0) {
      const games = values[0];
      const totalRebounds = values[8] || 0;
      const totalAssists = values[9] || 0;
      const totalPoints = (values[2] * 2) + values[5];
      
      let totalSteals = 0;
      let totalBlocks = 0;
      
      if (values.length >= 15) {
        totalSteals = values[10] || 0;
        totalBlocks = values[11] || 0;
      }
      
      seasons[season] = {
        pts: roundToTenths(totalPoints / games),
        reb: roundToTenths(totalRebounds / games),
        ast: roundToTenths(totalAssists / games),
        stl: roundToTenths(totalSteals / games),
        blk: roundToTenths(totalBlocks / games),
        games: Math.round(games)
      };
    }
  }
  
  return seasons;
};

const main = async () => {
  const newPlayers = [...players];
  const newStats = { ...playerSeasonStatsById };
  const scraped = [];
  const failed = [];
  
  for (let i = 0; i < missingAllSEC.length; i++) {
    const player = missingAllSEC[i];
    const urlName = player.id.split('_').map(s => 
      s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    ).join('_');
    const url = `${PLAYER_PAGE_BASE}/${urlName}.html`;
    
    console.log(`[${i + 1}/${missingAllSEC.length}] Scraping ${player.id}...`);
    
    try {
      const html = await fetchText(url);
      if (!html) {
        console.log(`  -> 404 Not Found`);
        failed.push({ ...player, reason: '404' });
        continue;
      }
      
      const info = parsePlayerInfo(html, player.id);
      const stats = parseSeasonStats(html);
      
      if (info.seasons.length === 0) {
        console.log(`  -> No seasons found`);
        failed.push({ ...player, reason: 'no seasons' });
        continue;
      }
      
      // Create player entry
      const playerEntry = {
        id: player.id,
        fullName: player.fullName,
        seasons: info.seasons,
        primaryPosition: player.position
      };
      
      if (info.height) playerEntry.height = info.height;
      if (info.jerseyNumber) playerEntry.jerseyNumber = info.jerseyNumber;
      
      // Add to players array
      newPlayers.push(playerEntry);
      
      // Add stats
      if (Object.keys(stats).length > 0) {
        newStats[player.id] = stats;
      }
      
      scraped.push({
        ...player,
        seasons: info.seasons,
        statsCount: Object.keys(stats).length
      });
      
      console.log(`  -> SUCCESS: ${info.seasons.length} seasons, ${Object.keys(stats).length} stat seasons`);
      
    } catch (e) {
      console.log(`  -> Error: ${e.message}`);
      failed.push({ ...player, reason: e.message });
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Sort players by ID for consistency
  newPlayers.sort((a, b) => a.id.localeCompare(b.id));
  
  // Write updated players.js
  const playersOutput = `// Kentucky Wildcats Basketball Player Dataset
// Source: bigbluehistory.net/bb/statistics/
// Every player from every roster page scraped from the site.
// Positions: PG, SG, SF, PF, C

export const players = ${JSON.stringify(newPlayers, null, 2)};
`;
  await fs.writeFile(new URL('../src/data/players.js', import.meta.url), playersOutput, 'utf8');
  
  // Write updated playerSeasonStats.js
  const statsOutput = `export const playerSeasonStatsById = ${JSON.stringify(newStats, null, 2)};
`;
  await fs.writeFile(new URL('../src/data/playerSeasonStats.js', import.meta.url), statsOutput, 'utf8');
  
  // Write report
  const report = `# Missing All-SEC Players Scrape Report

## Results
- **Scraped:** ${scraped.length} players
- **Failed:** ${failed.length} players

## Successfully Added
${scraped.map(p => `- ${p.fullName} (${p.id}): ${p.seasons.length} seasons played, ${p.statsCount} seasons with stats`).join('\n')}

## Failed to Scrape
${failed.map(p => `- ${p.fullName} (${p.id}): ${p.reason}`).join('\n')}
`;
  await fs.writeFile(new URL('../MISSING_ALLSEC_SCRAPE_REPORT.md', import.meta.url), report, 'utf8');
  
  console.log(`\n=== COMPLETE ===`);
  console.log(`Scraped: ${scraped.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Total players now: ${newPlayers.length}`);
};

main().catch(console.error);
