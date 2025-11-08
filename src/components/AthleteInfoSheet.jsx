import { useState, useEffect } from 'react'
import './AthleteInfoSheet.css'

export default function AthleteInfoSheet({ athletes = [], onSelectAthlete }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [showSearchResults, setShowSearchResults] = useState(false)

  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (athlete.bib && athlete.bib.toString().includes(searchTerm))
  )

  // Update selected athlete data when athletes array changes
  useEffect(() => {
    if (selectedAthlete) {
      const updatedAthlete = athletes.find(a => a.id === selectedAthlete.id)
      if (updatedAthlete) {
        setSelectedAthlete(updatedAthlete)
      }
    }
  }, [athletes])

  // Calculate current position based on distance ranking
  const getCurrentPosition = (athlete) => {
    const sorted = [...athletes].sort((a, b) => b.distance - a.distance)
    return sorted.findIndex(a => a.id === athlete.id) + 1
  }

  const handleSelectAthlete = (athlete) => {
    setSelectedAthlete(athlete)
    setShowSearchResults(false)
    setSearchTerm(athlete.name)
    if (onSelectAthlete) {
      onSelectAthlete(athlete)
    }
  }

  const handleSearchFocus = () => {
    setShowSearchResults(true)
  }

  const handleSearchBlur = () => {
    // Delay to allow click on search result
    setTimeout(() => setShowSearchResults(false), 200)
  }

  return (
    <div className="athlete-info-sheet">
      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <svg
            className="search-icon"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="9" r="7" />
            <path d="M14 14l4 4" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search athlete..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchTerm && filteredAthletes.length > 0 && (
          <div className="search-results">
            {filteredAthletes.slice(0, 5).map(athlete => (
              <div
                key={athlete.id}
                className="search-result-item"
                onClick={() => handleSelectAthlete(athlete)}
              >
                <span className="result-name">{athlete.name}</span>
                {athlete.bib && (
                  <span className="result-bib">#{athlete.bib}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Athlete Info Panel */}
      {selectedAthlete && (
        <div className="athlete-info-panel">
          <div className="athlete-header">
            <div className="athlete-main-info">
              <h3 className="athlete-name">{selectedAthlete.name}</h3>
              {selectedAthlete.bib && (
                <span className="athlete-bib-large">#{selectedAthlete.bib}</span>
              )}
            </div>
            <button className="camera-button" aria-label="View athlete camera">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="7" width="20" height="15" rx="2" />
                <path d="M17 7l5-5v15l-5-5" />
              </svg>
            </button>
          </div>

          <div className="athlete-stats">
            <div className="stat-item">
              <svg
                className="stat-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 0C5.8 0 4 1.8 4 4c0 2.4 4 8 4 8s4-5.6 4-8c0-2.2-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
              </svg>
              <span className="stat-value">{selectedAthlete.distance.toFixed(1)} km</span>
            </div>

            <div className="stat-item">
              <span className="position-label">Position</span>
              <span className="position-value">{getCurrentPosition(selectedAthlete)}</span>
            </div>

            {selectedAthlete.speed && (
              <div className="stat-item">
                <svg
                  className="stat-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 2L2 14h12L8 2zm0 3.5L11.5 12h-7L8 5.5z" />
                </svg>
                <span className="stat-value">{selectedAthlete.speed.toFixed(1)} km/h</span>
              </div>
            )}
          </div>

          {selectedAthlete.checkpoint && (
            <div className="checkpoint-info">
              <span className="checkpoint-label">Last checkpoint:</span>
              <span className="checkpoint-value">{selectedAthlete.checkpoint}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}