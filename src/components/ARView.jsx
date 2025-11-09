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
  const [cameraDistance, setCameraDistance] = useState(0)

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

  // Calculate distance from camera to athlete marker
  useFrame(({ camera }) => {
    if (worldPos) {
      const dist = camera.position.distanceTo(new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z))
      setCameraDistance(dist)
    }
  })

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

  // Calculate dynamic distance factor based on camera distance
  const getDistanceFactor = () => {
    if (cameraDistance < 100) return 150      // Very close: small banner
    if (cameraDistance < 1000) return 400     // 100m radius: little bit bigger
    if (cameraDistance < 3000) return 800     // 1km radius: more bigger
    if (cameraDistance < 10000) return 1500   // 3km radius: very much bigger
    return 2500                               // 10km+ radius: very very much bigger
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
      <Html distanceFactor={getDistanceFactor()} position={[0, 20, 0]}>
        <div style={{
          background: 'rgba(0,0,0,0.9)',
          color: 'white',
          padding: '1.5rem 2.5rem',
          borderRadius: '1rem',
          fontSize: '2rem',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          border: `4px solid ${getColor()}`,
          boxShadow: '0 8px 16px rgba(0,0,0,0.6)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>
            #{athlete.position} {athlete.name}
          </div>
          <div style={{ fontSize: '1.5rem', opacity: 0.9 }}>
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

// Camera positioning component
function CameraPositioner({ onCameraUpdate, origin, controlsRef }) {
  const { camera } = useThree()
  const [isInitialized, setIsInitialized] = useState(false)

  // Set initial camera target
  useEffect(() => {
    if (!controlsRef?.current || isInitialized) return

    // Set target to specific position (Z is positive in world space, but displays as negative due to coordinate conversion)
    controlsRef.current.target.set(938.0, 838.6, -1007.1)
    controlsRef.current.update()
    setIsInitialized(true)
  }, [controlsRef, isInitialized])

  // Update camera info every frame
  useFrame(() => {
    if (!onCameraUpdate || !origin || !controlsRef?.current) return

    // Convert camera world position back to lat/lng
    const originCoords = UnitsUtils.datumsToSpherical(origin.lat, origin.lng)

    // Camera position in world space relative to origin
    const worldX = camera.position.x + originCoords.x
    const worldZ = -camera.position.z + originCoords.y

    // Convert back to lat/lng using sphericalToDatums
    const geoCoords = UnitsUtils.sphericalToDatums(worldX, worldZ)

    // Convert target position back to lat/lng
    const target = controlsRef.current.target
    const targetWorldX = target.x + originCoords.x
    const targetWorldZ = -target.z + originCoords.y
    const targetGeoCoords = UnitsUtils.sphericalToDatums(targetWorldX, targetWorldZ)

    onCameraUpdate({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      fov: camera.fov,
      lat: geoCoords.latitude,
      lng: geoCoords.longitude,
      targetX: target.x,
      targetY: target.y,
      targetZ: target.z,
      targetLat: targetGeoCoords.latitude,
      targetLng: targetGeoCoords.longitude
    })
  })

  return null
}

// Main AR Scene component
function ARScene({ athletePositions, viewerPosition, onCameraUpdate }) {
  const [terrainData, setTerrainData] = useState(null)
  const controlsRef = useRef(null)
  const [mapOrigin] = useState(() => {
    // Use fixed origin for consistent camera positioning
    return { lat: 45.66078, lng: 7.09731 }
  })

  const handleTerrainReady = useCallback((data) => {
    setTerrainData(data)
    console.log('Terrain ready with height mode and raycasting support')
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

      {/* Orbit controls for camera manipulation */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2}
        zoomSpeed={1.5}
        enableZoom={true}
        screenSpacePanning={false}
      />

      {/* Camera positioner */}
      {mapOrigin && (
        <CameraPositioner
          onCameraUpdate={onCameraUpdate}
          origin={mapOrigin}
          controlsRef={controlsRef}
        />
      )}
    </>
  )
}

// Main ARView component - wrapper for Canvas
export default function ARView({ isOpen, onClose, athletePositions = [], currentPosition = null }) {
  const [viewerPosition, setViewerPosition] = useState(null)
  const [cameraInfo, setCameraInfo] = useState({
    x: 0,
    y: 0,
    z: 0,
    fov: 60,
    lat: 0,
    lng: 0,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    targetLat: 0,
    targetLng: 0
  })

  useEffect(() => {
    if (isOpen && currentPosition) {
      setViewerPosition({
        lng: currentPosition.lng,
        lat: currentPosition.lat,
        elevation: currentPosition.estimatedElevation || 0
      })
    }
  }, [isOpen, currentPosition])

  const handleCameraUpdate = useCallback((info) => {
    setCameraInfo(info)
    // Update viewer position with camera's geographic coordinates
    if (info.lat !== undefined && info.lng !== undefined) {
      setViewerPosition(prev => ({
        ...prev,
        lat: info.lat,
        lng: info.lng
      }))
    }
  }, [])

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
          position: [4189.0, 2044.2, -952.6],
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
          onCameraUpdate={handleCameraUpdate}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="ar-controls">
        <div className="ar-info">
          <h3>3D Terrain View</h3>
          <p>Height Mode: Enabled</p>
          <p>Satellite: MapBox</p>
          <p>LOD: Raycast</p>
          {cameraInfo.lat !== 0 && cameraInfo.lng !== 0 && (
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.8 }}>
              Lat: {cameraInfo.lat.toFixed(5)} | Lng: {cameraInfo.lng.toFixed(5)}
            </p>
          )}
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Camera Position</p>
            <p style={{ fontSize: '0.7rem', opacity: 0.9 }}>
              X: {cameraInfo.x.toFixed(1)} | Y: {cameraInfo.y.toFixed(1)} | Z: {cameraInfo.z.toFixed(1)}
            </p>
            <p style={{ fontSize: '0.7rem', opacity: 0.9, marginTop: '0.25rem' }}>
              Height: {(cameraInfo.y / 1000).toFixed(2)} km | FOV: {cameraInfo.fov.toFixed(0)}°
            </p>
          </div>
          {cameraInfo.targetLat !== undefined && cameraInfo.targetLng !== undefined && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Camera Target</p>
              <p style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                X: {cameraInfo.targetX?.toFixed(1)} | Y: {cameraInfo.targetY?.toFixed(1)} | Z: {cameraInfo.targetZ?.toFixed(1)}
              </p>
              <p style={{ fontSize: '0.7rem', opacity: 0.9, marginTop: '0.25rem' }}>
                Lat: {cameraInfo.targetLat.toFixed(5)} | Lng: {cameraInfo.targetLng.toFixed(5)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}