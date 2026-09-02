import asyncio
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import networkx as nx
import osmnx as ox
from risk_model import load_graph, load_landslides, calculate_edge_risks, fetch_rainfall

app = FastAPI()

# Global State
G = None
ls_df = None
edge_overrides = {}
active_route = None
clients = []

WAIT_THRESHOLD = 0.85
ORIG_LAT, ORIG_LON = 26.8797217, 88.4708027  # Sevoke
DEST_LAT, DEST_LON = 27.329046, 88.6122673   # Gangtok
orig_node = None
dest_node = None

class ReportItem(BaseModel):
    lat: float
    lon: float
    description: str

class SpikeItem(BaseModel):
    u: int
    v: int

@app.on_event("startup")
async def startup_event():
    global G, ls_df, orig_node, dest_node
    G = load_graph()
    
    # Cast coordinates back to float (GraphML saves them as strings)
    for n, data in G.nodes(data=True):
        data['x'] = float(data['x'])
        data['y'] = float(data['y'])
        
    # Cast edge lengths back to float
    for u, v, k, data in G.edges(keys=True, data=True):
        if 'length' in data:
            data['length'] = float(data['length'])
            
    ls_df = load_landslides()
    
    orig_node = ox.distance.nearest_nodes(G, ORIG_LON, ORIG_LAT)
    dest_node = ox.distance.nearest_nodes(G, DEST_LON, DEST_LAT)
    
    asyncio.create_task(monitoring_loop())

async def broadcast(message: dict):
    for client in clients:
        try:
            await client.send_json(message)
        except Exception:
            pass

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.remove(websocket)

def compute_cost(u, v, data):
    length = float(data.get('length', 1.0))
    risk = data.get('risk', 0.1)
    # Exponential penalty for high risk segments
    return length * (1.0 + (risk * 20))

def get_route_details(route):
    max_risk = 0.0
    total_length = 0.0
    for i in range(len(route)-1):
        u, v = route[i], route[i+1]
        edge_data = min(G.get_edge_data(u, v).values(), key=lambda x: x.get('length', 1))
        r = edge_data.get('risk', 0.0)
        if r > max_risk: max_risk = r
        total_length += float(edge_data.get('length', 0.0))
    return total_length, max_risk

def get_route_geometry(route):
    return [[float(G.nodes[n]['y']), float(G.nodes[n]['x'])] for n in route]

@app.get("/route")
def get_routes():
    global active_route
    for u, v, k, d in G.edges(keys=True, data=True):
        d['cost'] = compute_cost(u, v, d)
        
    baseline_route = nx.shortest_path(G, orig_node, dest_node, weight='length')
    base_len, base_risk = get_route_details(baseline_route)
    
    try:
        predictive_route = nx.shortest_path(G, orig_node, dest_node, weight='cost')
        pred_len, pred_risk = get_route_details(predictive_route)
    except nx.NetworkXNoPath:
        return {"status": "wait", "reason": "No path available."}

    active_route = predictive_route

    if pred_risk >= WAIT_THRESHOLD:
        return {
            "status": "wait",
            "reason": f"Max route risk {pred_risk:.2f} exceeds safety threshold {WAIT_THRESHOLD}.",
            "baseline_length_km": base_len / 1000,
            "predictive_length_km": pred_len / 1000
        }
        
    return {
        "status": "go",
        "baseline_route": baseline_route,
        "baseline_geometry": get_route_geometry(baseline_route),
        "baseline_length_km": base_len / 1000,
        "baseline_max_risk": base_risk,
        "predictive_route": predictive_route,
        "predictive_geometry": get_route_geometry(predictive_route),
        "predictive_length_km": pred_len / 1000,
        "predictive_max_risk": pred_risk
    }

@app.post("/report")
def report_blockage(item: ReportItem):
    u, v, k = ox.distance.nearest_edges(G, item.lon, item.lat)
    edge_overrides[(u, v, k)] = 1.0
    return {"status": "reported", "edge": [u, v]}
    
@app.post("/test_spike")
def test_spike(item: SpikeItem):
    edges = G.get_edge_data(item.u, item.v)
    if edges:
        k = list(edges.keys())[0]
        edge_overrides[(item.u, item.v, k)] = 1.0
        return {"status": "spiked", "edge": [item.u, item.v]}
    return {"status": "edge not found"}

async def monitoring_loop():
    global active_route
    while True:
        await asyncio.sleep(5)
        rain = fetch_rainfall()
        calculate_edge_risks(G, ls_df, rain, edge_overrides)
        
        if active_route:
            _, current_max_risk = get_route_details(active_route)
            
            # Recalculate weights
            for u, v, k, d in G.edges(keys=True, data=True):
                d['cost'] = compute_cost(u, v, d)
            
            new_route = nx.shortest_path(G, orig_node, dest_node, weight='cost')
            _, new_risk = get_route_details(new_route)
            
            status = "wait" if new_risk >= WAIT_THRESHOLD else "go"
            
            if new_route != active_route or status == "wait":
                old_route = active_route
                active_route = new_route if status != "wait" else None
                reason = "Unsafe conditions across all routes. WAIT." if status == "wait" else f"Route changed due to risk spike (Max Risk: {new_risk:.2f})."
                
                await broadcast({
                    "event": "route_changed",
                    "status": status,
                    "old_route": old_route,
                    "new_route": new_route,
                    "new_geometry": get_route_geometry(new_route) if new_route else [],
                    "reason": reason
                })

if __name__ == '__main__':
    uvicorn.run("main:app", host="127.0.0.1", port=8000)
