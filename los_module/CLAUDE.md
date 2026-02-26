# LOS Module - CLAUDE.md

This file provides guidance for working with the Line of Sight (LOS) research module.

## Purpose

This is a **research-only** module for developing and testing Line of Sight calculations. The code here is exploratory and will eventually be integrated into the main Sport Radar application's ARView component.

**Important**: This folder is completely separate from the main React application. It uses Python with its own virtual environment.

## Environment Setup

### Virtual Environment

The virtual environment should be created in this folder (not at the project root):

```bash
cd los_module
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Unix/macOS)
source venv/bin/activate
```

### Dependencies

Key libraries (full list in `requirements.txt`, install with `pip install -r requirements.txt`):
- `rasterio` - Reading GeoTIFF DEM files
- `rio-tiler` - On-the-fly tile serving from rasters (handles reprojection)
- `rio-cogeo` - Cloud Optimized GeoTIFF conversion
- `numpy` - Array operations
- `matplotlib` / `Pillow` - Visualization and image encoding
- `geopandas` / `shapely` - Geospatial vector operations
- `pyproj` - Coordinate transformations
- `whitebox` - WhiteboxTools viewshed analysis
- `leafmap` (maplibregl) - Interactive map rendering via MapLibre GL JS
- `starlette` / `uvicorn` - Lightweight HTTP tile server (for terrain-RGB serving)
- `rioxarray` / `xarray` - Raster I/O with xarray integration
- `scipy` - Post-processing (median filter, morphological operations)
- `localtileserver` - Local tile serving for visual raster display

### PROJ Database Conflict

On systems with PostgreSQL/PostGIS installed, `rasterio` may fail with a `proj.db MINOR >= 5` error because PostGIS ships an older PROJ database that gets picked up first. The fix is applied at the top of the notebook:

```python
import os, sys
_proj_data = os.path.join(sys.prefix, "Lib", "site-packages", "rasterio", "proj_data")
if os.path.isdir(_proj_data):
    os.environ["PROJ_DATA"] = _proj_data
```

This must run **before** importing `rasterio`, `fiona`, or any geo library.

## File Structure

```
los_module/
├── CLAUDE.md                      # This file - detailed instructions
├── readme.md                      # Project overview and research notes
├── los_module_research.py         # Marimo notebook (Python script format)
├── los_module_research.ipynb      # Jupyter notebook version
├── requirements.txt               # Full pip freeze of .venv dependencies
├── los_research.qgz               # QGIS project file
├── TOR330-CERT-2025.gpx           # Original GPX route file
│
├── DEM.tif                        # Copernicus GLO-30 DEM (EPSG:25832, float32)
├── DEM.tif.aux.xml                # GeoTIFF auxiliary metadata
│
├── viewshed_result.tif            # Raw WhiteboxTools viewshed output (EPSG:25832)
├── viewshed_result_4326.tif       # Viewshed reprojected to WGS84
├── viewshed_destriped.tif         # Viewshed with stripe artifacts removed
│
├── viewshed_station.shp (+.dbf/.cpg/.prj/.shx)  # Observer point shapefile
├── viewshed_overlay.png           # Viewshed visualization overlay
├── viewshed_overlay_destriped.png # Destriped viewshed overlay
├── viewshed_analysis.png          # Analysis visualization
├── viewshed_destrip_comparison.png # Before/after comparison
│
└── .venv/                         # Python virtual environment (gitignored)
```

## Research Phases

### Phase 1: Copernicus DEM (Current)

Working with raw GeoTIFF DEM files from Copernicus GLO-30 dataset.

**Key tasks:**
1. Load DEM tiles covering the TOR330 route area
2. Implement coordinate-to-elevation lookup
3. Develop LOS calculation algorithm
4. Visualize results (elevation profiles, 2D maps)

**Study area bounds (TOR330 route):**
- Latitude: ~45.5°N to ~46.0°N
- Longitude: ~6.8°E to ~7.5°E

### Phase 2: MapBox terrain-rgb (Future)

Align with the main application's terrain data source.

**Elevation decoding formula:**
```python
height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
```

## 3D Terrain Rendering from Local DEM

### The Problem

MapLibre GL JS can render 3D terrain via its `terrain` style property, but it requires a **`raster-dem` tile source** — an HTTP endpoint serving 256x256 PNG tiles where elevation is encoded into RGB pixel values. It cannot consume a raw GeoTIFF file directly.

Our `DEM.tif` is a Copernicus GLO-30 GeoTIFF with:
- Raw float32 elevation values (metres above sea level)
- CRS: EPSG:25832 (UTM Zone 32N)
- Dimensions: 3564 x 1265 pixels (~22m x 30m cell size)

### Terrain-RGB Encoding

MapLibre supports two encoding schemes for `raster-dem` sources:

**Mapbox encoding** (what we use):
```
encoded_value = (elevation + 10000) / 0.1
R = (encoded_value >> 16) & 0xFF
G = (encoded_value >> 8)  & 0xFF
B =  encoded_value        & 0xFF
```

**Decoding** (what MapLibre does internally):
```
elevation = -10000 + ((R * 256² + G * 256 + B) * 0.1)
```

The +10000 offset allows encoding negative elevations (ocean floors down to -10,000m). The 0.1 factor gives 0.1m precision. Three bytes (24 bits) encode values 0 to 16,777,215, mapping to elevations from -10,000m to +1,667,721.5m — more than enough for any terrain on Earth.

**Terrarium encoding** (alternative, used by some open-source tile sets):
```
elevation = (R * 256 + G + B / 256) - 32768
```

### Our Solution: Local Tile Server

Rather than pre-generating a static tile pyramid or installing a heavy tile server (TiTiler), we run a lightweight HTTP tile server directly in the marimo notebook using libraries already in the venv:

**Stack:**
- `rio-tiler` — Reads tiles from the GeoTIFF, handles CRS reprojection (EPSG:25832 → EPSG:3857 Web Mercator) automatically per-tile request
- `starlette` — Minimal ASGI web framework (already installed as a dependency of uvicorn)
- `uvicorn` — ASGI server, runs in a daemon thread so it doesn't block the notebook
- `Pillow` — Encodes the RGB array as PNG

**Request flow:**
```
MapLibre requests GET /tiles/{z}/{x}/{y}.png
  → starlette routes to tile handler
  → rio-tiler reads tile from DEM.tif (reprojects on the fly)
  → elevation float32 array → terrain-RGB uint8 encoding
  → Pillow saves as PNG → HTTP 200 response
  → MapLibre decodes RGB → elevation → renders 3D mesh
```

**Out-of-bounds handling:** Tiles outside the DEM extent return a solid RGB(1, 134, 160) tile, which decodes to exactly 0.0m elevation (sea level). This prevents MapLibre errors when it requests tiles beyond our coverage.

### Why Not Other Approaches

| Approach | Verdict | Reason |
|----------|---------|--------|
| `leafmap.add_raster()` | Won't work | Uses `localtileserver` which serves colormapped visual tiles, not terrain-RGB encoded tiles. MapLibre can't interpret these as elevation. |
| `localtileserver` directly | Won't work | Same issue — no terrain-RGB encoding mode. It produces tiles for display, not for `raster-dem` consumption. |
| TiTiler | Would work | Has built-in `algorithm=terrainrgb`. But requires `pip install titiler.core` + FastAPI — extra dependency we don't need since rio-tiler + starlette suffice. |
| Pre-generated static tiles | Would work | Use `rio rgbify` or manual encoding + `gdal2tiles.py` to create a tile pyramid on disk, then serve with any static HTTP server. More setup but no runtime overhead. Good for production. |
| `maplibre-cog-protocol` | JS only | Client-side COG reader for MapLibre — works in browser apps but not in Python notebook context. Could be relevant for the main spectator app. |

### Performance Notes

- `rio-tiler` warns about missing overviews (`NoOverviewWarning`). For faster tile serving at low zoom levels, add overviews: `gdaladdo DEM.tif 2 4 8 16`
- Each tile request opens and reads from the GeoTIFF — acceptable for a research notebook but not ideal for production
- The daemon thread server on port 8765 lives as long as the Python process; restarting the notebook cell will fail with "address already in use" (restart the marimo kernel to rebind)

### MapLibre Style Configuration

The 3D map uses a custom MapLibre style with three sources:
- `osm` — OpenStreetMap raster base layer for visual context
- `terrainSource` — `raster-dem` source pointing at our local tile server, used by the `terrain` property to deform the map surface
- `hillshadeSource` — Same `raster-dem` tiles reused for the `hillshade` layer, which adds shadow/light effects based on a simulated sun angle

The `terrain.exaggeration` property controls vertical scaling (1 = true scale, >1 = exaggerated for visual effect).

## LOS Algorithm Overview

The basic Line of Sight algorithm:

1. **Input**: Observer position (lat, lng, height), Target position (lat, lng, height)
2. **Sample points**: Generate intermediate points along the line between observer and target
3. **Elevation lookup**: For each sample point, get terrain elevation from DEM
4. **Sightline calculation**: Calculate expected sightline height at each point (linear interpolation)
5. **Visibility check**: If terrain elevation > sightline height at any point, view is blocked

**Accuracy considerations:**
- Earth curvature correction: `curvature_drop = distance² / (2 * earth_radius)`
- Observer height offset (e.g., 1.7m for eye level)
- DEM resolution limitations (30m may miss small obstacles)

## Integration with Main App

The eventual integration target is `src/components/ARView.jsx`. The LOS module should produce output compatible with ARView's coordinate system:

- Coordinates in WGS84 (lat/lng)
- Elevation in meters
- Output format: JSON with observer, target, visibility status, and optionally blocked points

## Data Sources

### Copernicus DEM (`DEM.tif`)
- **Dataset**: Copernicus GLO-30 (30m resolution)
- **Format**: GeoTIFF, single-band float32 (elevation in metres)
- **CRS**: EPSG:25832 (UTM Zone 32N)
- **Dimensions**: 3564 x 1265 pixels (~22m x 30m cell size)
- **Coverage**: Italian/French Alps, Aosta Valley region
- **Geographic bounds**: ~6.9°E to ~7.9°E, ~45.5°N to ~45.9°N
- **No overviews**: `gdaladdo DEM.tif 2 4 8 16` can be run for faster low-zoom tile serving
- Download from: Copernicus Open Access Hub, OpenTopography, or AWS Open Data

### Main App Route Data
- Route GeoJSON: `../apps/spectator/public/TOR330.geojson`
- Route GPX (local copy): `TOR330-CERT-2025.gpx`
- Format: `[longitude, latitude, elevation]` coordinates
- Can be used to validate elevation lookups

## Code Style

- This is exploratory research code - prioritize clarity over optimization
- Document findings and decisions in markdown cells
- Keep the notebook runnable from top to bottom
- Use descriptive variable names
