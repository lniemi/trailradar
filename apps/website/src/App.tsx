import { Routes, Route } from 'react-router-dom'
import { Button, Card } from '@sportradar/ui'

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <header className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-yellow-400">Sport Radar</h1>
          <div className="flex gap-4">
            <Button variant="ghost">Features</Button>
            <Button variant="ghost">About</Button>
            <Button variant="primary">Get Started</Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-16">
        <section className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">
            Track Ultra-Trail Events in{' '}
            <span className="text-yellow-400">Real-Time</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Follow your favorite athletes through the mountains with live GPS
            tracking, AR spectator features, and comprehensive race analytics.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">Launch App</Button>
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gray-800/50 border border-gray-700">
            <h3 className="text-xl font-semibold mb-2 text-yellow-400">
              Live Tracking
            </h3>
            <p className="text-gray-300">
              Real-time GPS positions for all participants on an interactive 3D
              map.
            </p>
          </Card>
          <Card className="bg-gray-800/50 border border-gray-700">
            <h3 className="text-xl font-semibold mb-2 text-yellow-400">
              AR Spectating
            </h3>
            <p className="text-gray-300">
              Use augmented reality to spot nearby athletes when viewing events
              in person.
            </p>
          </Card>
          <Card className="bg-gray-800/50 border border-gray-700">
            <h3 className="text-xl font-semibold mb-2 text-yellow-400">
              Race Analytics
            </h3>
            <p className="text-gray-300">
              Comprehensive statistics, leaderboards, and progress tracking for
              every event.
            </p>
          </Card>
        </section>
      </main>

      <footer className="container mx-auto px-6 py-8 border-t border-gray-700 mt-16">
        <p className="text-center text-gray-400">
          &copy; {new Date().getFullYear()} Sport Radar. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}
