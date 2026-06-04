// Kentucky Wildcats Head Coaching Eras
// Data sourced from bigbluehistory.net and Wikipedia

export const COACHING_ERAS = [
  {
    id: 'all',
    name: 'All-Time',
    coach: 'All Coaches',
    startYear: 1903,
    endYear: 2026,
    color: '#6b7280', // gray
  },
  {
    id: 'rupp',
    name: 'Rupp Era',
    coach: 'Adolph Rupp',
    startYear: 1930,
    endYear: 1972,
    color: '#1d4ed8', // blue
    championships: [1948, 1949, 1951, 1958],
  },
  {
    id: 'hall',
    name: 'Hall Era',
    coach: 'Joe B. Hall',
    startYear: 1972,
    endYear: 1985,
    color: '#7c3aed', // purple
    championships: [1978],
  },
  {
    id: 'sutton',
    name: 'Sutton Era',
    coach: 'Eddie Sutton',
    startYear: 1985,
    endYear: 1989,
    color: '#ea580c', // orange
  },
  {
    id: 'pitino',
    name: 'Pitino Era',
    coach: 'Rick Pitino',
    startYear: 1989,
    endYear: 1997,
    color: '#dc2626', // red
    championships: [1996],
  },
  {
    id: 'tubby',
    name: 'Tubby Era',
    coach: 'Tubby Smith',
    startYear: 1997,
    endYear: 2007,
    color: '#16a34a', // green
    championships: [1998],
  },
  {
    id: 'gillispie',
    name: 'Gillispie Era',
    coach: 'Billy Gillispie',
    startYear: 2007,
    endYear: 2009,
    color: '#9333ea', // violet
  },
  {
    id: 'calipari',
    name: 'Calipari Era',
    coach: 'John Calipari',
    startYear: 2009,
    endYear: 2024,
    color: '#2563eb', // bright blue
    championships: [2012],
  },
  {
    id: 'pope',
    name: 'Pope Era',
    coach: 'Mark Pope',
    startYear: 2024,
    endYear: 2026,
    color: '#db2777', // pink
  },
];

// Helper function to get coaching era for a given season (e.g., "2023-24")
export function getEraForSeason(season) {
  const year = parseInt(season.split('-')[0], 10);
  
  for (const era of COACHING_ERAS) {
    if (era.id === 'all') continue;
    if (year >= era.startYear && year < era.endYear) {
      return era;
    }
  }
  return null;
}

// Helper function to get all eras a player belongs to
export function getPlayerEras(player) {
  const eras = new Set();
  
  for (const season of player.seasons || []) {
    const era = getEraForSeason(season);
    if (era) {
      eras.add(era.id);
    }
  }
  
  return Array.from(eras);
}

// Helper to check if player belongs to specific era
export function playerBelongsToEra(player, eraId) {
  if (eraId === 'all') return true;
  
  const eras = getPlayerEras(player);
  return eras.includes(eraId);
}
