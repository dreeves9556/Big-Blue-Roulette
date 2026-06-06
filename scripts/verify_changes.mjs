import fs from 'fs';

const data = fs.readFileSync('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/players.js', 'utf8');
const stats = fs.readFileSync('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/playerSeasonStats.js', 'utf8');

const ids = ['hanson_reggie','dent_rodney','harrison_chris','prickett_jared','martinez_gimel','riddick_andre','brown_dale','braddy_junior','bearup_todd','toomer_carlos','thompson_jody','davis_johnathon','thomas_henry','timberlake_aminu','svoboda_todd'];

console.log('=== players.js seasons ===');
for (const id of ids) {
  const m = data.match(new RegExp('"id": "' + id + '"[\\s\\S]*?"seasons": \\[([^\\]]*)\\]'));
  if (m) {
    const seasons = m[1].match(/"[^"]+"/g) || [];
    console.log(id + ' -> ' + seasons.join(', '));
  } else {
    console.log(id + ' -> NOT FOUND');
  }
}

console.log('\n=== playerSeasonStats.js entries ===');
for (const id of ids) {
  const hasEntry = stats.includes('"' + id + '":');
  if (hasEntry) {
    const m = stats.match(new RegExp('"' + id + '": \\{([\\s\\S]*?)\\n  \\}'));
    const seasons = m ? (m[1].match(/"\d{4}-\d{2}":/g) || []) : [];
    console.log(id + ' -> has stats, seasons: ' + seasons.map(s => s.replace(/":/g, '')).join(', '));
  } else {
    console.log(id + ' -> MISSING STATS');
  }
}
