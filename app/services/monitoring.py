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
            
            PRIORITY_MAP = {"Medical Supplies": 3, "Food": 2, "Construction": 1, "Agri": 1}
            shipment_routes = {}
            node_usage = {}
            
            for shipment in active_shipments:
                opts = optimize_route(shipment.origin_lat, shipment.origin_lon, shipment.dest_lat, shipment.dest_lon)
                shipment_routes[shipment.id] = {"shipment": shipment, "opts": opts}
                
                if opts["now"]["max_risk"] < WAIT_THRESHOLD and opts["now"]["route"]:
                    for n in opts["now"]["route"]:
                        if n not in node_usage:
                            node_usage[n] = []
                        if shipment.id not in node_usage[n]:
                            node_usage[n].append(shipment.id)
            
            delayed_by_arbitration = set()
            for n, sids in node_usage.items():
                if len(sids) > 1:
                    # Conflict! Sort by priority
                    sids.sort(key=lambda sid: PRIORITY_MAP.get(shipment_routes[sid]["shipment"].cargo_type, 0), reverse=True)
                    # Everyone but the highest priority gets delayed
                    for loser in sids[1:]:
                        delayed_by_arbitration.add(loser)
            
            for sid, data in shipment_routes.items():
                shipment = data["shipment"]
                opts = data["opts"]
                old_route = shipment.current_route_json
                
                if sid in delayed_by_arbitration:
                    shipment.status = "DELAYED"
                    shipment.current_route_json = json.dumps([])
                    reason = f"Arbitration: Yielding route to higher-priority cargo."
                elif opts["now"]["max_risk"] < WAIT_THRESHOLD:
                    shipment.status = "ACTIVE"
                    shipment.current_route_json = json.dumps(opts["now"]["geometry"])
                    reason = f"Clear. {opts['now']['breakdown']}"
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
