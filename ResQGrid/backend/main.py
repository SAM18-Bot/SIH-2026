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

@app.get("/", tags=["Health"])
def root():
    from backend.risk_model import DEMO_MODE
    return {"status": "ok", "message": "ResQGrid AI API is running", "demo_mode": DEMO_MODE}

@app.post("/api/settings/mode", tags=["Settings"])
def set_mode(payload: dict):
    # payload: {"demo_mode": true/false}
    import backend.risk_model as rm
    rm.DEMO_MODE = payload.get("demo_mode", False)
    return {"status": "ok", "demo_mode": rm.DEMO_MODE}

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
