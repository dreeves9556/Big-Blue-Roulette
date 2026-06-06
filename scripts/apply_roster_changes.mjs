import fs from 'fs';

const extracted = JSON.parse(fs.readFileSync('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/scripts/roster_extracted.json', 'utf8'));

const NEW_PLAYERS = [
  { name: 'Dale Brown', id: 'brown_dale', jersey: '31', pos: 'SG' },
  { name: 'Junior Braddy', id: 'braddy_junior', jersey: '23', pos: 'SG' },
  { name: 'Todd Bearup', id: 'bearup_todd', jersey: '13', pos: 'SG' },
  { name: 'Carlos Toomer', id: 'toomer_carlos', jersey: '42', pos: 'PF' },
  { name: 'Jody Thompson', id: 'thompson_jody', jersey: '25', pos: 'SG' },
  { name: 'Johnathon Davis', id: 'davis_johnathon', jersey: '33', pos: 'C' },
  { name: 'Henry Thomas', id: 'thomas_henry', jersey: '21', pos: 'SG' },
  { name: 'Aminu Timberlake', id: 'timberlake_aminu', jersey: '25', pos: 'C' },
  { name: 'Todd Svoboda', id: 'svoboda_todd', jersey: '50', pos: 'PF' },
];

const SEASON_ADDITIONS = {
  'hanson_reggie': ['1990-91'],
  'dent_rodney': ['1992-93'],
  'harrison_chris': ['1991-92', '1992-93'],
  'prickett_jared': ['1992-93'],
  'martinez_gimel': ['1990-91', '1991-92'],
  'riddick_andre': ['1991-92'],
};

function formatStats(stats) {
  const lines = [];
  for (const [season, s] of Object.entries(stats).sort()) {
    lines.push(`    "${season}": {`);
    lines.push(`      "pts": ${s.pts},`);
    lines.push(`      "reb": ${s.reb},`);
    lines.push(`      "ast": ${s.ast},`);
    lines.push(`      "stl": ${s.stl},`);
    lines.push(`      "blk": ${s.blk},`);
    lines.push(`      "games": ${s.games}`);
    lines.push(`    }`);
  }
  return lines.join('\n');
}

function formatPlayer(p) {
  const stats = extracted[p.name];
  const seasons = Object.keys(stats).sort();
  const lines = [];
  lines.push(`  {`);
  lines.push(`    "id": "${p.id}",`);
  lines.push(`    "jerseyNumber": "${p.jersey}",`);
  lines.push(`    "fullName": "${p.name}",`);
  lines.push(`    "seasons": [`);
  seasons.forEach((s, i) => {
    lines.push(`      "${s}"${i < seasons.length - 1 ? ',' : ''}`);
  });
  lines.push(`    ],`);
  lines.push(`    "primaryPosition": "${p.pos}"`);
  lines.push(`  }`);
  return lines.join('\n');
}

// Update players.js
let playersJs = fs.readFileSync('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/players.js', 'utf8');

// Add new players before the closing ];
const newPlayerBlocks = NEW_PLAYERS.map(formatPlayer).join(',\n') + ',';
playersJs = playersJs.replace(
  /\n\];\n\nexport const POSITIONS/,
  `,\n${newPlayerBlocks}\n];\n\nexport const POSITIONS`
);

// Add seasons to existing players
for (const [id, seasons] of Object.entries(SEASON_ADDITIONS)) {
  const regex = new RegExp(`("id": "${id}"[\\s\\S]*?"seasons": \\[)([^\\]]*)(\\])`);
  const match = playersJs.match(regex);
  if (match) {
    const existingSeasonsStr = match[2];
    const existingSeasons = existingSeasonsStr.match(/"[^"]+"/g) || [];
    const allSeasons = [...existingSeasons];
    for (const s of seasons) {
      const seasonStr = `"${s}"`;
      if (!allSeasons.includes(seasonStr)) {
        allSeasons.push(seasonStr);
      }
    }
    allSeasons.sort();
    const newSeasonsBlock = allSeasons.map((s, i) => {
      const indent = '      ';
      return `${indent}${s}${i < allSeasons.length - 1 ? ',' : ''}`;
    }).join('\n');
    playersJs = playersJs.replace(regex, `$1\n${newSeasonsBlock}\n    ]`);
  }
}

fs.writeFileSync('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/players.js', playersJs);
console.log('Updated players.js');

// Update playerSeasonStats.js
let statsJs = fs.readFileSync('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/playerSeasonStats.js', 'utf8');

// Add stats for all players from extracted data
for (const [name, seasons] of Object.entries(extracted)) {
  const id = NEW_PLAYERS.find(p => p.name === name)?.id;
  if (!id) {
    // Find existing player's id by searching for the name in players.js
    const nameMatch = playersJs.match(new RegExp(`"fullName": "${name}"[\\s\\S]*?"id": "([^"]+)"`));
    if (nameMatch) {
      const existingId = nameMatch[1];
      // Check if this ID already exists in stats
      if (statsJs.includes(`"${existingId}":`)) {
        // Add missing seasons to existing stats block
        for (const [season, stat] of Object.entries(seasons).sort()) {
          if (statsJs.includes(`"${existingId}": {`) && !statsJs.includes(`"${existingId}": {\n    "${season}":`)) {
            // Find the last season block for this player and insert after it
            const playerRegex = new RegExp(`("${existingId}": \\{[\\s\\S]*?)(\\n  \\})`);
            const statLines = `\n    "${season}": {\n      "pts": ${stat.pts},\n      "reb": ${stat.reb},\n      "ast": ${stat.ast},\n      "stl": ${stat.stl},\n      "blk": ${stat.blk},\n      "games": ${stat.games}\n    }`;
            // More precise: find the last closing brace before the player's closing }
            const playerStart = statsJs.indexOf(`"${existingId}": {`);
            const playerEnd = statsJs.indexOf('\n  },', playerStart) + 5;
            const playerBlock = statsJs.substring(playerStart, playerEnd);
            const lastSeasonEnd = playerBlock.lastIndexOf('\n    }');
            const insertPos = playerStart + lastSeasonEnd + 6;
            statsJs = statsJs.slice(0, insertPos) + ',' + statLines + statsJs.slice(insertPos);
          }
        }
      }
    }
    continue;
  }

  // New player stats
  const statBlock = `  "${id}": {\n${formatStats(seasons)}\n  }`;
  if (!statsJs.includes(`"${id}":`)) {
    statsJs = statsJs.replace('\n};', `,\n${statBlock}\n};`);
  }
}

fs.writeFileSync('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/playerSeasonStats.js', statsJs);
console.log('Updated playerSeasonStats.js');
