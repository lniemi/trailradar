import { useState } from 'react'
import './Leaderboard.css'

export default function Leaderboard({ athletes = [], hasSelectedAthlete = false, isAthleteInfoExpanded = false }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleLeaderboard = () => {
    setIsOpen(!isOpen)
  }

  // Determine button class based on athlete info states
  const getButtonClass = () => {
    if (isAthleteInfoExpanded) {
      return 'leaderboard-button shifted-expanded'
    } else if (hasSelectedAthlete) {
      return 'leaderboard-button shifted'
    }
    return 'leaderboard-button'
  }

  return (
    <>
      {/* Leaderboard Button */}
      <button
        className={getButtonClass()}
        onClick={toggleLeaderboard}
        aria-label="Toggle leaderboard"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      </button>

      {/* Leaderboard Panel */}
      <div className={`leaderboard-panel ${isOpen ? 'open' : ''}`}>
        <div className="leaderboard-header">
          <h3>Leaderboard</h3>
          <button
            className="close-button"
            onClick={toggleLeaderboard}
            aria-label="Close leaderboard"
          >
            ×
          </button>
        </div>
        <div className="leaderboard-content">
          {athletes.length === 0 ? (
            <div className="no-athletes">
              No athletes in the race yet
            </div>
          ) : (
            <div className="athlete-list">
              {athletes
                .sort((a, b) => b.distance - a.distance)
                .map((athlete, index) => (
                  <div key={athlete.id} className="athlete-item">
                    <span className="position">{index + 1}</span>
                    <div className="athlete-info">
                      <div className="athlete-name">{athlete.name}</div>
                      <div className="athlete-distance">
                        {athlete.distance.toFixed(1)} km
                      </div>
                    </div>
                    {athlete.bib && (
                      <span className="athlete-bib">{athlete.bib}</span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}