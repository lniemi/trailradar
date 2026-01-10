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
    position: 1,
    age: 28,
    nationality: 'US',
    club: 'Boulder Trail Runners',
    photo: null,
    previousExperiences: [
      '2nd Tor des Glaciers 2024',
      '1st Ultra-Trail du Mont-Blanc 2023',
      '5th Western States 2023'
    ],
    sponsors: [
      { name: 'Salomon', logo: null },
      { name: 'Red Bull', logo: null }
    ]
  },
  {
    id: 2,
    name: 'Mike Chen',
    bib: '102',
    baseSpeed: 11.8,
    initialDistance: 41.2,
    position: 2,
    age: 32,
    nationality: 'CN',
    club: 'Shanghai Mountain Club',
    photo: null,
    previousExperiences: [
      '3rd Tor des Glaciers 2024',
      '2nd UTMB 2023',
      '8th Hardrock 100 2022'
    ],
    sponsors: [
      { name: 'The North Face', logo: null },
      { name: 'Suunto', logo: null }
    ]
  },
  {
    id: 3,
    name: 'Emma Wilson',
    bib: '103',
    baseSpeed: 11.5,
    initialDistance: 39.8,
    position: 3,
    age: 26,
    nationality: 'GB',
    club: 'Lake District Runners',
    photo: null,
    previousExperiences: [
      '1st Tor des Glaciers 2025',
      '4th Tor des Géants 2023',
      '27th Macina Valmeriana 2020'
    ],
    sponsors: [
      { name: 'La Sportiva', logo: null },
      { name: 'The North Face', logo: null },
      { name: 'Garmin', logo: null }
    ]
  },
  {
    id: 4,
    name: 'Carlos Rodriguez',
    bib: '104',
    baseSpeed: 11.2,
    initialDistance: 38.5,
    position: 4,
    age: 35,
    nationality: 'ES',
    club: 'Club Alpino Español',
    photo: null,
    previousExperiences: [
      '5th Tor des Glaciers 2024',
      '12th UTMB 2023',
      '3rd Transgrancanaria 2023'
    ],
    sponsors: [
      { name: 'Hoka', logo: null }
    ]
  },
  {
    id: 5,
    name: 'Anna Schmidt',
    bib: '105',
    baseSpeed: 10.9,
    initialDistance: 37.2,
    position: 5,
    age: 29,
    nationality: 'DE',
    club: 'Bavarian Trail Club',
    photo: null,
    previousExperiences: [
      '7th Tor des Glaciers 2024',
      '15th UTMB 2023'
    ],
    sponsors: [
      { name: 'Salomon', logo: null },
      { name: 'Garmin', logo: null }
    ]
  },
  {
    id: 6,
    name: 'James Park',
    bib: '106',
    baseSpeed: 10.6,
    initialDistance: 35.8,
    position: 6,
    age: 31,
    nationality: 'KR',
    club: 'Seoul Ultra Runners',
    photo: null,
    previousExperiences: [
      '10th Tor des Glaciers 2024',
      '20th UTMB 2022'
    ],
    sponsors: []
  },
  {
    id: 7,
    name: 'Maria Silva',
    bib: '107',
    baseSpeed: 10.3,
    initialDistance: 34.5,
    position: 7,
    age: 27,
    nationality: 'BR',
    club: 'Rio Trail Running',
    photo: null,
    previousExperiences: [
      '12th Tor des Glaciers 2024',
      '8th Patagonia Run 2023'
    ],
    sponsors: [
      { name: 'Nike', logo: null }
    ]
  },
  {
    id: 8,
    name: 'Tom Anderson',
    bib: '108',
    baseSpeed: 10.0,
    initialDistance: 33.2,
    position: 8,
    age: 40,
    nationality: 'SE',
    club: 'Stockholm Trail Society',
    photo: null,
    previousExperiences: [
      '15th Tor des Glaciers 2023',
      '25th UTMB 2023'
    ],
    sponsors: []
  },
  {
    id: 9,
    name: 'Lisa Zhang',
    bib: '109',
    baseSpeed: 9.7,
    initialDistance: 31.8,
    position: 9,
    age: 24,
    nationality: 'CN',
    club: 'Beijing Mountain Runners',
    photo: null,
    previousExperiences: [
      '18th Tor des Glaciers 2024'
    ],
    sponsors: [
      { name: 'Altra', logo: null }
    ]
  },
  {
    id: 10,
    name: 'David Miller',
    bib: '110',
    baseSpeed: 9.4,
    initialDistance: 30.5,
    position: 10,
    age: 38,
    nationality: 'CA',
    club: 'Vancouver Trail Blazers',
    photo: null,
    previousExperiences: [
      '22nd Tor des Glaciers 2024',
      '30th UTMB 2022'
    ],
    sponsors: [
      { name: 'Arc\'teryx', logo: null }
    ]
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
