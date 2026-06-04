import { players } from './src/data/players.js';
import { playerSeasonStatsById } from './src/data/playerSeasonStats.js';
import { writeFileSync } from 'fs';

const allSEC = [
  "spivey_bill", "watson_bobby", "ramsey_frank", "hagan_cliff", "tsioropoulos_lou",
  "evans_billy", "burrow_bob", "bird_jerry", "beck_ed", "cox_johnny", 
  "crigler_john", "hatton_vernon", "lickert_bill", "mills_don",
  "burchett_carroll", "pursiful_larry", "nash_cotton", "deeken_ted", "conley_larry",
  "kron_tommy", "dampier_louie", "riley_pat", "jaracz_thad", "casey_mike",
  "issel_dan", "pratt_mike", "steele_larry", "hollenbeck_kent", "parker_tom",
  "payne_tom", "andrews_jim", "lyons_ronnie", "conner_jimmydan", "grevey_kevin",
  "robey_rick", "givens_jack", "phillips_mike", "johnson_larry", "lee_james",
  "macy_kyle", "anderson_dwight", "bowie_sam", "minniefield_dirk", "hord_derrick",
  "master_jim", "turpin_melvin", "walker_kenny", "harden_roger", "bennett_winston",
  "davender_ed", "chapman_rex", "ellis_leron", "mills_chris", "miller_derrick",
  "hanson_reggie", "pelphrey_john", "mashburn_jamal", "ford_travis", "delk_tony",
  "rhodes_rodrick", "mccarty_walter", "walker_antoine", "anderson_derek", "epps_anthony",
  "mercer_ron", "sheppard_jeff", "mohammed_nazr", "padgett_scott", "turner_wayne",
  "magloire_jamaal", "prince_tayshaun", "bogans_keith", "estill_marquis", "daniels_erik",
  "fitch_gerald", "hawkins_cliff", "hayes_chuck", "azubuike_kelenna", "sparks_patrick",
  "morris_randolph", "rondo_rajon", "bradley_ramel", "crawford_joe", "patterson_patrick",
  "meeks_jodie", "cousins_demarcus", "wall_john", "jones_terrence", "knight_brandon",
  "lamb_doron", "davis_anthony", "mkg_michael", "noel_nerlens", "randle_julius",
  "young_james", "cauley_willie", "harrison_aaron", "booker_devin", "towns_kat",
  "ulis_tyler", "murray_jamal", "adebayo_bam", "fox_deaaron", "monk_malik",
  "gilgeous_shai", "knox_kevin", "washington_pj", "herro_tyler", "johnson_keldon",
  "richards_nick", "quickley_immanuel", "maxey_tyrese", "tshiebwe_oscar", "wheeler_sahvir",
  "washington_tyty", "sheppard_reed", "reeves_antonio"
];

const inGame = new Set(players.map(p => p.id));
const missing = allSEC.filter(id => !inGame.has(id));
const present = allSEC.filter(id => inGame.has(id));
const noStats = present.filter(id => !playerSeasonStatsById[id] || Object.keys(playerSeasonStatsById[id]).length === 0);

// Build output buffer
let output = [];
output.push("MISSING ALL-SEC PLAYERS:");
missing.forEach(id => output.push("- " + id));
output.push("\nTotal missing: " + missing.length);

output.push("\nPRESENT BUT NO STATS:");
noStats.forEach(id => output.push("- " + id));
output.push("\nTotal no stats: " + noStats.length);

output.push("\nSUMMARY: " + allSEC.length + " All-SEC players, " + present.length + " present, " + missing.length + " missing, " + noStats.length + " without stats");

const outputText = output.join('\n');

// Write to file (avoids Devin console marshaling issues)
writeFileSync('allsec-report.txt', outputText, 'utf8');

// Also print to console
console.log(outputText);
