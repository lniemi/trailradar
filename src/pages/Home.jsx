import { useRef, useState, useEffect } from 'react'
import Map from '../components/Map'
import Navbar from '../components/Navbar'
import { createAthleteSimulation } from '../simulations/athleteSimulation'

function Home() {
  const mapRef = useRef(null)
  const [simulation, setSimulation] = useState(null)
  const simulationRef = useRef(null)

  // Listen for commands from SimulationManager window
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'simulation_command' && e.newValue) {
        try {
          const { command, data } = JSON.parse(e.newValue)
          handleCommand(command, data)
        } catch (err) {
          console.error('Failed to parse simulation command:', err)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleCommand = async (command, data = {}) => {
    switch (command) {
      case 'start_single_athlete':
        if (!simulationRef.current) {
          const sim = createAthleteSimulation()
          await sim.initialize()
          if (data.speed) {
            sim.setSpeed(data.speed)
          }
          simulationRef.current = sim
          setSimulation(sim)
        }
        break

      case 'start':
        if (simulationRef.current) {
          simulationRef.current.start()
        }
        break

      case 'pause':
        if (simulationRef.current) {
          simulationRef.current.pause()
        }
        break

      case 'resume':
        if (simulationRef.current) {
          simulationRef.current.resume()
        }
        break

      case 'stop':
        if (simulationRef.current) {
          simulationRef.current.stop()
          if (mapRef.current) {
            mapRef.current.removeAthleteMarker()
          }
          simulationRef.current = null
          setSimulation(null)
        }
        break

      case 'reset':
        if (simulationRef.current) {
          simulationRef.current.reset()
        }
        break

      case 'set_speed':
        if (simulationRef.current && data.speed) {
          simulationRef.current.setSpeed(data.speed)
        }
        break
    }
  }

  // Update map marker and broadcast state
  useEffect(() => {
    if (!simulation || !mapRef.current) return

    const interval = setInterval(() => {
      const state = simulation.getCurrentState()
      if (state) {
        // Update map marker
        if (simulation.isRunning && !state.isPaused) {
          mapRef.current.updateAthletePosition(
            state.position.lng,
            state.position.lat
          )
        }

        // Broadcast state to SimulationManager window
        localStorage.setItem('simulation_state', JSON.stringify({
          ...state,
          isRunning: simulation.isRunning
        }))
      }
    }, 100)

    return () => clearInterval(interval)
  }, [simulation])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Navbar />
      <Map ref={mapRef} />
    </div>
  )
}

export default Home
