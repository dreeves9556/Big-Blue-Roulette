import { players } from './src/data/players.js';
import { playerSeasonStatsById } from './src/data/playerSeasonStats.js';
import { COACHING_ERAS } from './src/data/coaches.js';

const gillispie = COACHING_ERAS.find(e => e.id === 'gillispie');
console.log('Gillispie Era:', gillispie.startYear, '-', gillispie.endYear);

function playerBelongsToEra(player, era) {
  return player.seasons.some(s => {
    const year = parseInt(s.split('-')[0]);
    return year >= era.startYear && year < era.endYear;
  });
}

function getPlayerCareerStats(playerId) {
  const stats = playerSeasonStatsById[playerId];
  if (!stats) return null;
  let totalPts = 0, totalGames = 0;
  Object.values(stats).forEach(s => {
    totalPts += (s.pts || 0) * (s.games || 0);
    totalGames += s.games || 0;
  });
  if (totalGames === 0) return null;
  return { ppg: totalPts / totalGames };
}

const gillispiePlayers = players.filter(p => {
  if (!playerBelongsToEra(p, gillispie)) return false;
  const stats = getPlayerCareerStats(p.id);
  return stats && stats.ppg > 5;
});

console.log('\nTotal players with >5 PPG:', gillispiePlayers.length);
console.log('\nPlayers:');
gillispiePlayers.forEach(p => {
  const stats = getPlayerCareerStats(p.id);
  console.log(`  - ${p.fullName} (${stats.ppg.toFixed(1)} PPG)`);
});
