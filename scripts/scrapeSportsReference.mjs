import fs from 'fs/promises';
import { players } from '../src/data/players.js';
import { playerSeasonStatsById } from '../src/data/playerSeasonStats.js';

// Find missing players
const missingPlayers = players.filter(p => {
  const stats = playerSeasonStatsById[p.id];
  return !stats || Object.keys(stats).length === 0;
});

console.log(`Found ${missingPlayers.length} missing players to scrape from Sports-Reference`);

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Convert name to Sports-Reference slug format
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[\.']/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Try multiple URL patterns for a player
function buildSrUrls(player) {
  const baseName = toSlug(player.fullName);
  const urls = [];
  
  // Pattern: firstname-lastname-1
  for (let i = 1; i <= 3; i++) {
    urls.push(`https://www.sports-reference.com/cbb/players/${baseName}-${i}.html`);
  }
  
  // Handle initials like C.M. Newton
  const nameParts = player.fullName.split(/\s+/);
  if (nameParts[0].includes('.')) {
    const initial = nameParts[0].replace(/\./g, '');
    const rest = nameParts.slice(1).join('-').toLowerCase().replace(/[\.']/g, '');
    urls.push(`https://www.sports-reference.com/cbb/players/${initial}-${rest}-1.html`);
  }
  
  // Handle compound names
  if (player.fullName.includes('Dan ')) {
    const danVariant = baseName.replace('jimmy-dan-', 'jimmy-dan-');
    urls.push(`https://www.sports-reference.com/cbb/players/${danVariant}-1.html`);
  }
  
  return urls;
}

const fetchText = async (url) => {
  const response = await fetch(url, { 
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
};

const roundToTenths = (value) => Math.round(value * 10) / 10;

const parseSeasonStats = (html) => {
  const seasons = {};
  
  // Find the per game stats table
  const tableMatch = html.match(/<table[^>]*id="players_per_game"[^>]*>([\s\S]*?)<\/table>/);
  if (!tableMatch) return seasons;
  
  const tableHtml = tableMatch[1];
  
  // Extract rows
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const rows = [...tableHtml.matchAll(rowRegex)];
  
  for (const rowMatch of rows) {
    const row = rowMatch[1];
    
    // Skip header rows
    if (row.includes('<th') || row.includes('class="thead"')) continue;
    
    // Extract season year
    const seasonMatch = row.match(/data-stat="season"[^>]*>(\d{4}-\d{2})<\/a>/);
    if (!seasonMatch) continue;
    
    const season = seasonMatch[1];
    
    // Extract stats
    const gMatch = row.match(/data-stat="g"[^>]*>(\d+(?:\.\d+)?)<\/td>/);
    const ptsMatch = row.match(/data-stat="pts_per_g"[^>]*>([\d.]+)<\/td>/);
    const trbMatch = row.match(/data-stat="trb_per_g"[^>]*>([\d.]+)<\/td>/);
    const astMatch = row.match(/data-stat="ast_per_g"[^>]*>([\d.]+)<\/td>/);
    const stlMatch = row.match(/data-stat="stl_per_g"[^>]*>([\d.]+)<\/td>/);
    const blkMatch = row.match(/data-stat="blk_per_g"[^>]*>([\d.]+)<\/td>/);
    
    if (gMatch && ptsMatch) {
      const games = parseFloat(gMatch[1]);
      if (games > 0) {
        seasons[season] = {
          pts: roundToTenths(parseFloat(ptsMatch[1]) || 0),
          reb: roundToTenths(parseFloat(trbMatch?.[1] || 0)),
          ast: roundToTenths(parseFloat(astMatch?.[1] || 0)),
          stl: roundToTenths(parseFloat(stlMatch?.[1] || 0)),
          blk: roundToTenths(parseFloat(blkMatch?.[1] || 0)),
          games: Math.round(games)
        };
      }
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
    console.log(`\n[${i + 1}/${missingPlayers.length}] ${player.fullName} (${player.id})`);
    
    const urls = buildSrUrls(player);
    let found = false;
    
    for (const url of urls) {
      try {
        console.log(`  Trying: ${url}`);
        const html = await fetchText(url);
        
        if (!html) {
          console.log(`  -> 404`);
          continue;
        }
        
        // Verify it's a Kentucky player
        if (!html.includes('Kentucky') && !html.includes('Wildcats')) {
          console.log(`  -> Not Kentucky player`);
          continue;
        }
        
        const stats = parseSeasonStats(html);
        const seasonCount = Object.keys(stats).length;
        
        if (seasonCount > 0) {
          console.log(`  -> SUCCESS: ${seasonCount} seasons`);
          newStats[player.id] = stats;
          resolved.push({ id: player.id, name: player.fullName, seasons: seasonCount, url });
          found = true;
          break;
        } else {
          console.log(`  -> No seasons found`);
        }
      } catch (e) {
        console.log(`  -> Error: ${e.message}`);
      }
    }
    
    if (!found) {
      stillMissing.push(player);
    }
    
    // Rate limiting - be nice to the server
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Write updated stats
  const outputPath = new URL('../src/data/playerSeasonStats.js', import.meta.url);
  const outputContent = `export const playerSeasonStatsById = ${JSON.stringify(newStats, null, 2)};\n`;
  await fs.writeFile(outputPath, outputContent, 'utf8');
  
  // Write report
  const reportPath = new URL('../SPORTS_REFERENCE_SCRAPE_REPORT.md', import.meta.url);
  const report = `# Sports-Reference Scrape Report

## Results
- **Resolved:** ${resolved.length} players
- **Still missing:** ${stillMissing.length} players
- **Previous coverage:** 208/301 (69.1%)
- **New coverage:** ${208 + resolved.length}/301 (${(((208 + resolved.length) / 301) * 100).toFixed(1)}%)

## Resolved Players
${resolved.map(r => `- ${r.name}: ${r.seasons} seasons (${r.url})`).join('\n')}

## Still Missing
${stillMissing.map(p => `- ${p.fullName} (${p.id})`).join('\n')}
`;
  await fs.writeFile(reportPath, report, 'utf8');
  
  console.log(`\n\n=== COMPLETE ===`);
  console.log(`Resolved: ${resolved.length}`);
  console.log(`Still missing: ${stillMissing.length}`);
  console.log(`Coverage now: ${208 + resolved.length}/301 players`);
};

main().catch(e => {
  console.error(e);
  process.exit(1);
});
