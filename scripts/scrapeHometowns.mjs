import fs from 'fs/promises';
import { players } from '../src/data/players.js';
import { HOMETOWN_DATA } from '../src/data/hometownData.js';
import { getPlayerEras } from '../src/data/coaches.js';

// Focus on Rupp, Hall, and Pitino eras
const targetEras = ['rupp', 'hall', 'pitino'];
const playersInTargetEras = players.filter(player => {
  const eras = getPlayerEras(player);
  return eras.some(era => targetEras.includes(era));
});

// Get players missing hometown data
const missingPlayers = playersInTargetEras.filter(player => 
  !HOMETOWN_DATA[player.id]
);

console.log(`Found ${missingPlayers.length} players from Rupp/Hall/Pitino eras missing hometown data`);

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Build BigBlueHistory URL for a player
function buildBigBlueHistoryUrl(player) {
  const nameParts = player.fullName.split(' ');
  if (nameParts.length < 2) return null;
  
  const lastName = nameParts[nameParts.length - 1];
  const firstName = nameParts.slice(0, -1).join(' ');
  
  return `http://www.bigbluehistory.net/bb/statistics/Players/${lastName}_${firstName}.html`;
}

// Scrape hometown from BigBlueHistory page
async function scrapeHometown(player) {
  const url = buildBigBlueHistoryUrl(player);
  if (!url) return null;
  
  try {
    console.log(`Scraping: ${player.fullName} from ${url}`);
    
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    if (!response.ok) {
      console.log(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Look for hometown information in the page
    // Common patterns: "Born:", "Hometown:", "From:", etc.
    const patterns = [
      /Born:\s*([^,\n]+),\s*([A-Za-z\s]+)/i,
      /Hometown:\s*([^,\n]+),\s*([A-Za-z\s]+)/i,
      /From:\s*([^,\n]+),\s*([A-Za-z\s]+)/i,
      /(?:Born|Hometown|From)\s+in\s+([^,\n]+),\s*([A-Za-z\s]+)/i,
      /\(([^,\n]+),\s*([A-Za-z\s]+)\)/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const city = match[1].trim();
        const state = match[2].trim();
        console.log(`Found hometown for ${player.fullName}: ${city}, ${state}`);
        return { city, state };
      }
    }
    
    console.log(`No hometown found for ${player.fullName}`);
    return null;
    
  } catch (error) {
    console.log(`Error scraping ${player.fullName}: ${error.message}`);
    return null;
  }
}

// Main scraping function
async function scrapeMissingHometowns() {
  const results = [];
  
  for (let i = 0; i < missingPlayers.length; i++) {
    const player = missingPlayers[i];
    console.log(`\nProgress: ${i + 1}/${missingPlayers.length}`);
    
    const hometown = await scrapeHometown(player);
    
    if (hometown) {
      results.push({
        id: player.id,
        fullName: player.fullName,
        hometown
      });
    }
    
    // Add delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save results
  const outputPath = './scraped_hometowns.json';
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
  
  console.log(`\nScraped ${results.length} hometowns. Saved to ${outputPath}`);
  
  // Generate code to add to hometownData.js
  console.log('\n=== Code to add to hometownData.js ===');
  results.forEach(({ id, hometown }) => {
    console.log(`  "${id}": { city: "${hometown.city}", state: "${hometown.state}" },`);
  });
}

// Run the scraper
scrapeMissingHometowns().catch(console.error);
