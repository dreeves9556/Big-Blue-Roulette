import fs from 'fs';

const filePath = '/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/players.js';
let content = fs.readFileSync(filePath, 'utf8');

// Reliable remaps from user research
const REMAPS = {
  // G -> specific
  'newton_c.m.': 'SG',
  'bibb_bill': 'PF',
  'evans_billy': 'SG',
  'cassady_billyray': 'SG',
  'cassady_billy': 'SG',
  'radabaugh_denny': 'PF',
  'stephens_elmore': 'SF',
  'ross_harold': 'SG',
  'mcdonald_jim': 'SG',
  'conner_jimmy': 'SF',
  'argento_phil': 'SG',
  'wood_roger': 'C',
  'green_steve': 'SF',
  'deeken_ted': 'SF',
  'brewer_john': 'SG',
  // F -> specific
  'smith_bill': 'PF',
  'guyette_bob': 'C',
  'bounds_brad': 'PF',
  'miller_david': 'PF',
  'rolfes_don': 'C',
  'price_dwight': 'SF',
  'smith_gj': 'PF',
  'gamble_gary': 'PF',
  'stewart_gene': 'SF',
  'lee_james': 'PF',
  'bird_jerry': 'PF',
  'stamper_larry': 'PF',
  'haskins_merion': 'PF',
  'doyle_pat': 'SG',
  'grawemeyer_phil': 'PF',
  'noll_randy': 'PF',
  'pool_randy': 'PF',
  'drewitz_rick': 'C',
  'lock_rob': 'C',
  'newman_roger': 'SF',
  'roberts_roy': 'PF',
  'lochmueller_steve': 'C',
  'ziegler_todd': 'PF',
  'porter_tom': 'SF',
  'lyons_wendell': 'PF',
};

let changes = 0;
for (const [id, newPos] of Object.entries(REMAPS)) {
  // Match the id, then find the primaryPosition within that player's block
  const idRegex = new RegExp(`("id": "${id}"[\\s\\S]{0,200}?"primaryPosition": ")([FG])(")`);
  if (idRegex.test(content)) {
    content = content.replace(idRegex, `$1${newPos}$3`);
    changes++;
    console.log(`✓ ${id} -> ${newPos}`);
  } else {
    console.log(`✗ ${id} - not found or already remapped`);
  }
}

fs.writeFileSync(filePath, content);
console.log(`\nApplied ${changes} position remaps.`);
