import { useState, useEffect } from 'react'
import './AthleteInfoSheet.css'

export default function AthleteInfoSheet({ athletes = [], onSelectAthlete, simulatedAthleteId = null, onExpandChange, onSelectionChange }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (athlete.bib && athlete.bib.toString().includes(searchTerm))
  )

  // Auto-select simulated athlete when simulation starts
  useEffect(() => {
    if (simulatedAthleteId) {
      const simulatedAthlete = athletes.find(a => a.id === simulatedAthleteId)
      if (simulatedAthlete) {
        console.log('[AthleteInfoSheet] Auto-selecting simulated athlete:', simulatedAthlete.name)
        setSelectedAthlete(simulatedAthlete)
        setSearchTerm(simulatedAthlete.name)
      }
    }
  }, [simulatedAthleteId, athletes])

  // Update selected athlete data when athletes array changes
  useEffect(() => {
    if (selectedAthlete) {
      const updatedAthlete = athletes.find(a => a.id === selectedAthlete.id)
      if (updatedAthlete) {
        setSelectedAthlete(updatedAthlete)
      }
    }
  }, [athletes])

  // Notify parent when athlete info is expanded/collapsed
  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(!!selectedAthlete && isExpanded)
    }
  }, [selectedAthlete, isExpanded, onExpandChange])

  // Notify parent when athlete is selected/deselected
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedAthlete)
    }
  }, [selectedAthlete, onSelectionChange])

  // Calculate current position based on distance ranking
  const getCurrentPosition = (athlete) => {
    const sorted = [...athletes].sort((a, b) => b.distance - a.distance)
    return sorted.findIndex(a => a.id === athlete.id) + 1
  }

  const handleSelectAthlete = (athlete) => {
    setSelectedAthlete(athlete)
    setShowSearchResults(false)
    setSearchTerm(athlete.name)
    setIsExpanded(false)
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

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleClosePanel = () => {
    setSelectedAthlete(null)
    setSearchTerm('')
    setIsExpanded(false)
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
        <div className={`athlete-info-panel ${isExpanded ? 'expanded' : ''}`}>
          {/* Header Section */}
          <div className="athlete-card-header">
            <button
              className="close-button"
              onClick={handleClosePanel}
              aria-label="Close athlete info"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 5L5 15M5 5l10 10" />
              </svg>
            </button>

            <div className="header-top">
              <div className="position-badge">
                <span className="position-number">{getCurrentPosition(selectedAthlete)}</span>
              </div>

              <div className="header-center">
                <div className="bib-container">
                  {selectedAthlete.nationality && (
                    <span className="nationality-flag">{selectedAthlete.nationality}</span>
                  )}
                  <span className="bib-number">#{selectedAthlete.bib}</span>
                </div>
                <h3 className="athlete-name">{selectedAthlete.name}</h3>
                <div className="distance-display">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C5.8 0 4 1.8 4 4c0 2.4 4 8 4 8s4-5.6 4-8c0-2.2-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                  </svg>
                  <span className="distance-value">{selectedAthlete.distance.toFixed(1)} km</span>
                </div>
              </div>

              <div className="athlete-photo">
                {selectedAthlete.photo ? (
                  <img src={selectedAthlete.photo} alt={selectedAthlete.name} />
                ) : (
                  <div className="photo-placeholder">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor">
                      <circle cx="20" cy="12" r="8" />
                      <path d="M4 36c0-8.8 7.2-16 16-16s16 7.2 16 16" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Age and Club Info */}
            <div className="basic-info">
              <div className="info-row">
                <span className="info-label">Age:</span>
                <span className="info-value">{selectedAthlete.age || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Club:</span>
                <span className="info-value">{selectedAthlete.club || 'N/A'}</span>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              className="show-more-button"
              onClick={toggleExpanded}
              aria-label={isExpanded ? "Show less" : "Show more"}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>

          {/* Expanded Section */}
          {isExpanded && (
            <div className="athlete-card-expanded">
              {/* Previous Experiences */}
              {selectedAthlete.previousExperiences && selectedAthlete.previousExperiences.length > 0 && (
                <div className="experiences-section">
                  <h4 className="section-title">Previous experiences:</h4>
                  <ul className="experiences-list">
                    {selectedAthlete.previousExperiences.map((exp, index) => (
                      <li key={index} className="experience-item">{exp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sponsors */}
              {selectedAthlete.sponsors && selectedAthlete.sponsors.length > 0 && (
                <div className="sponsors-section">
                  <h4 className="section-title">Sponsors</h4>
                  <div className="sponsors-grid">
                    {selectedAthlete.sponsors.map((sponsor, index) => (
                      <div key={index} className="sponsor-logo">
                        {sponsor.logo ? (
                          <img src={sponsor.logo} alt={sponsor.name} />
                        ) : (
                          <div className="sponsor-placeholder">{sponsor.name}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
