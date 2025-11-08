/**
 * Mock athlete data for simulation and testing
 */
export const mockAthletes = [
  {
    id: 1,
    name: 'Sarah Johnson',
    bib: '101',
    baseSpeed: 12.3,
    initialDistance: 42.5,
    position: 1
  },
  {
    id: 2,
    name: 'Mike Chen',
    bib: '102',
    baseSpeed: 11.8,
    initialDistance: 41.2,
    position: 2
  },
  {
    id: 3,
    name: 'Emma Wilson',
    bib: '103',
    baseSpeed: 11.5,
    initialDistance: 39.8,
    position: 3
  },
  {
    id: 4,
    name: 'Carlos Rodriguez',
    bib: '104',
    baseSpeed: 11.2,
    initialDistance: 38.5,
    position: 4
  },
  {
    id: 5,
    name: 'Anna Schmidt',
    bib: '105',
    baseSpeed: 10.9,
    initialDistance: 37.2,
    position: 5
  },
  {
    id: 6,
    name: 'James Park',
    bib: '106',
    baseSpeed: 10.6,
    initialDistance: 35.8,
    position: 6
  },
  {
    id: 7,
    name: 'Maria Silva',
    bib: '107',
    baseSpeed: 10.3,
    initialDistance: 34.5,
    position: 7
  },
  {
    id: 8,
    name: 'Tom Anderson',
    bib: '108',
    baseSpeed: 10.0,
    initialDistance: 33.2,
    position: 8
  },
  {
    id: 9,
    name: 'Lisa Zhang',
    bib: '109',
    baseSpeed: 9.7,
    initialDistance: 31.8,
    position: 9
  },
  {
    id: 10,
    name: 'David Miller',
    bib: '110',
    baseSpeed: 9.4,
    initialDistance: 30.5,
    position: 10
  }
]

/**
 * Get athlete by ID
 * @param {number} id - Athlete ID
 * @returns {Object|undefined} Athlete object or undefined if not found
 */
export function getAthleteById(id) {
  return mockAthletes.find(athlete => athlete.id === id)
}

/**
 * Get athlete by bib number
 * @param {string} bib - Bib number
 * @returns {Object|undefined} Athlete object or undefined if not found
 */
export function getAthleteByBib(bib) {
  return mockAthletes.find(athlete => athlete.bib === bib)
}
