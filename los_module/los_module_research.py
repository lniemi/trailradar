import marimo

__generated_with = "0.19.11"
app = marimo.App()


@app.cell
def _():
    import marimo as mo

    return (mo,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Line of Sight (LOS) Module Research

    This notebook explores the implementation of line-of-sight calculations between two geographic coordinates using elevation data. The goal is to develop and validate LOS logic before integrating it into the main Sport Radar application.

    This notebook will use a simple python virtual environment. The required dependencies are listed in `los_module/requirements.txt`. You can create the virtual environment and install the dependencies using the following commands (assuming you are already in the `los_module` directory):

    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows, use .venv\Scripts\activate
    pip install -r requirements.txt
    ```

    ## Objectives

    1. Load and work with Copernicus DEM data (GLO-30)
    2. Calculate line of sight between two geographic coordinates
    3. Produce output that can be visualized in the main app's ARView
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Study Area

    The TOR330 ultra-trail race route in the Italian/French Alps (Aosta Valley area). This is the same region used in the main application, allowing us to validate results against the existing terrain visualization.
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ---
    ## Phase 1: Raw DEM Files (Copernicus DEM)

    We start with raw DEM files because:
    - Direct access to elevation values without decoding tile formats
    - Well-documented GeoTIFF format with standard tooling (rasterio, GDAL)
    - No API rate limits or authentication complexity
    - Easier to debug and validate results

    ### Copernicus DEM Resolutions
    - **GLO-30**: 30m resolution, freely available globally
    - **GLO-90**: 90m resolution, freely available globally

    We'll use GLO-30 for better accuracy in the mountainous terrain.
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### 1.1 Environment Setup & Imports
    """)
    return


@app.cell
def _():
    import os
    import sys
    import fiona
    #import rasterio

    # Fix PROJ database conflict: rasterio requires proj.db MINOR >= 5, but pyproj
    # and PostgreSQL/PostGIS ship older versions that get picked up first.
    # Point PROJ_DATA at rasterio's bundled proj_data which has the newest version.
    _proj_data = os.path.join(
        sys.prefix, "Lib", "site-packages", "rasterio", "proj_data"
    )
    if os.path.isdir(_proj_data):
        os.environ["PROJ_DATA"] = _proj_data

    import leafmap.leafmap as leafmap
    print("localtileserver")
    return leafmap, os


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### 1.2 Download/Load Copernicus DEM Data

    Copernicus DEM tiles can be downloaded from:
    - [Copernicus Open Access Hub](https://spacedata.copernicus.eu/)
    - [OpenTopography](https://opentopography.org/)
    - AWS Open Data Registry

    For the TOR330 area, we need tiles covering approximately:
    - Latitude: 45.5░N to 46.0░N
    - Longitude: 6.8░E to 7.5░E
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### 1.3 Explore the DEM Data
    """)
    return


@app.cell
def _(leafmap):
    # TODO: Inspect DEM
    # TODO: Print basic statistics (min/max elevation, shape)
    import geopandas as gpd

    dem = "DEM.tif"
    m = leafmap.Map()
    m.add_raster(dem, colormap="terrain", layer_name="DEM")

    tracks = gpd.read_file("TOR330-CERT-2025.gpx", layer="tracks")
    m.add_gdf(tracks, layer_name="TOR330 Route", style={"color": "red", "weight": 3})
    m
    return gpd, m, tracks


@app.cell
def _(gpd, m, os):
    from whitebox import WhiteboxTools
    from shapely.geometry import Point
    import rasterio
    assert m.draw_features, 'No marker drawn! Add a marker on the map above, then re-run this cell.'
    # 1. Get marker coordinates from the map
    coords = m.draw_features[-1]['geometry']['coordinates']
    marker_lng, marker_lat = (coords[0], coords[1])  # last drawn marker
    print(f'Observer position (WGS84): lng={marker_lng:.6f}, lat={marker_lat:.6f}')
    station_gdf = gpd.GeoDataFrame({'id': [1]}, geometry=[Point(marker_lng, marker_lat)], crs='EPSG:4326').to_crs('EPSG:25832')
    print(f'Reprojected to EPSG:25832: x={station_gdf.geometry.iloc[0].x:.1f}, y={station_gdf.geometry.iloc[0].y:.1f}')
    # 2. Create station point and reproject to match DEM CRS (EPSG:25832)
    station_file = os.path.abspath('viewshed_station.shp')
    station_gdf.to_file(station_file)
    dem_path = os.path.abspath('DEM.tif')
    output_path = os.path.abspath('viewshed_result.tif')
    wbt = WhiteboxTools()
    wbt.work_dir = os.path.abspath('.')
    wbt.verbose = True
    wbt.viewshed(dem=dem_path, stations=station_file, output=output_path, height=1.7)
    assert os.path.exists(output_path), 'Viewshed output not created. Check WhiteboxTools output above.'
    with rasterio.open(output_path) as _src:
        _data = _src.read(1)
    # 3. Run viewshed analysis
        _profile = _src.profile.copy()
    _profile.update(nodata=0)
    with rasterio.open(output_path, 'w', **_profile) as _dst:
        _dst.write(_data, 1)
    m.add_raster(output_path, colormap='Greens', layer_name='Viewshed', opacity=0.5)
    # 4. Post-process: set non-visible (0) as nodata for transparency
    # 5. Overlay on map ù visible areas shown in green
    print('Viewshed computed and displayed (green = visible from marker).')
    return marker_lat, marker_lng, rasterio


@app.cell
def _(leafmap, marker_lat, marker_lng, tracks):
    # New map showing viewshed analysis results
    from ipyleaflet import Marker, AwesomeIcon
    import matplotlib.pyplot as plt
    import matplotlib.colors as mcolors
    from PIL import Image
    import numpy as np
    import rioxarray
    # Read viewshed with rioxarray and reproject to EPSG:4326
    vs = rioxarray.open_rasterio('viewshed_result.tif').squeeze()
    vs = vs.rio.reproject('EPSG:4326')
    _bounds = vs.rio.bounds()
    _data = vs.values  # (left, bottom, right, top)
    _h, _w = _data.shape
    # Create a transparent PNG overlay: visible=green, non-visible=transparent
    _rgba = np.zeros((_h, _w, 4), dtype=np.uint8)
    visible = _data == 1
    _rgba[visible] = [0, 200, 0, 180]
    _img_path = 'viewshed_overlay.png'
    Image.fromarray(_rgba).save(_img_path)  # green, semi-transparent
    from ipyleaflet import ImageOverlay
    import base64
    with open(_img_path, 'rb') as _f:
        _b64 = base64.b64encode(_f.read()).decode()
    # Display on map using image overlay
    _data_url = f'data:image/png;base64,{_b64}'
    m2 = leafmap.Map()
    m2.add_raster('DEM.tif', colormap='terrain', layer_name='DEM', opacity=0.7)
    _overlay = ImageOverlay(url=_data_url, bounds=((_bounds[1], _bounds[0]), (_bounds[3], _bounds[2])), name='Viewshed')
    m2.add(_overlay)
    m2.add_gdf(tracks, layer_name='TOR330 Route', style={'color': 'red', 'weight': 3})
    _icon = AwesomeIcon(name='eye', marker_color='red', icon_color='white')
    obs_marker = Marker(location=(marker_lat, marker_lng), icon=_icon, title='Observer')
    m2.add(obs_marker)
    m2  # ((south, west), (north, east))
    return AwesomeIcon, Image, ImageOverlay, Marker, base64, np, plt, rioxarray


@app.cell
def _(np, rasterio):
    from scipy.ndimage import median_filter, binary_closing, generate_binary_structure
    import scipy
    with rasterio.open('viewshed_result.tif') as _src:
        raw = _src.read(1)
        _profile = _src.profile.copy()
    binary = (raw == 1).astype(np.uint8)
    filtered = median_filter(binary, size=3)
    struct = generate_binary_structure(2, 2)
    closed = binary_closing(filtered, structure=struct, iterations=1).astype(np.uint8)
    orig_count = binary.sum()
    clean_count = closed.sum()
    print(f'Visible pixels ù before: {orig_count:,}  after: {clean_count:,}  change: {clean_count - orig_count:+,} ({(clean_count / orig_count - 1) * 100:+.1f}%)')
    _profile.update(nodata=0)
    with rasterio.open('viewshed_destriped.tif', 'w', **_profile) as _dst:
        _dst.write(closed, 1)
    print('Saved viewshed_destriped.tif')
    return binary, clean_count, closed, orig_count


@app.cell
def _(binary, clean_count, closed, np, orig_count, plt):
    # Side-by-side comparison: original vs destriped viewshed
    fig, axes = plt.subplots(1, 2, figsize=(16, 8))
    rows = np.any(binary, axis=1)
    cols = np.any(binary, axis=0)
    rmin, rmax = np.where(rows)[0][[0, -1]]
    # Crop to the region with actual viewshed data for better comparison
    cmin, cmax = np.where(cols)[0][[0, -1]]
    pad = 20
    rmin, rmax = (max(0, rmin - pad), min(binary.shape[0], rmax + pad))
    cmin, cmax = (max(0, cmin - pad), min(binary.shape[1], cmax + pad))
    axes[0].imshow(binary[rmin:rmax, cmin:cmax], cmap='Greens', interpolation='nearest')
    axes[0].set_title(f'Original ({orig_count:,} px)')
    axes[1].imshow(closed[rmin:rmax, cmin:cmax], cmap='Greens', interpolation='nearest')
    axes[1].set_title(f'Destriped ({clean_count:,} px)')
    for ax in axes:
        ax.axis('off')
    plt.tight_layout()
    plt.savefig('viewshed_destrip_comparison.png', dpi=150, bbox_inches='tight')
    plt.show()
    print('Saved comparison to viewshed_destrip_comparison.png')
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### 1.4 Helper Functions for Coordinate-to-Elevation Lookup
    """)
    return


@app.cell
def _(
    AwesomeIcon,
    Image,
    ImageOverlay,
    Marker,
    base64,
    leafmap,
    marker_lat,
    marker_lng,
    np,
    rioxarray,
    tracks,
):
    vs_clean = rioxarray.open_rasterio('viewshed_destriped.tif').squeeze()
    vs_clean = vs_clean.rio.reproject('EPSG:4326')
    _bounds = vs_clean.rio.bounds()
    data_clean = vs_clean.values
    _h, _w = data_clean.shape
    _rgba = np.zeros((_h, _w, 4), dtype=np.uint8)
    _rgba[data_clean == 1] = [0, 200, 0, 180]
    _img_path = 'viewshed_overlay_destriped.png'
    Image.fromarray(_rgba).save(_img_path)
    with open(_img_path, 'rb') as _f:
        _b64 = base64.b64encode(_f.read()).decode()
    _data_url = f'data:image/png;base64,{_b64}'
    m3 = leafmap.Map()
    m3.add_raster('DEM.tif', colormap='terrain', layer_name='DEM', opacity=0.7)
    _overlay = ImageOverlay(url=_data_url, bounds=((_bounds[1], _bounds[0]), (_bounds[3], _bounds[2])), name='Viewshed (destriped)')
    m3.add(_overlay)
    m3.add_gdf(tracks, layer_name='TOR330 Route', style={'color': 'red', 'weight': 3})
    _icon = AwesomeIcon(name='eye', marker_color='red', icon_color='white')
    m3.add(Marker(location=(marker_lat, marker_lng), icon=_icon, title='Observer'))
    m3
    return


@app.cell
def _():
    # TODO: Create function to get elevation at a given (lat, lng) coordinate
    # - Convert geographic coordinates to pixel indices
    # - Handle edge cases (out of bounds, nodata values)
    # - Consider interpolation for sub-pixel accuracy
    return


@app.cell
def _():
    # TODO: Test elevation lookup with known points from the TOR330 route
    # Compare with elevation values in the GeoJSON to validate
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ---
    ## 2. Line of Sight Calculation

    The core LOS algorithm determines whether there is an unobstructed view between two points by:
    1. Creating a line between observer and target
    2. Sampling elevation along that line
    3. Checking if any terrain point blocks the sightline
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### 2.1 Basic LOS Algorithm
    """)
    return


@app.cell
def _():
    # TODO: Implement function to generate sample points along a line between two coordinates
    # - Input: observer (lat, lng, height), target (lat, lng, height)
    # - Output: list of (lat, lng) sample points
    return


@app.cell
def _():
    # TODO: Implement basic LOS calculation
    # - For each sample point, get terrain elevation
    # - Calculate the expected sightline height at that point
    # - Check if terrain is above sightline (blocked) or below (visible)
    return


@app.cell
def _():
    # TODO: Test LOS with simple cases
    # - Two points with clear view
    # - Two points with mountain in between
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### 2.2 Visualization of LOS Results
    """)
    return


@app.cell
def _():
    # TODO: Create elevation profile visualization
    # - X-axis: distance along sightline
    # - Y-axis: elevation
    # - Show terrain profile and sightline
    # - Highlight blocked/visible segments
    return


@app.cell
def _():
    # TODO: Create 2D map visualization
    # - Show observer and target points
    # - Draw line between them
    # - Color-code based on visibility
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### 2.3 Considerations for Accuracy

    Factors that affect LOS accuracy:
    - **Earth curvature**: significant for distances > 1km
    - **Atmospheric refraction**: bends light slightly
    - **DEM resolution**: 30m may miss small obstacles
    - **Observer/target height**: eye level vs ground level
    """)
    return


@app.cell
def _():
    # TODO: Implement earth curvature correction
    # Formula: curvature_drop = distance^2 / (2 * earth_radius)
    return


@app.cell
def _():
    # TODO: Add observer height parameter (e.g., 1.7m for eye level)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ---
    ## 3. Output for Main Application

    The LOS results need to be formatted for integration with the main app's ARView.
    """)
    return


@app.cell
def _():
    # TODO: Define output format
    # - JSON structure for LOS result
    # - Include: observer, target, visibility (bool), blocked_points (if any)
    return


@app.cell
def _():
    # TODO: Create function to export LOS results
    # - Save to JSON file
    # - Compatible with ARView coordinate system
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ---
    ## Phase 2: MapBox terrain-rgb Tiles (Future)

    Once Phase 1 is complete, we can explore using MapBox terrain-rgb tiles to align with the main application.

    ### Elevation Encoding
    MapBox terrain-rgb tiles encode elevation in RGB values:
    ```
    height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
    ```

    This provides approximately -10,000m to +1,667,772m range with 0.1m precision.
    """)
    return


@app.cell
def _():
    # TODO (Future): Implement MapBox terrain-rgb tile fetching
    # TODO (Future): Decode elevation from RGB values
    # TODO (Future): Compare results with Copernicus DEM
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ---
    ## Summary & Next Steps

    After completing this research:
    1. Validate LOS calculations against known test cases
    2. Optimize performance for real-time use
    3. Integrate with main application's ARView
    4. Consider caching/precomputation strategies for common viewpoints
    """)
    return


if __name__ == "__main__":
    app.run()
