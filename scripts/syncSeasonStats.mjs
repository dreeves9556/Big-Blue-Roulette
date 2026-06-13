import fs from 'fs/promises';
import { players } from '../src/data/players.js';

const PLAYER_PAGE_BASE = 'http://www.bigbluehistory.com/bb/statistics/Players';
const PLAYERS_INDEX_HTML_URL = 'http://www.bigbluehistory.com/bb/statistics/players.html';

const normalizeName = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&amp;/g, 'and')
  .replace(/[^a-z0-9]/g, '');

const cleanNumber = (value) => {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const numeric = Number.parseFloat(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
};

const roundToTenths = (value) => Math.round(value * 10) / 10;

const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
};

const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const formatInitialToken = (token) => {
  if (!token || token.length !== 2) return null;
  return `${token.charAt(0).toUpperCase()}.${token.charAt(1).toUpperCase()}.`;
};

const addCandidate = (set, value) => {
  if (!value) return;
  set.add(value);
};

const parsePlayerUrlMapFromIndexHtml = (indexHtmlText) => {
  const map = new Map();
  // The index only links to gbg pages with '*' as text
  // e.g., <A HREF="Players/Walker_Kennygbg.html">*</A>
  // We derive the main player page by stripping 'gbg' from the filename
  const gbgAnchorRegex = /<A\s+HREF\s*=\s*"Players\/([^"#?]+)gbg\.html"\s*>\*<\/A>/gi;

  for (const match of indexHtmlText.matchAll(gbgAnchorRegex)) {
    const gbgFileName = match[1]; // e.g., "Walker_Kenny"
    // The player name is in the filename as Last_First
    const parts = gbgFileName.split('_');
    if (parts.length < 2) continue;

    // Reconstruct likely full name: last part is first name, rest is last name
    const firstName = parts[parts.length - 1];
    const lastName = parts.slice(0, -1).join(' ');
    const fullName = `${firstName} ${lastName}`;

    const key = normalizeName(fullName);
    const mainUrl = `${PLAYER_PAGE_BASE}/${gbgFileName}.html`;

    if (!map.has(key)) {
      map.set(key, mainUrl);
    }
  }

  return map;
};

const buildCandidateUrls = (player) => {
  const candidates = new Set();
  const idParts = player.id.split('_').filter(Boolean);
  const idTitleParts = idParts.map((part) => titleCase(part));

  const idBased = idTitleParts.join('_');
  addCandidate(candidates, `${PLAYER_PAGE_BASE}/${idBased}.html`);

  if (idParts.length >= 2) {
    const expanded = [...idTitleParts];
    const lastIdx = expanded.length - 1;
    const maybeInitials = formatInitialToken(idParts[lastIdx]);
    if (maybeInitials) {
      expanded[lastIdx] = maybeInitials;
      addCandidate(candidates, `${PLAYER_PAGE_BASE}/${expanded.join('_')}.html`);
    }
  }

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
    addCandidate(candidates, `${PLAYER_PAGE_BASE}/${[last, first, ...middle].join('_')}.html`);
    addCandidate(candidates, `${PLAYER_PAGE_BASE}/${[last, ...middle, first].join('_')}.html`);

    if (rest.length > 0) {
      const compoundLast = [...rest, last].join('_');
      addCandidate(candidates, `${PLAYER_PAGE_BASE}/${[compoundLast, first].join('_')}.html`);
    }
  }

  return [...candidates];
};

const parseSeasonStatsFromPlayerPage = (playerPageText) => {
  const seasonStats = {};

  const compact = playerPageText.replace(/\s+/g, ' ');
  const seasonRowRegex = /<TR><TD><A HREF="\.\.\/stat(\d{4}-\d{2})\.html">[^<]*<\/A><\/TD>([\s\S]*?)(?=<TR>|<\/TABLE>)/gi;

  for (const match of compact.matchAll(seasonRowRegex)) {
    const season = match[1];
    const rowRest = match[2];
    const tdValues = [...rowRest.matchAll(/<TD>([^<]*)<\/TD>/gi)].map((tdMatch) => cleanNumber(tdMatch[1]));
    if (tdValues.length < 20) continue;

    const games = tdValues[0];

    if (games <= 0) {
      seasonStats[season] = {
        pts: 0,
        reb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        games: 0,
      };
      continue;
    }

    const totalRebounds = tdValues[13];
    const totalAssists = tdValues[14];
    const totalSteals = tdValues[15];
    const totalBlocks = tdValues[16];
    const totalPoints = tdValues[19];

    seasonStats[season] = {
      pts: roundToTenths(totalPoints / games),
      reb: roundToTenths(totalRebounds / games),
      ast: roundToTenths(totalAssists / games),
      stl: roundToTenths(totalSteals / games),
      blk: roundToTenths(totalBlocks / games),
      games: Math.round(games),
    };
  }

  return seasonStats;
};

const main = async () => {
  const playersIndexHtml = await fetchText(PLAYERS_INDEX_HTML_URL);
  const playerUrlMap = parsePlayerUrlMapFromIndexHtml(playersIndexHtml);

  const entries = players.map((player) => ({
    id: player.id,
    fullName: player.fullName,
    candidates: [
      playerUrlMap.get(normalizeName(player.fullName)),
      ...buildCandidateUrls(player),
    ].filter(Boolean),
  }));

  const outputById = {};
  const unresolved = [];

  const concurrency = 12;
  for (let index = 0; index < entries.length; index += concurrency) {
    const batch = entries.slice(index, index + concurrency);

    const batchResults = await Promise.all(batch.map(async (entry) => {
      for (const candidateUrl of entry.candidates) {
        const wrappedUrl = `https://r.jina.ai/${candidateUrl}`;

        try {
          const playerPageText = await fetchText(candidateUrl);
          const seasonStats = parseSeasonStatsFromPlayerPage(playerPageText);

          if (Object.keys(seasonStats).length > 0) {
            return {
              entry,
              seasonStats,
              url: candidateUrl,
              error: null,
            };
          }
        } catch {
        }
      }

      return {
        entry,
        seasonStats: null,
        url: null,
        error: 'no-matching-player-page-found',
      };
    }));

    for (const result of batchResults) {
      if (result.seasonStats) {
        outputById[result.entry.id] = result.seasonStats;
      } else {
        unresolved.push({
          id: result.entry.id,
          fullName: result.entry.fullName,
          candidates: result.entry.candidates,
          error: result.error,
        });
      }
    }
  }

  const outputPath = new URL('../src/data/playerSeasonStats.js', import.meta.url);
  const unresolvedPath = new URL('../src/data/playerSeasonStats.unresolved.json', import.meta.url);

  const outputContent = `export const playerSeasonStatsById = ${JSON.stringify(outputById, null, 2)};\n`;
  await fs.writeFile(outputPath, outputContent, 'utf8');
  await fs.writeFile(unresolvedPath, JSON.stringify(unresolved, null, 2), 'utf8');

  console.log(`Players in dataset: ${entries.length}`);
  console.log(`Season stats extracted: ${Object.keys(outputById).length}`);
  console.log(`Unresolved players: ${unresolved.length}`);
  console.log('Jon Hood seasons:', outputById.hood_jon);
  console.log('Stacey Poole seasons:', outputById.poole_stacey);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
