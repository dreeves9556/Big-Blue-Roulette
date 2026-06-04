import { players } from './src/data/players.js';
import { HOMETOWN_DATA } from './src/data/hometownData.js';
import { getPlayerEras } from './src/data/coaches.js';

// Focus on Pitino, Tubby, and Gillispie eras
const targetEras = ['pitino', 'tubby', 'gillispie'];
const playersInTargetEras = players.filter(player => {
  const eras = getPlayerEras(player);
  return eras.some(era => targetEras.includes(era));
});

console.log('Total players in Pitino, Tubby, and Gillispie eras:', playersInTargetEras.length);

const playersWithHometowns = playersInTargetEras.filter(player => 
  HOMETOWN_DATA[player.id]
);

console.log('Players with hometown data:', playersWithHometowns.length);
console.log('Players missing hometown data:', playersInTargetEras.length - playersWithHometowns.length);

// Show some examples of missing players
const missingPlayers = playersInTargetEras.filter(player => 
  !HOMETOWN_DATA[player.id]
).slice(0, 20);

console.log('\nFirst 20 players missing hometown data:');
missingPlayers.forEach(player => {
  console.log(`- ${player.fullName} (${player.id}) - Seasons: ${player.seasons.join(', ')}`);
});

// Break down by era
console.log('\n=== Breakdown by Era ===');
targetEras.forEach(era => {
  const eraPlayers = players.filter(player => {
    const playerEras = getPlayerEras(player);
    return playerEras.includes(era);
  });
  
  const eraWithHometowns = eraPlayers.filter(player => HOMETOWN_DATA[player.id]);
  
  console.log(`${era.toUpperCase()} Era:`);
  console.log(`  Total players: ${eraPlayers.length}`);
  console.log(`  With hometowns: ${eraWithHometowns.length}`);
  console.log(`  Missing hometowns: ${eraPlayers.length - eraWithHometowns.length}`);
  
  if (eraPlayers.length - eraWithHometowns.length > 0) {
    console.log('  Missing examples:');
    eraPlayers.filter(player => !HOMETOWN_DATA[player.id])
      .slice(0, 5)
      .forEach(player => {
        console.log(`    - ${player.fullName} (${player.seasons.join(', ')})`);
      });
  }
  console.log('');
});

// Export missing players list for scraping
import fs from 'fs/promises';
await fs.writeFile('./missing_ptg_players.json', JSON.stringify(missingPlayers, null, 2));
console.log('Missing players list saved to missing_ptg_players.json');
