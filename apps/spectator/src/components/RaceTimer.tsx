import { useState, useEffect } from 'react'
import './RaceTimer.css'

export default function RaceTimer({ startTime, isRunning }) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!isRunning || !startTime) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      setElapsedTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, isRunning])

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="race-timer">
      <div className="race-timer-content">
        <span className="live-indicator">LIVE</span>
        <span className="timer-display">{formatTime(elapsedTime)}</span>
      </div>
    </div>
  )
}