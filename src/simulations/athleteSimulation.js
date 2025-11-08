import { calculateTotalDistance, getPositionAtDistance } from './utils'

/**
 * Athlete simulation class for TOR330 route
 */
export class AthleteSimulation {
  constructor(athleteData = null) {
    this.routeCoordinates = null
    this.totalDistance = 0
    this.startTime = null
    this.speed = 4 // km/h
    this.isRunning = false
    this.isPaused = false
    this.pausedDistance = 0
    this.athleteData = athleteData // Store athlete info (name, bib, id, etc.)
  }

  /**
   * Initialize the simulation by loading the route
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const response = await fetch('/TOR330.geojson')
      const data = await response.json()

      // Extract coordinates from the MultiLineString geometry
      this.routeCoordinates = data.features[0].geometry.coordinates[0]
      this.totalDistance = calculateTotalDistance(this.routeCoordinates)

      console.log(`Route loaded: ${this.routeCoordinates.length} points, ${this.totalDistance.toFixed(2)} km total`)

      return {
        totalDistance: this.totalDistance,
        totalPoints: this.routeCoordinates.length
      }
    } catch (error) {
      console.error('Error loading route:', error)
      throw error
    }
  }

  /**
   * Start the simulation
   */
  start() {
    if (!this.routeCoordinates) {
      throw new Error('Simulation not initialized. Call initialize() first.')
    }

    this.startTime = Date.now()
    this.isRunning = true
    this.isPaused = false
    this.pausedDistance = 0
  }

  /**
   * Pause the simulation
   */
  pause() {
    if (this.isRunning && !this.isPaused) {
      this.isPaused = true
      const currentState = this.getCurrentState()
      this.pausedDistance = currentState.distanceCovered
    }
  }

  /**
   * Resume the simulation
   */
  resume() {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false
      this.startTime = Date.now()
    }
  }

  /**
   * Stop the simulation
   */
  stop() {
    this.isRunning = false
    this.isPaused = false
    this.startTime = null
    this.pausedDistance = 0
  }

  /**
   * Reset the simulation to the beginning
   */
  reset() {
    this.stop()
  }

  /**
   * Set the speed of the athlete
   * @param {number} kmPerHour - Speed in km/h
   */
  setSpeed(kmPerHour) {
    const currentState = this.getCurrentState()
    this.speed = kmPerHour
    this.pausedDistance = currentState.distanceCovered
    this.startTime = Date.now()
  }

  /**
   * Get the current state of the simulation
   * @returns {Object} Current state with position, distance, progress, etc.
   */
  getCurrentState() {
    if (!this.isRunning) {
      // Return starting position
      const startCoord = this.routeCoordinates[0]
      return {
        position: {
          lng: startCoord[0],
          lat: startCoord[1],
          elevation: startCoord[2]
        },
        distanceCovered: 0,
        progressPercent: 0,
        elapsedTime: 0,
        estimatedTotalTime: this.totalDistance / this.speed,
        speed: this.speed,
        isFinished: false,
        athlete: this.athleteData
      }
    }

    // Calculate elapsed time in hours
    let elapsedTimeHours
    if (this.isPaused) {
      elapsedTimeHours = 0
    } else {
      const elapsedTimeMs = Date.now() - this.startTime
      elapsedTimeHours = elapsedTimeMs / (1000 * 60 * 60)
    }

    // Calculate distance covered (distance = speed × time)
    const distanceCovered = Math.min(
      this.pausedDistance + (this.speed * elapsedTimeHours),
      this.totalDistance
    )

    // Get position at this distance
    const position = getPositionAtDistance(this.routeCoordinates, distanceCovered)

    // Calculate progress
    const progressPercent = (distanceCovered / this.totalDistance) * 100
    const isFinished = distanceCovered >= this.totalDistance

    // Calculate estimated total time
    const estimatedTotalTime = this.totalDistance / this.speed

    return {
      position: {
        lng: position.lng,
        lat: position.lat,
        elevation: position.elevation
      },
      distanceCovered,
      progressPercent,
      elapsedTime: (this.pausedDistance / this.speed) + elapsedTimeHours,
      estimatedTotalTime,
      speed: this.speed,
      isFinished,
      isPaused: this.isPaused,
      athlete: this.athleteData
    }
  }
}

/**
 * Create a new athlete simulation instance
 * @param {Object} athleteData - Optional athlete data (id, name, bib, baseSpeed, etc.)
 * @returns {AthleteSimulation}
 */
export function createAthleteSimulation(athleteData = null) {
  return new AthleteSimulation(athleteData)
}
