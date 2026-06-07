import fs from 'fs';

const filePath = '/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/players.js';
let content = fs.readFileSync(filePath, 'utf8');

// Map from user-friendly slug (first_last) to actual file ID (last_first)
const SLUG_TO_ID = {
  'abe_collinsworth': 'collinsworth_abe',
  'adrian_smith': 'smith_adrian',
  'benny_spears': 'spears_benny',
  'bernie_butts': 'butts_bernie',
  'bill_busey': 'busey_bill',
  'bill_evans': 'evans_bill',
  'bob_mccowan': 'mccowan_bob',
  'bob_tallent': 'tallent_bob',
  'charles_ishmael': 'ishmael_charles',
  'dan_chandler': 'chandler_dan',
  'darryl_bishop': 'bishop_darryl',
  'derrick_miller': 'miller_derrick',
  'doug_pendygraft': 'pendygraft_doug',
  'earl_adkins': 'adkins_earl',
  'gayle_rose': 'rose_gayle',
  'gerry_calvert': 'calvert_gerry',
  'greg_smith': 'smith_greg',
  'greg_starrick': 'starrick_greg',
  'guy_strong': 'strong_guy',
  'jim_dinwiddie': 'dinwiddie_jim',
  'jim_lemaster': 'lemaster_jim',
  'jerry_hale': 'hale_jerry',
  'joey_holland': 'holland_joey',
  'kirk_chiles': 'chiles_kirk',
  'larry_miller': 'miller_larry',
  'leroy_byrd': 'byrd_leroy',
  'lincoln_collinsworth': 'collinsworth_lincoln',
  'linville_puckett': 'puckett_linville',
  'lowell_hughes': 'hughes_lowell',
  'mike_casey': 'casey_mike',
  'mike_flynn': 'flynn_mike',
  'paul_andrews': 'andrews_paul',
  'paul_corum': 'corum_paul',
  'ray_edelman': 'edelman_ray',
  'reggie_warford': 'warford_reggie',
  'ron_kennett': 'kennett_ron',
  'ronnie_lyons': 'lyons_ronnie',
  'sam_harper': 'harper_sam',
  'scotty_baesler': 'baesler_scotty',
  'skippy_whitaker': 'whitaker_skippy',
  'steve_clevenger': 'clevenger_steve',
  'terry_mobley': 'mobley_terry',
  'tom_harper': 'harper_tom',
  'tom_kron': 'kron_tom',
  'willie_rouse': 'rouse_willie',
  'bob_fowler': 'fowler_bob',
  'clint_wheeler': 'wheeler_clint',
  'dan_perry': 'perry_dan',
  'frank_tully': 'tully_frank',
  'g_j_smith': 'smith_g.j.',
  'george_critz': 'critz_george',
  'herky_rupp': 'rupp_herky',
  'jay_bayless': 'bayless_jay',
  'john_hardwick': 'hardwick_john',
  'larry_johnson': 'johnson_larry',
  'mickey_gibson': 'gibson_mickey',
  'ray_frudenberger': 'frudenberger_ray',
  'ray_mills': 'mills_ray',
};

// User's position assignments
const USER_POSITIONS = {
  'abe_collinsworth': 'SG',
  'adrian_smith': 'PG',
  'benny_spears': 'SG',
  'bernie_butts': 'PG',
  'bill_busey': 'PG',
  'bill_evans': 'SG',
  'bob_mccowan': 'SG',
  'bob_tallent': 'SG',
  'charles_ishmael': 'SG',
  'dan_chandler': 'PG',
  'darryl_bishop': 'SG',
  'derrick_miller': 'SG',
  'doug_pendygraft': 'SG',
  'earl_adkins': 'PG',
  'gayle_rose': 'PG',
  'gerry_calvert': 'PG',
  'greg_smith': 'SG',
  'greg_starrick': 'SG',
  'guy_strong': 'SG',
  'jim_dinwiddie': 'PG',
  'jim_lemaster': 'SG',
  'jerry_hale': 'SG',
  'joey_holland': 'SG',
  'kirk_chiles': 'PG',
  'larry_miller': 'SG',
  'leroy_byrd': 'PG',
  'lincoln_collinsworth': 'SG',
  'linville_puckett': 'SG',
  'lowell_hughes': 'PG',
  'mike_casey': 'SG',
  'mike_flynn': 'PG',
  'paul_andrews': 'SG',
  'paul_corum': 'PG',
  'ray_edelman': 'SG',
  'reggie_warford': 'SG',
  'ron_kennett': 'PG',
  'ronnie_lyons': 'PG',
  'sam_harper': 'SG',
  'scotty_baesler': 'PG',
  'skippy_whitaker': 'PG',
  'steve_clevenger': 'PG',
  'terry_mobley': 'SG',
  'tom_harper': 'SG',
  'tom_kron': 'SF',
  'willie_rouse': 'PG',
  'bob_fowler': 'PF',
  'clint_wheeler': 'PF',
  'dan_perry': 'SF',
  'frank_tully': 'SF',
  'g_j_smith': 'PF',
  'george_critz': 'SF',
  'herky_rupp': 'SF',
  'jay_bayless': 'PF',
  'john_hardwick': 'SG',
  'larry_johnson': 'PF',
  'mickey_gibson': 'SF',
  'ray_frudenberger': 'PF',
  'ray_mills': 'PF',
};

let changes = 0;
for (const [userSlug, newPos] of Object.entries(USER_POSITIONS)) {
  const id = SLUG_TO_ID[userSlug];
  if (!id) {
    console.log(`✗ ${userSlug} - no ID mapping`);
    continue;
  }
  // Match the id, then find primaryPosition within ~300 chars (one player block)
  const regex = new RegExp(`("id": "${id}"[\\s\\S]{0,300}?"primaryPosition": ")([FG])(")`);
  if (regex.test(content)) {
    content = content.replace(regex, `$1${newPos}$3`);
    changes++;
    console.log(`✓ ${id} (${userSlug}) -> ${newPos}`);
  } else {
    // Try without the char limit in case block is longer
    const looseRegex = new RegExp(`("id": "${id}"[\\s\\S]*?"primaryPosition": ")([FG])(")`);
    if (looseRegex.test(content)) {
      content = content.replace(looseRegex, `$1${newPos}$3`);
      changes++;
      console.log(`✓ ${id} (${userSlug}) -> ${newPos} (loose match)`);
    } else {
      console.log(`✗ ${id} (${userSlug}) - not found or already remapped`);
    }
  }
}

fs.writeFileSync(filePath, content);
console.log(`\nApplied ${changes} position remaps.`);
