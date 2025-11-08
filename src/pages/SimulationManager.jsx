import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { mockAthletes } from '../simulations/mockAthletes';

export default function SimulationManager() {
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [selectedAthlete, setSelectedAthlete] = useState(mockAthletes[0]);
  const [selectedAthletes, setSelectedAthletes] = useState([]); // For multi-athlete mode
  const [speed, setSpeed] = useState(mockAthletes[0].baseSpeed);
  const [simulationState, setSimulationState] = useState(null);

  // Listen for simulation state updates from the map window
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'simulation_state' && e.newValue) {
        try {
          const state = JSON.parse(e.newValue);
          setSimulationState(state);
        } catch (err) {
          console.error('Failed to parse simulation state:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check for initial state
    const storedState = localStorage.getItem('simulation_state');
    if (storedState) {
      try {
        setSimulationState(JSON.parse(storedState));
      } catch (err) {
        console.error('Failed to parse stored simulation state:', err);
      }
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const sendCommand = (command, data = {}) => {
    const message = {
      command,
      data,
      timestamp: Date.now()
    };
    localStorage.setItem('simulation_command', JSON.stringify(message));
    // Remove it immediately so the same command can be sent again
    setTimeout(() => localStorage.removeItem('simulation_command'), 100);
  };

  const handleStartSingleAthlete = () => {
    sendCommand('start_single_athlete', {
      speed,
      athlete: selectedAthlete
    });
    setActiveSimulation('single_athlete');
  };

  const handleAthleteChange = (e) => {
    const athleteId = parseInt(e.target.value);
    const athlete = mockAthletes.find(a => a.id === athleteId);
    setSelectedAthlete(athlete);
    setSpeed(athlete.baseSpeed);

    // If there's an active simulation, switch to the new athlete
    if (activeSimulation === 'single_athlete') {
      sendCommand('start_single_athlete', {
        speed: athlete.baseSpeed,
        athlete: athlete
      });
    }
  };

  const handleStart = () => {
    sendCommand('start');
  };

  const handlePause = () => {
    sendCommand('pause');
  };

  const handleResume = () => {
    sendCommand('resume');
  };

  const handleStop = () => {
    sendCommand('stop');
    setActiveSimulation(null);
  };

  const handleReset = () => {
    sendCommand('reset');
  };

  const handleSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value);
    setSpeed(newSpeed);
    sendCommand('set_speed', { speed: newSpeed });
  };

  const handleStartMultipleAthletes = () => {
    if (selectedAthletes.length === 0) {
      alert('Please select at least one athlete');
      return;
    }

    sendCommand('start_multiple_athletes', {
      athletes: selectedAthletes
    });
    setActiveSimulation('multiple_athletes');
  };

  const toggleAthleteSelection = (athlete) => {
    setSelectedAthletes(prev => {
      const isSelected = prev.some(a => a.id === athlete.id);
      if (isSelected) {
        return prev.filter(a => a.id !== athlete.id);
      } else {
        return [...prev, athlete];
      }
    });
  };

  const selectAllAthletes = () => {
    setSelectedAthletes([...mockAthletes]);
  };

  const deselectAllAthletes = () => {
    setSelectedAthletes([]);
  };

  const handlePauseAthlete = (athleteId) => {
    sendCommand('pause_athlete', { athleteId });
  };

  const handleResumeAthlete = (athleteId) => {
    sendCommand('resume_athlete', { athleteId });
  };

  const handleStopAthlete = (athleteId) => {
    sendCommand('stop_athlete', { athleteId });
  };

  const handleAthleteSpeedChange = (athleteId, newSpeed) => {
    sendCommand('set_athlete_speed', { athleteId, speed: newSpeed });
  };

  return (
    <div className="h-screen overflow-y-auto bg-gray-950 text-white">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-3xl font-bold mb-8">Simulation Manager</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulation Selection */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Start Simulation</h2>

            <div className="space-y-4">
              {/* Athlete Selection */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Select Athlete {activeSimulation && '(switch athletes anytime)'}
                </label>
                <select
                  value={selectedAthlete.id}
                  onChange={handleAthleteChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {mockAthletes.map(athlete => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.name} (#{athlete.bib}) - {athlete.baseSpeed} km/h @ {athlete.initialDistance} km
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStartSingleAthlete}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={activeSimulation !== null}
              >
                <div className="font-bold">Start Single Athlete Simulation</div>
                <div className="text-sm text-gray-300">
                  Simulate {selectedAthlete.name} along the route
                </div>
              </button>

              <button
                onClick={handleStartMultipleAthletes}
                className="w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={activeSimulation !== null}
              >
                <div className="font-bold">Start Multiple Athletes</div>
                <div className="text-sm text-gray-300">
                  Simulate {selectedAthletes.length} selected athletes
                </div>
              </button>

              {/* Athlete Selection UI (only show when no simulation is active) */}
              {!activeSimulation && (
                <div className="border border-gray-700 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-400">
                      Select Athletes ({selectedAthletes.length}/{mockAthletes.length})
                    </label>
                    <div className="space-x-2">
                      <button
                        onClick={selectAllAthletes}
                        className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllAthletes}
                        className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {mockAthletes.map(athlete => (
                      <label
                        key={athlete.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAthletes.some(a => a.id === athlete.id)}
                          onChange={() => toggleAthleteSelection(athlete)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1 text-sm">
                          <span className="font-medium">{athlete.name}</span>
                          <span className="text-gray-400 ml-2">#{athlete.bib}</span>
                          <span className="text-gray-500 ml-2 text-xs">
                            {athlete.baseSpeed} km/h @ {athlete.initialDistance} km
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="w-full bg-gray-700 px-4 py-3 rounded-lg text-left cursor-not-allowed opacity-50"
                disabled
              >
                <div className="font-bold">Race Replay</div>
                <div className="text-sm text-gray-400">Coming soon</div>
              </button>

              <button
                className="w-full bg-gray-700 px-4 py-3 rounded-lg text-left cursor-not-allowed opacity-50"
                disabled
              >
                <div className="font-bold">Custom Scenario</div>
                <div className="text-sm text-gray-400">Coming soon</div>
              </button>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              Controls
              {activeSimulation === 'multiple_athletes' && (
                <span className="text-sm font-normal text-gray-400 ml-2">
                  (Multi-Athlete Mode)
                </span>
              )}
            </h2>

            {!activeSimulation ? (
              <div className="text-gray-400 text-center py-12">
                No active simulation. Start one to see controls.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Speed Control - Only show for single athlete mode */}
                {activeSimulation === 'single_athlete' && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">
                      Speed: {speed} km/h
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="99999"
                      step="1"
                      value={speed}
                      onChange={handleSpeedChange}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Global Speed Control for multiple athletes */}
                {activeSimulation === 'multiple_athletes' && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">
                      Global Speed: {speed} km/h (applies to all athletes)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="99999"
                      step="1"
                      value={speed}
                      onChange={handleSpeedChange}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Playback Controls */}
                <div className="flex gap-2">
                  {simulationState?.isRunning ? (
                    simulationState?.isPaused ? (
                      <button
                        onClick={handleResume}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
                      >
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={handlePause}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded transition-colors"
                      >
                        Pause
                      </button>
                    )
                  ) : (
                    <button
                      onClick={handleStart}
                      className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
                    >
                      Start
                    </button>
                  )}

                  <button
                    onClick={handleStop}
                    className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
                  >
                    Stop
                  </button>

                  <button
                    onClick={handleReset}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition-colors"
                  >
                    Reset
                  </button>
                </div>

                {/* Athlete Info - Single Athlete Mode */}
                {activeSimulation === 'single_athlete' && simulationState?.athlete && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-bold mb-2">Athlete</h3>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span className="font-medium">{simulationState.athlete.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bib:</span>
                        <span className="font-medium">#{simulationState.athlete.bib}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Multi-Athlete Cards */}
                {activeSimulation === 'multiple_athletes' && simulationState?.mode === 'multiple' && simulationState?.athletes && (
                  <div className="space-y-3">
                    <h3 className="font-bold">Athletes ({simulationState.athletes.length})</h3>
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {simulationState.athletes
                        .sort((a, b) => b.distanceCovered - a.distanceCovered)
                        .map((athleteState, index) => (
                          <div key={athleteState.athleteId} className="bg-gray-800 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium">
                                  #{index + 1} {athleteState.athlete?.name}
                                  <span className="text-gray-400 ml-2 text-sm">
                                    #{athleteState.athlete?.bib}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {athleteState.distanceCovered?.toFixed(2)} km • {athleteState.speed?.toFixed(1)} km/h
                                  {athleteState.isPaused && <span className="text-yellow-400 ml-2">⏸ Paused</span>}
                                  {athleteState.isFinished && <span className="text-green-400 ml-2">🏁 Finished</span>}
                                </div>
                              </div>
                            </div>

                            {/* Individual athlete controls */}
                            <div className="flex gap-1 mt-2">
                              {athleteState.isPaused ? (
                                <button
                                  onClick={() => handleResumeAthlete(athleteState.athleteId)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
                                  disabled={athleteState.isFinished}
                                >
                                  Resume
                                </button>
                              ) : (
                                <button
                                  onClick={() => handlePauseAthlete(athleteState.athleteId)}
                                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs transition-colors"
                                  disabled={athleteState.isFinished}
                                >
                                  Pause
                                </button>
                              )}
                              <button
                                onClick={() => handleStopAthlete(athleteState.athleteId)}
                                className="flex-1 bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors"
                              >
                                Stop
                              </button>
                            </div>

                            {/* Individual speed control */}
                            <div className="mt-2">
                              <label className="text-xs text-gray-400 block mb-1">
                                Speed: {athleteState.speed?.toFixed(1)} km/h
                              </label>
                              <input
                                type="range"
                                min="1"
                                max="50"
                                step="0.5"
                                value={athleteState.speed || 10}
                                onChange={(e) => handleAthleteSpeedChange(athleteState.athleteId, parseFloat(e.target.value))}
                                className="w-full"
                                disabled={athleteState.isFinished}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Simulation State - Single Athlete Mode */}
                {activeSimulation === 'single_athlete' && simulationState && simulationState.mode === 'single' && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-bold mb-3">Live Status</h3>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{simulationState.progressPercent?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all"
                          style={{ width: `${simulationState.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Distance:</span>
                        <div className="font-mono">{simulationState.distanceCovered?.toFixed(2) || 0} km</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Time:</span>
                        <div className="font-mono">{simulationState.elapsedTime?.toFixed(2) || 0} h</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Elevation:</span>
                        <div className="font-mono">{simulationState.position?.elevation?.toFixed(0) || 0} m</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Position:</span>
                        <div className="font-mono text-xs">
                          {simulationState.position?.lat?.toFixed(4) || 0}, {simulationState.position?.lng?.toFixed(4) || 0}
                        </div>
                      </div>
                    </div>

                    {simulationState.isFinished && (
                      <div className="bg-green-600 text-white text-center py-2 rounded mt-3">
                        🏁 Finished!
                      </div>
                    )}
                  </div>
                )}

                {/* Simulation State - Multiple Athletes Mode */}
                {activeSimulation === 'multiple_athletes' && simulationState?.mode === 'multiple' && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-bold mb-3">Overall Status</h3>

                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Athletes:</span>
                        <span className="font-medium">{simulationState.athletes?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="font-medium">
                          {simulationState.allFinished ? (
                            <span className="text-green-400">🏁 All Finished</span>
                          ) : simulationState.isPaused ? (
                            <span className="text-yellow-400">⏸ Paused</span>
                          ) : (
                            <span className="text-green-400">▶ Running</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {simulationState.allFinished && (
                      <div className="bg-green-600 text-white text-center py-2 rounded mt-3">
                        🏁 All Athletes Finished!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-6 mt-6">
          <h3 className="font-bold mb-2">💡 How to use</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Open the Map view in another browser window/tab</li>
            <li>Select and start a simulation from this window</li>
            <li>The simulation will run on the Map window</li>
            <li>Control the simulation from here and see live updates</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
