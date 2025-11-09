import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Sky, OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { MapView, MapBoxProvider, UnitsUtils, MapNode } from 'geo-three'
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

// Terrain component using Geo-Three
function Terrain({ origin, onReady }) {
  const { scene } = useThree()
  const [isLoading, setIsLoading] = useState(true)
  const mapViewRef = useRef(null)

  useEffect(() => {
    if (!origin) return

    const loadTerrain = async () => {
      setIsLoading(true)

      try {
        // Create map provider (Mapbox)
        // MapBoxProvider requires: apiToken, styleId (default: 'mapbox.satellite')
        const provider = new MapBoxProvider(
          import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
          'mapbox/satellite-v9'
        )

        // Create planar map view
        const mapView = new MapView(MapView.PLANAR, provider)

        // Scale to kilometers for better visualization
        mapView.scale.set(0.001, 0.001, 0.001)

        // Convert origin lat/lng to XY coordinates
        const coords = UnitsUtils.datumsToSpherical(origin.lat, origin.lng)

        // Position the map at the origin
        mapView.position.set(coords.x * 0.001, 0, -coords.y * 0.001)

        // Remove old terrain if exists
        if (mapViewRef.current) {
          scene.remove(mapViewRef.current)
        }

        // Add new terrain to scene
        scene.add(mapView)
        mapViewRef.current = mapView

        // Pass helper functions to parent
        if (onReady) {
          onReady({
            mapView,
            coordsToWorld: (lat, lng) => {
              const c = UnitsUtils.datumsToSpherical(lat, lng)
              const originCoords = UnitsUtils.datumsToSpherical(origin.lat, origin.lng)
              return {
                x: (c.x - originCoords.x) * 0.001,
                z: -(c.y - originCoords.y) * 0.001
              }
            }
          })
        }

        setIsLoading(false)
        console.log('Geo-Three terrain loaded successfully')
      } catch (error) {
        console.error('Failed to load Geo-Three terrain:', error)
        setIsLoading(false)
      }
    }

    loadTerrain()

    return () => {
      if (mapViewRef.current) {
        scene.remove(mapViewRef.current)
        mapViewRef.current = null
      }
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
        Loading terrain...
      </div>
    </Html>
  ) : null
}

// Athlete marker component rendered in 3D space
function AthleteMarker({ athlete, coordsToWorld, viewerPosition }) {
  const meshRef = useRef()
  const textRef = useRef()
  const [worldPos, setWorldPos] = useState(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    if (!coordsToWorld || !athlete || !viewerPosition) return

    // Convert GPS to WebGL coordinates
    const pos = coordsToWorld(athlete.lat, athlete.lng)

    // Elevation offset to put marker above terrain (increased for better visibility from nadir)
    const elevationOffset = 100 // 100 meters in world space

    setWorldPos({ x: pos.x, y: elevationOffset * 0.001, z: pos.z })

    // Calculate distance from viewer
    const dist = haversineDistance(
      viewerPosition.lat,
      viewerPosition.lng,
      athlete.lat,
      athlete.lng
    )
    setDistance(dist)
  }, [athlete, coordsToWorld, viewerPosition])

  // Billboard effect - always face camera
  useFrame(({ camera }) => {
    if (meshRef.current) {
      meshRef.current.quaternion.copy(camera.quaternion)
    }
    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion)
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
    <group position={[worldPos.x, worldPos.y, worldPos.z]}>
      {/* Vertical pole (increased size for visibility from above) */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.1, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>

      {/* Athlete flag/marker (billboard, increased size) */}
      <mesh ref={meshRef} position={[0, 0.11, 0]}>
        <planeGeometry args={[0.12, 0.06]} />
        <meshStandardMaterial
          color={getColor()}
          side={THREE.DoubleSide}
          emissive={getColor()}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Text label with athlete info */}
      <mesh ref={textRef} position={[0, 0.1, 0]}>
        <Html
          center
          distanceFactor={0.15}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            border: `2px solid ${getColor()}`
          }}
        >
          <div>
            #{athlete.position} {athlete.name}
            <br />
            <span style={{ fontSize: '10px', opacity: 0.8 }}>
              {distance > 1000
                ? `${(distance / 1000).toFixed(1)} km`
                : `${Math.round(distance)} m`}
            </span>
          </div>
        </Html>
      </mesh>
    </group>
  )
}

// Route line component
function RouteLine({ coordsToWorld }) {
  const [routePoints, setRoutePoints] = useState([])

  useEffect(() => {
    if (!coordsToWorld) return

    // Load TOR330 route
    fetch('/TOR330.geojson')
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features[0]) {
          const coords = data.features[0].geometry.coordinates[0]

          // Convert route coordinates to 3D world positions
          const points = coords.map(coord => {
            const pos = coordsToWorld(coord[1], coord[0]) // [lat, lng]
            // Offset slightly above terrain to avoid z-fighting
            return new THREE.Vector3(pos.x, 0.01, pos.z)
          })
          setRoutePoints(points)
        }
      })
      .catch(err => console.error('Failed to load route:', err))
  }, [coordsToWorld])

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
      <lineBasicMaterial color="#ffff00" linewidth={3} transparent opacity={0.8} />
    </line>
  )
}

// Camera controller component
function CameraController({ athletePositions, coordsToWorld }) {
  const { camera } = useThree()
  const [isPositioned, setIsPositioned] = useState(false)

  useEffect(() => {
    if (!coordsToWorld || !athletePositions || athletePositions.length === 0 || isPositioned) return

    // Calculate centroid of all athletes
    const centroid = calculateAthleteCentroid(athletePositions)
    if (!centroid) return

    // Calculate spread to determine camera height
    const spread = calculateAthleteSpread(athletePositions)

    // Convert centroid to world coordinates
    const centerPos = coordsToWorld(centroid.lat, centroid.lng)

    // Calculate camera height based on spread and FOV
    // Using a factor to ensure all athletes fit in view
    // For FOV=60°, height = (spread / 2) / tan(30°) ≈ spread * 0.866
    const baseHeight = Math.max(spread * 0.001 * 1.2, 2) // At least 2km high
    const cameraHeight = baseHeight

    // Set camera for nadir (top-down) view
    camera.position.set(centerPos.x, cameraHeight, centerPos.z)

    // Look straight down at the centroid
    camera.lookAt(centerPos.x, 0, centerPos.z)

    // Set up vector for proper orientation
    camera.up.set(0, 1, 0)

    setIsPositioned(true)
    console.log('Camera positioned for nadir view:', {
      centroid,
      spread: spread / 1000 + 'km',
      height: cameraHeight + 'km',
      position: { x: centerPos.x, y: cameraHeight, z: centerPos.z }
    })
  }, [camera, athletePositions, coordsToWorld, isPositioned])

  return null
}

// Map update component to handle LOD updates
function MapUpdater({ mapView }) {
  const { camera, gl, scene } = useThree()

  useFrame(() => {
    if (mapView) {
      mapView.lod.updateLOD(mapView, camera, gl, scene)
    }
  })

  return null
}

// Main AR Scene component
function ARScene({ athletePositions, viewerPosition }) {
  const [terrainData, setTerrainData] = useState(null)

  const handleTerrainReady = (data) => {
    setTerrainData(data)
    console.log('Terrain ready')
  }

  // Use athlete centroid as map origin if athletes exist, otherwise use viewer position
  const mapOrigin = athletePositions && athletePositions.length > 0
    ? calculateAthleteCentroid(athletePositions)
    : viewerPosition

  return (
    <>
      {/* Sky with realistic atmosphere */}
      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.6}
        azimuth={0.25}
      />

      {/* Ambient lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <hemisphereLight intensity={0.6} groundColor="#553311" />

      {/* Load terrain with Geo-Three centered on athletes */}
      {mapOrigin && (
        <Terrain
          origin={mapOrigin}
          onReady={handleTerrainReady}
        />
      )}

      {/* Map LOD updater */}
      {terrainData?.mapView && <MapUpdater mapView={terrainData.mapView} />}

      {/* Route line */}
      {terrainData?.coordsToWorld && <RouteLine coordsToWorld={terrainData.coordsToWorld} />}

      {/* Athlete markers */}
      {terrainData?.coordsToWorld && viewerPosition && athletePositions.map(athlete => (
        <AthleteMarker
          key={athlete.id}
          athlete={athlete}
          coordsToWorld={terrainData.coordsToWorld}
          viewerPosition={viewerPosition}
        />
      ))}

      {/* Camera controls - OrbitControls for nadir view */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        minDistance={0.5}
        maxDistance={20}
        minPolarAngle={0} // Allow looking straight up at sky
        maxPolarAngle={Math.PI * 0.75} // Limit to 135° (prevent going too horizontal)
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />

      {/* Position camera for nadir view above athletes */}
      {terrainData?.coordsToWorld && athletePositions && athletePositions.length > 0 && (
        <CameraController athletePositions={athletePositions} coordsToWorld={terrainData.coordsToWorld} />
      )}
    </>
  )
}

// Main AR View component
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

  return (
    <div className="ar-view">
      {/* Header */}
      <div className="ar-header">
        <div className="view-info">
          <h3>AR View - Geo-Three Terrain</h3>
          {viewerPosition && (
            <p className="position-info">
              Elevation: {Math.round(viewerPosition.elevation)}m |
              Lat: {viewerPosition.lat.toFixed(5)} |
              Lng: {viewerPosition.lng.toFixed(5)}
            </p>
          )}
        </div>
        <button className="close-button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Control hints */}
      <div className="control-hint">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
          <path d="M12 2v4m0 0a8 8 0 018 8h4m-4 0l3-3m-3 3l3 3"/>
        </svg>
        Drag to rotate 360° • Scroll to zoom • Right-drag to pan
      </div>

      {/* Athlete count indicator */}
      {athletePositions.length > 0 && (
        <div className="athlete-count">
          {athletePositions.length} athlete{athletePositions.length !== 1 ? 's' : ''} visible
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{
          fov: 60,
          near: 0.01,
          far: 50,
          position: [0, 5, 0]
        }}
        style={{ background: '#87CEEB' }}
        gl={{
          antialias: true,
          alpha: false
        }}
      >
        <ARScene
          athletePositions={athletePositions}
          viewerPosition={viewerPosition}
        />
      </Canvas>

      {/* Compass */}
      <div className="ar-compass">
        <div className="compass-arrow"></div>
        <div className="compass-label">N</div>
      </div>
    </div>
  )
}
