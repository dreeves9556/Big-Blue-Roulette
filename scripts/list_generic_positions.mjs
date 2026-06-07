import fs from 'fs';

const data = fs.readFileSync('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/players.js', 'utf8');
const lines = data.split('\n');

const results = [];
for (let i = 0; i < lines.length; i++) {
  const posMatch = lines[i].match(/"primaryPosition": "([FG])"/);
  if (posMatch) {
    let id = null, name = null, height = null;
    for (let j = i - 10; j <= i; j++) {
      if (j < 0) continue;
      const idM = lines[j].match(/"id": "([^"]+)"/);
      if (idM && !id) id = idM[1];
      const nameM = lines[j].match(/"fullName": "([^"]+)"/);
      if (nameM && !name) name = nameM[1];
      const heightM = lines[j].match(/"height": ([0-9]+)/);
      if (heightM && !height) height = parseInt(heightM[1]);
    }
    results.push({ id, name, pos: posMatch[1], height });
  }
}

results.forEach(p => {
  console.log(`${p.id} | ${p.name} | ${p.pos} | ${p.height ?? '?'}`);
});
console.log(`--- TOTAL: ${results.length}`);
