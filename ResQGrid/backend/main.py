from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from backend import shipments_api, reports_api, routing_api
from backend.database import engine, Base
from backend.monitoring_loop import monitoring_loop

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ResQGrid AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shipments_api.router, prefix="/api/shipments", tags=["Shipments"])
app.include_router(reports_api.router, prefix="/api/reports", tags=["Reports"])
app.include_router(routing_api.router, prefix="/api/route", tags=["Routing"])

from pydantic import BaseModel

class RainSimulationRequest(BaseModel):
    rainfall_mm: float

class PresetRequest(BaseModel):
    preset: str

@app.get("/", tags=["Health"])
def root():
    import os
    from backend.risk_model import get_simulated_rainfall
    demo_mode = os.environ.get("DEMO_MODE", "false").lower() == "true"
    return {
        "status": "ok", 
        "message": "ResQGrid AI Tactical Engine is running", 
        "demo_mode": demo_mode,
        "simulated_rainfall": get_simulated_rainfall()
    }

@app.post("/api/simulation/rain", tags=["Simulation"])
def simulate_rain(req: RainSimulationRequest):
    from backend.risk_model import set_simulated_rainfall
    set_simulated_rainfall(req.rainfall_mm)
    return {"status": "success", "simulated_rainfall": req.rainfall_mm}

@app.post("/api/simulation/preset", tags=["Simulation"])
def trigger_preset(req: PresetRequest):
    from backend.risk_model import trigger_preset_scenario
    trigger_preset_scenario(req.preset)
    return {"status": "success", "preset": req.preset}

@app.post("/api/demo/trigger", tags=["Demo"])
def trigger_demo():
    from backend.risk_model import trigger_demo_scenario
    trigger_demo_scenario()
    return {"status": "triggered", "message": "Rainfall scenario injected!"}

@app.post("/api/demo/reset", tags=["Demo"])
def reset_demo():
    from backend.risk_model import reset_demo_scenario
    reset_demo_scenario()
    return {"status": "reset", "message": "Weather cleared."}

@app.get("/api/hazard-points", tags=["GIS"])
def get_hazard_points():
    from backend.risk_model import get_hazard_hotspots
    return get_hazard_hotspots()

@app.get("/api/terrain-profile", tags=["GIS"])
def get_terrain_profile():
    """
    Returns realistic elevation profile along the primary Siliguri-Gangtok corridor (NH-10).
    Includes altitude (m), distance (km), slope percentage, and geomorphic risk classification.
    """
    return [
        {"km": 0, "name": "Siliguri Junction", "lat": 26.7271, "lon": 88.4230, "elevation_m": 122, "slope_deg": 1.2, "risk": "LOW"},
        {"km": 18, "name": "Sevoke (Coronation Bridge)", "lat": 26.8820, "lon": 88.4715, "elevation_m": 210, "slope_deg": 14.5, "risk": "HIGH", "hazard": "Single-Lane Chokepoint & Rockfall"},
        {"km": 32, "name": "Kalijhora Gorge", "lat": 26.9324, "lon": 88.4552, "elevation_m": 290, "slope_deg": 18.2, "risk": "CRITICAL", "hazard": "Debris Flow & River Erosion"},
        {"km": 45, "name": "Teesta Bazar Confluence", "lat": 27.0588, "lon": 88.4310, "elevation_m": 220, "slope_deg": 8.0, "risk": "CRITICAL", "hazard": "Flash Flood Submergence Zone"},
        {"km": 60, "name": "Melli Checkpost", "lat": 27.0984, "lon": 88.4590, "elevation_m": 310, "slope_deg": 11.4, "risk": "MEDIUM", "hazard": "Inter-State Border Control Staging"},
        {"km": 78, "name": "Rangpo Border Gate", "lat": 27.1764, "lon": 88.5300, "elevation_m": 380, "slope_deg": 7.5, "risk": "LOW"},
        {"km": 92, "name": "Singtam Bridge", "lat": 27.2340, "lon": 88.4980, "elevation_m": 410, "slope_deg": 9.2, "risk": "MEDIUM", "hazard": "Silt Deposit Choke"},
        {"km": 105, "name": "Ranipool Hairpin Bend", "lat": 27.2910, "lon": 88.5860, "elevation_m": 920, "slope_deg": 22.0, "risk": "HIGH", "hazard": "Steep Valley Hairpins"},
        {"km": 114, "name": "Gangtok Ridge Terminal", "lat": 27.3389, "lon": 88.6065, "elevation_m": 1650, "slope_deg": 12.0, "risk": "LOW", "hazard": "High Altitude Dropzone"}
    ]

@app.get("/api/holding-havens", tags=["Logistics"])
def get_holding_havens():
    """
    Returns certified mountain truck staging turnouts and holding havens.
    Used to safely stage heavy convoys during active slope destabilization.
    """
    return [
        {
            "id": "haven-1",
            "name": "Sevoke Staging Bay (Km 18)",
            "lat": 26.8820,
            "lon": 88.4715,
            "capacity_total": 45,
            "capacity_available": 28,
            "amenities": "Emergency Fuel Reserve, Army Aid Post",
            "status": "OPERATIONAL"
        },
        {
            "id": "haven-2",
            "name": "Melli Staging Turnout (Km 60)",
            "lat": 27.0984,
            "lon": 88.4590,
            "capacity_total": 30,
            "capacity_available": 14,
            "amenities": "Reinforced Rockfall Shelter, Police Staging",
            "status": "OPERATIONAL"
        },
        {
            "id": "haven-3",
            "name": "Rangpo Logistics Terminal (Km 78)",
            "lat": 27.1764,
            "lon": 88.5300,
            "capacity_total": 60,
            "capacity_available": 39,
            "amenities": "Heavy Turnaround Bay, Satellite VHF",
            "status": "OPERATIONAL"
        }
    ]

@app.get("/api/situation-report", tags=["Tactical"])
def get_situation_report():
    """
    Generates an official National Disaster Management Authority (NDMA) style
    Tactical Situation Briefing based on live system state.
    """
    from backend.database import SessionLocal
    from backend.domain import Shipment, GroundReport
    from backend.risk_model import get_forecast_rainfall
    from datetime import datetime

    db = SessionLocal()
    try:
        shipments = db.query(Shipment).all()
        ground_reports = db.query(GroundReport).filter(GroundReport.active == True).all()
        rain_now, _ = get_forecast_rainfall()

        active_count = sum(1 for s in shipments if s.status in ["ACTIVE", "DIVERTED_BYPASS"])
        delayed_count = sum(1 for s in shipments if "DELAYED" in s.status)
        diverted_count = sum(1 for s in shipments if s.status == "DIVERTED_BYPASS")
        blocked_count = len(ground_reports)

        alert_level = "GREEN - NORMAL"
        if rain_now >= 120 or blocked_count >= 2 or delayed_count >= 2:
            alert_level = "RED - DISASTER PROTOCOL"
        elif rain_now >= 50 or blocked_count >= 1 or delayed_count >= 1:
            alert_level = "ORANGE - HIGH ALERT"

        sitrep_id = f"SITREP-NER-{datetime.utcnow().strftime('%Y%m%d-%H%M')}"
        
        directives = []
        if rain_now > 80:
            directives.append("Halt commercial freight >15T at Sevoke to protect single-lane Coronation Bridge.")
        if diverted_count > 0:
            directives.append(f"Maintain traffic regulation for {diverted_count} convoys rerouted via Lava-Algarah auxiliary bypass.")
        if delayed_count > 0:
            directives.append("Stage delayed convoys at designated Melli and Sevoke turnout bays to prevent gorge entrapment.")
        if not directives:
            directives.append("All regional road corridors nominal under standard geotechnical monitoring.")

        return {
            "sitrep_id": sitrep_id,
            "timestamp": datetime.utcnow().strftime("%d %b %Y, %H:%M UTC"),
            "corridor": "NH-10 / Siliguri-Gangtok Arterial Lifeline & NH-717A Bypass",
            "jurisdiction": "NDMA / BRO Project Swastik / Sikkim SDMA",
            "threat_level": alert_level,
            "meteorological_status": f"{rain_now:.1f} mm/hr precipitation registered",
            "active_convoys": active_count,
            "delayed_shipments": delayed_count,
            "diverted_convoys": diverted_count,
            "active_ground_blockages": blocked_count,
            "key_directives": directives,
            "arbitration_status": "Life-Critical Medicine > Food Grains > Construction/Heavy Machinery"
        }
    finally:
        db.close()

@app.get("/api/validation", tags=["Validation"])
def get_validation_stats():
    import json
    import os
    file_path = os.path.join(os.path.dirname(__file__), "validation_result.json")
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            return json.load(f)
    return {"hits": 0, "total": 0, "hit_rate": 0.0}

clients = []

async def broadcast_ws(message: dict):
    disconnected = []
    for client in clients:
        try:
            await client.send_json(message)
        except Exception:
            disconnected.append(client)
            
    for client in disconnected:
        if client in clients:
            clients.remove(client)

@app.on_event("startup")
async def startup_event():
    # Preload graph
    from backend.graph_loader import get_graph
    get_graph()
    asyncio.create_task(monitoring_loop(broadcast_ws))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.remove(websocket)
