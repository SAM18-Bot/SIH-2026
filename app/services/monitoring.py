import asyncio
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.domain import Shipment, GroundReport
from app.services.prediction import apply_risk_scores, get_forecast_rainfall
from app.services.routing import get_graph, optimize_route
import json

WAIT_THRESHOLD = 0.85

async def monitoring_loop(broadcast_callback):
    while True:
        await asyncio.sleep(5)
        
        db = SessionLocal()
        try:
            active_shipments = db.query(Shipment).filter(Shipment.status.in_(["PENDING", "ACTIVE"])).all()
            if not active_shipments:
                continue
                
            rain_now, rain_future = get_forecast_rainfall()
            reports = db.query(GroundReport).filter(GroundReport.active == True).all()
            
            G = get_graph()
            apply_risk_scores(G, rain_now, rain_future, reports)
            
            for shipment in active_shipments:
                opts = optimize_route(shipment.origin_lat, shipment.origin_lon, shipment.dest_lat, shipment.dest_lon)
                
                old_route = shipment.current_route_json
                
                if opts["now"]["max_risk"] < WAIT_THRESHOLD:
                    shipment.status = "ACTIVE"
                    shipment.current_route_json = json.dumps(opts["now"]["geometry"])
                    reason = "Conditions clear. Proceed."
                elif opts["future"]["max_risk"] < WAIT_THRESHOLD:
                    shipment.status = "DELAYED"
                    shipment.current_route_json = json.dumps(opts["future"]["geometry"])
                    reason = f"High risk now ({opts['now']['max_risk']:.2f}). Wait for next window."
                else:
                    shipment.status = "DELAYED"
                    shipment.current_route_json = json.dumps([])
                    reason = "ALL ROUTES UNSAFE. WAIT."
                
                db.commit()
                
                if old_route != shipment.current_route_json:
                    await broadcast_callback({
                        "event": "shipment_updated",
                        "shipment_id": shipment.id,
                        "status": shipment.status,
                        "reason": reason,
                        "geometry": json.loads(shipment.current_route_json)
                    })
                    
        finally:
            db.close()
