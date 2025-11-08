import { Link } from 'react-router';

export default function Navbar() {
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
            <Link to="/simulations" className="hover:text-yellow-400 transition-colors">
              Simulations
            </Link>
            <Link to="/events" className="hover:text-yellow-400 transition-colors">
              Events
            </Link>
            <Link to="/athletes" className="hover:text-yellow-400 transition-colors">
              Athletes
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
