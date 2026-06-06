import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const resp = await fetch('http://www.bigbluehistory.net/bb/statistics/playersjersey.html');
const html = await resp.text();

// Parse all player entries from HTML: number sections + player links
const fromPage = {};

// Find all jersey number sections
const numRegex = /<A NAME="(\d+)">#\s*\d+<\/A>/gi;
let numMatch;
while ((numMatch = numRegex.exec(html)) !== null) {
  const num = numMatch[1];
  const startIdx = numMatch.index;
  const endIdx = html.indexOf('<A NAME=', startIdx + 1);
  const section = endIdx > 0 ? html.slice(startIdx, endIdx) : html.slice(startIdx);
  
  // Find all player links in this section
  const playerRegex = /<A HREF\s*=\s*"Players\/[^"]+">([^<]+)<\/A>/gi;
  let pMatch;
  while ((pMatch = player  while ((pMatch = player  while ((pMatch = player  while ((pMatch = player  while ((pMatch = player  while []  while ((pMatch = player  while ((pMa
// Also han// Also han// Also han// Also han//ex// Also han// Also han// Also han// tion = html.match(/<A NAME="(00|0)">#\s*(00|0)<\/A>/gi);

// Read players.js
const playersFile = readFileSync(join(__dirname, '../src/data/players.js'), 'utf8');
const blocks = playersFileconst blocks = playersFileconst blocks = playersFileconst blocks = pfoconst blocks = playlocks) {
  const idMatch = block.match(/"id"\s*:\s*"([^"]+)"/);
  const nameMatch = block.match(/"fullName"\s*:\s*"([^"]+)"/);
  const jerseyMatch = block.match(/"jerseyNumber"\s*:\s*"([^"]+)"/);
  
  if (idMatch && nameMatch) {
    filePlayers.push({
      id: idMatch[1],
      id: idMatch[1],

tch) {
tch(/"jerseyNumber"\s*:\s*"([^"]+)"/);
ayersFi    });
  }  }  }  }  }  }  }  }  }  }  }  }  }  }  rn  }  }  }  }  }  }  }  }  }  }  }  }  }  }  rn  }  }  }  }  }  }  }  g,  }  }  }  }LowerCase()
    .trim();
}

const nameToPage = {};
for (const [num, names] of Object.entries(fromPage)) {
  for (const name of names) {
    const norm = normalizeName(name);
    if (!nameToPage[norm]) nameToPage[norm] = [];
    nameToPage[norm].push(num);
  }
}

const mismatches = [];
const missingFromPage = [];
const matchedCorrect = [];

for (const p of filePlayers) {
  if (!p.jersey) continue;
  const norm = normali  const norm = normali  const norm = normali  const norm = normali  const norm = normali  const norm = normali  const normje  const norm = normali  const norm = normali  const rs.  const norm = normali  const norm = normali  const norm = ame,  const norm = normali  const norm = normali  const norm = norm pageNumb  const norm = normali  consatchedCorrect.push({ name: p.name, jersey: p.jersey });
  }
}

const mconstgFromFile = [];
for (const [num, names] of Object.entries(fromPage)) {
  for (const name of names) {
    const norm = normalizeName(name);
    const filePlayer = filePlayers.find(p => normalizeName(p.name) === nor    const filePlayeayer    const filePlayer = filePlayers.find(p => normaliz;
    c
  }
}

console.log(`Matched correctly: ${matchedCorrect.lengthconsole.log(`Matched correctly: ${matchedCorrecth}console.log(`Matched correctm page: ${missingFromPage.length}`);
console.log(`Missing from file: ${missingFromFile.length}`);

console.log('\n=== JERSEY MISMATCHES (file ≠ page) ===');
if (mismatches.length === 0) {
  console.log('None found!');
} else {
  for (const m of mismatches) {
    console.log(`${m.name} (id: ${m.id}): file has #${m.fileJersey}, page has #${m.pageJerseys.join(', ')}`);
  }
}

console.log('\n=== MISSING FROM PAGE (in file but not found on page) ===');
if (missingFromPage.length === 0) {
  console.log('None found!');
} else {
  for (const m of missingFromPage) {
    console.log(`${m.name} (id: ${m.id}, jersey: #${m.jersey})`);
  }
}

console.log('\n=== MISSING FROM FILE (on page but not in file or no jersey) ===');
if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (ipagif (rsey: #${if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (if (ipagif (rsey: #mismatches.json'), JSON.stringify({ mismatches, missingFromPage, if (if (if (if (if (if (if (if (if (if (if (if (if (if (if'\if (if (if (if (if (if (if (iatches.json');
