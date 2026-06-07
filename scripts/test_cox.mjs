import vm from 'vm';
import fs from 'fs';

function evalJsExport(filePath, varName) {
  const text = fs.readFileSync(filePath, 'utf8');
  const ctx = {};
  vm.createContext(ctx);
  const script = text.replace(/export const /g, 'const ') + `\n;__result__ = ${varName};`;
  vm.runInContext(script, ctx, { timeout: 5000 });
  return ctx.__result__;
}

const playerSeasonStatsById = evalJsExport('./src/data/playerSeasonStats.js', 'playerSeasonStatsById');
const players = evalJsExport('./src/data/players.js', 'players');

function getEraAdjustment(year) {
  if (year < 1970) return { pts: 0.92, reb: 1.04, ast: 0.9, stl: 0.78, blk: 0.76 };
  if (year < 1980) return { pts: 0.94, reb: 1.03, ast: 0.92, stl: 0.82, blk: 0.8 };
  if (year < 1990) return { pts: 0.97, reb: 1.0, ast: 0.96, stl: 0.9, blk: 0.9 };
  if (year < 2000) return { pts: 1.0, reb: 0.98, ast: 1.0, stl: 1.0, blk: 1.0 };
  if (year < 2010) return { pts: 1.03, reb: 0.96, ast: 1.04, stl: 1.05, blk: 1.03 };
  if (year < 2020) return { pts: 1.05, reb: 0.95, ast: 1.08, stl: 1.1, blk: 1.06 };
  return { pts: 1.08, reb: 0.94, ast: 1.12, stl: 1.12, blk: 1.08 };
}

function roundToTenths(value) {
  return Math.round(value * 10) / 10;
}

function estimatePlayerMetrics(player, season) {
  const realStats = playerSeasonStatsById[player.id]?.[season];
  if (realStats) {
    const year = parseInt(season.split('-')[0]);
    if (year >= 1980) {
      return {
        pts: realStats.pts ?? 0,
        reb: realStats.reb ?? 0,
        ast: realStats.ast ?? 0,
        stl: realStats.stl ?? 0,
        blk: realStats.blk ?? 0,
      };
    }
    const positionEstimates = {
      'PG': { ast: 3.5, stl: 1.2, blk: 0.1 },
      'SG': { ast: 2.0, stl: 1.0, blk: 0.2 },
      'SF': { ast: 1.5, stl: 0.8, blk: 0.4 },
      'PF': { ast: 1.0, stl: 0.5, blk: 0.8 },
      'C':  { ast: 0.5, stl: 0.4, blk: 1.5 },
    };
    const estimates = positionEstimates[player.primaryPosition] || { ast: 1.0, stl: 0.5, blk: 0.3 };
    const era = getEraAdjustment(year);
    const rawAst = realStats.ast ?? 0;
    const ast = rawAst > 0 ? rawAst * era.ast : estimates.ast * era.ast;
    return {
      pts: (realStats.pts ?? 0) * era.pts,
      reb: (realStats.reb ?? 0) * era.reb,
      ast: roundToTenths(ast),
      stl: estimates.stl * era.stl,
      blk: estimates.blk * era.blk,
    };
  }
  return null;
}

const cox = players.find(p => p.id === 'cox_johnny');
for (const season of cox.seasons) {
  const metrics = estimatePlayerMetrics(cox, season);
  console.log(`${season} | pos=${cox.primaryPosition} | rawAst=${playerSeasonStatsById['cox_johnny'][season].ast} | computedAPG=${metrics.ast}`);
}
