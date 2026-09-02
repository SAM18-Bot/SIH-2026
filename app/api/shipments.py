from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.schemas import ShipmentCreate, ShipmentResponse
from app.models.domain import Shipment
from app.core.database import get_db
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
    # For MVP, let's just create it as PENDING and the background loop will process it.
    
    return db_shipment

@router.get("/", response_model=list[ShipmentResponse])
def get_shipments(db: Session = Depends(get_db)):
    return db.query(Shipment).order_by(Shipment.id.desc()).all()
