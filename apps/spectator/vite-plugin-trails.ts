import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

const TRAILS_DIR = 'public/imported-trails'
const INDEX_FILE = path.join(TRAILS_DIR, 'index.json')

interface TrailMeta {
  id: string
  name: string
  location: string
  distance: number
  elevationGain?: number
  source: 'imported'
  geojsonUrl: string
}

function ensureDir() {
  if (!fs.existsSync(TRAILS_DIR)) {
    fs.mkdirSync(TRAILS_DIR, { recursive: true })
  }
}

function readIndex(): TrailMeta[] {
  ensureDir()
  if (!fs.existsSync(INDEX_FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeIndex(trails: TrailMeta[]) {
  ensureDir()
  fs.writeFileSync(INDEX_FILE, JSON.stringify(trails, null, 2))
}

export default function trailsPlugin(): Plugin {
  return {
    name: 'vite-plugin-trails',
    configureServer(server) {
      server.middlewares.use('/api/trails', (req, res) => {
        // GET — list imported trails
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(readIndex()))
          return
        }

        // POST — save a new imported trail
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            try {
              const { id, name, location, distance, elevationGain, geojson } = JSON.parse(body)

              if (!id || !geojson) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Missing id or geojson' }))
                return
              }

              ensureDir()

              // Write the GeoJSON file
              const filename = `${id}.geojson`
              const filepath = path.join(TRAILS_DIR, filename)
              fs.writeFileSync(filepath, JSON.stringify(geojson))

              // Update index
              const trails = readIndex()
              const meta: TrailMeta = {
                id,
                name: name || id,
                location: location || 'Imported',
                distance: distance || 0,
                elevationGain,
                source: 'imported',
                geojsonUrl: `/imported-trails/${filename}`,
              }

              const existingIdx = trails.findIndex((t) => t.id === id)
              if (existingIdx >= 0) {
                trails[existingIdx] = meta
              } else {
                trails.push(meta)
              }
              writeIndex(trails)

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(meta))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
          return
        }

        // DELETE — remove an imported trail (id in query string)
        if (req.method === 'DELETE') {
          const url = new URL(req.url || '', `http://${req.headers.host}`)
          const id = url.searchParams.get('id')

          if (!id) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Missing id parameter' }))
            return
          }

          // Remove GeoJSON file
          const filepath = path.join(TRAILS_DIR, `${id}.geojson`)
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath)
          }

          // Update index
          const trails = readIndex().filter((t) => t.id !== id)
          writeIndex(trails)

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true }))
          return
        }

        res.statusCode = 405
        res.end(JSON.stringify({ error: 'Method not allowed' }))
      })
    },
  }
}
