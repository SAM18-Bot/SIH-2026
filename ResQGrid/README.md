# 🏔️ ResQGrid

> **AI-Based Smart Logistics and Accessibility Intelligence Platform for the North Eastern Region (NER)**  
> *Developed for Smart India Hackathon (SIH26002)*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![NetworkX](https://img.shields.io/badge/Routing-NetworkX-316192?style=flat-square)](https://networkx.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.style=flat-square)](https://opensource.org/licenses/MIT)

The North Eastern Region (NER) of India faces major logistical challenges due to difficult terrain, extreme weather, and frequent road disruptions caused by landslides. **ResQGrid** is an intelligent, real-time logistics platform designed to predict infrastructure disruptions, optimize routing for essential goods, and automatically arbitrate multi-shipment bottlenecks on constrained terrains like single-lane bridges.

---

## ✨ Key Features

* **🧠 Predictive Risk Model (XAI)**: Combines live rainfall data (Open-Meteo) with historical terrain susceptibility (GSI Bhukosh) to dynamically predict landslide risks. Fully explainable AI provides exact percentage breakdowns (e.g., *78% Rainfall, 22% Terrain*) and confidence scores.
* **🚦 Multi-Shipment Arbitration**: Automatically resolves routing conflicts on constrained segments by analyzing cargo priority (e.g., Medicine > Construction) and urgency, rerouting lower-priority shipments.
* **🗺️ Real-Time Dispatch Terminal**: A Vite/React + Leaflet dashboard providing live WebSocket telemetry, active shipment tracking, and visual arbitration resolution.
* **🚨 Ground-Truth Reporting**: Live dispatcher inputs allow immediate flagging of blockages, overriding predictions and instantly recalculating active routes.
* **🛡️ Validated Accuracy**: The spatial vulnerability model was natively backtested against the GSI Bhukosh historical landslide inventory, successfully pre-flagging **71.4% (5/7)** of known historical incidents as high-risk *before* rainfall triggers were even applied.

---

## 🏗️ Architecture

* **`backend/`**: FastAPI core engine handling Dijkstra routing (NetworkX), predictive risk scoring (SciPy cKDTree), conflict arbitration, and asynchronous WebSocket loops.
* **`gis-data/`**: OSMnx graph extraction pipelines and historical backtesting logic validating the risk model against spatial datasets.
* **`frontend/`**: High-performance Vite + React dashboard visualizing routes, system event logs, dynamic validation badges, and interactive tools.

---

## 🚀 Getting Started

### Prerequisites
* Python 3.10+
* Node.js 18+

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/SAM18-Bot/SIH-2026.git
cd SIH-2026

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r ResQGrid/requirements.txt

# Start the FastAPI engine
cd ResQGrid
uvicorn backend.main:app --port 8000
```

### 2. Frontend Setup

Open a new terminal window:

```bash
cd SIH-2026/ResQGrid/frontend
npm install
npm run dev
```

The Dispatcher Terminal will be available at `http://localhost:5173`.

---

## 🎤 Presentation / Demo Mode

To ensure a flawless presentation without relying on unpredictable venue Wi-Fi or uncooperative weather, ResQGrid includes a robust offline **Demo Mode**.

Start the backend with the environment variable set to `true`:

**Windows (PowerShell):**
```powershell
$env:DEMO_MODE="true"
uvicorn backend.main:app --port 8000
```
**Mac/Linux:**
```bash
DEMO_MODE=true uvicorn backend.main:app --port 8000
```

* **What it does:** Freezes the live API fetching and unlocks the **"🌧️ Inject Rain Scenario"** and **"☀️ Clear Weather"** buttons in the UI. 
* **The Flow:** Start with clear routes, hit "Inject Scenario" to simulate a massive 120mm rainfall spike mapped perfectly to your historical data, and watch the system instantly flag the nodes and reroute shipments natively.

---

## 👥 Team Roles

* **Sameer (Data & GIS):** OSMnx pipeline, GSI Bhukosh susceptibility model, and historical backtest validation.
* **Pallavi (Backend & Optimizer):** FastAPI async logic, NetworkX optimizer, and the multi-shipment arbitration engine.
* **Deep (Risk AI):** Explainable AI (XAI) risk breakdowns, API integration, and confidence scoring.
* **Samruddhi (Frontend Dashboard):** React-Leaflet integration, arbitration visualization, and dynamic tooltips.
* **Shubham (Dashboard Panels):** Real-time dispatcher UI controls, WebSocket telemetry, and ground reporting.
* **Tanvi (Demo & Deck):** Strategic pitch flow, baseline metric tracking, and integration scenario design.
