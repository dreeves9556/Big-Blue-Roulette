import fs from 'fs';
import vm from 'vm';

const PLAYER_PAGE_BASE = 'http://www.bigbluehistory.net/bb/statistics/Players';

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

const playerNames = {};
for (const p of players) {
  playerNames[p.id] = p.fullName;
}

const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
};

const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const buildCandidateUrls = (player) => {
  const candidates = new Set();
  const idParts = player.id.split('_').filter(Boolean);
  const idTitleParts = idParts.map((part) => titleCase(part));

  const idBased = idTitleParts.join('_');
  candidates.add(`${PLAYER_PAGE_BASE}/${idBased}.html`);

  const fullNameTokens = player.fullName
    .replace(/'/g, '')
    .replace(/\./g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => titleCase(token));

  if (fullNameTokens.length >= 2) {
    const [first, ...rest] = fullNameTokens;
    const last = rest.pop();
    const middle = rest;
    candidates.add(`${PLAYER_PAGE_BASE}/${[last, first, ...middle].join('_')}.html`);
    candidates.add(`${PLAYER_PAGE_BASE}/${[last, ...middle, first].join('_')}.html`);
    if (rest.length > 0) {
      const compoundLast = [...rest, last].join('_');
      candidates.add(`${PLAYER_PAGE_BASE}/${[compoundLast, first].join('_')}.html`);
    }
  }

  return [...candidates];
};

const parseAssistsFromHtml = (html, playerName) => {
  // Find all season rows with their raw HTML context
  const seasonMatches = [...html.matchAll(/<A HREF="\.\.\/stat(\d{4}-\d{2})\.html">[^<]*<\/A>/g)];
  const results = [];

  for (const match of seasonMatches) {
    const season = match[1];
    const rowStartIdx = match.index;
    const rowEndMatch = html.slice(rowStartIdx).match(/<\/TR>|<TR><TD><A HREF="\.\.\/stat/);
    const rowEndIdx = rowEndMatch ? rowStartIdx + rowEndMatch.index : rowStartIdx + 500;
    const rowHtml = html.slice(rowStartIdx, rowEndIdx);

    const tdMatches = [...rowHtml.matchAll(/<TD>([^<]*)<\/TD>/g)];
    const values = tdMatches.map(m => m[1].trim());

    // Also check for "-" in values
    const hasDash = values.some(v => v === '-');

    results.push({ season, values, hasDash, raw: rowHtml });
  }

  return results;
};

const detectAssistColumn = (html) => {
  // Find the header row
  const headerMatch = html.match(/<TR>(<TH>[^<]*<\/TH>)+<\/TR>/i);
  if (!headerMatch) return { hasAssist: false, assistIndex: -1, headers: [] };

  const headerRow = headerMatch[0];
  const thMatches = [...headerRow.matchAll(/<TH>([\s\S]*?)<\/TH>/g)];
  const headers = thMatches.map(m => m[1].replace(/<BR>/gi, ' ').trim().toLowerCase());

  // Look for assist-related header
  const assistIndex = headers.findIndex(h =>
    h.includes('asst') || h.includes('assist')
  );

  return { hasAssist: assistIndex !== -1, assistIndex, headers };
};

const main = async () => {
  // Identify players who have pre-1983 seasons with 0 or missing assists
  const targetPlayers = [];

  for (const player of players) {
    const stats = playerSeasonStatsById[player.id];
    if (!stats) continue;

    let hasPre1983 = false;
    for (const season of Object.keys(stats)) {
      const year = parseInt(season.split('-')[0]);
      if (year < 1983) {
        hasPre1983 = true;
        break;
      }
    }

    if (hasPre1983) {
      targetPlayers.push(player);
    }
  }

  console.log(`Found ${targetPlayers.length} players with pre-1983 seasons to check`);

  const findings = {
    fixed: [],      // Successfully got real assist value
    missing: [],    // Page exists but no assist column or dash value
    noPage: [],     // Page not found
    alreadyCorrect: [], // Had non-zero assists already
    zeroReal: [],   // Page shows actual 0 assists
  };

  const updatedStats = JSON.parse(JSON.stringify(playerSeasonStatsById));

  const concurrency = 5;
  for (let i = 0; i < targetPlayers.length; i += concurrency) {
    const batch = targetPlayers.slice(i, i + concurrency);
    console.log(`\nBatch ${Math.floor(i / concurrency) + 1}/${Math.ceil(targetPlayers.length / concurrency)}`);

    await Promise.all(batch.map(async (player) => {
      const urls = buildCandidateUrls(player);
      let pageHtml = null;
      let matchedUrl = null;

      for (const url of urls) {
        try {
          const html = await fetchText(url);
          if (html) {
            // Quick validation: check if player's name appears on page
            if (html.toLowerCase().includes(player.fullName.toLowerCase().split(' ').pop()) ||
                html.includes(player.fullName)) {
              pageHtml = html;
              matchedUrl = url;
              break;
            }
          }
        } catch (e) {
          // 404 or error, try next
        }
      }

      if (!pageHtml) {
        findings.noPage.push({ id: player.id, name: player.fullName, urls });
        return;
      }

      const { hasAssist, assistIndex, headers } = detectAssistColumn(pageHtml);
      const seasonData = parseAssistsFromHtml(pageHtml, player.fullName);

      const playerStats = updatedStats[player.id] || {};

      for (const s of seasonData) {
        const year = parseInt(s.season.split('-')[0]);
        if (year >= 1983) continue; // Only care about pre-1983

        const existing = playerStats[s.season];
        if (!existing) continue;

        if (!hasAssist) {
          // No assist column at all on this page
          findings.missing.push({
            id: player.id,
            name: player.fullName,
            season: s.season,
            reason: 'no-assist-column',
            headers: headers.join(', '),
            existingAst: existing.ast,
            url: matchedUrl
          });
          continue;
        }

        // The season link itself is a TD, so we need to offset
        // values[0] = season link text, values[1] = games, etc.
        // But our parser above extracts ALL TDs in the row
        // The season link TD is included at values[0]
        // So assist is at values[assistIndex + 1] (accounting for season TD)
        // Wait - the regex <TD>([^<]*)</TD> won't match the season link TD because it contains <A>...</A>
        // Let me re-check...

        // Actually the season link is: <TD><A HREF="...">...</A></TD>
        // The regex <TD>([^<]*)</TD> won't match because there's nested tags.
        // But our parseAssistsFromHtml extracts TDs starting from the season link's position.
        // Let me verify by looking at the raw HTML for Hagan.

        // For Hagan 1950-51: <TD><A HREF="../stat1950-51.html">1950-51</A></TD><TD>20</TD>...
        // The regex <TD>([^<]*)</TD> would only match plain text TDs.
        // So values[0] = 20 (games), values[1] = 69 (FG), etc.
        // assistIndex in headers = 9 (0-based: Season=0, Games=1, FG=2, FGA=3, %=4, FT=5, FTA=6, %=7, Rebs=8, Asst=9, F=10, Pts=11)
        // But values don't include the season TD, so:
        // values[0] = games, values[1] = FG, values[8] = Rebs, values[9] = Asst, values[10] = F, values[11] = Pts

        // Wait, the headers array includes the season header too.
        // headers[0] = 'Season', headers[1] = 'Games Played', ..., headers[9] = 'Asst.'
        // But the TD extraction skips the season TD (it has nested <A> tag).
        // So the values array has one fewer element than headers.
        // values[0] corresponds to headers[1] (Games)
        // values[8] corresponds to headers[9] (Asst.)

        // Let me check with Hagan data:
        // For 1950-51 with Asst. column: games=20, FG=69, FGA=188, %=36.7, FT=45, FTA=61, %=73.77, Rebs=169, Asst=19, F=62, Pts=183
        // values should be: ['20','69','188','36.7','45','61','73.77','169','19','62','183']
        // assist index in values = 8 (headers[9] = 'Asst.', offset by 1 because season TD is skipped)

        const assistValueIndex = assistIndex - 1; // offset for season TD
        const assistValue = s.values[assistValueIndex];

        if (assistValue === undefined) {
          findings.missing.push({
            id: player.id,
            name: player.fullName,
            season: s.season,
            reason: 'index-out-of-bounds',
            values: s.values,
            headers: headers.join(', '),
            assistIndex,
            assistValueIndex,
            existingAst: existing.ast,
            url: matchedUrl
          });
          continue;
        }

        if (assistValue === '-') {
          findings.missing.push({
            id: player.id,
            name: player.fullName,
            season: s.season,
            reason: 'dash-value',
            existingAst: existing.ast,
            url: matchedUrl
          });
          continue;
        }

        const parsedAst = parseFloat(assistValue);
        if (isNaN(parsedAst)) {
          findings.missing.push({
            id: player.id,
            name: player.fullName,
            season: s.season,
            reason: 'not-a-number',
            value: assistValue,
            existingAst: existing.ast,
            url: matchedUrl
          });
          continue;
        }

        const games = parseFloat(s.values[0]);
        if (isNaN(games) || games <= 0) {
          findings.missing.push({
            id: player.id,
            name: player.fullName,
            season: s.season,
            reason: 'invalid-games',
            games,
            existingAst: existing.ast,
            url: matchedUrl
          });
          continue;
        }

        const apg = Math.round((parsedAst / games) * 10) / 10;

        if (existing.ast === apg) {
          findings.alreadyCorrect.push({
            id: player.id,
            name: player.fullName,
            season: s.season,
            apg,
            totalAssists: parsedAst,
            games
          });
        } else if (apg === 0) {
          findings.zeroReal.push({
            id: player.id,
            name: player.fullName,
            season: s.season,
            apg,
            totalAssists: parsedAst,
            games,
            existingAst: existing.ast
          });
          playerStats[s.season].ast = apg;
        } else {
          findings.fixed.push({
            id: player.id,
            name: player.fullName,
            season: s.season,
            oldAst: existing.ast,
            newAst: apg,
            totalAssists: parsedAst,
            games,
            url: matchedUrl
          });
          playerStats[s.season].ast = apg;
        }
      }
    }));

    // Rate limiting between batches
    await new Promise(r => setTimeout(r, 500));
  }

  // Write report
  console.log('\n\n=== RESCRAPE REPORT ===\n');

  console.log(`Fixed (${findings.fixed.length}):`);
  for (const f of findings.fixed) {
    console.log(`  ${f.season} | ${f.name} | ${f.oldAst} -> ${f.newAst} APG (${f.totalAssists} total / ${f.games} games)`);
  }

  console.log(`\nAlready correct (${findings.alreadyCorrect.length}):`);
  for (const f of findings.alreadyCorrect) {
    console.log(`  ${f.season} | ${f.name} | ${f.apg} APG`);
  }

  console.log(`\nReal zero assists (${findings.zeroReal.length}):`);
  for (const f of findings.zeroReal) {
    console.log(`  ${f.season} | ${f.name} | ${f.apg} APG (${f.totalAssists} total / ${f.games} games)`);
  }

  console.log(`\nMissing data (${findings.missing.length}):`);
  for (const m of findings.missing) {
    console.log(`  ${m.season} | ${m.name} | reason: ${m.reason}, existing: ${m.existingAst}`);
  }

  console.log(`\nNo page found (${findings.noPage.length}):`);
  for (const p of findings.noPage) {
    console.log(`  ${p.name} (${p.id})`);
  }

  // Write updated stats
  const outputPath = './src/data/playerSeasonStats.js';
  const outputContent = `export const playerSeasonStatsById = ${JSON.stringify(updatedStats, null, 2)};\n`;
  fs.writeFileSync(outputPath, outputContent, 'utf8');
  console.log(`\nUpdated ${outputPath}`);
};

main().catch(e => {
  console.error(e);
  process.exit(1);
});
