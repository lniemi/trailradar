import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StreetLevelView from '../components/StreetLevelView'
import { createMultiAthleteSimulation } from '../simulations/multiAthleteSimulation'
import { mockAthletes } from '../simulations/mockAthletes'
import { getCameraPosition } from '../utils/cameraPositions'

export default function VRSimulationControl() {
  const navigate = useNavigate()
  const [simulation, setSimulation] = useState(null)
  const [isSimulationRunning, setIsSimulationRunning] = useState(false)
  const [athletePositions, setAthletePositions] = useState([])
  const [selectedViewpoint, setSelectedViewpoint] = useState('col_seigne')
  const [showStreetView, setShowStreetView] = useState(false)

  // Predefined viewpoints for testing
  const viewpoints = [
    { id: 'start', name: 'Start Line - Cormayeur' },
    { id: 'col_seigne', name: 'Col de la Seigne (Mountain Pass)' },
    { id: 'les_houches', name: 'Les Houches (Valley)' },
    { id: 'chamonix', name: 'Chamonix Valley' },
    { id: 'champex', name: 'Champex-Lac (Lakeside)' }
  ]

  // Start multi-athlete simulation
  const startSimulation = async () => {
    // Select 5 athletes for the simulation
    const selectedAthletes = mockAthletes.slice(0, 5).map(athlete => ({
      ...athlete,
      // Start them at slightly different positions for variety
      initialDistance: 50 + Math.random() * 100, // 50-150km into the race
      baseSpeed: 8 + Math.random() * 7 // 8-15 km/h
    }))

    const sim = createMultiAthleteSimulation(selectedAthletes)
    await sim.initialize()
    sim.start()

    setSimulation(sim)
    setIsSimulationRunning(true)
  }

  // Stop simulation
  const stopSimulation = () => {
    if (simulation) {
      simulation.stop()
      setSimulation(null)
      setIsSimulationRunning(false)
      setAthletePositions([])
    }
  }

  // Update athlete positions
  useEffect(() => {
    if (!simulation || !isSimulationRunning) return

    const interval = setInterval(() => {
      const allStates = simulation.getAllStates()

      if (allStates && allStates.length > 0) {
        // Sort athletes by distance
        const sortedStates = [...allStates].sort((a, b) =>
          (b.distanceCovered || 0) - (a.distanceCovered || 0)
        )

        // Prepare position data for VR view
        const positions = sortedStates.map((state, index) => ({
          id: state.athleteId,
          name: state.athlete?.name || `Athlete ${state.athleteId}`,
          position: index + 1,
          lng: state.position.lng,
          lat: state.position.lat,
          distance: state.distanceCovered,
          speed: state.speed
        }))

        setAthletePositions(positions)

        // Check if all finished
        if (simulation.areAllFinished()) {
          console.log('All athletes finished!')
          setIsSimulationRunning(false)
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [simulation, isSimulationRunning])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulation) {
        simulation.stop()
      }
    }
  }, [simulation])

  const openStreetView = () => {
    setShowStreetView(true)
  }

  return (
    <>
      <div style={{
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{ margin: 0 }}>VR Simulation Control</h1>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.5rem 1rem',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Back to Map
          </button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '1rem',
          padding: '2rem',
          color: 'white',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginTop: 0 }}>Multi-Athlete VR Testing</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Start a simulation with 5 athletes racing through the TOR330 route.
            View them from street level at various viewpoints along the course.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {!isSimulationRunning ? (
              <button
                onClick={startSimulation}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  ':hover': { transform: 'scale(1.05)' }
                }}
              >
                🏃 Start Simulation
              </button>
            ) : (
              <>
                <button
                  onClick={stopSimulation}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ⏹ Stop Simulation
                </button>
                <button
                  onClick={() => simulation?.pause()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  ⏸ Pause
                </button>
                <button
                  onClick={() => simulation?.resume()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  ▶ Resume
                </button>
              </>
            )}
          </div>
        </div>

        {/* Viewpoint Selection */}
        <div style={{
          background: '#f7f7f7',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginTop: 0 }}>Select Viewpoint</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {viewpoints.map(vp => (
              <label
                key={vp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: selectedViewpoint === vp.id ? '#667eea' : 'white',
                  color: selectedViewpoint === vp.id ? 'white' : '#333',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '2px solid ' + (selectedViewpoint === vp.id ? '#667eea' : '#ddd')
                }}
              >
                <input
                  type="radio"
                  value={vp.id}
                  checked={selectedViewpoint === vp.id}
                  onChange={(e) => setSelectedViewpoint(e.target.value)}
                  style={{ marginRight: '0.5rem' }}
                />
                {vp.name}
              </label>
            ))}
          </div>
        </div>

        {/* Open VR View Button */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button
            onClick={openStreetView}
            disabled={!isSimulationRunning}
            style={{
              padding: '1rem 2rem',
              background: isSimulationRunning ? '#28a745' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              cursor: isSimulationRunning ? 'pointer' : 'not-allowed',
              opacity: isSimulationRunning ? 1 : 0.6,
              transition: 'all 0.2s'
            }}
          >
            👁 Open Street Level View
          </button>
          {!isSimulationRunning && (
            <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              Start the simulation first to enable VR view
            </p>
          )}
        </div>

        {/* Current Athletes Status */}
        {athletePositions.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ marginTop: 0 }}>Live Athlete Positions</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {athletePositions.map(athlete => (
                <div
                  key={athlete.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9f9f9',
                    borderRadius: '0.5rem',
                    borderLeft: `4px solid ${
                      athlete.position === 1 ? '#FFD700' :
                      athlete.position === 2 ? '#C0C0C0' :
                      athlete.position === 3 ? '#CD7F32' : '#667eea'
                    }`
                  }}
                >
                  <div>
                    <strong>#{athlete.position}</strong> {athlete.name}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#666' }}>
                    {athlete.distance?.toFixed(1)} km | {athlete.speed?.toFixed(1)} km/h
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Street Level View */}
      <StreetLevelView
        isOpen={showStreetView}
        onClose={() => setShowStreetView(false)}
        athletePositions={athletePositions}
        currentPosition={getCameraPosition(selectedViewpoint)}
      />
    </>
  )
}