import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function SimulationManager() {
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [speed, setSpeed] = useState(4);
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
    sendCommand('start_single_athlete', { speed });
    setActiveSimulation('single_athlete');
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

  return (
    <div className="h-screen overflow-y-auto bg-gray-950 text-white">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-3xl font-bold mb-8">Simulation Manager</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulation Selection */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Start Simulation</h2>

            <div className="space-y-3">
              <button
                onClick={handleStartSingleAthlete}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors text-left"
                disabled={activeSimulation !== null}
              >
                <div className="font-bold">Single Athlete</div>
                <div className="text-sm text-gray-300">Simulate one athlete along the route</div>
              </button>

              <button
                className="w-full bg-gray-700 px-4 py-3 rounded-lg text-left cursor-not-allowed opacity-50"
                disabled
              >
                <div className="font-bold">Multiple Athletes</div>
                <div className="text-sm text-gray-400">Coming soon</div>
              </button>

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
            <h2 className="text-xl font-bold mb-4">Controls</h2>

            {!activeSimulation ? (
              <div className="text-gray-400 text-center py-12">
                No active simulation. Start one to see controls.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Speed Control */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Speed: {speed} km/h
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    step="1"
                    value={speed}
                    onChange={handleSpeedChange}
                    className="w-full"
                  />
                </div>

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

                {/* Simulation State */}
                {simulationState && (
                  <div className="bg-gray-800 rounded-lg p-4 mt-4">
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
