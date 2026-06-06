import fs from 'fs';

const players = fs.readFileSync('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/players.js', 'utf8');

const checks = [
  {n:'Reggie Hanson', expected:['1990-91']},
  {n:'Richie Farmer', expected:['1990-91','1991-92']},
  {n:'Rodney Dent', expected:['1992-93']},
  {n:'Chris Harrison', expected:['1991-92','1992-93']},
  {n:'Jared Prickett', expected:['1992-93']},
  {n:'Gimel Martinez', expected:['1990-91','1991-92']},
  {n:'Dale Brown', expected:['1991-92','1992-93']},
  {n:'John Pelphrey', expected:['1990-91','1991-92']},
  {n:'Deron Feldhaus', expected:['1990-91','1991-92']},
  {n:'Sean Woods', expected:['1990-91','1991-92']},
  {n:'Jamal Mashburn', expected:['1990-91','1991-92','1992-93']},
  {n:'Jeff Brassow', expected:['1990-91','1991-92','1992-93']},
  {n:'Travis Ford', expected:['1990-91','1991-92','1992-93']},
  {n:'Tony Delk', expected:['1992-93']},
  {n:'Rodrick Rhodes', expected:['1992-93']},
  {n:'Andre Riddick', expected:['1991-92','1992-93']},
];

for (const {n, expected} of checks) {
  const idx = players.indexOf(`"fullName": "${n}"`);
  if (idx === -1) { console.log('MISSING PLAYER: ' + n); continue; }
  const start = players.lastIndexOf('{', idx);
  const end = players.indexOf('},', idx) + 2;
  const obj = players.substring(start, end);
  const idMatch = obj.match(/"id": "([^"]+)"/);
  const id = idMatch ? idMatch[1] : 'unknown';
  const seasonsMatch = obj.match(/"seasons":\s*\[([^\]]*)\]/);
  const seasons = seasonsMatch ? seasonsMatch[1].match(/"[^"]+"/g) || [] : [];
  const seasonStrs = seasons.map(s => s.replace(/"/g, ''));
  const missing = expected.filter(e => !seasonStrs.includes(e));
  if (missing.length > 0) {
    console.log('NEEDS SEASONS: ' + id + ' (' + n + ') missing: ' + missing.join(', '));
  } else {
    console.log('OK: ' + id + ' (' + n + ')');
  }
}

console.log('\n--- Checking playerSeasonStats ---');
const stats = fs.readFileSync('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/playerSeasonStats.js', 'utf8');
for (const {n, expected} of checks) {
  const idx = players.indexOf(`"fullName": "${n}"`);
  if (idx === -1) { console.log('MISSING STAT KEY: ' + n); continue; }
  const start = players.lastIndexOf('{', idx);
  const end = players.indexOf('},', idx) + 2;
  const obj = players.substring(start, end);
  const idMatch = obj.match(/"id": "([^"]+)"/);
  const id = idMatch ? idMatch[1] : 'unknown';
  const inStats = stats.includes(`"${id}":`);
  if (!inStats) {
    console.log('MISSING STATS: ' + id + ' (' + n + ')');
  }
}
