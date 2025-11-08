import { useRef, useState, useEffect } from 'react'
import Map from '../components/Map'
import Navbar from '../components/Navbar'
import SimulationControls from '../components/SimulationControls'
import { createAthleteSimulation } from '../simulations/athleteSimulation'

function Home() {
  const mapRef = useRef(null)
  const [simulation, setSimulation] = useState(null)
  const [showControls, setShowControls] = useState(false)

  const handleStartSimulation = async () => {
    const sim = createAthleteSimulation()
    await sim.initialize()
    setSimulation(sim)
    setShowControls(true)
  }

  const handleCloseSimulation = () => {
    if (simulation) {
      simulation.stop()
      if (mapRef.current) {
        mapRef.current.removeAthleteMarker()
      }
    }
    setSimulation(null)
    setShowControls(false)
  }

  // Update map marker when simulation runs
  useEffect(() => {
    if (!simulation || !mapRef.current) return

    const interval = setInterval(() => {
      const state = simulation.getCurrentState()
      if (state && simulation.isRunning) {
        mapRef.current.updateAthletePosition(
          state.position.lng,
          state.position.lat
        )
      }
    }, 100)

    return () => clearInterval(interval)
  }, [simulation])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Navbar onStartSimulation={handleStartSimulation} />
      <Map ref={mapRef} />
      {showControls && simulation && (
        <SimulationControls
          simulation={simulation}
          onClose={handleCloseSimulation}
        />
      )}
    </div>
  )
}

export default Home
