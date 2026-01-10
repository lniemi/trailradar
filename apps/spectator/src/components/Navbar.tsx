import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Ultra-discreet Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-7 h-7 flex flex-col items-center justify-center gap-[3px] bg-yellow-400/10 rounded hover:bg-yellow-400/30 transition-all opacity-70 hover:opacity-100"
        aria-label="Toggle menu"
      >
        <span className={`w-4 h-[2px] bg-yellow-400 transition-all ${isOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
        <span className={`w-4 h-[2px] bg-yellow-400 transition-all ${isOpen ? 'opacity-0' : ''}`} />
        <span className={`w-4 h-[2px] bg-yellow-400 transition-all ${isOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <nav className={`fixed top-0 left-0 right-0 bg-gray-900/90 backdrop-blur-lg text-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-yellow-400 hover:text-yellow-300 transition-colors">
            Sport Radar
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium hover:text-yellow-400 transition-colors"
            >
              Map
            </Link>
            <Link
              to="/simulations"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium hover:text-yellow-400 transition-colors"
            >
              Simulations
            </Link>
            <Link
              to="/events"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium hover:text-yellow-400 transition-colors"
            >
              Events
            </Link>
            <Link
              to="/athletes"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium hover:text-yellow-400 transition-colors"
            >
              Athletes
            </Link>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
