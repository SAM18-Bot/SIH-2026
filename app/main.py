from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from app.api import shipments, reports
from app.core.database import engine, Base
from app.services.monitoring import monitoring_loop

Base.metadata.create_all(bind=engine)

app = FastAPI(title="NER Logistics AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shipments.router, prefix="/api/shipments", tags=["Shipments"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

clients = []

async def broadcast_ws(message: dict):
    for client in clients:
        try:
            await client.send_json(message)
        except:
            pass

@app.on_event("startup")
async def startup_event():
    # Preload graph
    from app.services.routing import get_graph
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
