import * as players from '/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/players.js';
import * as stats from '/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/playerSeasonStats.js';

const expected = {
  'brown_dale': ['1991-92', '1992-93'],
  'braddy_junior': ['1990-91', '1991-92', '1992-93'],
  'bearup_todd': ['1990-91'],
  'toomer_carlos': ['1990-91', '1991-92'],
  'thompson_jody': ['1990-91'],
  'davis_johnathon': ['1990-91'],
  'thomas_henry': ['1990-91'],
  'timberlake_aminu': ['1991-92', '1992-93'],
  'svoboda_todd': ['1992-93'],
  'hanson_reggie': ['1987-88', '1988-89', '1989-90', '1990-91'],
  'dent_rodney': ['1992-93', '1993-94'],
  'harrison_chris': ['1991-92', '1992-93', '1993-94', '1994-95'],
  'prickett_jared': ['1992-93', '1993-94', '1994-95', '1995-96', '1996-97'],
  'martinez_gimel': ['1990-91', '1991-92', '1992-93', '1993-94'],
  'riddick_andre': ['1991-92', '1992-93', '1993-94', '1994-95'],
};

console.log('=== Verification ===');
let errors = 0;

for (const [id, expectedSeasons] of Object.entries(expected)) {
  const player = players.players.find(p => p.id === id);
  if (!player) {
    console.log(`FAIL: ${id} not found in players.js`);
    errors++;
    continue;
  }
  
  for (const season of expectedSeasons) {
    if (!player.seasons.includes(season)) {
      console.log(`FAIL: ${id} missing season ${season} in players.js`);
      errors++;
    }
  }
  
  const playerStats = stats.playerSeasonStatsById[id];
  if (!playerStats) {
    console.log(`FAIL: ${id} not found in playerSeasonStats.js`);
    errors++;
    continue;
  }
  
  for (const season of expectedSeasons) {
    if (!playerStats[season]) {
      console.log(`FAIL: ${id} missing stats for ${season}`);
      errors++;
    } else {
      const s = playerStats[season];
      if (typeof s.pts !== 'number' || typeof s.reb !== 'number' || typeof s.ast !== 'number' ||
          typeof s.stl !== 'number' || typeof s.blk !== 'number' || typeof s.games !== 'number') {
        console.log(`FAIL: ${id} ${season} has invalid stat types`);
        errors++;
      }
    }
  }
}

if (errors === 0) {
  console.log('All checks passed!');
} else {
  console.log(`\n${errors} error(s) found.`);
}
