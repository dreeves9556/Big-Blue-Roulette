import fs from 'fs/promises';
import { playerSeasonStatsById } from '../src/data/playerSeasonStats.js';

// The 65 players we just collected that need to be re-scraped with correct column mapping
const playersToFix = [
  'brassow_jeff', 'woods_sean', 'pelphrey_john', 'feldhaus_deron', 'farmer_richie',
  'chapman_rex', 'davender_ed', 'hanson_reggie', 'blackmon_james', 'walker_kenny',
  'harden_roger', 'madison_richard', 'turpin_melvin', 'master_jim', 'bowie_sam',
  'beal_dicky', 'shidler_jay', 'cowan_fred', 'hurt_charles', 'macy_kyle',
  'hord_derrick', 'minniefield_dirk', 'anderson_dwight', 'verderber_chuck',
  'heitz_tom', 'williams_lavon', 'gettelfinger_chris', 'lanter_bo', 'givens_jack',
  'robey_rick', 'casey_dwane', 'grevey_kevin', 'issel_dan', 'pratt_mike',
  'steele_larry', 'parker_tom', 'mills_terry', 'hollenbeck_kent', 'key_stan',
  'payne_tom', 'riley_pat', 'dampier_louie', 'kron_tommy', 'conley_larry',
  'jaracz_thad', 'embry_randy', 'nash_cotton', 'hatton_vernon', 'crigler_john',
  'beck_ed', 'cox_johnny', 'mills_don', 'cohen_sid', 'lickert_bill',
  'parsons_dick', 'jennings_ned', 'pursiful_larry', 'burchett_carroll',
  'feldhaus_allen', 'coffman_bennie', 'hagan_cliff', 'ramsey_frank',
  'tsioropoulos_lou', 'linville_shelby', 'watson_bobby'
];

const PLAYER_PAGE_BASE = 'http://www.bigbluehistory.com/bb/statistics/Players';
const roundToTenths = (value) => Math.round(value * 10) / 10;

const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
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
  const newStats = { ...playerSeasonStatsById };
  let fixed = 0;
  
  for (let i = 0; i < playersToFix.length; i++) {
    const id = playersToFix[i];
    const urlName = id.split('_').map(s => 
      s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    ).join('_');
    const url = `${PLAYER_PAGE_BASE}/${urlName}.html`;
    
    console.log(`[${i + 1}/${playersToFix.length}] Re-scraping ${id}`);
    
    try {
      const html = await fetchText(url);
      if (!html) {
        console.log(`  -> 404`);
        continue;
      }
      
      const stats = parseSeasonStats(html);
      if (Object.keys(stats).length > 0) {
        newStats[id] = stats;
        fixed++;
        console.log(`  -> Fixed ${Object.keys(stats).length} seasons`);
      }
    } catch (e) {
      console.log(`  -> Error: ${e.message}`);
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Write updated stats
  const outputPath = new URL('../src/data/playerSeasonStats.js', import.meta.url);
  const outputContent = `export const playerSeasonStatsById = ${JSON.stringify(newStats, null, 2)};\n`;
  await fs.writeFile(outputPath, outputContent, 'utf8');
  
  console.log(`\n=== FIXED ${fixed} PLAYERS ===`);
};

main().catch(console.error);
