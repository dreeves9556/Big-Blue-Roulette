import { footballPlayers, footballSeasonPlayersMap } from '../src/data/footballPlayers.js';
import { footballPlayerSeasonStatsById } from '../src/data/footballPlayerSeasonStats.js';

function pct(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const i = Math.floor(sorted.length * p);
  return sorted[Math.min(i, sorted.length - 1)];
}

const qb = { yds: [], td: [], rate: [], rushYds: [] };
const rb = { rushYds: [], rushTD: [], ypc: [], recYds: [] };
const wr = { recYds: [], recTD: [], ypr: [], rec: [], rushYds: [] };
const te = { recYds: [], recTD: [], ypr: [], rec: [], rushYds: [] };

for (const player of footballPlayers) {
  for (const season of player.seasons) {
    const s = footballPlayerSeasonStatsById[player.id]?.[season];
    if (!s) continue;
    const pos = player.primaryPosition;
    if (pos === 'QB') {
      qb.yds.push(s.Yds ?? 0);
      qb.td.push(s.TD ?? 0);
      qb.rate.push(s.Rate ?? 0);
      qb.rushYds.push(s.RushYds ?? 0);
    } else if (pos === 'RB') {
      rb.rushYds.push(s.RushYds ?? 0);
      rb.rushTD.push(s.RushTD ?? 0);
      rb.ypc.push(s.RushYA ?? 0);
      rb.recYds.push(s.RecYds ?? 0);
    } else if (pos === 'WR') {
      wr.recYds.push(s.RecYds ?? 0);
      wr.recTD.push(s.RecTD ?? 0);
      wr.ypr.push(s.YPR ?? 0);
      wr.rec.push(s.Rec ?? 0);
      wr.rushYds.push(s.RushYds ?? 0);
    } else if (pos === 'TE') {
      te.recYds.push(s.RecYds ?? 0);
      te.recTD.push(s.RecTD ?? 0);
      te.ypr.push(s.YPR ?? 0);
      te.rec.push(s.Rec ?? 0);
      te.rushYds.push(s.RushYds ?? 0);
    }
  }
}

function report(name, data, labels) {
  console.log(`\n${name} (n=${data[0].length}):`);
  const ps = [0.25, 0.5, 0.75, 0.85, 0.9, 0.95, 0.99];
  console.log('        ' + labels.map(l => l.padStart(10)).join(''));
  for (const p of ps) {
    const vals = data.map(arr => pct(arr, p).toFixed(1));
    const label = `p${Math.round(p * 100)}`.padStart(6);
    console.log(label + '  ' + vals.map(v => v.padStart(10)).join(''));
  }
}

report('QB', [qb.yds, qb.td, qb.rate, qb.rushYds], ['PassYds', 'PassTD', 'Rate', 'RushYds']);
report('RB', [rb.rushYds, rb.rushTD, rb.ypc, rb.recYds], ['RushYds', 'RushTD', 'YPC', 'RecYds']);
report('WR', [wr.recYds, wr.recTD, wr.ypr, wr.rec, wr.rushYds], ['RecYds', 'RecTD', 'YPR', 'Rec', 'RushYds']);
report('TE', [te.recYds, te.recTD, te.ypr, te.rec, te.rushYds], ['RecYds', 'RecTD', 'YPR', 'Rec', 'RushYds']);
