# SIH26002 — AI-Based Smart Logistics and Accessibility Intelligence Platform for NER

An AI-enabled logistics intelligence system explicitly tailored for the unique geographical and operational challenges of the North Eastern Region (NER) of India. The platform predicts infrastructure disruptions using Open-Meteo rainfall forecasting and GSI Bhukosh landslide susceptibility, optimizes active transport networks, provides predictive alternative routing, and executes automated multi-shipment arbitration to solve bottlenecks on constrained road segments (like single-lane bridges).

## Architecture Overview
* **`backend/`**: FastAPI core engine handling routing, prediction (weather + spatial data), multi-shipment arbitration, and an async WebSocket loop for live dashboard updates.
* **`gis-data/scripts/`**: OSMnx graph extraction pipelines and historical backtesting logic validating the risk model against actual GSI Bhukosh records.
* **`gis-data/data/`**: The offline routing topology, spatial features, and historical validation CSVs.
* **`frontend/`**: Vite + React dispatch operator terminal visualizing real-time shipments, AI risk-rationale (XAI), and multi-shipment conflict arbitration on a Leaflet map.

## Setup and Run

### 1. Backend (Python 3.10+)
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # (or .\venv\Scripts\activate on Windows)

# Install requirements
pip install -r requirements.txt

# Start the FastApi engine
cd ner-logistics-mvp
uvicorn backend.main:app --port 8000
```

### 2. Frontend (Node.js 18+)
```bash
cd ner-logistics-mvp/frontend
npm install
npm run dev
```

## Running the Demo
1. Open the frontend dashboard (`http://localhost:5173`).
2. Click **"+ New Medical Shipment"**. The engine will route it based on the live rainfall vs terrain risk metrics.
3. Click **"⚠️ Trigger Arbitration Conflict"**. The engine creates a conflicting Construction shipment. The backend dynamically flags the shared constrained segment, drops the lower-priority shipment, and fires a WebSocket update that visualizes the conflict node directly on the Leaflet map.

## Project Roles
* **Sameer (Data & GIS):** OSMnx pipeline, GSI Bhukosh susceptibility model, and historical backtest validation.
* **Pallavi (Backend & Routing):** FastAPI async logic, NetworkX optimizer, multi-shipment arbitration engine.
* **Deep (Risk AI):** Explainable AI (XAI) risk breakdowns (Terrain vs Rainfall drivers) and Open-Meteo forecasting integration.
* **Samruddhi (Frontend Dashboard):** React-Leaflet integration, arbitration visualization, and dynamic tooltips.
* **Shubham (Dashboard Panels):** Real-time dispatcher UI controls, WebSocket log telemetry.
* **Tanvi (Demo & Deck):** Strategic pitch flow, baseline metric tracking, integration scenario design.
