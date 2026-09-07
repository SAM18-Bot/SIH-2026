from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ShipmentCreate(BaseModel):
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float
    cargo_type: str
    priority: str
    departure_window_start: datetime
    departure_window_end: datetime

class ShipmentResponse(ShipmentCreate):
    id: int
    status: str
    reason: Optional[str] = None
    current_route_json: Optional[str] = None
    recommended_departure_time: Optional[datetime] = None
    risk_breakdown: Optional[str] = None   # e.g. "78% Rainfall, 22% Terrain"
    confidence: Optional[str] = None       # "low" | "medium" | "high"
    arbitration_decision: Optional[str] = None

    class Config:
        from_attributes = True

class GroundReportCreate(BaseModel):
    lat: float
    lon: float
    description: str

class RouteRequest(BaseModel):
    shipment_id: int