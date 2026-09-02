# NER Logistics AI - GIS Data Pipeline

This folder isolates the GIS data processing layer from the backend codebase. It is responsible for grabbing OpenStreetMap data, cleaning the graph, generating routes, and packaging outputs for your backend and frontend teammates.

## Setup & Installation

You'll need Python 3.9+ (3.10+ recommended). We strongly recommend using a virtual environment.

```bash
# Create and activate virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

> **Note on Windows GIS packages:** Modern versions of `geopandas` usually install flawlessly via pip. If you run into GDAL/Fiona C-extension build errors on older environments, use Conda instead: `conda install geopandas osmnx -c conda-forge`.

## Generating the Graph Data

Run the pipeline:

```bash
python build_graph.py
```

### Pipeline Steps:
1. **Geocoding:** Locates Sevoke, Rangpo, and Gangtok.
2. **Buffering:** Creates a ~5km buffer around the straight-line trajectory to restrict the OSMnx download exclusively to the NH-10 corridor (no massive state-wide downloads).
3. **Extraction & Cleaning:** Pulls the drivable road network and strips disconnected fragments to ensure a purely strongly-connected component.
4. **Validation:** Executes a test shortest-path algorithm across the span to guarantee the graph is fully traversable.
5. **Output Generation:** See below.

## Outputs Produced

Once the script finishes, it generates these files:

* `corridor_graph.graphml`: The clean road network ready for the backend. **Backend Devs**: Load this directly with `G = networkx.read_graphml('corridor_graph.graphml')`.
* `corridor_edges.geojson`: Spatial lines of every edge. **Frontend Devs**: Render this directly in Leaflet/React to show the network map.
* `corridor_graph.png`: A quick visual verification map of the network and the test route.

## Stretch Goal: Landslide Risk Overlay

To visually verify historical risks along the route:
1. Place your GSI Bhukosh historical inventory CSV inside `gis-data/data/historical_landslides.csv` (Make sure it has columns named `latitude` and `longitude` or similar).
2. Re-run `python build_graph.py`.
3. The script will automatically parse the coordinate data, overlap the points against the extracted NH-10 graph, and output a new image named `corridor_with_landslides.png`.
