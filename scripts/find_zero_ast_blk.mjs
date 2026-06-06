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

const assistCutoff = 1983; // assists tracked from 1983-84
const blockCutoff = 1985;  // blocks tracked from 1985-86

const zeroAssists = [];
const zeroBlocks = [];

for (const [playerId, seasons] of Object.entries(playerSeasonStatsById)) {
  for (const [season, stats] of Object.entries(seasons)) {
    const year = parseInt(season.split('-')[0]);
    const ppg = stats.pts || 0;
    const ast = stats.ast ?? 0;
    const blk = stats.blk ?? 0;
    const games = stats.games || 0;

    if (ppg > 5) {
      // Before assists tracking began
      if (year < assistCutoff && ast === 0 && games > 0) {
        zeroAssists.push({
          name: playerNames[playerId] || playerId,
          id: playerId,
          season,
          ppg: stats.pts,
          reb: stats.reb,
          ast: stats.ast,
          stl: stats.stl,
          blk: stats.blk,
          games
        });
      }

      // Before blocks tracking began
      if (year < blockCutoff && blk === 0 && games > 0) {
        zeroBlocks.push({
          name: playerNames[playerId] || playerId,
          id: playerId,
          season,
          ppg: stats.pts,
          reb: stats.reb,
          ast: stats.ast,
          stl: stats.stl,
          blk: stats.blk,
          games
        });
      }
    }
  }
}

// Sort by season then by PPG desc
zeroAssists.sort((a, b) => a.season.localeCompare(b.season) || b.ppg - a.ppg);
zeroBlocks.sort((a, b) => a.season.localeCompare(b.season) || b.ppg - a.ppg);

console.log(`\n=== Players with >5 PPG and 0 assists before ${assistCutoff}-${assistCutoff+1} (${zeroAssists.length} season entries) ===\n`);
for (const p of zeroAssists) {
  console.log(`${p.season} | ${p.name} (${p.id}) | ${p.ppg} PPG, ${p.reb} RPG, ast=${p.ast}, stl=${p.stl}, blk=${p.blk} | ${p.games} games`);
}

console.log(`\n=== Players with >5 PPG and 0 blocks before ${blockCutoff}-${blockCutoff+1} (${zeroBlocks.length} season entries) ===\n`);
for (const p of zeroBlocks) {
  console.log(`${p.season} | ${p.name} (${p.id}) | ${p.ppg} PPG, ${p.reb} RPG, ast=${p.ast}, stl=${p.stl}, blk=${p.blk} | ${p.games} games`);
}

// Also check if there are any pre-cutoff seasons with NON-ZERO assists/blocks (to see if some data exists)
const nonZeroAssistsPre = [];
const nonZeroBlocksPre = [];

for (const [playerId, seasons] of Object.entries(playerSeasonStatsById)) {
  for (const [season, stats] of Object.entries(seasons)) {
    const year = parseInt(season.split('-')[0]);
    const ppg = stats.pts || 0;
    const ast = stats.ast ?? 0;
    const blk = stats.blk ?? 0;
    const games = stats.games || 0;

    if (ppg > 5) {
      if (year < assistCutoff && ast > 0 && games > 0) {
        nonZeroAssistsPre.push({ name: playerNames[playerId] || playerId, season, ast, ppg });
      }
      if (year < blockCutoff && blk > 0 && games > 0) {
        nonZeroBlocksPre.push({ name: playerNames[playerId] || playerId, season, blk, ppg });
      }
    }
  }
}

console.log(`\n=== Pre-${assistCutoff} seasons with >5 PPG and NON-ZERO assists: ${nonZeroAssistsPre.length} ===`);
if (nonZeroAssistsPre.length > 0) {
  nonZeroAssistsPre.sort((a, b) => a.season.localeCompare(b.season));
  for (const p of nonZeroAssistsPre.slice(0, 20)) {
    console.log(`  ${p.season} | ${p.name} | ${p.ppg} PPG, ${p.ast} APG`);
  }
  if (nonZeroAssistsPre.length > 20) console.log(`  ... and ${nonZeroAssistsPre.length - 20} more`);
}

console.log(`\n=== Pre-${blockCutoff} seasons with >5 PPG and NON-ZERO blocks: ${nonZeroBlocksPre.length} ===`);
if (nonZeroBlocksPre.length > 0) {
  nonZeroBlocksPre.sort((a, b) => a.season.localeCompare(b.season));
  for (const p of nonZeroBlocksPre.slice(0, 20)) {
    console.log(`  ${p.season} | ${p.name} | ${p.ppg} PPG, ${p.blk} BPG`);
  }
  if (nonZeroBlocksPre.length > 20) console.log(`  ... and ${nonZeroBlocksPre.length - 20} more`);
}
