import fs from 'fs/promises';

// Load scraped data
const scrapedData = JSON.parse(await fs.readFile('./scraped_cal_pope_hometowns.json', 'utf8'));

// Clean the data
const cleanedData = scrapedData.map(item => {
  let city = item.hometown.city.replace(/<\/?B>/g, '').trim();
  let state = item.hometown.state.replace(/<\/?B>/g, '').trim();
  
  // If state is empty, try to infer from context or use common defaults
  if (!state) {
    // Some cities are well-known and can be mapped to states
    const cityStateMap = {
      'Spring Valley': 'New York',
      'Sacramento': 'California', 
      'Menifee': 'California',
      'Louisville': 'Kentucky',
      'Washington Heights': 'New York',
      'Union': 'New Jersey',
      'Lexington': 'Kentucky',
      'Mt. Lebanon': 'Pennsylvania',
      'Queens': 'New York',
      'St. Louis': 'Missouri',
      'Palo Alto': 'California',
      'Philadelphia': 'Pennsylvania',
      'Marietta': 'Georgia',
      'Linton': 'Indiana',
      'Madisonville': 'Kentucky',
      'Oak Park': 'Illinois',
      'Brooklyn': 'New York',
      'Tampa': 'Florida',
      'Akron': 'Ohio',
      'Dumont': 'New Jersey',
      'Camby': 'Indiana',
      'Scituate': 'Massachusetts',
      'Marion': 'Indiana',
      'Windsor': 'Ontario',
      'Eddyville': 'Kentucky',
      'Jacksonville': 'Florida',
      'Cynthiana': 'Kentucky',
      'Kingston': 'Jamaica',
      'Indianapolis': 'Indiana',
      'Frisco': 'Texas',
      'Phoenix': 'Arizona',
      'Rochester Hills': 'Michigan'
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
await fs.writeFile('./cleaned_cal_pope_hometowns.json', JSON.stringify(validData, null, 2));

// Generate code for hometownData.js
console.log('\n=== Code to add to hometownData.js ===');
validData.forEach(({ id, hometown }) => {
  console.log(`  "${id}": { city: "${hometown.city}", state: "${hometown.state}" },`);
});

console.log(`\nTotal new hometowns to add: ${validData.length}`);

// Show which players are still missing
console.log('\nPlayers still missing hometowns (not found on BigBlueHistory):');
console.log('- Denzel Aberdeen (current player - may not have page yet)');
console.log('- Shai Gilgeous-Alexander (404 error - hyphenated name issue)');
console.log('- Braydon Hawthorne (current player - may not have page yet)');
console.log('- Michael Kidd-Gilchrist (404 error - hyphenated name issue)');
console.log('- Jayden Quaintance (current player - may not have page yet)');
