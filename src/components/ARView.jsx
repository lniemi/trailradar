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

// Calculate bounding box diagonal distance for athletes
function calculateAthleteSpread(athletes) {
  if (!athletes || athletes.length === 0) return 0

  let minLat = Infinity, maxLat = -Infinity
  let minLng = Infinity, maxLng = -Infinity

  athletes.forEach(athlete => {
    minLat = Math.min(minLat, athlete.lat)
    maxLat = Math.max(maxLat, athlete.lat)
    minLng = Math.min(minLng, athlete.lng)
    maxLng = Math.max(maxLng, athlete.lng)
  })

  // Calculate diagonal distance
  return haversineDistance(minLat, minLng, maxLat, maxLng)
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

        // Create planar map view with height data support
        // MapView(root, provider, heightProvider)
        const mapView = new MapView(MapView.PLANAR, satelliteProvider, heightProvider)

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
function AthleteMarker({ athlete, coordsToWorld, getHeightAt, viewerPosition }) {
  const meshRef = useRef()
  const groupRef = useRef()
  const [worldPos, setWorldPos] = useState(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    if (!coordsToWorld || !athlete || !viewerPosition) return

    // Convert GPS to WebGL coordinates
    const pos = coordsToWorld(athlete.lat, athlete.lng)

    // Get terrain height at position (will raycast once terrain is loaded)
    const terrainHeight = getHeightAt ? getHeightAt(athlete.lat, athlete.lng) : 0

    // Elevation offset to put marker above terrain
    const markerHeight = 100 // 100 meters above terrain

    setWorldPos({
      x: pos.x,
      y: terrainHeight + markerHeight,
      z: pos.z
    })

    // Calculate distance from viewer
    const dist = haversineDistance(
      viewerPosition.lat,
      viewerPosition.lng,
      athlete.lat,
      athlete.lng
    )
    setDistance(dist)
  }, [athlete, coordsToWorld, getHeightAt, viewerPosition])

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
function RouteLine({ coordsToWorld, getHeightAt }) {
  const [routePoints, setRoutePoints] = useState([])

  useEffect(() => {
    if (!coordsToWorld) return

    // Load TOR330 route
    fetch('/TOR330.geojson')
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features[0]) {
          const coords = data.features[0].geometry.coordinates[0]

          // Sample points to reduce complexity (every 10th point)
          const sampledCoords = coords.filter((_, i) => i % 10 === 0)

          // Convert route coordinates to 3D world positions
          const points = sampledCoords.map(coord => {
            const pos = coordsToWorld(coord[1], coord[0]) // [lng, lat] -> [lat, lng]
            const terrainHeight = getHeightAt ? getHeightAt(coord[1], coord[0]) : 0
            // Offset slightly above terrain to avoid z-fighting
            return new THREE.Vector3(pos.x, terrainHeight + 5, pos.z)
          })
          setRoutePoints(points)
        }
      })
      .catch(err => console.error('Failed to load route:', err))
  }, [coordsToWorld, getHeightAt])

  if (routePoints.length === 0) return null

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={routePoints.length}
          array={new Float32Array(routePoints.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#FFFF00" linewidth={3} transparent opacity={0.8} />
    </line>
  )
}

// Camera positioning component
function CameraPositioner({ athletePositions, coordsToWorld }) {
  const { camera } = useThree()
  const [isPositioned, setIsPositioned] = useState(false)

  useEffect(() => {
    if (!coordsToWorld || !athletePositions || athletePositions.length === 0 || isPositioned) {
      return
    }

    // Calculate centroid
    const centroid = calculateAthleteCentroid(athletePositions)
    if (!centroid) return

    // Calculate spread to determine camera distance
    const spread = calculateAthleteSpread(athletePositions)

    // Convert centroid to world coordinates
    const centerPos = coordsToWorld(centroid.lat, centroid.lng)

    // Calculate camera position for good overview
    const cameraDistance = Math.max(spread * 1.5, 5000) // Minimum 5km distance
    const cameraHeight = cameraDistance * 0.7

    // Position camera at an angle for better 3D view
    camera.position.set(
      centerPos.x,
      cameraHeight,
      centerPos.z + cameraDistance
    )

    // Look at the centroid
    camera.lookAt(centerPos.x, 0, centerPos.z)

    setIsPositioned(true)
    console.log('Camera positioned:', {
      centroid,
      spread: (spread / 1000).toFixed(2) + ' km',
      height: (cameraHeight / 1000).toFixed(2) + ' km',
      distance: (cameraDistance / 1000).toFixed(2) + ' km'
    })
  }, [camera, athletePositions, coordsToWorld, isPositioned])

  return null
}

// Main AR Scene component
function ARScene({ athletePositions, viewerPosition }) {
  const [terrainData, setTerrainData] = useState(null)
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
      {terrainData?.coordsToWorld && (
        <RouteLine
          coordsToWorld={terrainData.coordsToWorld}
          getHeightAt={terrainData.getHeightAt}
        />
      )}

      {/* Athlete markers */}
      {terrainData?.coordsToWorld && viewerPosition && athletePositions.map(athlete => (
        <AthleteMarker
          key={athlete.id}
          athlete={athlete}
          coordsToWorld={terrainData.coordsToWorld}
          getHeightAt={terrainData.getHeightAt}
          viewerPosition={viewerPosition}
        />
      ))}

      {/* Orbit controls for camera manipulation */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={1000}
        maxDistance={50000}
        maxPolarAngle={Math.PI / 2}
      />

      {/* Camera positioner */}
      {terrainData?.coordsToWorld && (
        <CameraPositioner
          athletePositions={athletePositions}
          coordsToWorld={terrainData.coordsToWorld}
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
          position: [0, 10000, 10000],
          fov: 60,
          near: 1,
          far: 100000
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
          <h3>3D Terrain View</h3>
          <p>Height Mode: Enabled</p>
          <p>Satellite: MapBox</p>
          <p>LOD: Raycast</p>
          {viewerPosition && (
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.8 }}>
              Lat: {viewerPosition.lat.toFixed(5)} | Lng: {viewerPosition.lng.toFixed(5)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
