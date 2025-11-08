import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import mapboxgl from 'mapbox-gl'
import './Map.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

const Map = forwardRef((props, ref) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const athleteMarker = useRef(null)

  useEffect(() => {
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [0, 0],
      zoom: 2,
      projection: 'globe',
      terrain: { source: 'mapbox-dem', exaggeration: 1.5 }
    })

    map.current.on('style.load', () => {
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb',
        tileSize: 512,
        maxzoom: 14
      })
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })

      // Load TOR330.geojson
      fetch('/TOR330.geojson')
        .then(response => response.json())
        .then(data => {
          map.current.addSource('tor330', {
            type: 'geojson',
            data: data
          })

          map.current.addLayer({
            id: 'tor330-line',
            type: 'line',
            source: 'tor330',
            paint: {
              'line-color': '#ffff00',
              'line-width': 3
            }
          })

          // Calculate bounds and zoom to extent
          const coordinates = data.features[0].geometry.coordinates[0]
          const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord)
          }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))

          map.current.fitBounds(bounds, {
            padding: 50
          })
        })
    })

    return () => {
      if (athleteMarker.current) {
        athleteMarker.current.remove()
      }
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    updateAthletePosition(lng, lat) {
      if (!map.current) return

      if (!athleteMarker.current) {
        // Create marker on first update
        const el = document.createElement('div')
        el.className = 'athlete-marker'
        el.style.width = '20px'
        el.style.height = '20px'
        el.style.borderRadius = '50%'
        el.style.backgroundColor = '#ff0000'
        el.style.border = '3px solid white'
        el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)'

        athleteMarker.current = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current)
      } else {
        // Update existing marker
        athleteMarker.current.setLngLat([lng, lat])
      }

      // Center map on athlete
      map.current.easeTo({
        center: [lng, lat],
        duration: 1000
      })
    },

    removeAthleteMarker() {
      if (athleteMarker.current) {
        athleteMarker.current.remove()
        athleteMarker.current = null
      }
    }
  }))

  return <div ref={mapContainer} className="map-container" />
})

Map.displayName = 'Map'

export default Map
