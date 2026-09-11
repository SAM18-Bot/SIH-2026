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

    detour_specs = {
        "corridor": "Lava-Algarah Mountain Bypass (SH-12 / NH-717A)",
        "distance_km": 148,
        "delta_km": "+34 km vs NH-10",
        "eta_minutes": 275,
        "delta_time_min": "+72 mins",
        "estimated_fuel_burn_liters": 38.5,
        "extra_fuel_liters": 11.8,
        "max_risk": 0.18,
        "safety_margin": "98% (Avoids Teesta River Submergence Zone)",
        "recommended_by": "BRO Project Swastik & Sikkim Traffic Advisory"
    }

    shipment.status = "DIVERTED_BYPASS"
    shipment.corridor_name = "Lava-Algarah Mountain Bypass"
    shipment.current_route_json = json.dumps(bypass_waypoints)
    shipment.detour_specs_json = json.dumps(detour_specs)
    shipment.risk_breakdown = "18% Risk (Detour via Lava Pass avoids river gorge flood lines)"
    shipment.confidence = "high"
    shipment.reason = "Diverted to Lava-Algarah Bypass (+34 km, +72 mins). Clears active landslide zone."
    
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

@router.delete("/clear")
def clear_all_shipments(db: Session = Depends(get_db)):
    db.query(Shipment).delete()
    db.commit()
    return {"status": "cleared"}

