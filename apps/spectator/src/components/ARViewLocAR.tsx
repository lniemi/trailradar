/**
 * ARViewLocAR - Real AR view using LocAR.js + Three.js
 *
 * Drop-in replacement for ARView. In Home.tsx, swap:
 *   import ARView from '../components/ARView'
 * with:
 *   import ARView from '../components/ARViewLocAR'
 *
 * Requires a mobile device with camera, GPS, and compass.
 * Falls back gracefully on desktop (dark background, no orientation tracking).
 */
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LocationBased, DeviceOrientationControls } from 'locar'
import './ARViewLocAR.css'

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
  routeCoordinates?: number[][]  // Array of [lng, lat, elevation]
}

// --------------- Helpers ---------------

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getPositionColor(pos: number): string {
  if (pos === 1) return '#FFD700'
  if (pos === 2) return '#C0C0C0'
  if (pos === 3) return '#CD7F32'
  return '#FF0000'
}

function formatDistance(meters: number): string {
  return meters > 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`
}

function createMarkerTexture(
  name: string,
  position: number,
  distStr: string,
  color: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
  ctx.beginPath()
  ctx.roundRect(0, 0, 512, 256, 16)
  ctx.fill()

  // Border
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.roundRect(2, 2, 508, 252, 14)
  ctx.stroke()

  // Position badge
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(50, 80, 30, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#000'
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${position}`, 50, 80)

  // Name
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 36px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(name, 95, 70)

  // Distance
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.font = '26px sans-serif'
  ctx.fillText(distStr, 95, 130)

  // Bottom pointer
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(246, 240)
  ctx.lineTo(256, 256)
  ctx.lineTo(266, 240)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// --------------- Types ---------------

interface OffscreenAthlete {
  id: string
  name: string
  position: number
  distance: number
  screenX: number
  screenY: number
  color: string
}

// --------------- Component ---------------

export default function ARViewLocAR({
  isOpen,
  onClose,
  athletePositions = [],
  currentPosition = null,
  routeCoordinates,
}: ARViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  // LocAR refs — typed as any because locar may lack full TS declarations
  const locationBasedRef = useRef<ReturnType<typeof LocationBased> | null>(null)
  const deviceControlsRef = useRef<ReturnType<typeof DeviceOrientationControls> | null>(null)

  const markersRef = useRef<Map<string, THREE.Sprite>>(new window.Map())
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef(0)
  const geoWatchRef = useRef<number | null>(null)
  const disposedRef = useRef(false)

  // Route line refs
  const routeLineRef = useRef<Line2 | null>(null)
  const routeMaterialRef = useRef<LineMaterial | null>(null)
  const routeLastBuildPosRef = useRef<{ lat: number; lng: number } | null>(null)

  // State
  const [showDebug, setShowDebug] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offscreenAthletes, setOffscreenAthletes] = useState<OffscreenAthlete[]>([])
  const [activated, setActivated] = useState(false)
  const [liveGps, setLiveGps] = useState<{ lat: number; lng: number; elevation: number } | null>(null)
  const [debugInfo, setDebugInfo] = useState({
    heading: 0,
    fps: 0,
    athletes: 0,
    gps: 'N/A',
    gpsSource: 'none',
  })

  // FPS tracking refs (avoid state updates per frame)
  const fpsCountRef = useRef(0)
  const fpsTimeRef = useRef(performance.now())
  const headingRef = useRef(0)
  const gpsSourceRef = useRef<'live' | 'simulated' | 'none'>('none')
  const liveGpsRef = useRef<{ lat: number; lng: number; elevation: number } | null>(null)

  // Reset activated state when view closes
  useEffect(() => {
    if (!isOpen) {
      setActivated(false)
    }
  }, [isOpen])

  // ==================== Activation handler (user gesture) ====================
  const handleActivate = async () => {
    // Request DeviceOrientation permission from this user gesture (required by iOS/Chrome)
    try {
      const DOE = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>
      }
      if (typeof DOE.requestPermission === 'function') {
        const perm = await DOE.requestPermission()
        if (perm !== 'granted') {
          setError('Orientation permission denied. Compass will not work.')
        } else {
          console.log('[ARViewLocAR] DeviceOrientation permission granted')
        }
      }
    } catch (err) {
      console.warn('[ARViewLocAR] DeviceOrientation permission request failed:', err)
    }

    setActivated(true)
  }

  // ==================== Lifecycle: init & teardown ====================
  useEffect(() => {
    if (!isOpen || !activated) return

    disposedRef.current = false

    const init = async () => {
      if (!canvasRef.current || !videoRef.current) return

      const w = window.innerWidth
      const h = window.innerHeight

      // --- Camera feed ---
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (disposedRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        videoRef.current!.srcObject = stream
        streamRef.current = stream
        console.log('[ARViewLocAR] Camera stream started')
      } catch (err) {
        console.warn('[ARViewLocAR] Camera unavailable:', err)
        setError('Camera not available. Markers shown on dark background.')
      }

      if (disposedRef.current) return

      // --- Three.js ---
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 50000)
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        alpha: true,
        antialias: true,
      })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)

      scene.add(new THREE.AmbientLight(0xffffff, 1))

      sceneRef.current = scene
      cameraRef.current = camera
      rendererRef.current = renderer

      // --- LocAR: LocationBased ---
      try {
        const lb = new LocationBased(scene, camera, {
          gpsMinDistance: 0,
          gpsMinAccuracy: 1000,
        })
        locationBasedRef.current = lb

        // Set initial position from prop while waiting for real GPS
        if (currentPosition) {
          lb.fakeGps(
            currentPosition.lng,
            currentPosition.lat,
            currentPosition.estimatedElevation ?? 0,
          )
          gpsSourceRef.current = 'simulated'
          console.log(
            '[ARViewLocAR] Initial GPS position (simulated):',
            currentPosition.lat.toFixed(5),
            currentPosition.lng.toFixed(5),
          )
        }

        // --- Real GPS: watch device position ---
        if ('geolocation' in navigator) {
          const watchId = navigator.geolocation.watchPosition(
            (pos) => {
              if (disposedRef.current) return
              const { latitude, longitude, altitude } = pos.coords
              const elev = altitude ?? currentPosition?.estimatedElevation ?? 0
              lb.fakeGps(longitude, latitude, elev)
              gpsSourceRef.current = 'live'
              const gpsData = { lat: latitude, lng: longitude, elevation: elev }
              liveGpsRef.current = gpsData
              setLiveGps(gpsData)
              console.log(
                '[ARViewLocAR] Live GPS update:',
                latitude.toFixed(5),
                longitude.toFixed(5),
                'alt:', altitude?.toFixed(1) ?? 'N/A',
              )
            },
            (err) => {
              console.warn('[ARViewLocAR] Geolocation error:', err.message)
              if (gpsSourceRef.current !== 'live') {
                // Only show error if we never got a live fix
                console.log('[ARViewLocAR] Using simulated position as fallback')
              }
            },
            {
              enableHighAccuracy: true,
              maximumAge: 2000,
              timeout: 10000,
            },
          )
          geoWatchRef.current = watchId
        }
      } catch (err) {
        console.error('[ARViewLocAR] LocationBased init failed:', err)
        setError('GPS positioning initialisation failed.')
      }

      // --- LocAR: DeviceOrientationControls ---
      // Permission was already requested in handleActivate (user gesture),
      // so we skip the permission dialog and connect directly.
      try {
        const controls = new DeviceOrientationControls(camera, {
          smoothingFactor: 0.1,
          enablePermissionDialog: false,
        })
        // Must call init() then connect() for controls to receive events
        controls.init()
        controls.connect()
        deviceControlsRef.current = controls
        console.log('[ARViewLocAR] DeviceOrientationControls connected')
      } catch (err) {
        console.warn('[ARViewLocAR] DeviceOrientation unavailable:', err)
        setError('Device orientation not available.')
      }

      // Firefox mobile warning
      if (
        /firefox/i.test(navigator.userAgent) &&
        /android|mobile/i.test(navigator.userAgent)
      ) {
        setError('Firefox mobile has limited orientation support. Try Chrome.')
      }

      // --- Resize handler ---
      const onResize = () => {
        if (disposedRef.current) return
        const nw = window.innerWidth
        const nh = window.innerHeight
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
        // Update LineMaterial resolution for correct line width
        routeMaterialRef.current?.resolution.set(nw, nh)
      }
      window.addEventListener('resize', onResize)

      // --- Render loop ---
      const animate = () => {
        if (disposedRef.current) return
        rafRef.current = requestAnimationFrame(animate)

        deviceControlsRef.current?.update()
        renderer.render(scene, camera)

        // FPS + heading (updated once per second)
        fpsCountRef.current++
        const now = performance.now()
        if (now - fpsTimeRef.current >= 1000) {
          const fps = fpsCountRef.current
          fpsCountRef.current = 0
          fpsTimeRef.current = now

          const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
          const heading = ((-euler.y * 180) / Math.PI + 360) % 360
          headingRef.current = heading

          const gpsPos = liveGpsRef.current
          const simPos = currentPosition

          setDebugInfo({
            heading: Math.round(heading),
            fps,
            athletes: markersRef.current.size,
            gps: gpsPos
              ? `${gpsPos.lat.toFixed(4)}, ${gpsPos.lng.toFixed(4)}`
              : simPos
                ? `${simPos.lat.toFixed(4)}, ${simPos.lng.toFixed(4)}`
                : 'N/A',
            gpsSource: gpsSourceRef.current,
          })
        }
      }
      animate()

      // Store resize cleanup
      return () => {
        window.removeEventListener('resize', onResize)
      }
    }

    let removeResize: (() => void) | undefined
    init().then((fn) => {
      removeResize = fn
    })

    // --- Cleanup ---
    return () => {
      disposedRef.current = true
      cancelAnimationFrame(rafRef.current)
      removeResize?.()

      // Stop GPS watch
      if (geoWatchRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchRef.current)
        geoWatchRef.current = null
      }

      // Dispose route line
      if (routeLineRef.current) {
        sceneRef.current?.remove(routeLineRef.current)
        routeLineRef.current.geometry.dispose()
        routeLineRef.current = null
      }
      if (routeMaterialRef.current) {
        routeMaterialRef.current.dispose()
        routeMaterialRef.current = null
      }
      routeLastBuildPosRef.current = null

      // Dispose markers
      markersRef.current.forEach((sprite) => {
        sceneRef.current?.remove(sprite)
        if (sprite.material instanceof THREE.SpriteMaterial && sprite.material.map) {
          sprite.material.map.dispose()
        }
        sprite.material.dispose()
        sprite.geometry.dispose()
      })
      markersRef.current.clear()

      // Renderer
      rendererRef.current?.dispose()
      rendererRef.current = null

      // Camera stream
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null

      // Controls
      const ctrl = deviceControlsRef.current as { dispose?: () => void } | null
      ctrl?.dispose?.()

      sceneRef.current = null
      cameraRef.current = null
      locationBasedRef.current = null
      deviceControlsRef.current = null
      gpsSourceRef.current = 'none'
      liveGpsRef.current = null
      setLiveGps(null)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activated])

  // ==================== GPS fallback update ====================
  // Only use simulated position if we have no live GPS
  useEffect(() => {
    if (!isOpen || !activated || !locationBasedRef.current || !currentPosition) return
    // Don't override live GPS with simulated position
    if (gpsSourceRef.current === 'live') return
    locationBasedRef.current.fakeGps(
      currentPosition.lng,
      currentPosition.lat,
      currentPosition.estimatedElevation ?? 0,
    )
  }, [isOpen, activated, currentPosition])

  // ==================== Route line rendering ====================
  useEffect(() => {
    if (!isOpen || !activated || !locationBasedRef.current || !sceneRef.current || !routeCoordinates?.length) return

    const scene = sceneRef.current
    const lb = locationBasedRef.current

    // Determine viewer position for nearby filtering
    const viewerPos = liveGpsRef.current
      ?? (currentPosition ? { lat: currentPosition.lat, lng: currentPosition.lng } : null)
    if (!viewerPos) return

    // Skip rebuild if viewer hasn't moved significantly (>200m) from last build
    if (routeLastBuildPosRef.current) {
      const movedDist = haversineDistance(
        routeLastBuildPosRef.current.lat, routeLastBuildPosRef.current.lng,
        viewerPos.lat, viewerPos.lng,
      )
      if (movedDist < 200) return
    }

    console.log('[ARViewLocAR] Building route line near', viewerPos.lat.toFixed(4), viewerPos.lng.toFixed(4))
    routeLastBuildPosRef.current = { lat: viewerPos.lat, lng: viewerPos.lng }

    // Remove old route line
    if (routeLineRef.current) {
      scene.remove(routeLineRef.current)
      routeLineRef.current.geometry.dispose()
      routeLineRef.current = null
    }

    // Filter to coordinates within 3km of viewer
    const RADIUS = 3000
    const nearbyCoords: number[][] = []
    for (let i = 0; i < routeCoordinates.length; i++) {
      const coord = routeCoordinates[i]
      const dist = haversineDistance(viewerPos.lat, viewerPos.lng, coord[1], coord[0])
      if (dist <= RADIUS) {
        nearbyCoords.push(coord)
      }
    }

    if (nearbyCoords.length < 2) {
      console.log('[ARViewLocAR] Not enough nearby route points:', nearbyCoords.length)
      return
    }

    // Sample down if too many points (cap at ~500)
    let sampled = nearbyCoords
    if (nearbyCoords.length > 500) {
      const step = Math.ceil(nearbyCoords.length / 500)
      sampled = nearbyCoords.filter((_, i) => i % step === 0 || i === nearbyCoords.length - 1)
    }

    // Convert to Three.js world positions
    const positions: number[] = []
    for (const coord of sampled) {
      const [lng, lat, elev = 0] = coord
      const worldXZ = lb.lonLatToWorldCoords(lng, lat)
      positions.push(worldXZ[0], elev, worldXZ[1])
    }

    // Create Line2 with fat-line rendering
    const geometry = new LineGeometry()
    geometry.setPositions(positions)

    if (!routeMaterialRef.current) {
      routeMaterialRef.current = new LineMaterial({
        color: 0xffdd00,
        linewidth: 6,
        transparent: true,
        opacity: 0.85,
        depthTest: false,
        worldUnits: false,
      })
    }
    routeMaterialRef.current.resolution.set(window.innerWidth, window.innerHeight)

    const line = new Line2(geometry, routeMaterialRef.current)
    line.computeLineDistances()
    scene.add(line)
    routeLineRef.current = line

    console.log(`[ARViewLocAR] Route line rendered: ${sampled.length} points within ${RADIUS}m`)
  }, [isOpen, activated, routeCoordinates, liveGps, currentPosition])

  // ==================== Athlete markers ====================
  // Use live GPS position for distance calculations when available
  const effectivePosition = liveGps
    ? { lat: liveGps.lat, lng: liveGps.lng }
    : currentPosition
      ? { lat: currentPosition.lat, lng: currentPosition.lng }
      : null

  useEffect(() => {
    if (!isOpen || !activated || !locationBasedRef.current || !sceneRef.current) return

    const scene = sceneRef.current
    const lb = locationBasedRef.current
    const existingIds = new Set(markersRef.current.keys())
    const currentIds = new Set(athletePositions.map((a) => a.id))

    // Remove departed athletes
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const sprite = markersRef.current.get(id)!
        scene.remove(sprite)
        if (sprite.material instanceof THREE.SpriteMaterial && sprite.material.map) {
          sprite.material.map.dispose()
        }
        sprite.material.dispose()
        sprite.geometry.dispose()
        markersRef.current.delete(id)
      }
    })

    // Add / update athletes
    athletePositions.forEach((athlete) => {
      const dist = effectivePosition
        ? haversineDistance(effectivePosition.lat, effectivePosition.lng, athlete.lat, athlete.lng)
        : 0
      const distStr = formatDistance(dist)
      const color = getPositionColor(athlete.position)

      if (markersRef.current.has(athlete.id)) {
        const sprite = markersRef.current.get(athlete.id)!
        scene.remove(sprite)
        if (sprite.material instanceof THREE.SpriteMaterial && sprite.material.map) {
          sprite.material.map.dispose()
        }
        sprite.material.map = createMarkerTexture(athlete.name, athlete.position, distStr, color)
        sprite.material.needsUpdate = true
        lb.add(sprite, athlete.lng, athlete.lat, athlete.elevation ?? 0)
      } else {
        const texture = createMarkerTexture(athlete.name, athlete.position, distStr, color)
        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthTest: false,
          sizeAttenuation: true,
        })
        const sprite = new THREE.Sprite(material)
        sprite.scale.set(300, 150, 1)
        lb.add(sprite, athlete.lng, athlete.lat, athlete.elevation ?? 0)
        markersRef.current.set(athlete.id, sprite)
        console.log(`[ARViewLocAR] Marker added: ${athlete.name}`)
      }
    })
  }, [isOpen, activated, athletePositions, effectivePosition])

  // ==================== Off-screen indicators (5 Hz) ====================
  useEffect(() => {
    if (!isOpen || !activated) return

    const interval = setInterval(() => {
      const camera = cameraRef.current
      const effPos = liveGpsRef.current
        ?? (currentPosition ? { lat: currentPosition.lat, lng: currentPosition.lng } : null)
      if (!camera || !effPos) {
        setOffscreenAthletes([])
        return
      }

      const width = window.innerWidth
      const height = window.innerHeight
      const offscreen: OffscreenAthlete[] = []

      athletePositions.forEach((athlete) => {
        const sprite = markersRef.current.get(athlete.id)
        if (!sprite) return

        const worldPos = new THREE.Vector3()
        sprite.getWorldPosition(worldPos)
        const projected = worldPos.clone().project(camera)

        const onScreen =
          projected.x >= -1 &&
          projected.x <= 1 &&
          projected.y >= -1 &&
          projected.y <= 1 &&
          projected.z < 1

        if (!onScreen) {
          const dist = haversineDistance(
            effPos.lat,
            effPos.lng,
            athlete.lat,
            athlete.lng,
          )
          const angle = Math.atan2(projected.x, projected.y)
          const edgeR = Math.min(width, height) / 2 - 50
          const sx = width / 2 + Math.sin(angle) * edgeR
          const sy = height / 2 - Math.cos(angle) * edgeR

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
  }, [isOpen, activated, athletePositions, currentPosition])

  // ==================== Render ====================

  if (!isOpen) return null

  // Show activation screen before initializing sensors
  if (!activated) {
    return (
      <div className="ar-locar-container">
        <div className="ar-locar-activate-screen">
          <div className="ar-locar-activate-content">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
            </svg>
            <h2 style={{ color: 'white', margin: '1rem 0 0.5rem', fontSize: '1.5rem' }}>AR View</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 1.5rem', fontSize: '0.9rem', textAlign: 'center', maxWidth: '280px' }}>
              Tap the button below to enable camera, GPS, and compass sensors.
            </p>
            <button className="ar-locar-activate-button" onClick={handleActivate}>
              Start AR
            </button>
          </div>
          {/* Close button on activation screen too */}
          <button className="ar-close-button" onClick={onClose} aria-label="Close AR view"
            style={{ position: 'absolute', top: 20, right: 20, zIndex: 100, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem', padding: '0.5rem', color: 'white', cursor: 'pointer' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ar-locar-container">
      {/* Camera feed */}
      <video ref={videoRef} className="ar-locar-video" autoPlay playsInline muted />

      {/* Three.js overlay */}
      <canvas ref={canvasRef} className="ar-locar-canvas" />

      {/* Close */}
      <button className="ar-close-button" onClick={onClose} aria-label="Close AR view">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Error */}
      {error && <div className="ar-locar-error">{error}</div>}

      {/* Off-screen indicators */}
      {offscreenAthletes.map((a) => (
        <div
          key={`off-${a.id}`}
          className="ar-locar-offscreen-indicator"
          style={{ left: a.screenX, top: a.screenY }}
        >
          <div className="ar-locar-indicator-arrow" style={{ color: a.color }}>
            &#9650;
          </div>
          <div className="ar-locar-indicator-label">
            <span style={{ color: a.color, fontWeight: 'bold' }}>
              #{a.position} {a.name}
            </span>
            <span>{formatDistance(a.distance)}</span>
          </div>
        </div>
      ))}

      {/* Empty state */}
      {athletePositions.length === 0 && (
        <div className="ar-locar-no-athletes">No athletes in range</div>
      )}

      {/* Debug overlay */}
      {showDebug && (
        <div className="ar-locar-debug">
          <div>Heading: {debugInfo.heading}&deg;</div>
          <div>FPS: {debugInfo.fps}</div>
          <div>Athletes: {debugInfo.athletes}</div>
          <div>GPS: {debugInfo.gps}</div>
          <div>Source: {debugInfo.gpsSource}</div>
          <div>Route: {routeLineRef.current ? 'visible' : 'none'}</div>
        </div>
      )}
      <button
        className="ar-locar-debug-toggle"
        onClick={() => setShowDebug((v) => !v)}
        aria-label="Toggle debug overlay"
      >
        {showDebug ? 'Hide Debug' : 'Debug'}
      </button>
    </div>
  )
}
