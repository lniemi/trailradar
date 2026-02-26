export interface Trail {
  id: string
  name: string
  location: string
  distance: number // km
  elevationGain?: number // meters
  source: 'builtin' | 'imported'
  geojsonUrl?: string // for built-in trails (e.g. "/TOR330.geojson")
  geojsonData?: object // for imported trails (stored inline)
}
