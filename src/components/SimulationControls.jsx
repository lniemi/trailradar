import { useState, useEffect } from 'react';

export default function SimulationControls({ simulation, onClose }) {
  const [state, setState] = useState(null);
  const [speed, setSpeed] = useState(4);

  useEffect(() => {
    if (!simulation) return;

    const interval = setInterval(() => {
      const currentState = simulation.getCurrentState();
      setState(currentState);

      if (currentState.isFinished) {
        simulation.stop();
      }
    }, 100); // Update 10 times per second

    return () => clearInterval(interval);
  }, [simulation]);

  const handleStart = () => {
    simulation.start();
  };

  const handlePause = () => {
    simulation.pause();
  };

  const handleResume = () => {
    simulation.resume();
  };

  const handleStop = () => {
    simulation.stop();
  };

  const handleReset = () => {
    simulation.reset();
  };

  const handleSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value);
    setSpeed(newSpeed);
    simulation.setSpeed(newSpeed);
  };

  if (!state) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white rounded-lg shadow-xl p-4 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Single Athlete Simulation</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{state.progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all"
              style={{ width: `${state.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-400">Distance:</span>
            <div className="font-mono">{state.distanceCovered.toFixed(2)} km</div>
          </div>
          <div>
            <span className="text-gray-400">Total:</span>
            <div className="font-mono">{state.estimatedTotalTime ? (state.estimatedTotalTime * simulation.totalDistance / state.estimatedTotalTime).toFixed(2) : '0.00'} km</div>
          </div>
          <div>
            <span className="text-gray-400">Time:</span>
            <div className="font-mono">{state.elapsedTime.toFixed(2)} h</div>
          </div>
          <div>
            <span className="text-gray-400">Elevation:</span>
            <div className="font-mono">{state.position.elevation?.toFixed(0) || 0} m</div>
          </div>
        </div>

        {/* Speed Control */}
        <div>
          <label className="text-sm text-gray-400">Speed: {speed} km/h</label>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={speed}
            onChange={handleSpeedChange}
            className="w-full"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!simulation.isRunning ? (
            <button
              onClick={handleStart}
              className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded transition-colors"
            >
              Start
            </button>
          ) : state.isPaused ? (
            <button
              onClick={handleResume}
              className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded transition-colors"
            >
              Resume
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded transition-colors"
            >
              Pause
            </button>
          )}

          <button
            onClick={handleStop}
            className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition-colors"
          >
            Stop
          </button>

          <button
            onClick={handleReset}
            className="flex-1 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Finish Message */}
        {state.isFinished && (
          <div className="bg-green-600 text-white text-center py-2 rounded">
            🏁 Finished!
          </div>
        )}
      </div>
    </div>
  );
}
