import { players } from '../src/data/players.js';
import { playerSeasonStatsById } from '../src/data/playerSeasonStats.js';

// Find all players from 1950-1960 and their missing seasons
const earlyPlayers = players.filter(p => {
  return p.seasons.some(s => {
    const year = parseInt(s.split('-')[0]);
    return year >= 1950 && year < 1960;
  });
});

const completelyMissing = [];
const partiallyMissing = [];
const complete = [];

for (const player of earlyPlayers) {
  const stats = playerSeasonStatsById[player.id];
  const hasAnyStats = stats && Object.keys(stats).length > 0;

  if (!hasAnyStats) {
    completelyMissing.push({
      id: player.id,
      name: player.fullName,
      seasons: player.seasons.filter(s => {
        const year = parseInt(s.split('-')[0]);
        return year >= 1950;
      })
    });
    continue;
  }

  const missingSeasons = player.seasons.filter(s => {
    const year = parseInt(s.split('-')[0]);
    if (year < 1950) return false;
    return !stats[s];
  });

  if (missingSeasons.length > 0) {
    partiallyMissing.push({
      id: player.id,
      name: player.fullName,
      missingSeasons,
      hasSeasons: Object.keys(stats).filter(s => s.startsWith('19') || s.startsWith('20'))
    });
  } else {
    complete.push({
      id: player.id,
      name: player.fullName,
      seasons: Object.keys(stats).filter(s => s.startsWith('19') || s.startsWith('20'))
    });
  }
}

console.log('=== EARLY 1950s STATS ANALYSIS ===\n');

console.log(`Total players with 1950s seasons: ${earlyPlayers.length}`);
console.log(`Complete: ${complete.length}`);
console.log(`Partially missing: ${partiallyMissing.length}`);
console.log(`Completely missing: ${completelyMissing.length}\n`);

console.log('--- COMPLETELY MISSING PLAYERS ---');
for (const p of completelyMissing) {
  console.log(`  ${p.name} (${p.id}): ${p.seasons.join(', ')}`);
}

console.log('\n--- PARTIALLY MISSING PLAYERS ---');
for (const p of partiallyMissing) {
  console.log(`  ${p.name} (${p.id})`);
  console.log(`    Has: ${p.hasSeasons.join(', ')}`);
  console.log(`    Missing: ${p.missingSeasons.join(', ')}`);
}

console.log('\n--- COMPLETE PLAYERS ---');
for (const p of complete) {
  console.log(`  ${p.name}: ${p.seasons.join(', ')}`);
}
