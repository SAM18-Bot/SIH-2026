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

    result = optimize_route(
        shipment.origin_lat,
        shipment.origin_lon,
        shipment.dest_lat,
        shipment.dest_lon
    )

    return {
        "shipment_id": shipment.id,
        "status": shipment.status,
        "route": result,
        "arbitration_decision": shipment.arbitration_decision,
        "reason": shipment.reason,
    }