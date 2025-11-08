import './ARButton.css'

export default function ARButton({ isAthleteInfoExpanded = false, onClick }) {
  return (
    <button
      className={`ar-button ${isAthleteInfoExpanded ? 'shifted' : ''}`}
      onClick={onClick}
      aria-label="Toggle AR view"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Eye outline */}
        <path d="M1 12s4-8 15-8 15 8 15 8-4 8-15 8-15-8-15-8z" />
        {/* Iris circle */}
        <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </button>
  )
}
