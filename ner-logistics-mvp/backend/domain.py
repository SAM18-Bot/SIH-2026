from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from datetime import datetime
from backend.database import Base

class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(Integer, primary_key=True, index=True)
    origin_lat = Column(Float)
    origin_lon = Column(Float)
    dest_lat = Column(Float)
    dest_lon = Column(Float)
    cargo_type = Column(String) # medicine, food, construction, agri
    priority = Column(String) # HIGH, NORMAL
    departure_window_start = Column(DateTime)
    departure_window_end = Column(DateTime, nullable=False)
    status = Column(String, default="PENDING") # PENDING, ACTIVE, COMPLETED, DELAYED
    reason = Column(Text, nullable=True)
    current_route_json = Column(Text, nullable=True)
    recommended_departure_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class GroundReport(Base):
    __tablename__ = "ground_reports"
    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float)
    lon = Column(Float)
    description = Column(String)
    reported_at = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)
