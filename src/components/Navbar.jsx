import { Link } from 'react-router';
import { useState } from 'react';

export default function Navbar({ onStartSimulation }) {
  const [isSimulationsOpen, setIsSimulationsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold">
            Sport Radar
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/" className="hover:text-yellow-400 transition-colors">
              Map
            </Link>
            <Link to="/events" className="hover:text-yellow-400 transition-colors">
              Events
            </Link>
            <Link to="/athletes" className="hover:text-yellow-400 transition-colors">
              Athletes
            </Link>

            <div className="relative">
              <button
                onClick={() => setIsSimulationsOpen(!isSimulationsOpen)}
                className="hover:text-yellow-400 transition-colors"
              >
                Simulations ▼
              </button>

              {isSimulationsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-xl py-1">
                  <button
                    onClick={() => {
                      setIsSimulationsOpen(false)
                      onStartSimulation?.()
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                  >
                    Single Athlete
                  </button>
                  <button
                    onClick={() => setIsSimulationsOpen(false)}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors text-gray-400 cursor-not-allowed"
                    disabled
                  >
                    Multiple Athletes
                  </button>
                  <button
                    onClick={() => setIsSimulationsOpen(false)}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors text-gray-400 cursor-not-allowed"
                    disabled
                  >
                    Race Replay
                  </button>
                  <button
                    onClick={() => setIsSimulationsOpen(false)}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors text-gray-400 cursor-not-allowed"
                    disabled
                  >
                    Custom Scenario
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
