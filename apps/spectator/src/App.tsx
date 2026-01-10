import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import SimulationManager from './pages/SimulationManager'
import VRSimulationControl from './pages/VRSimulationControl'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/simulations" element={<SimulationManager />} />
      <Route path="/vr-simulation" element={<VRSimulationControl />} />
    </Routes>
  )
}

export default App
