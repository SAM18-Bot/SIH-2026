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