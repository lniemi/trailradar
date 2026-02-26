import { useRef, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Map from '../components/Map'
import Navbar from '../components/Navbar'
import RaceTimer from '../components/RaceTimer'
import Leaderboard from '../components/Leaderboard'
import AthleteInfoSheet from '../components/AthleteInfoSheet'
import ARButton from '../components/ARButton'
import ARView from '../components/ARViewLocAR'
import StreetLevelView from '../components/StreetLevelView'
import { createAthleteSimulation } from '../simulations/athleteSimulation'
import { createMultiAthleteSimulation } from '../simulations/multiAthleteSimulation'
import { mockAthletes } from '../simulations/mockAthletes'
import { getNearestCameraPosition } from '../utils/cameraPositions'
import { getTrailById } from '../utils/trailStorage'

function Home() {
  const { trailId } = useParams()
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const [routeData, setRouteData] = useState(null)
  const routeCoordinatesRef = useRef(null)
  const [trailLoading, setTrailLoading] = useState(true)
  const [trailError, setTrailError] = useState<string | null>(null)
  const [simulation, setSimulation] = useState(null)
  const simulationRef = useRef(null)
  const [multiSimulation, setMultiSimulation] = useState(null)
  const multiSimulationRef = useRef(null)
  const [raceStartTime, setRaceStartTime] = useState(null)
  const [isRaceRunning, setIsRaceRunning] = useState(false)
  const [athletes, setAthletes] = useState([])
  const [currentAthleteState, setCurrentAthleteState] = useState(null)
  const [simulatedAthleteId, setSimulatedAthleteId] = useState(null)
  const [isMultiAthleteMode, setIsMultiAthleteMode] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [isAthleteInfoExpanded, setIsAthleteInfoExpanded] = useState(false)
  const [isARViewOpen, setIsARViewOpen] = useState(false)
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false)
  const [streetViewPosition, setStreetViewPosition] = useState(null)
  const [athletePositionsForVR, setAthletePositionsForVR] = useState([])

  // Load trail data on mount
  useEffect(() => {
    if (!trailId) {
      navigate('/')
      return
    }

    const loadTrail = async () => {
      try {
        const trail = await getTrailById(trailId)
        if (!trail) {
          setTrailError('Trail not found')
          setTrailLoading(false)
          return
        }

        let data
        if (trail.geojsonData) {
          data = trail.geojsonData
        } else if (trail.geojsonUrl) {
          const response = await fetch(trail.geojsonUrl)
          data = await response.json()
        } else {
          throw new Error('Trail has no route data')
        }

        const coords = data.features[0].geometry.coordinates[0]
        routeCoordinatesRef.current = coords
        setRouteData(data)
      } catch (err) {
        console.error('Failed to load trail:', err)
        setTrailError(err instanceof Error ? err.message : 'Failed to load trail')
      } finally {
        setTrailLoading(false)
      }
    }

    loadTrail()
  }, [trailId])

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
    console.log('[Home] handleCommand received:', command, data)
    switch (command) {
      case 'start_single_athlete':
        console.log('[Home] Starting single athlete simulation for:', data.athlete?.name, 'initialDistance:', data.athlete?.initialDistance)

        // Stop any existing simulations
        if (simulationRef.current) {
          console.log('[Home] Stopping existing single simulation')
          simulationRef.current.stop()
          if (mapRef.current) {
            mapRef.current.removeAthleteMarker()
          }
        }
        if (multiSimulationRef.current) {
          console.log('[Home] Stopping existing multi simulation')
          multiSimulationRef.current.stop()
          if (mapRef.current) {
            mapRef.current.clearAllAthleteMarkers()
          }
          multiSimulationRef.current = null
          setMultiSimulation(null)
        }

        // Create new simulation with selected athlete
        const sim = createAthleteSimulation(data.athlete)
        await sim.initialize(routeCoordinatesRef.current)
        console.log('[Home] Simulation initialized')

        // Set speed before starting if provided
        if (data.speed) {
          console.log('[Home] Setting initial speed to:', data.speed)
          sim.speed = data.speed  // Set speed directly without calling setSpeed()
        }

        console.log('[Home] Calling sim.start()')
        sim.start() // Start immediately at athlete's initial position
        simulationRef.current = sim
        setSimulation(sim)
        setSimulatedAthleteId(data.athlete?.id)
        setIsMultiAthleteMode(false)
        setRaceStartTime(Date.now())
        setIsRaceRunning(true)
        console.log('[Home] Simulation started for athlete ID:', data.athlete?.id)
        break

      case 'start_multiple_athletes':
        console.log('[Home] Starting multiple athletes simulation with', data.athletes?.length, 'athletes')

        // Stop any existing simulations
        if (simulationRef.current) {
          simulationRef.current.stop()
          if (mapRef.current) {
            mapRef.current.removeAthleteMarker()
          }
          simulationRef.current = null
          setSimulation(null)
        }
        if (multiSimulationRef.current) {
          multiSimulationRef.current.stop()
          if (mapRef.current) {
            mapRef.current.clearAllAthleteMarkers()
          }
        }

        // Create multi-athlete simulation
        const multiSim = createMultiAthleteSimulation(data.athletes)
        await multiSim.initialize(routeCoordinatesRef.current)
        console.log('[Home] Multi-athlete simulation initialized')

        multiSim.start()
        multiSimulationRef.current = multiSim
        setMultiSimulation(multiSim)
        setIsMultiAthleteMode(true)
        setSimulatedAthleteId(null)
        setRaceStartTime(Date.now())
        setIsRaceRunning(true)
        console.log('[Home] Multi-athlete simulation started')
        break

      case 'start':
        if (isMultiAthleteMode && multiSimulationRef.current) {
          multiSimulationRef.current.start()
          setRaceStartTime(Date.now())
          setIsRaceRunning(true)
        } else if (simulationRef.current) {
          simulationRef.current.start()
          setRaceStartTime(Date.now())
          setIsRaceRunning(true)
        }
        break

      case 'pause':
        if (isMultiAthleteMode && multiSimulationRef.current) {
          multiSimulationRef.current.pause()
        } else if (simulationRef.current) {
          simulationRef.current.pause()
        }
        break

      case 'resume':
        if (isMultiAthleteMode && multiSimulationRef.current) {
          multiSimulationRef.current.resume()
        } else if (simulationRef.current) {
          simulationRef.current.resume()
        }
        break

      case 'stop':
        if (isMultiAthleteMode && multiSimulationRef.current) {
          multiSimulationRef.current.stop()
          if (mapRef.current) {
            mapRef.current.clearAllAthleteMarkers()
          }
          multiSimulationRef.current = null
          setMultiSimulation(null)
          setIsMultiAthleteMode(false)
        } else if (simulationRef.current) {
          simulationRef.current.stop()
          if (mapRef.current) {
            mapRef.current.removeAthleteMarker()
          }
          simulationRef.current = null
          setSimulation(null)
          setSimulatedAthleteId(null)
        }
        setIsRaceRunning(false)
        setRaceStartTime(null)
        break

      case 'reset':
        if (isMultiAthleteMode && multiSimulationRef.current) {
          multiSimulationRef.current.reset()
        } else if (simulationRef.current) {
          simulationRef.current.reset()
        }
        break

      case 'set_speed':
        if (isMultiAthleteMode && multiSimulationRef.current && data.speed) {
          multiSimulationRef.current.setGlobalSpeed(data.speed)
        } else if (simulationRef.current && data.speed) {
          simulationRef.current.setSpeed(data.speed)
        }
        break

      case 'pause_athlete':
        if (multiSimulationRef.current && data.athleteId) {
          multiSimulationRef.current.pauseAthlete(data.athleteId)
        }
        break

      case 'resume_athlete':
        if (multiSimulationRef.current && data.athleteId) {
          multiSimulationRef.current.resumeAthlete(data.athleteId)
        }
        break

      case 'stop_athlete':
        if (multiSimulationRef.current && data.athleteId) {
          multiSimulationRef.current.stopAthlete(data.athleteId)
        }
        break

      case 'set_athlete_speed':
        if (multiSimulationRef.current && data.athleteId && data.speed) {
          multiSimulationRef.current.setAthleteSpeed(data.athleteId, data.speed)
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

  // Update map marker and broadcast state for single athlete
  useEffect(() => {
    if (!simulation || !mapRef.current || isMultiAthleteMode) return

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
          isRunning: simulation.isRunning,
          mode: 'single'
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
  }, [simulation, isMultiAthleteMode])

  // Update map markers and broadcast state for multiple athletes
  useEffect(() => {
    if (!multiSimulation || !mapRef.current || !isMultiAthleteMode) return

    const interval = setInterval(() => {
      const allStates = multiSimulation.getAllStates()

      if (allStates && allStates.length > 0) {
        // Update athletes list with current distances
        setAthletes(prev => {
          const updated = [...prev]

          allStates.forEach(state => {
            const athleteIndex = updated.findIndex(a => a.id === state.athleteId)
            if (athleteIndex !== -1 && state.distanceCovered !== undefined) {
              updated[athleteIndex] = {
                ...updated[athleteIndex],
                distance: state.distanceCovered,
                speed: state.speed || updated[athleteIndex].speed
              }
            }
          })

          // Sort by distance (descending) to update positions
          return updated.sort((a, b) => b.distance - a.distance)
        })

        // Prepare athlete position data for map
        const athletePositions = allStates.map((state, index) => ({
          id: state.athleteId,
          name: state.athlete?.name,
          position: index + 1, // Position based on order in allStates
          lng: state.position.lng,
          lat: state.position.lat,
          elevation: state.position.elevation
        }))

        // Update all markers on map
        mapRef.current.updateAthletePositions(athletePositions)

        // Also update positions for VR view
        setAthletePositionsForVR(athletePositions)

        // Broadcast all states to SimulationManager
        localStorage.setItem('simulation_state', JSON.stringify({
          mode: 'multiple',
          isRunning: multiSimulation.isRunning,
          isPaused: multiSimulation.isPaused,
          athletes: allStates,
          allFinished: multiSimulation.areAllFinished()
        }))
      }
    }, 100)

    return () => clearInterval(interval)
  }, [multiSimulation, isMultiAthleteMode])

  const handleSelectAthlete = (athlete) => {
    // Center map on selected athlete if they have a position
    console.log('Selected athlete:', athlete)
  }

  const handleARButtonClick = () => {
    console.log('AR button clicked')

    // Determine camera position based on current simulation state
    let position = null

    if (isMultiAthleteMode && athletePositionsForVR.length > 0) {
      // Use the position of the leading athlete
      const leader = athletePositionsForVR[0]
      if (leader) {
        position = getNearestCameraPosition(leader.lng, leader.lat)
      }
    } else if (simulation && currentAthleteState?.position) {
      // Use single athlete position
      position = getNearestCameraPosition(
        currentAthleteState.position.lng,
        currentAthleteState.position.lat
      )
    } else {
      // Default to a scenic viewpoint (Col de la Seigne)
      position = {
        lng: 6.8012,
        lat: 45.7456,
        estimatedElevation: 2516
      }
    }

    setStreetViewPosition(position)
    setIsARViewOpen(true)
  }

  if (trailLoading) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#e5e5e5' }}>
        Loading trail...
      </div>
    )
  }

  if (trailError) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#e5e5e5', gap: '1rem' }}>
        <p>{trailError}</p>
        <button onClick={() => navigate('/')} style={{ color: '#fbbf24', background: 'none', border: '1px solid #fbbf24', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Back to trails
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Navbar />
      <Map ref={mapRef} routeData={routeData} />
      <RaceTimer startTime={raceStartTime} isRunning={isRaceRunning} />
      <Leaderboard
        athletes={athletes}
        hasSelectedAthlete={!!selectedAthlete}
        isAthleteInfoExpanded={isAthleteInfoExpanded}
      />
      <ARButton
        hasSelectedAthlete={!!selectedAthlete}
        isAthleteInfoExpanded={isAthleteInfoExpanded}
        onClick={handleARButtonClick}
      />
      <AthleteInfoSheet
        athletes={athletes}
        onSelectAthlete={handleSelectAthlete}
        simulatedAthleteId={simulatedAthleteId}
        onExpandChange={setIsAthleteInfoExpanded}
        onSelectionChange={setSelectedAthlete}
      />
      <ARView
        isOpen={isARViewOpen}
        onClose={() => setIsARViewOpen(false)}
        athletePositions={athletePositionsForVR}
        currentPosition={streetViewPosition}
      />
      <StreetLevelView
        isOpen={isStreetViewOpen}
        onClose={() => setIsStreetViewOpen(false)}
        athletePositions={athletePositionsForVR}
        currentPosition={streetViewPosition}
      />
    </div>
  )
}

export default Home
