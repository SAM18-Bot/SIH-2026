# SIH26002 - Logistics Intelligence Platform Architecture

## Core Workflow
1. **Dispatcher** creates a Shipment Request (Origin, Dest, Cargo Type, Priority, Departure Window).
2. **System** initializes a Shipment Session.
3. **Prediction Engine** pulls graph, historical landslides, and live/forecasted rainfall to score edges (OPEN, AT-RISK, BLOCKED) across time windows (e.g., Now, +4h, +8h).
4. **Optimizer** calculates the safest route and recommends the best departure time within the window. If all paths are AT-RISK/BLOCKED, it advises WAIT.
5. **Monitoring Loop** runs every N seconds for ACTIVE shipments. If weather changes or a ground report is received, it recalculates. If the route changes, it triggers a WebSocket event.

## Project Structure
* `app/`: FastAPI application.
  * `main.py`: App entry point, WebSocket manager, and startup events.
  * `core/database.py`: SQLAlchemy setup (SQLite for MVP: `sqlite:///./logistics.db`).
  * `models/`:
    * `domain.py`: SQLAlchemy models (`Shipment`, `GroundReport`, `RouteLog`).
    * `schemas.py`: Pydantic models for API validation.
  * `services/`:
    * `prediction.py`: Risk scoring combining static landslide susceptibility and Open-Meteo rainfall forecasts.
    * `routing.py`: NetworkX routing logic, evaluating current vs future departure windows.
    * `monitoring.py`: Async loop evaluating active shipments.
  * `api/`:
    * `shipments.py`: CRUD for shipments.
    * `reports.py`: POST endpoints for ground reports (which block specific edges).
* `data/`: Contains `corridor_graph.graphml`, `historical_landslides.csv`.
* `frontend/`: React + Vite Dispatcher Dashboard.
* `scripts/`: GIS and data generation scripts.

## Database Schema (MVP)
* **Shipment**: id, origin_lat, origin_lon, dest_lat, dest_lon, cargo_type, priority, departure_window_start, departure_window_end, status (PENDING, ACTIVE, COMPLETED, DELAYED), current_route_json, recommended_departure_time.
* **GroundReport**: id, lat, lon, description, reported_at, active (bool).
