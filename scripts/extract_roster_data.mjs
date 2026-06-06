import fs from 'fs';

const files = ['90-91', '91-92', '92-93'];
const seasonMap = { '90-91': '1990-91', '91-92': '1991-92', '92-93': '1992-93' };
const allData = {};

for (const f of files) {
  const season = seasonMap[f];
  const html = fs.readFileSync(`/Users/danielsmac/Downloads/Roster Additions/${f}.xls`, 'utf8');
  const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
  for (let i = 0; i < rows.length; i++) {
    if (i === 0) continue; // skip header
    const row = rows[i];
    const cells = row.match(/<t[dhd][^>]*>([\s\S]*?)<\/t[dhd]>/g) || [];
    const vals = cells.map(c => c.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim());
    if (!vals[1] || vals[1].includes('Team Totals')) continue;
    const name = vals[1];
    if (!allData[name]) allData[name] = {};
    allData[name][season] = {
      pos: vals[2],
      games: parseInt(vals[3]) || 0,
      pts: parseFloat(vals[25]) || 0,
      reb: parseFloat(vals[19]) || 0,
      ast: parseFloat(vals[20]) || 0,
      stl: parseFloat(vals[21]) || 0,
      blk: parseFloat(vals[22]) || 0
    };
  }
}

// Print summary
for (const [name, seasons] of Object.entries(allData)) {
  const s = Object.keys(seasons).sort();
  console.log(name + ': ' + s.join(', '));
}

fs.writeFileSync('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/scripts/roster_extracted.json', JSON.stringify(allData, null, 2));
console.log('\nWrote roster_extracted.json');
