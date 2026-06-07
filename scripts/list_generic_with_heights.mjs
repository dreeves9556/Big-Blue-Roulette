import fs from 'fs';

const data = fs.readFileSync('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/players.js', 'utf8');
const lines = data.split('\n');

const results = [];
for (let i = 0; i < lines.length; i++) {
  const posMatch = lines[i].match(/"primaryPosition": "([FG])"/);
  if (posMatch) {
    let id = null, name = null, height = null;
    // Search backwards until we hit a closing brace of previous block or opening of current
    for (let j = i; j >= Math.max(0, i - 15); j--) {
      const idM = lines[j].match(/"id": "([^"]+)"/);
      if (idM) id = idM[1];
      const nameM = lines[j].match(/"fullName": "([^"]+)"/);
      if (nameM) name = nameM[1];
      const heightM = lines[j].match(/"height": ([0-9]+)/);
      if (heightM) height = parseInt(heightM[1]);
      // Stop if we hit a closing brace (end of previous block)
      if (lines[j].trim() === '},' || lines[j].trim() === '}') {
        if (j < i - 2) break;
      }
    }
    results.push({ id, name, pos: posMatch[1], height });
  }
}

results.forEach(p => {
  console.log(`${p.id} | ${p.name} | ${p.pos} | ${p.height ?? '?'}`);
});
console.log(`--- TOTAL: ${results.length}`);
