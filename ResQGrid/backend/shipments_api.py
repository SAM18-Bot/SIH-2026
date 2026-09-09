from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.schemas import ShipmentCreate, ShipmentResponse
from backend.domain import Shipment
from backend.database import get_db
import json

router = APIRouter()

@router.post("/", response_model=ShipmentResponse)
def create_shipment(shipment: ShipmentCreate, db: Session = Depends(get_db)):
    # Create the shipment session in the database
    db_shipment = Shipment(**shipment.model_dump())
    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)

    # In a real app, we might trigger a synchronous routing calculation here,
    # or let the background monitoring loop pick it up immediately.
    # For MVP, just create as PENDING and the background loop will process it.

    return db_shipment

@router.get("/", response_model=list[ShipmentResponse])
def get_shipments(db: Session = Depends(get_db)):
    return db.query(Shipment).order_by(Shipment.id.desc()).all()

@router.get("/{shipment_id}/risk")
def get_shipment_risk(shipment_id: int, db: Session = Depends(get_db)):
    """
    Returns a structured risk breakdown for a specific shipment.

    Response fields:
    - risk_score: the max edge risk on the chosen route (0.0 – 1.0)
    - risk_breakdown: human-readable contribution split, e.g. "78% Rainfall, 22% Terrain"
    - confidence: data confidence flag — "low" | "medium" | "high"
      (based on density of historical landslide records near the worst-risk segment)
    - status: current shipment status
    - reason: free-text explanation from the monitoring loop
    """
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    return {
        "shipment_id":   shipment.id,
        "status":        shipment.status,
        "risk_breakdown": shipment.risk_breakdown,
        "confidence":    shipment.confidence,
        "reason":        shipment.reason,
        "route_geometry": json.loads(shipment.current_route_json) if shipment.current_route_json else [],
    }
