import fs from 'fs';
import vm from 'vm';

function evalJsExport(filePath, varName) {
  const text = fs.readFileSync(filePath, 'utf8');
  const ctx = {};
  vm.createContext(ctx);
  const script = text.replace(/export const /g, 'const ') + `\n;__result__ = ${varName};`;
  vm.runInContext(script, ctx, { timeout: 5000 });
  return ctx.__result__;
}

const playerSeasonStatsById = evalJsExport('./src/data/playerSeasonStats.js', 'playerSeasonStatsById');
const players = evalJsExport('./src/data/players.js', 'players');

const playerNames = {};
for (const p of players) {
  playerNames[p.id] = p.fullName;
}

const updatedStats = JSON.parse(JSON.stringify(playerSeasonStatsById));

const filled = [];
const stillZero = [];
const noStatsAtAll = [];

for (const [playerId, seasons] of Object.entries(updatedStats)) {
  // Calculate career average APG from all seasons with non-zero assists
  let totalAst = 0;
  let totalGames = 0;
  let nonZeroSeasons = 0;
  const pre1983ZeroSeasons = [];

  for (const [season, stats] of Object.entries(seasons)) {
    const games = stats.games || 0;
    const ast = stats.ast ?? 0;

    if (games > 0 && ast > 0) {
      totalAst += ast * games;
      totalGames += games;
      nonZeroSeasons++;
    }

    const year = parseInt(season.split('-')[0]);
    if (year < 1983 && ast === 0 && games > 0) {
      pre1983ZeroSeasons.push(season);
    }
  }

  if (pre1983ZeroSeasons.length === 0) continue;

  const careerAvgApg = totalGames > 0 ? Math.round((totalAst / totalGames) * 10) / 10 : 0;

  if (careerAvgApg > 0) {
    // Fill pre-1983 zero seasons with career average
    for (const season of pre1983ZeroSeasons) {
      const oldAst = seasons[season].ast;
      seasons[season].ast = careerAvgApg;
      filled.push({
        id: playerId,
        name: playerNames[playerId] || playerId,
        season,
        oldAst,
        newAst: careerAvgApg,
        basedOn: `${nonZeroSeasons} seasons, ${totalGames} games, ${Math.round(totalAst * 10) / 10} total asts`
      });
    }
  } else {
    // Player has no non-zero assist seasons at all
    for (const season of pre1983ZeroSeasons) {
      stillZero.push({
        id: playerId,
        name: playerNames[playerId] || playerId,
        season,
        ppg: seasons[season].pts,
        games: seasons[season].games
      });
    }
  }
}

// Check for players with NO stats at all in the dataset
for (const p of players) {
  if (!updatedStats[p.id]) {
    const pre1983Seasons = (p.seasons || []).filter(s => parseInt(s.split('-')[0]) < 1983);
    if (pre1983Seasons.length > 0) {
      noStatsAtAll.push({ id: p.id, name: p.fullName, seasons: pre1983Seasons });
    }
  }
}

console.log(`\n=== FILLED with career average (${filled.length} season entries) ===\n`);
for (const f of filled.sort((a, b) => a.season.localeCompare(b.season))) {
  console.log(`${f.season} | ${f.name} | ${f.oldAst} -> ${f.newAst} APG (based on ${f.basedOn})`);
}

console.log(`\n=== STILL ZERO after career avg (${stillZero.length} season entries) ===\n`);
for (const z of stillZero.sort((a, b) => a.season.localeCompare(b.season))) {
  console.log(`${z.season} | ${z.name} | ${z.ppg} PPG, ${z.games} games`);
}

console.log(`\n=== NO STATS AT ALL in dataset (${noStatsAtAll.length} players) ===\n`);
for (const n of noStatsAtAll) {
  console.log(`${n.name} (${n.id}) | seasons: ${n.seasons.join(', ')}`);
}

// Write updated stats
const outputPath = './src/data/playerSeasonStats.js';
const outputContent = `export const playerSeasonStatsById = ${JSON.stringify(updatedStats, null, 2)};\n`;
fs.writeFileSync(outputPath, outputContent, 'utf8');

console.log(`\nWrote updated stats to ${outputPath}`);
console.log(`Filled: ${filled.length}, Still zero: ${stillZero.length}, No stats: ${noStatsAtAll.length}`);
