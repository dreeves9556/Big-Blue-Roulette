import { footballAllSeasons, footballSeasonPlayersMap } from '../src/data/footballPlayers.js';

console.log('Total seasons:', footballAllSeasons.length);
console.log('Seasons with < 5 players:');
for (const season of footballAllSeasons) {
  const players = footballSeasonPlayersMap[season];
  if (players.length < 5) {
    console.log(`  ${season}: ${players.length} players`);
  }
}

console.log('---');
console.log('Seasons with no QBs:');
for (const season of footballAllSeasons) {
  const players = footballSeasonPlayersMap[season];
  const qbs = players.filter(p => p.primaryPosition === 'QB');
  if (qbs.length === 0) console.log(`  ${season}`);
}

console.log('---');
console.log('Seasons with no RBs:');
for (const season of footballAllSeasons) {
  const players = footballSeasonPlayersMap[season];
  const rbs = players.filter(p => p.primaryPosition === 'RB');
  if (rbs.length === 0) console.log(`  ${season}`);
}

console.log('---');
console.log('Seasons with no WRs:');
for (const season of footballAllSeasons) {
  const players = footballSeasonPlayersMap[season];
  const wrs = players.filter(p => p.primaryPosition === 'WR');
  if (wrs.length === 0) console.log(`  ${season}`);
}

console.log('---');
console.log('Seasons with no TEs:');
for (const season of footballAllSeasons) {
  const players = footballSeasonPlayersMap[season];
  const tes = players.filter(p => p.primaryPosition === 'TE');
  if (tes.length === 0) console.log(`  ${season}`);
}

console.log('---');
console.log('Sample of season sizes:');
for (const season of footballAllSeasons.slice(0, 5)) {
  const players = footballSeasonPlayersMap[season];
  console.log(`  ${season}: ${players.length} players`);
}
for (const season of footballAllSeasons.slice(-5)) {
  const players = footballSeasonPlayersMap[season];
  console.log(`  ${season}: ${players.length} players`);
}
