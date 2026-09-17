from fastapi import APIRouter, Depends
from backend.optimizer import optimize_route
from backend.schemas import RouteRequest
from backend.database import get_db
from backend.domain import Shipment

router = APIRouter()

@router.post("/")
def get_route(request: RouteRequest, db=Depends(get_db)):
    shipment = db.query(Shipment).filter(
        Shipment.id == request.shipment_id
    ).first()

    if not shipment:
        return {
            "error": "Shipment not found"
        }

    import json
    return {
        "shipment_id": shipment.id,
        "status": shipment.status,
        "route": json.loads(shipment.current_route_json) if shipment.current_route_json else None,
        "arbitration_decision": shipment.arbitration_decision,
        "reason": shipment.reason,
    }

@router.post("/simulation/progress")
def advance_simulation_progress(db=Depends(get_db)):
    """
    Legitimately advances ALL active shipments in the DB along their 
    current_route_json by X kilometers based on their priority speed modifiers.
    """
    active_shipments = db.query(Shipment).filter(
        Shipment.status.in_(["ACTIVE", "DIVERTED_BYPASS"])
    ).all()
    
    advanced = 0
    for shipment in active_shipments:
        if not shipment.current_route_json:
            continue
            
        # priority modifiers
        speed_km_per_tick = 2.5 if shipment.priority == "HIGH" else 1.0
        
        # Advance progress
        if shipment.progress_km is None:
            shipment.progress_km = 0.0
            
        shipment.progress_km += speed_km_per_tick
        advanced += 1
        
    db.commit()
    return {"status": "success", "advanced_shipments": advanced}