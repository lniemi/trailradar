import { AthleteSimulation } from './athleteSimulation'

/**
 * Manages multiple athlete simulations concurrently
 */
export class MultiAthleteSimulation {
  constructor(athletes = []) {
    this.simulations = new Map() // Map<athleteId, AthleteSimulation>
    this.athletes = athletes
    this.isRunning = false
    this.isPaused = false

    console.log('[MultiAthleteSimulation] Created with', athletes.length, 'athletes')
  }

  /**
   * Initialize all athlete simulations
   * @returns {Promise<void>}
   */
  async initialize() {
    console.log('[MultiAthleteSimulation] Initializing all simulations')

    for (const athlete of this.athletes) {
      const simulation = new AthleteSimulation(athlete)
      await simulation.initialize()
      this.simulations.set(athlete.id, simulation)
    }

    console.log('[MultiAthleteSimulation] All simulations initialized')
  }

  /**
   * Start all athlete simulations
   */
  start() {
    console.log('[MultiAthleteSimulation] Starting all simulations')

    this.simulations.forEach((simulation) => {
      simulation.start()
    })

    this.isRunning = true
    this.isPaused = false
  }

  /**
   * Pause all athlete simulations
   */
  pause() {
    console.log('[MultiAthleteSimulation] Pausing all simulations')

    this.simulations.forEach((simulation) => {
      simulation.pause()
    })

    this.isPaused = true
  }

  /**
   * Resume all athlete simulations
   */
  resume() {
    console.log('[MultiAthleteSimulation] Resuming all simulations')

    this.simulations.forEach((simulation) => {
      simulation.resume()
    })

    this.isPaused = false
  }

  /**
   * Stop all athlete simulations
   */
  stop() {
    console.log('[MultiAthleteSimulation] Stopping all simulations')

    this.simulations.forEach((simulation) => {
      simulation.stop()
    })

    this.isRunning = false
    this.isPaused = false
  }

  /**
   * Reset all athlete simulations
   */
  reset() {
    console.log('[MultiAthleteSimulation] Resetting all simulations')

    this.simulations.forEach((simulation) => {
      simulation.reset()
    })
  }

  /**
   * Pause a specific athlete
   * @param {number} athleteId - Athlete ID to pause
   */
  pauseAthlete(athleteId) {
    const simulation = this.simulations.get(athleteId)
    if (simulation) {
      simulation.pause()
      console.log('[MultiAthleteSimulation] Paused athlete', athleteId)
    }
  }

  /**
   * Resume a specific athlete
   * @param {number} athleteId - Athlete ID to resume
   */
  resumeAthlete(athleteId) {
    const simulation = this.simulations.get(athleteId)
    if (simulation) {
      simulation.resume()
      console.log('[MultiAthleteSimulation] Resumed athlete', athleteId)
    }
  }

  /**
   * Stop a specific athlete
   * @param {number} athleteId - Athlete ID to stop
   */
  stopAthlete(athleteId) {
    const simulation = this.simulations.get(athleteId)
    if (simulation) {
      simulation.stop()
      console.log('[MultiAthleteSimulation] Stopped athlete', athleteId)
    }
  }

  /**
   * Set speed for a specific athlete
   * @param {number} athleteId - Athlete ID
   * @param {number} speed - Speed in km/h
   */
  setAthleteSpeed(athleteId, speed) {
    const simulation = this.simulations.get(athleteId)
    if (simulation) {
      simulation.setSpeed(speed)
      console.log('[MultiAthleteSimulation] Set athlete', athleteId, 'speed to', speed)
    }
  }

  /**
   * Set speed for all athletes
   * @param {number} speed - Speed in km/h
   */
  setGlobalSpeed(speed) {
    console.log('[MultiAthleteSimulation] Setting global speed to', speed)

    this.simulations.forEach((simulation) => {
      simulation.setSpeed(speed)
    })
  }

  /**
   * Get current states of all athletes
   * @returns {Array} Array of athlete states
   */
  getAllStates() {
    const states = []

    this.simulations.forEach((simulation, athleteId) => {
      const state = simulation.getCurrentState()
      states.push({
        athleteId,
        ...state
      })
    })

    return states
  }

  /**
   * Get state of a specific athlete
   * @param {number} athleteId - Athlete ID
   * @returns {Object|null} Athlete state or null if not found
   */
  getAthleteState(athleteId) {
    const simulation = this.simulations.get(athleteId)
    if (simulation) {
      return {
        athleteId,
        ...simulation.getCurrentState()
      }
    }
    return null
  }

  /**
   * Check if all athletes have finished
   * @returns {boolean}
   */
  areAllFinished() {
    let allFinished = true

    this.simulations.forEach((simulation) => {
      const state = simulation.getCurrentState()
      if (!state.isFinished) {
        allFinished = false
      }
    })

    return allFinished
  }
}

/**
 * Create a new multi-athlete simulation instance
 * @param {Array} athletes - Array of athlete data objects
 * @returns {MultiAthleteSimulation}
 */
export function createMultiAthleteSimulation(athletes) {
  return new MultiAthleteSimulation(athletes)
}
