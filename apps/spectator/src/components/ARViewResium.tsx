/**
 * ARViewResium - Real AR view using CesiumJS + Resium
 *
 * Drop-in replacement for ARView. In Home.tsx, swap:
 *   import ARView from '../components/ARView'
 * with:
 *   import ARView from '../components/ARViewResium'
 *
 * Requires a mobile device with camera, GPS, and compass.
 * Falls back gracefully on desktop (dark background, no orientation tracking).
 *
 * NOTE: CesiumJS is Apache 2.0 — no Cesium Ion token required.
 * vite-plugin-cesium must be added to vite.config.ts plugins.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { Viewer, Entity, BillboardGraphics } from 'resium'
import * as Cesium from 'cesium'
import './ARViewResium.css'

// Disable Cesium Ion dependency — we use Mapbox or no base layer
Cesium.Ion.defaultAccessToken = ''

// --------------- Types ---------------

interface ARViewProps {
  isOpen: boolean
  onClose: () => void
  athletePositions?: Array<{
    id: string
    name: string
    position: number
    lat: number
    lng: number
    elevation?: number
  }>
  currentPosition?: {
    lat: number
    lng: number
    estimatedElevation?: number
  } | null
}

interface OffscreenAthlete {
  id: string
  name: string
  position: number
  distance: number
  screenX: number
  screenY: number
  color: string
}

// --------------- Helpers ---------------

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getPositionColor(pos: number): string {
  if (pos === 1) return '#FFD700'
  if (pos === 2) return '#C0C0C0'
  if (pos === 3) return '#CD7F32'
  return '#FF0000'
}

function positionToCesiumColor(pos: number): Cesium.Color {
  if (pos === 1) return Cesium.Color.fromCssColorString('#FFD700')
  if (pos === 2) return Cesium.Color.fromCssColorString('#C0C0C0')
  if (pos === 3) return Cesium.Color.fromCssColorString('#CD7F32')
  return Cesium.Color.fromCssColorString('#FF0000')
}

function formatDistance(meters: number): string {
  return meters > 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`
}

/** Create a billboard image (data URL) for an athlete marker */
function createMarkerDataUrl(
  name: string,
  position: number,
  distStr: string,
  color: string,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
  ctx.beginPath()
  ctx.roundRect(0, 0, 256, 128, 10)
  ctx.fill()

  // Border
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(1.5, 1.5, 253, 125, 9)
  ctx.stroke()

  // Position badge
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(28, 42, 18, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#000'
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${position}`, 28, 42)

  // Name
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(name, 54, 38)

  // Distance
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.font = '16px sans-serif'
  ctx.fillText(distStr, 54, 70)

  // Pointer
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(120, 118)
  ctx.lineTo(128, 128)
  ctx.lineTo(136, 118)
  ctx.fill()

  return canvas.toDataURL()
}

// --------------- Smoothing utility ---------------

interface SmoothedOrientation {
  heading: number
  pitch: number
  roll: number
}

function smoothOrientation(
  current: SmoothedOrientation,
  raw: SmoothedOrientation,
  factor: number,
): SmoothedOrientation {
  return {
    heading: current.heading + (raw.heading - current.heading) * factor,
    pitch: current.pitch + (raw.pitch - current.pitch) * factor,
    roll: current.roll + (raw.roll - current.roll) * factor,
  }
}

// --------------- Component ---------------

export default function ARViewResium({
  isOpen,
  onClose,
  athletePositions = [],
  currentPosition = null,
}: ARViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const viewerInstanceRef = useRef<Cesium.Viewer | null>(null)

  const [showDebug, setShowDebug] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offscreenAthletes, setOffscreenAthletes] = useState<OffscreenAthlete[]>([])
  const [debugInfo, setDebugInfo] = useState({
    heading: 0,
    pitch: 0,
    fps: 0,
    athletes: 0,
    gps: 'N/A',
  })

  // Orientation smoothing
  const orientationRef = useRef<SmoothedOrientation>({ heading: 0, pitch: 0, roll: 0 })
  const fpsCountRef = useRef(0)
  const fpsTimeRef = useRef(performance.now())

  // ==================== Camera feed ====================
  useEffect(() => {
    if (!isOpen) return

    let disposed = false

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (disposed) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        streamRef.current = stream
        console.log('[ARViewResium] Camera stream started')
      } catch (err) {
        console.warn('[ARViewResium] Camera unavailable:', err)
        setError('Camera not available. Markers shown on dark background.')
      }
    }

    startCamera()

    return () => {
      disposed = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [isOpen])

  // ==================== Viewer mount callback ====================
  const handleViewerMount = useCallback(
    (ref: { cesiumElement?: Cesium.Viewer } | null) => {
      if (!ref?.cesiumElement) return

      const viewer = ref.cesiumElement
      viewerInstanceRef.current = viewer

      // Make everything transparent for AR
      viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT
      viewer.scene.globe.show = false
      viewer.scene.skyBox.show = false
      viewer.scene.skyAtmosphere.show = false
      viewer.scene.sun.show = false
      viewer.scene.moon.show = false
      viewer.scene.fog.enabled = false

      // Continuous rendering for AR camera sync
      viewer.scene.requestRenderMode = false

      // Set initial camera position from GPS
      if (currentPosition) {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            currentPosition.lng,
            currentPosition.lat,
            (currentPosition.estimatedElevation ?? 0) + 1.7,
          ),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-90),
            roll: 0,
          },
        })
      }

      console.log('[ARViewResium] Viewer configured for AR transparency')
    },
    [currentPosition],
  )

  // ==================== Device orientation → Cesium camera ====================
  useEffect(() => {
    if (!isOpen) return

    let disposed = false

    const requestPermission = async () => {
      const DOE = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>
      }
      if (typeof DOE.requestPermission === 'function') {
        try {
          const perm = await DOE.requestPermission()
          if (perm !== 'granted') {
            setError('Orientation permission denied.')
          }
        } catch {
          setError('Orientation permission request failed.')
        }
      }
    }

    requestPermission()

    // Firefox mobile warning
    if (
      /firefox/i.test(navigator.userAgent) &&
      /android|mobile/i.test(navigator.userAgent)
    ) {
      setError('Firefox mobile has limited orientation support. Try Chrome.')
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (disposed) return
      const viewer = viewerInstanceRef.current
      if (!viewer || !currentPosition) return

      // Extract raw orientation
      // iOS provides webkitCompassHeading for true north
      const iOSHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading
      const rawHeading = iOSHeading != null ? iOSHeading : ((360 - (event.alpha ?? 0)) % 360)
      const rawPitch = event.beta ?? 0 // 0 = flat, 90 = upright
      const rawRoll = event.gamma ?? 0 // -90..90 tilt left/right

      // Exponential smoothing
      orientationRef.current = smoothOrientation(
        orientationRef.current,
        { heading: rawHeading, pitch: rawPitch, roll: rawRoll },
        0.1,
      )

      const { heading, pitch, roll } = orientationRef.current

      try {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            currentPosition.lng,
            currentPosition.lat,
            (currentPosition.estimatedElevation ?? 0) + 1.7,
          ),
          orientation: {
            heading: Cesium.Math.toRadians(heading),
            pitch: Cesium.Math.toRadians(pitch - 90), // device: 0=flat → Cesium: -90=down; 90=upright → Cesium: 0=horizon
            roll: Cesium.Math.toRadians(roll),
          },
        })
      } catch {
        // Viewer may be destroyed during teardown
      }

      // FPS + debug
      fpsCountRef.current++
      const now = performance.now()
      if (now - fpsTimeRef.current >= 1000) {
        setDebugInfo({
          heading: Math.round(heading),
          pitch: Math.round(pitch),
          fps: fpsCountRef.current,
          athletes: athletePositions.length,
          gps: currentPosition
            ? `${currentPosition.lat.toFixed(4)}, ${currentPosition.lng.toFixed(4)}`
            : 'N/A',
        })
        fpsCountRef.current = 0
        fpsTimeRef.current = now
      }
    }

    window.addEventListener('deviceorientation', handleOrientation, true)

    return () => {
      disposed = true
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, [isOpen, currentPosition, athletePositions.length])

  // ==================== Off-screen indicators (5 Hz) ====================
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      const viewer = viewerInstanceRef.current
      if (!viewer || !currentPosition) {
        setOffscreenAthletes([])
        return
      }

      const width = viewer.canvas.clientWidth
      const height = viewer.canvas.clientHeight
      const offscreen: OffscreenAthlete[] = []

      athletePositions.forEach((athlete) => {
        const cartesian = Cesium.Cartesian3.fromDegrees(
          athlete.lng,
          athlete.lat,
          athlete.elevation ?? 0,
        )
        const windowPos = Cesium.SceneTransforms.worldToWindowCoordinates(
          viewer.scene,
          cartesian,
        )

        const onScreen =
          windowPos != null &&
          windowPos.x >= 0 &&
          windowPos.x <= width &&
          windowPos.y >= 0 &&
          windowPos.y <= height

        if (!onScreen) {
          const dist = haversineDistance(
            currentPosition.lat,
            currentPosition.lng,
            athlete.lat,
            athlete.lng,
          )

          // Compute screen-edge position from bearing
          let sx = width / 2
          let sy = height / 2
          if (windowPos) {
            const angle = Math.atan2(windowPos.x - width / 2, -(windowPos.y - height / 2))
            const edgeR = Math.min(width, height) / 2 - 50
            sx = width / 2 + Math.sin(angle) * edgeR
            sy = height / 2 - Math.cos(angle) * edgeR
          }

          offscreen.push({
            id: athlete.id,
            name: athlete.name,
            position: athlete.position,
            distance: dist,
            screenX: Math.max(30, Math.min(width - 30, sx)),
            screenY: Math.max(60, Math.min(height - 60, sy)),
            color: getPositionColor(athlete.position),
          })
        }
      })

      setOffscreenAthletes(offscreen)
    }, 200)

    return () => clearInterval(interval)
  }, [isOpen, athletePositions, currentPosition])

  // ==================== Cleanup viewer ref on close ====================
  useEffect(() => {
    if (!isOpen) {
      viewerInstanceRef.current = null
      setError(null)
    }
  }, [isOpen])

  // ==================== Render ====================

  if (!isOpen) return null

  return (
    <div className="ar-resium-container">
      {/* Camera feed background */}
      <video ref={videoRef} className="ar-resium-video" autoPlay playsInline muted />

      {/* Cesium viewer overlay */}
      <div className="ar-resium-viewer-wrapper">
        <Viewer
          ref={handleViewerMount as React.Ref<{ cesiumElement?: Cesium.Viewer }>}
          full
          animation={false}
          baseLayerPicker={false}
          fullscreenButton={false}
          geocoder={false}
          homeButton={false}
          timeline={false}
          navigationHelpButton={false}
          sceneModePicker={false}
          selectionIndicator={false}
          infoBox={false}
          scene3DOnly
          contextOptions={{
            webgl: { alpha: true, premultipliedAlpha: false },
          }}
          // @ts-expect-error — baseLayer={false} disables default imagery without Ion token
          baseLayer={false}
        >
          {/* Athlete markers as Cesium Entities */}
          {athletePositions.map((athlete) => {
            const dist = currentPosition
              ? haversineDistance(
                  currentPosition.lat,
                  currentPosition.lng,
                  athlete.lat,
                  athlete.lng,
                )
              : 0
            const distStr = formatDistance(dist)
            const color = getPositionColor(athlete.position)
            const imageUrl = createMarkerDataUrl(
              athlete.name,
              athlete.position,
              distStr,
              color,
            )

            return (
              <Entity
                key={athlete.id}
                position={Cesium.Cartesian3.fromDegrees(
                  athlete.lng,
                  athlete.lat,
                  (athlete.elevation ?? 0) + 50,
                )}
              >
                <BillboardGraphics
                  image={imageUrl}
                  scale={0.75}
                  verticalOrigin={Cesium.VerticalOrigin.BOTTOM}
                  heightReference={Cesium.HeightReference.NONE}
                  color={Cesium.Color.WHITE}
                  disableDepthTestDistance={Number.POSITIVE_INFINITY}
                />
              </Entity>
            )
          })}
        </Viewer>
      </div>

      {/* Close button */}
      <button className="ar-close-button" onClick={onClose} aria-label="Close AR view">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Error */}
      {error && <div className="ar-resium-error">{error}</div>}

      {/* Off-screen indicators */}
      {offscreenAthletes.map((a) => (
        <div
          key={`off-${a.id}`}
          className="ar-resium-offscreen-indicator"
          style={{ left: a.screenX, top: a.screenY }}
        >
          <div className="ar-resium-indicator-arrow" style={{ color: a.color }}>
            &#9650;
          </div>
          <div className="ar-resium-indicator-label">
            <span style={{ color: a.color, fontWeight: 'bold' }}>
              #{a.position} {a.name}
            </span>
            <span>{formatDistance(a.distance)}</span>
          </div>
        </div>
      ))}

      {/* Empty state */}
      {athletePositions.length === 0 && (
        <div className="ar-resium-no-athletes">No athletes in range</div>
      )}

      {/* Debug overlay */}
      {showDebug && (
        <div className="ar-resium-debug">
          <div>Heading: {debugInfo.heading}&deg;</div>
          <div>Pitch: {debugInfo.pitch}&deg;</div>
          <div>FPS: {debugInfo.fps}</div>
          <div>Athletes: {debugInfo.athletes}</div>
          <div>GPS: {debugInfo.gps}</div>
        </div>
      )}
      <button
        className="ar-resium-debug-toggle"
        onClick={() => setShowDebug((v) => !v)}
        aria-label="Toggle debug overlay"
      >
        {showDebug ? 'Hide Debug' : 'Debug'}
      </button>
    </div>
  )
}
