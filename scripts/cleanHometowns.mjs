import fs from 'fs/promises';

// Load scraped data
const scrapedData = JSON.parse(await fs.readFile('./scraped_hometowns.json', 'utf8'));

// Clean the data
const cleanedData = scrapedData.map(item => {
  let city = item.hometown.city.replace(/<\/?B>/g, '').trim();
  let state = item.hometown.state.replace(/<\/?B>/g, '').trim();
  
  // If state is empty, try to infer from context or use common defaults
  if (!state) {
    // Some cities are well-known and can be mapped to states
    const cityStateMap = {
      'Morristown': 'New Jersey',
      'Dayton': 'Ohio', 
      'Lima': 'Ohio',
      'Yorktown': 'Virginia',
      'Antioch': 'Tennessee',
      'Covington': 'Kentucky',
      'Fort Valley': 'Georgia',
      'Louisville': 'Kentucky',
      'Corbin': 'Kentucky',
      'Marion': 'Indiana',
      'Houston': 'Texas',
      'Fuget': 'Kentucky',
      'Wells': 'Minnesota',
      'Morganfield': 'Kentucky',
      'Simpsonville': 'Kentucky',
      'Huntington': 'West Virginia',
      'Brooklyn': 'New York',
      'Hazard': 'Kentucky',
      'Ashland': 'Kentucky',
      'Sturgis': 'Kentucky',
      'Hebron': 'Kentucky',
      'Edison': 'Georgia',
      'Miami': 'Florida',
      'Owensboro': 'Kentucky',
      'Lebanon': 'Kentucky',
      'Berea': 'Kentucky',
      'New Albany': 'Indiana',
      'Burlington': 'Kentucky',
      'Maysville': 'Kentucky',
      'Knoxville': 'Tennessee',
      'Martins Ferry': 'Ohio',
      'Valparaiso': 'Indiana',
      'Tollesboro': 'Kentucky',
      'Hamilton': 'Ohio',
      'Lexington': 'Kentucky',
      'Carlisle': 'Kentucky',
      'Morganfield': 'Kentucky',
      'Harlan': 'Kentucky',
      'Hazel': 'Kentucky',
      'Sharpe': 'Kentucky',
      'Tell City': 'Indiana',
      'Versailles': 'Kentucky',
      'Akron': 'Ohio',
      'Middletown': 'Ohio',
      'Peru': 'Indiana',
      'Bronx': 'New York',
      'Fort Wayne': 'Indiana',
      'Evansville': 'Indiana',
      'Savannah': 'Georgia',
      'Barbourville': 'Kentucky',
      'Chicago': 'Illinois',
      'Fort Lauderdale': 'Florida',
      'Midway': 'Kentucky',
      'New York': 'New York',
      'Collinsville': 'Illinois',
      'Yancey': 'North Carolina',
      'Paintsville': 'Kentucky',
      'Manchester': 'Kentucky',
      'Fairmont': 'West Virginia',
      'Four Mile': 'Kentucky',
      'Schenectady': 'New York',
      'Wickliffe': 'Kentucky',
      'Ludlow': 'Kentucky',
      'Lawrenceburg': 'Kentucky',
      'Nashville': 'Tennessee',
      'Bainbridge': 'Georgia',
      'Lynn': 'Massachusetts'
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
await fs.writeFile('./cleaned_hometowns.json', JSON.stringify(validData, null, 2));

// Generate code for hometownData.js
console.log('\n=== Code to add to hometownData.js ===');
validData.forEach(({ id, hometown }) => {
  console.log(`  "${id}": { city: "${hometown.city}", state: "${hometown.state}" },`);
});

console.log(`\nTotal new hometowns to add: ${validData.length}`);
