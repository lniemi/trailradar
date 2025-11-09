import { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { MapView, MapBoxProvider, UnitsUtils, LODRaycast } from 'geo-three'
import './ARView.css'

// Helper function to calculate distance between two GPS points (in meters)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000 // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Calculate optimal spectator position relative to route
function findSpectatorPosition(athletePositions, routeCoords) {
  if (!athletePositions || athletePositions.length === 0 || !routeCoords) {
    return null
  }

  // Find centroid of athletes
  const centroid = calculateAthleteCentroid(athletePositions)

  // Find closest route points to centroid
  let closestDist = Infinity
  let closestIndex = 0

  for (let i = 0; i < routeCoords.length; i++) {
    const coord = routeCoords[i]
    const dist = haversineDistance(centroid.lat, centroid.lng, coord[1], coord[0])
    if (dist < closestDist) {
      closestDist = dist
      closestIndex = i
    }
  }

  // Get route point and adjacent points for direction
  const routePoint = routeCoords[closestIndex]
  const prevPoint = routeCoords[Math.max(0, closestIndex - 1)]
  const nextPoint = routeCoords[Math.min(routeCoords.length - 1, closestIndex + 1)]

  // Calculate route direction vector
  const routeDir = {
    lat: nextPoint[1] - prevPoint[1],
    lng: nextPoint[0] - prevPoint[0]
  }

  // Normalize direction
  const dirLength = Math.sqrt(routeDir.lat * routeDir.lat + routeDir.lng * routeDir.lng)
  if (dirLength > 0) {
    routeDir.lat /= dirLength
    routeDir.lng /= dirLength
  }

  // Calculate perpendicular vector (rotate 90 degrees)
  const perpDir = {
    lat: -routeDir.lng,
    lng: routeDir.lat
  }

  // Offset distance in degrees (approximately 200m)
  const offsetDegrees = 200 / 111000 // 1 degree ≈ 111km

  // Calculate spectator position
  const spectatorPos = {
    lat: routePoint[1] + perpDir.lat * offsetDegrees,
    lng: routePoint[0] + perpDir.lng * offsetDegrees,
    elevation: routePoint[2] || 0, // Use route elevation
    targetLat: routePoint[1],
    targetLng: routePoint[0],
    targetElevation: routePoint[2] || 0
  }

  return spectatorPos
}

// Calculate geographic centroid of athletes
function calculateAthleteCentroid(athletes) {
  if (!athletes || athletes.length === 0) return null

  let sumLat = 0
  let sumLng = 0

  athletes.forEach(athlete => {
    sumLat += athlete.lat
    sumLng += athlete.lng
  })

  return {
    lat: sumLat / athletes.length,
    lng: sumLng / athletes.length
  }
}


// Terrain component using Geo-Three with height data
function Terrain({ origin, onReady }) {
  const { scene } = useThree()
  const [isLoading, setIsLoading] = useState(true)
  const mapViewRef = useRef(null)
  const isLoadedRef = useRef(false)

  useEffect(() => {
    if (!origin || isLoadedRef.current) return

    const loadTerrain = async () => {
      setIsLoading(true)

      try {
        // Create MapBox provider for satellite imagery
        // MapBoxProvider(apiToken, styleId, mode, format, useHDPI, version)
        const satelliteProvider = new MapBoxProvider(
          import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
          'mapbox/satellite-v9',
          MapBoxProvider.STYLE,
          'png',
          false
        )

        // Create MapBox provider for terrain height data (terrain-rgb tileset)
        const heightProvider = new MapBoxProvider(
          import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
          'mapbox.terrain-rgb',
          MapBoxProvider.MAP_ID,
          'pngraw',
          false
        )

        // Create map view with HEIGHT mode for 3D terrain
        // MapView(root, provider, heightProvider)
        // Use MapView.HEIGHT to enable MapHeightNode rendering with elevation data
        const mapView = new MapView(MapView.HEIGHT, satelliteProvider, heightProvider)

        // Override with LODRaycast for better performance
        mapView.lod = new LODRaycast()

        // Convert origin lat/lng to Spherical Mercator coordinates
        const originCoords = UnitsUtils.datumsToSpherical(origin.lat, origin.lng)

        // Center the map at origin (invert Y for WebGL coordinate system)
        mapView.position.set(-originCoords.x, 0, originCoords.y)

        // Remove old terrain if exists
        if (mapViewRef.current) {
          scene.remove(mapViewRef.current)
          mapViewRef.current.traverse((child) => {
            if (child.geometry) child.geometry.dispose()
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose())
              } else {
                child.material.dispose()
              }
            }
          })
        }

        // Add new terrain to scene
        scene.add(mapView)
        mapViewRef.current = mapView

        // Helper to convert lat/lng to world coordinates
        const coordsToWorld = (lat, lng) => {
          const coords = UnitsUtils.datumsToSpherical(lat, lng)
          return {
            x: coords.x - originCoords.x,
            y: 0,
            z: -(coords.y - originCoords.y)
          }
        }

        // Helper to get terrain height at a position using raycasting
        const getHeightAt = (lat, lng) => {
          const pos = coordsToWorld(lat, lng)
          const raycaster = new THREE.Raycaster()
          raycaster.set(
            new THREE.Vector3(pos.x, 10000, pos.z),
            new THREE.Vector3(0, -1, 0)
          )
          const intersects = raycaster.intersectObject(mapView, true)
          return intersects.length > 0 ? intersects[0].point.y : 0
        }

        // Pass utilities to parent
        if (onReady) {
          onReady({
            mapView,
            coordsToWorld,
            getHeightAt
          })
        }

        setIsLoading(false)
        isLoadedRef.current = true
        console.log('Geo-Three terrain with height data loaded successfully')
      } catch (error) {
        console.error('Failed to load Geo-Three terrain:', error)
        setIsLoading(false)
      }
    }

    loadTerrain()

    return () => {
      if (mapViewRef.current) {
        scene.remove(mapViewRef.current)
        mapViewRef.current.traverse((child) => {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose())
            } else {
              child.material.dispose()
            }
          }
        })
        mapViewRef.current = null
      }
      isLoadedRef.current = false
    }
  }, [origin, scene, onReady])

  return isLoading ? (
    <Html center>
      <div style={{
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '1rem 2rem',
        borderRadius: '0.5rem',
        fontSize: '1rem'
      }}>
        Loading 3D terrain with satellite imagery...
      </div>
    </Html>
  ) : null
}

// Athlete marker component rendered in 3D space
function AthleteMarker({ athlete, coordsToWorld, viewerPosition }) {
  const meshRef = useRef()
  const groupRef = useRef()
  const [worldPos, setWorldPos] = useState(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    if (!coordsToWorld || !athlete || !viewerPosition) return

    // Calculate distance from viewer
    const dist = haversineDistance(
      viewerPosition.lat,
      viewerPosition.lng,
      athlete.lat,
      athlete.lng
    )
    setDistance(dist)
  }, [athlete, viewerPosition, coordsToWorld])

  // Update position every frame using elevation data from athlete state
  useFrame(() => {
    if (!coordsToWorld || !athlete) return

    // Convert GPS to WebGL coordinates
    const pos = coordsToWorld(athlete.lat, athlete.lng)

    // Use elevation from athlete data (same as route - from GeoJSON)
    const elevation = athlete.elevation || 0

    // Elevation offset to put marker above terrain for visibility
    const markerHeight = 100 // 100 meters above terrain

    const newPos = {
      x: pos.x,
      y: elevation + markerHeight,
      z: pos.z
    }

    // Update position
    setWorldPos(newPos)
  })

  // Billboard effect - keep marker facing camera
  useFrame(({ camera }) => {
    if (meshRef.current) {
      meshRef.current.quaternion.copy(camera.quaternion)
    }
  })

  // Color based on position
  const getColor = () => {
    if (athlete.position === 1) return '#FFD700' // Gold
    if (athlete.position === 2) return '#C0C0C0' // Silver
    if (athlete.position === 3) return '#CD7F32' // Bronze
    return '#FF0000' // Red
  }

  if (!worldPos) return null

  return (
    <group ref={groupRef} position={[worldPos.x, worldPos.y, worldPos.z]}>
      {/* Vertical line from ground to marker */}
      <mesh position={[0, -worldPos.y / 2, 0]}>
        <cylinderGeometry args={[2, 2, worldPos.y, 8]} />
        <meshBasicMaterial color={getColor()} transparent opacity={0.4} />
      </mesh>

      {/* Marker sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[10, 16, 16]} />
        <meshStandardMaterial
          color={getColor()}
          emissive={getColor()}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Label */}
      <Html distanceFactor={50} position={[0, 20, 0]}>
        <div style={{
          background: 'rgba(0,0,0,0.85)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          fontSize: '0.9rem',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          border: `2px solid ${getColor()}`,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
            #{athlete.position} {athlete.name}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
            {distance > 1000
              ? `${(distance / 1000).toFixed(1)} km`
              : `${Math.round(distance)} m`}
          </div>
        </div>
      </Html>
    </group>
  )
}

// Route line component to show the race path
function RouteLine({ coordsToWorld, getHeightAt, mapView }) {
  const [routeCoords, setRouteCoords] = useState(null)
  const meshRef = useRef()

  // Load route GeoJSON once
  useEffect(() => {
    if (!coordsToWorld || routeCoords) return

    fetch('/TOR330.geojson')
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features[0]) {
          const coords = data.features[0].geometry.coordinates[0]
          // Sample points to reduce complexity (every 10th point)
          const sampledCoords = coords.filter((_, i) => i % 10 === 0)
          setRouteCoords(sampledCoords)
          console.log(`Route loaded with ${sampledCoords.length} points`)
        }
      })
      .catch(err => console.error('Failed to load route:', err))
  }, [coordsToWorld, routeCoords])

  // Update route positions - use GeoJSON elevation data
  useFrame(() => {
    if (!routeCoords || !coordsToWorld || !meshRef.current || !mapView) return

    // Convert route coordinates to 3D world positions using elevation from GeoJSON
    const points = []
    let maxHeight = -Infinity
    let minHeight = Infinity

    for (const coord of routeCoords) {
      const pos = coordsToWorld(coord[1], coord[0]) // [lng, lat] -> [lat, lng]

      // Use elevation from GeoJSON [lng, lat, elevation]
      // The elevation in the GeoJSON is in meters above sea level
      const elevation = coord[2] || 0

      maxHeight = Math.max(maxHeight, elevation)
      minHeight = Math.min(minHeight, elevation)

      // Use the GeoJSON elevation directly with offset for visibility over complex terrain
      points.push(new THREE.Vector3(pos.x, elevation + 50, pos.z))
    }

    // Debug output (once every ~60 frames)
    if (Math.random() < 0.016) {
      console.log(`Route using GeoJSON elevation | Min: ${minHeight.toFixed(0)}m | Max: ${maxHeight.toFixed(0)}m | Points: ${points.length}`)
    }

    // Create a tube geometry from points for better visibility
    if (points.length > 1) {
      try {
        const curve = new THREE.CatmullRomCurve3(points)
        const tubeGeometry = new THREE.TubeGeometry(curve, Math.min(points.length * 2, 1000), 20, 8, false)

        if (meshRef.current.geometry) {
          meshRef.current.geometry.dispose()
        }
        meshRef.current.geometry = tubeGeometry
      } catch (err) {
        console.error('Failed to create tube geometry:', err)
      }
    }
  })

  if (!routeCoords) return null

  // Create valid initial geometry with two points
  const initialCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 1, 0)
  ])

  return (
    <mesh ref={meshRef}>
      <tubeGeometry args={[initialCurve, 10, 15, 8, false]} />
      <meshStandardMaterial
        color="#FFFF00"
        emissive="#FFAA00"
        emissiveIntensity={0.3}
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>
  )
}

// Camera positioning component for spectator view
function CameraPositioner({ athletePositions, coordsToWorld, routeCoords }) {
  const { camera } = useThree()
  const [isPositioned, setIsPositioned] = useState(false)

  useEffect(() => {
    if (!coordsToWorld || !athletePositions || athletePositions.length === 0 || !routeCoords || isPositioned) {
      return
    }

    // Find optimal spectator position
    const spectatorPos = findSpectatorPosition(athletePositions, routeCoords)
    if (!spectatorPos) return

    // Convert spectator position to world coordinates
    const worldPos = coordsToWorld(spectatorPos.lat, spectatorPos.lng)
    const targetPos = coordsToWorld(spectatorPos.targetLat, spectatorPos.targetLng)

    // Set camera at spectator eye height (4m above terrain)
    const eyeHeight = 4 // 4 meters tall spectator
    const cameraElevation = spectatorPos.elevation + eyeHeight

    // Position camera at spectator location
    camera.position.set(
      worldPos.x,
      cameraElevation,
      worldPos.z
    )

    // Look at the route where athletes are
    const lookAtElevation = spectatorPos.targetElevation + 50 // Look slightly above ground
    camera.lookAt(targetPos.x, lookAtElevation, targetPos.z)

    // Adjust field of view for realistic perspective
    camera.fov = 75 // More natural FOV for ground-level view
    camera.updateProjectionMatrix()

    setIsPositioned(true)
    console.log('Spectator camera positioned:', {
      position: { lat: spectatorPos.lat.toFixed(5), lng: spectatorPos.lng.toFixed(5) },
      elevation: cameraElevation.toFixed(1) + 'm',
      lookingAt: { lat: spectatorPos.targetLat.toFixed(5), lng: spectatorPos.targetLng.toFixed(5) },
      distance: '200m from route'
    })
  }, [camera, athletePositions, coordsToWorld, routeCoords, isPositioned])

  return null
}

// Main AR Scene component
function ARScene({ athletePositions, viewerPosition }) {
  const [terrainData, setTerrainData] = useState(null)
  const [routeCoords, setRouteCoords] = useState(null)
  const [mapOrigin] = useState(() => {
    // Calculate origin once on mount
    return athletePositions && athletePositions.length > 0
      ? calculateAthleteCentroid(athletePositions)
      : viewerPosition
  })

  const handleTerrainReady = useCallback((data) => {
    setTerrainData(data)
    console.log('Terrain ready with height mode and raycasting support')
  }, [])

  // Load route coordinates for camera positioning
  useEffect(() => {
    fetch('/TOR330.geojson')
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features[0]) {
          const coords = data.features[0].geometry.coordinates[0]
          // Sample for camera positioning (every 10th point)
          const sampledCoords = coords.filter((_, i) => i % 10 === 0)
          setRouteCoords(sampledCoords)
        }
      })
      .catch(err => console.error('Failed to load route for camera:', err))
  }, [])

  // Store mapView reference
  const mapViewRef = useRef(null)

  useEffect(() => {
    if (terrainData?.mapView) {
      mapViewRef.current = terrainData.mapView
    }
  }, [terrainData])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[100, 100, 50]}
        intensity={1.0}
        castShadow
      />
      <hemisphereLight
        intensity={0.4}
        color="#ffffff"
        groundColor="#444444"
      />

      {/* Load terrain with Geo-Three centered on athletes */}
      {mapOrigin && (
        <Terrain
          origin={mapOrigin}
          onReady={handleTerrainReady}
        />
      )}

      {/* Route line */}
      {terrainData?.coordsToWorld && terrainData?.mapView && (
        <RouteLine
          coordsToWorld={terrainData.coordsToWorld}
          getHeightAt={terrainData.getHeightAt}
          mapView={terrainData.mapView}
        />
      )}

      {/* Athlete markers */}
      {terrainData?.coordsToWorld && viewerPosition && athletePositions.map(athlete => (
        <AthleteMarker
          key={athlete.id}
          athlete={athlete}
          coordsToWorld={terrainData.coordsToWorld}
          viewerPosition={viewerPosition}
        />
      ))}

      {/* Orbit controls for camera manipulation - configured for ground-level view */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={10}           // Allow very close viewing (10m)
        maxDistance={2000}         // Limit max distance for spectator view (2km)
        maxPolarAngle={Math.PI * 0.85}  // Allow looking up slightly
        minPolarAngle={Math.PI * 0.15}  // Prevent looking too far down
        enablePan={true}           // Allow panning around
        panSpeed={0.8}            // Moderate pan speed
        rotateSpeed={0.5}         // Slower rotation for more control
      />

      {/* Camera positioner */}
      {terrainData?.coordsToWorld && routeCoords && (
        <CameraPositioner
          athletePositions={athletePositions}
          coordsToWorld={terrainData.coordsToWorld}
          routeCoords={routeCoords}
        />
      )}
    </>
  )
}

// Main ARView component - wrapper for Canvas
export default function ARView({ isOpen, onClose, athletePositions = [], currentPosition = null }) {
  const [viewerPosition, setViewerPosition] = useState(null)

  useEffect(() => {
    if (isOpen && currentPosition) {
      setViewerPosition({
        lng: currentPosition.lng,
        lat: currentPosition.lat,
        elevation: currentPosition.estimatedElevation || 0
      })
    }
  }, [isOpen, currentPosition])

  if (!isOpen) return null

  // Use mock data if no real data provided (for testing)
  const positions = athletePositions.length > 0 ? athletePositions : [
    { id: '1', name: 'Athlete 1', position: 1, lat: 45.7780, lng: 6.8640 },
    { id: '2', name: 'Athlete 2', position: 2, lat: 45.7800, lng: 6.8660 },
    { id: '3', name: 'Athlete 3', position: 3, lat: 45.7820, lng: 6.8680 },
  ]

  const viewer = viewerPosition || { lat: 45.7780, lng: 6.8640 }

  return (
    <div className="ar-view-container">
      {/* Close button */}
      <button
        className="ar-close-button"
        onClick={onClose}
        aria-label="Close AR view"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      <Canvas
        camera={{
          position: [0, 100, 500],  // Start closer to ground level
          fov: 75,  // Wider FOV for more natural ground-level perspective
          near: 0.5,  // Allow very close rendering
          far: 50000  // Still allow far distance for terrain
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
      >
        <ARScene
          athletePositions={positions}
          viewerPosition={viewer}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="ar-controls">
        <div className="ar-info">
          <h3>Spectator View</h3>
          <p>Viewing Distance: ~200m</p>
          <p>Eye Height: 4m</p>
          <p>Mode: Ground Level</p>
          {positions.length > 0 && (
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.8 }}>
              Tracking {positions.length} athlete{positions.length !== 1 ? 's' : ''}
            </p>
          )}
          <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.6 }}>
            <p>Use mouse to look around</p>
            <p>Scroll to zoom in/out</p>
          </div>
        </div>
      </div>
    </div>
  )
}
