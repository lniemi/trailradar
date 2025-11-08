import { useRef, useState, useEffect } from 'react'
import Map from '../components/Map'
import Navbar from '../components/Navbar'
import RaceTimer from '../components/RaceTimer'
import Leaderboard from '../components/Leaderboard'
import AthleteInfoSheet from '../components/AthleteInfoSheet'
import { createAthleteSimulation } from '../simulations/athleteSimulation'
import { mockAthletes } from '../simulations/mockAthletes'

function Home() {
  const mapRef = useRef(null)
  const [simulation, setSimulation] = useState(null)
  const simulationRef = useRef(null)
  const [raceStartTime, setRaceStartTime] = useState(null)
  const [isRaceRunning, setIsRaceRunning] = useState(false)
  const [athletes, setAthletes] = useState([])
  const [currentAthleteState, setCurrentAthleteState] = useState(null)

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
          const sim = createAthleteSimulation(data.athlete)
          await sim.initialize()
          if (data.speed) {
            sim.setSpeed(data.speed)
          }
          simulationRef.current = sim
          setSimulation(sim)
          setRaceStartTime(Date.now())
          setIsRaceRunning(true)
        }
        break

      case 'start':
        if (simulationRef.current) {
          simulationRef.current.start()
          setRaceStartTime(Date.now())
          setIsRaceRunning(true)
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
          setIsRaceRunning(false)
          setRaceStartTime(null)
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

  // Initialize mock athletes
  useEffect(() => {
    // Map mock athletes to include distance and speed for display
    const athletesWithStats = mockAthletes.map(athlete => ({
      ...athlete,
      distance: athlete.initialDistance,
      speed: athlete.baseSpeed
    }))
    setAthletes(athletesWithStats)
  }, [])

  // Update map marker and broadcast state
  useEffect(() => {
    if (!simulation || !mapRef.current) return

    const interval = setInterval(() => {
      const state = simulation.getCurrentState()
      if (state) {
        setCurrentAthleteState(state)

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

        // Update the correct athlete in the list with simulation data
        if (state.distanceCovered !== undefined && state.athlete) {
          setAthletes(prev => {
            const updated = [...prev]
            const athleteIndex = updated.findIndex(a => a.id === state.athlete.id)
            if (athleteIndex !== -1) {
              updated[athleteIndex] = {
                ...updated[athleteIndex],
                distance: state.distanceCovered,
                speed: state.speed || updated[athleteIndex].speed
              }
            }
            return updated
          })
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [simulation])

  const handleSelectAthlete = (athlete) => {
    // Center map on selected athlete if they have a position
    console.log('Selected athlete:', athlete)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Navbar />
      <Map ref={mapRef} />
      <RaceTimer startTime={raceStartTime} isRunning={isRaceRunning} />
      <Leaderboard athletes={athletes} />
      <AthleteInfoSheet
        athletes={athletes}
        onSelectAthlete={handleSelectAthlete}
      />
    </div>
  )
}

export default Home
