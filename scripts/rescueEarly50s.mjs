import fs from 'fs/promises';
import { playerSeasonStatsById } from '../src/data/playerSeasonStats.js';

// Players with missing stats in the early 1950s era
const TARGETS = [
  { id: 'bird_jerry', name: 'Jerry Bird', seasons: ['1953-54', '1954-55', '1955-56'] },
  { id: 'burrow_bob', name: 'Bob Burrow', seasons: ['1954-55', '1955-56'] },
  { id: 'evans_billy', name: 'Billy Evans', seasons: ['1951-52', '1953-54', '1954-55'] },
  { id: 'cohen_sid', name: 'Sid Cohen', seasons: ['1957-58', '1960-61'] },
  { id: 'tsioropoulos_lou', name: 'Lou Tsioropoulos', seasons: ['1952-53'] },
];

const PLAYER_PAGE_BASE = 'http://www.bigbluehistory.com/bb/statistics/Players';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const roundToTenths = (value) => Math.round(value * 10) / 10;

const fetchText = async (url) => {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
  } catch (e) {
    return null;
  }
};

// --- Big Blue History parser ---
const parseBBHStats = (html) => {
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
        games: Math.round(games),
      };
    }
  }
  return seasons;
};

// --- Sports-Reference parser ---
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[\.'/]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildSrUrls(name) {
  const baseName = toSlug(name);
  const urls = [];
  for (let i = 1; i <= 3; i++) {
    urls.push(`https://www.sports-reference.com/cbb/players/${baseName}-${i}.html`);
  }
  // Handle initials like C.M. Newton
  const nameParts = name.split(/\s+/);
  if (nameParts[0].includes('.')) {
    const initial = nameParts[0].replace(/\./g, '');
    const rest = nameParts.slice(1).join('-').toLowerCase().replace(/[\.'/]/g, '');
    urls.push(`https://www.sports-reference.com/cbb/players/${initial}-${rest}-1.html`);
  }
  return urls;
}

const parseSRStats = (html) => {
  const seasons = {};
  const tableMatch = html.match(/<table[^>]*id="players_per_game"[^>]*>([\s\S]*?)<\/table>/);
  if (!tableMatch) return seasons;

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const rows = [...tableMatch[1].matchAll(rowRegex)];

  for (const rowMatch of rows) {
    const row = rowMatch[1];
    if (row.includes('<th') || row.includes('class="thead"')) continue;

    const seasonMatch = row.match(/data-stat="season"[^>]*>(\d{4}-\d{2})<\/a>/);
    if (!seasonMatch) continue;

    const season = seasonMatch[1];
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
          games: Math.round(games),
        };
      }
    }
  }
  return seasons;
};

// --- Main ---
const main = async () => {
  const results = {};
  const reports = [];

  for (const target of TARGETS) {
    console.log(`\n=== ${target.name} (${target.id}) ===`);
    console.log(`  Missing seasons: ${target.seasons.join(', ')}`);

    let foundStats = null;
    let source = null;

    // Try Big Blue History first
    const bbhName = target.id.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join('_');
    const bbhUrl = `${PLAYER_PAGE_BASE}/${bbhName}.html`;
    console.log(`  Trying BBH: ${bbhUrl}`);
    const bbhHtml = await fetchText(bbhUrl);
    if (bbhHtml) {
      const bbhStats = parseBBHStats(bbhHtml);
      if (Object.keys(bbhStats).length > 0) {
        // Verify it's the right player
        if (bbhHtml.toLowerCase().includes(target.name.toLowerCase().split(' ')[0]) ||
            bbhHtml.toLowerCase().includes(target.name.toLowerCase().split(' ')[1])) {
          foundStats = bbhStats;
          source = 'Big Blue History';
          console.log(`  -> BBH SUCCESS: ${Object.keys(bbhStats).length} seasons`);
        } else {
          console.log(`  -> BBH found stats but page doesn't match player name`);
        }
      } else {
        console.log(`  -> BBH: No seasons found`);
      }
    } else {
      console.log(`  -> BBH: 404`);
    }

    // Try Sports-Reference
    if (!foundStats) {
      const srUrls = buildSrUrls(target.name);
      for (const url of srUrls) {
        console.log(`  Trying SR: ${url}`);
        const srHtml = await fetchText(url);
        if (srHtml) {
          if (!srHtml.includes('Kentucky') && !srHtml.includes('Wildcats')) {
            console.log(`  -> SR: Not a Kentucky player`);
            continue;
          }
          const srStats = parseSRStats(srHtml);
          if (Object.keys(srStats).length > 0) {
            foundStats = srStats;
            source = 'Sports-Reference';
            console.log(`  -> SR SUCCESS: ${Object.keys(srStats).length} seasons`);
            break;
          } else {
            console.log(`  -> SR: No seasons found`);
          }
        } else {
          console.log(`  -> SR: 404`);
        }
        await new Promise(r => setTimeout(r, 1500)); // Rate limit
      }
    }

    if (foundStats) {
      results[target.id] = foundStats;
      reports.push({
        id: target.id,
        name: target.name,
        source,
        seasons: Object.keys(foundStats),
      });
    } else {
      reports.push({
        id: target.id,
        name: target.name,
        source: null,
        seasons: [],
      });
      console.log(`  -> FAILED: No stats found on either source`);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  // Write results
  const outputPath = new URL('../src/data/playerSeasonStats.rescue.json', import.meta.url);
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2), 'utf8');

  const reportPath = new URL('../RESCUE_EARLY50s_REPORT.md', import.meta.url);
  const report = `# Early 1950s Stats Rescue Report

## Results

| Player | Source | Seasons Found |
|--------|--------|---------------|
${reports.map(r => `| ${r.name} | ${r.source || 'NOT FOUND'} | ${r.seasons.join(', ') || 'None'} |`).join('\n')}

## Data
\`\`\`json
${JSON.stringify(results, null, 2)}
\`\`\`
`;
  await fs.writeFile(reportPath, report, 'utf8');

  console.log('\n\n=== RESCUE COMPLETE ===');
  const found = reports.filter(r => r.source);
  console.log(`Found stats for: ${found.length}/${TARGETS.length} players`);
  for (const r of found) {
    console.log(`  - ${r.name}: ${r.seasons.join(', ')} (${r.source})`);
  }
};

main().catch(e => {
  console.error(e);
  process.exit(1);
});
