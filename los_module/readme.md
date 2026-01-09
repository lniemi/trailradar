# Line of Sight (LOS) Module

This module provides functionality to calculate and visualize the line of sight between two points.

The exact logic and frameworks used are still to be determined, but the core features will include:

1. Use of Copernicus DEM data
2. Calculation of line of sight between two geographic coordinates
3. Production of an raw output that can be later visualized in the main app

## Research

The logic by which this will be implemented is going to be explored first in a python notebook environment. After that has been done and clear and good practices have been established, the logic will be transferred to the main application.

The way how the environment and required libraries will be set up is at first at least going to be done using virtual environments (venv) and pip. Later if needed and there are e.g. conflict of dependencies other solutions (mainly conda) will be explored. The venv is going to be in the los_module folder, not at the root.

The research will try to use the same data sources as the main application and study area(s) from the region that currently (january 9th 2026) is used in the main application.

### Phase 1: Raw DEM Files (Copernicus DEM)

The research will start with raw DEM files, specifically Copernicus DEM data. This approach is more straightforward for LOS calculations because:

- Direct access to elevation values without decoding tile formats
- Well-documented GeoTIFF format with standard tooling (rasterio, GDAL)
- No API rate limits or authentication complexity during development
- Easier to debug and validate results

Copernicus DEM is available in multiple resolutions:
- **GLO-30**: 30m resolution, freely available globally
- **GLO-90**: 90m resolution, freely available globally

For the TOR330 route area (Italian/French Alps, Aosta Valley), we'll download the relevant GLO-30 tiles covering the study area.

### Phase 2: MapBox terrain-rgb Tiles (Future)

Once LOS calculations are working with raw DEM files, we can explore using MapBox's terrain-rgb tileset to align with the main application's ARView. This tileset derives elevation data from:

1. **SRTM (Shuttle Radar Topography Mission)** - NASA's radar topography data covering latitudes 60°N to 56°S at ~30m resolution

2. **ASTER GDEM (Advanced Spaceborne Thermal Emission and Reflection Radiometer Global Digital Elevation Model)** - Covers 83°N to 83°S

3. **ETOPO1** - For ocean bathymetry and areas not covered by SRTM/ASTER

4. **Local high-resolution sources** - In some regions, MapBox incorporates higher-resolution national datasets (like USGS 3DEP for the US)

#### Elevation Encoding

The terrain-rgb tiles are PNG images where elevation is encoded in RGB values:

```
height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
```

This provides a range of approximately -10,000m to +1,667,772m with 0.1 meter precision.

#### TOR330 Route Area (Alps)

For the TOR330 route in the Italian/French Alps (Aosta Valley area), the terrain data likely comes from:
- **EU-DEM** (European Digital Elevation Model) at 25m resolution
- **SRTM** at 30m resolution
- Possibly **SwissALTI3D** or similar national datasets for Swiss portions


## Integration

There may be multiple ways to integrate this module into the main application. First that comes to mind is this:

**Integration with ARView**. ARView was designed from the beginning to visualize geospatial data in augmented reality. The LOS module can leverage ARView's capabilities to display line of sight results directly within an AR environment, providing users with an immersive experience.