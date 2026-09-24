from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.schemas import ShipmentCreate, ShipmentResponse
from backend.domain import Shipment
from backend.database import get_db
import json
import networkx as nx
import osmnx as ox
from backend.optimizer import get_graph, get_route_geometry

router = APIRouter()

@router.post("/", response_model=ShipmentResponse)
def create_shipment(shipment: ShipmentCreate, db: Session = Depends(get_db)):
    # Calculate initial distance via shortest path
    G = get_graph()
    orig_node = ox.distance.nearest_nodes(G, shipment.origin_lon, shipment.origin_lat)
    dest_node = ox.distance.nearest_nodes(G, shipment.dest_lon, shipment.dest_lat)
    
    try:
        dist_m = nx.shortest_path_length(G, orig_node, dest_node, weight='length')
        distance_km = round(dist_m / 1000.0, 1)
    except nx.NetworkXNoPath:
        distance_km = 0.0

    # Dynamic derivations
    # Assume base speed 35 km/h for heavy vehicles in mountains
    eta_minutes = int((distance_km / 35.0) * 60) if distance_km else 0
    
    # Fuel burn logic based on tonnage and distance. 
    # e.g., Base: 0.15 L/km for 5-ton, plus 0.02 L/km per extra ton.
    tonnage = shipment.model_dump().get("vehicle_tonnage", 5.0)
    fuel_rate = 0.15 + (max(0, tonnage - 5.0) * 0.02)
    fuel_burn = round(distance_km * fuel_rate, 1)

    shipment_data = shipment.model_dump()
    db_shipment = Shipment(
        **shipment_data,
        distance_km=distance_km,
        eta_minutes=eta_minutes,
        estimated_fuel_burn_liters=fuel_burn
    )
    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)

    return db_shipment

@router.get("/", response_model=list[ShipmentResponse])
def get_shipments(db: Session = Depends(get_db)):
    return db.query(Shipment).order_by(Shipment.id.desc()).all()

@router.post("/{shipment_id}/divert-bypass", response_model=ShipmentResponse)
def divert_to_bypass(shipment_id: int, db: Session = Depends(get_db)):
    """
    Diverts a shipment via the official Lava-Algarah Mountain Bypass Corridor.
    Used by highway authorities when NH-10 (Teesta River Gorge) is severed.
    Trade-offs: +34 km length, +72 min transit time, +11.8L fuel, but reduces landslide risk to 18%.
    """
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Real-world arterial detour coordinates via Damdim -> Gorubathan -> Lava Pass -> Algarah -> Reshi -> Singtam -> Gangtok
    bypass_waypoints = [
        [26.7271, 88.4230], # Siliguri Base
        [26.8820, 88.6200], # Damdim Junction
        [26.9720, 88.7000], # Gorubathan Hill Base
        [27.0860, 88.6600], # Lava Mountain Pass (2,100m ASL)
        [27.1150, 88.5860], # Algarah Ridge
        [27.1580, 88.6300], # Reshi River Crossing
        [27.1850, 88.6400], # Rhenock Staging
        [27.2340, 88.5200], # Singtam Bypass Bridge
        [27.2910, 88.5860], # Ranipool Incline
        [27.3389, 88.6065]  # Gangtok Terminal
    ]

    G = get_graph()
    lats = [wp[0] for wp in bypass_waypoints]
    lons = [wp[1] for wp in bypass_waypoints]
    nodes = ox.distance.nearest_nodes(G, lons, lats)
    
    full_path = []
    total_length = 0.0
    max_risk = 0.0
    
    for i in range(len(nodes) - 1):
        try:
            sub_path = nx.shortest_path(G, nodes[i], nodes[i+1], weight='length')
            if i > 0:
                full_path.extend(sub_path[1:])
            else:
                full_path.extend(sub_path)
        except nx.NetworkXNoPath:
            if i > 0:
                full_path.append(nodes[i+1])
            else:
                full_path.extend([nodes[i], nodes[i+1]])

    for i in range(len(full_path) - 1):
        edge_data = G.get_edge_data(full_path[i], full_path[i+1])
        if edge_data:
            edge = next(iter(edge_data.values()))
            total_length += float(edge.get("length", 0.0))
            risk = float(edge.get("risk_now", 0.1))
            if risk > max_risk:
                max_risk = risk

    distance_km = round(total_length / 1000.0, 1)
    print(f"Bypass distance computed: {distance_km} km")
    
    full_geometry = get_route_geometry(G, full_path)

    detour_specs = {
        "corridor": "Lava-Algarah Mountain Bypass (SH-12 / NH-717A)",
        "distance_km": distance_km,
        "max_risk": round(max_risk, 2),
    }

    shipment.status = "DIVERTED_BYPASS"
    shipment.corridor_name = "Lava-Algarah Mountain Bypass"
    shipment.current_route_json = json.dumps(full_geometry)
    shipment.detour_specs_json = json.dumps(detour_specs)
    shipment.risk_breakdown = f"{round(max_risk*100)}% Risk (Derived from graph)"
    shipment.confidence = "high"
    shipment.reason = f"Diverted to Lava-Algarah Bypass ({distance_km} km). Clears active landslide zone."
    
    db.commit()
    db.refresh(shipment)
    return shipment

@router.post("/{shipment_id}/assign-haven", response_model=ShipmentResponse)
def assign_holding_haven(shipment_id: int, haven_name: str = "Melli Staging Turnout (Km 60)", db: Session = Depends(get_db)):
    """
    Directs a delayed convoy to hold safely at an official certified mountain truck turnout bay.
    """
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    shipment.assigned_holding_haven = haven_name
    shipment.reason = f"Convoys held at {haven_name} until precipitation subsides below 35 mm/hr."
    db.commit()
    db.refresh(shipment)
    return shipment

@router.get("/{shipment_id}/advisory")
def get_dispatch_advisory(shipment_id: int, db: Session = Depends(get_db)):
    """
    Generates a formatted official dispatch advisory printout for field teams.
    """
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    status = shipment.status
    corridor = shipment.corridor_name or "NH-10 Arterial Corridor"
    
    advisory = [
        "========================================",
        f"       RESQGRID DISPATCH ADVISORY       ",
        "========================================",
        f"CONVOY ID      : #{shipment.id}",
        f"CARGO TYPE     : {shipment.cargo_type.upper()}",
        f"PRIORITY CLS   : {shipment.priority.upper()}",
        f"STATUS         : {status.upper()}",
        "----------------------------------------",
        f"ASSIGNED ROUTE : {corridor}",
        f"DISTANCE       : {shipment.distance_km or 0} km",
        f"EST. TRANSIT   : {shipment.eta_minutes or 0} minutes",
        f"EST. FUEL BURN : {shipment.estimated_fuel_burn_liters or 0} Liters",
        "----------------------------------------",
        f"CURRENT RISK   : {shipment.risk_breakdown or 'Pending Scan'}",
        f"CONFIDENCE     : {(shipment.confidence or 'Unknown').upper()}"
    ]

    if shipment.assigned_holding_haven:
        advisory.append(f"STAGING ORDER  : HOLD AT {shipment.assigned_holding_haven.upper()}")
    
    if shipment.recommended_departure_time:
        advisory.append(f"SAFE DEPARTURE : {shipment.recommended_departure_time.strftime('%Y-%m-%d %H:00 UTC')}")
        
    if shipment.reason:
        advisory.append("----------------------------------------")
        advisory.append(f"TACTICAL NOTE  : {shipment.reason}")

    advisory.append("========================================")
    
    return {"advisory_text": "\n".join(advisory)}

@router.delete("/clear")
def clear_all_shipments(db: Session = Depends(get_db)):
    db.query(Shipment).delete()
    db.commit()
    return {"status": "cleared"}

