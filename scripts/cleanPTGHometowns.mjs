import fs from 'fs/promises';

// Load scraped data
const scrapedData = JSON.parse(await fs.readFile('./scraped_ptg_hometowns.json', 'utf8'));

// Clean the data
const cleanedData = scrapedData.map(item => {
  let city = item.hometown.city.replace(/<\/?B>/g, '').trim();
  let state = item.hometown.state.replace(/<\/?B>/g, '').trim();
  
  // If state is empty, try to infer from context or use common defaults
  if (!state) {
    // Some cities are well-known and can be mapped to states
    const cityStateMap = {
      'New York': 'New York',
      'Louisville': 'Kentucky', 
      'Edmonton': 'Kentucky',
      'Worcester': 'Massachusetts',
      'Bowling Green': 'Kentucky',
      'College Park': 'Georgia',
      'Georgetown': 'Kentucky',
      'St. Lambert': 'Quebec',
      'West Bloomfield': 'Michigan',
      'Bronx': 'New York',
      'St. Charles': 'Missouri',
      'Anchorage': 'Alaska',
      'Lexington': 'Kentucky',
      'Deerfield': 'Illinois',
      'Beverly Hills': 'California',
      'Paris': 'Kentucky',
      'Palmetto': 'Florida',
      'Gliwice': 'Poland',
      'Durham': 'North Carolina',
      'Modesto': 'California',
      'Corbin': 'Kentucky',
      'Paintsville': 'Kentucky',
      'Central City': 'Kentucky',
      'Jacksonville': 'Florida',
      'Montreal': 'Quebec',
      'St. Albans': 'West Virginia'
    };
    
    state = cityStateMap[city] || '';
  }
  
  return {
    id: item.id,
    fullName: item.fullName,
    hometown: { city, state }
  };
});

// Filter out entries with missing states
const validData = cleanedData.filter(item => item.hometown.state);

console.log(`Cleaned ${validData.length} valid hometown entries out of ${scrapedData.length} total`);

// Save cleaned data
await fs.writeFile('./cleaned_ptg_hometowns.json', JSON.stringify(validData, null, 2));

// Generate code for hometownData.js
console.log('\n=== Code to add to hometownData.js ===');
validData.forEach(({ id, hometown }) => {
  console.log(`  "${id}": { city: "${hometown.city}", state: "${hometown.state}" },`);
});

console.log(`\nTotal new hometowns to add: ${validData.length}`);
