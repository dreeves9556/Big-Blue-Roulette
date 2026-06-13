const PLAYER_PAGE_BASE = 'http://www.bigbluehistory.com/bb/statistics/Players';

const players = [
  'Bird_Jerry', 'Burrow_Bob', 'Evans_Billy', 'Cohen_Sid', 'Tsioropoulos_Lou'
];

for (const player of players) {
  console.log(`\n=== ${player} ===`);
  try {
    const res = await fetch(`${PLAYER_PAGE_BASE}/${player}.html`);
    const html = await res.text();
    
    // Find table content
    const tableMatch = html.match(/<TABLE BORDER>([\s\S]*?)<\/TABLE>/);
    if (tableMatch) {
      const tableHtml = tableMatch[1];
      // Extract rows
      const rows = tableHtml.match(/<TR>[\s\S]*?<\/TR>/g);
      for (const row of rows) {
        // Extract season
        const seasonMatch = row.match(/stat(\d{4}-\d{2})/);
        const season = seasonMatch ? seasonMatch[1] : null;
        if (!season) {
          // Check if it's the total row
          if (row.includes('Total')) {
            const tds = [...row.matchAll(/<TD>(?:<B>)?([^<]+)(?:<\/B>)?<\/TD>/g)].map(m => m[1].trim());
            console.log(`  TOTAL: ${tds.join(' | ')}`);
          }
          continue;
        }
        // Extract all TD values
        const tds = [...row.matchAll(/<TD>([^<]*)<\/TD>/g)].map(m => m[1].trim());
        console.log(`  ${season}: ${tds.join(' | ')}`);
      }
    } else {
      console.log('  No table found');
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }
}
