# 🚁 ResQGrid
**AI-Driven Logistics & Dynamic Routing Platform for Disaster-Prone Regions (SIH 2026)**

![ResQGrid Banner](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-green)
![Data](https://img.shields.io/badge/Data-OSMnx%20%7C%20GSI%20Bhukosh-orange)

### 🌍 Live Deployment
* **Frontend (Vercel):** [https://sih-2026-m4wlikp1c-sam-cd86.vercel.app](https://sih-2026-m4wlikp1c-sam-cd86.vercel.app)
* **Backend API (Render):** [https://resqgrid-yx8y.onrender.com](https://resqgrid-yx8y.onrender.com)

ResQGrid is a predictive, multi-agent logistics platform designed for the North Eastern Region (NER) and other topographically challenging areas. Standard GPS solutions are *reactive* and treat all cargo equally, leading to gridlock during crises. ResQGrid anticipates road network failures *before* they occur using geological data and live weather telemetry, autonomously rerouting fleets and arbitrating road capacity based on mission-critical priorities.

---

## 🌟 Key Features

*   **Predictive Routing:** Cross-references live rainfall (Open-Meteo API) with historical geological slope vulnerability (GSI Bhukosh data) to predict imminent landslides and reroute trucks *before* roads are blocked.
*   **Capacity Arbitration Engine:** When alternative routes create narrow bottlenecks, the AI automatically evaluates the priority matrix of the fleet. Critical supplies (Medical, Food) are granted right-of-way, while non-essential cargo (Construction) is ordered to yield.
*   **Tactical Dark-Mode Command Center:** A highly interactive React/Leaflet dashboard featuring live WebSocket truck tracking, 3D Elevation Profiles, NDMA Situation Reports (SitRep), and Arbitration explainability matrices.
*   **Integrated Presenter Mode:** A built-in UI overlay that allows seamless, step-by-step interactive demonstrations of the AI's capabilities for hackathons and pitches.

---

## 🛠️ Tech Stack & Architecture

### Geospatial & Risk AI (Data Module)
*   **Tech:** Python, SciPy (`cKDTree`), Pandas
*   **Why:** We use `cKDTree` for spatial queries ($O(\log N)$ nearest-neighbor mathematical efficiency) to rapidly map thousands of GPS coordinates against historical landslide polygons in real-time, bypassing the latency of traditional SQL spatial queries.

### Routing & Arbitration Engine (Core Backend)
*   **Tech:** OSMnx, NetworkX
*   **Why:** Standard mapping APIs are "black boxes". Using `NetworkX`, we built a custom mathematical graph of NER corridors where edge weights dynamically mutate based on the formula: `(0.6 * Terrain Susceptibility) + (0.4 * Live Rainfall)`.

### Real-Time Systems (API & Persistence)
*   **Tech:** FastAPI, SQLite, SQLAlchemy, WebSockets
*   **Why:** FastAPI's asynchronous architecture handles hundreds of concurrent WebSocket connections streaming live truck telemetry. SQLite provides a lightweight, zero-config persistence layer ideal for edge servers in remote disaster zones.

### Command Center (Frontend)
*   **Tech:** React, Vite, Tailwind CSS, React-Leaflet
*   **Why:** React enables instantaneous DOM updates for the live dashboard. React-Leaflet allows us to render native GeoJSON hazard layers and animated mathematical shapes (storm cells) directly over raw OpenStreetMap tiles.

---

## 🚀 How is it different from existing solutions?

| Feature | Standard GPS (Google Maps) | ResQGrid |
| :--- | :--- | :--- |
| **Approach** | **Reactive:** Routes around traffic only *after* a jam or landslide is reported. | **Predictive:** Reroutes based on 120mm/hr rainfall thresholds against known slope vulnerability. |
| **Fleet Awareness** | **Single-Agent:** Ignores the rest of the fleet, causing bottleneck gridlocks. | **Multi-Agent:** Actively performs Capacity Arbitration on narrow bypasses. |
| **Cargo Priority** | **First-come, first-served:** Treats cement exactly like life-saving blood. | **Mission-Critical Priority:** Stalls low-priority trucks to let emergency supplies pass. |

---

## ⚙️ Local Setup & Installation

### 1. Backend Setup
```bash
cd ResQGrid
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # Mac/Linux

pip install -r requirements.txt
uvicorn backend.main:app --port 8000
```

### 2. Frontend Setup
```bash
cd ResQGrid/frontend
npm install
npm run dev
```

### 3. Usage
Open `http://localhost:5173` in your browser. 
Click **"🎤 Start Presenter Mode"** in the top right to walk through the interactive, AI-driven disaster scenario!

---

## 🤝 Contribution & Roles

This project was built for SIH 2026. The modules were distributed as follows:
*   **Geospatial & Risk AI Lead:** Predictive modeling and GSI data integration.
*   **Routing & Arbitration Lead:** Custom NetworkX graph generation and priority logic.
*   **Backend Systems Architect:** FastAPI WebSockets, Database Schema, and System Integration.
*   **Frontend & UX Lead:** Tactical dashboard, React-Leaflet mapping, and Presenter Mode sequencing.
