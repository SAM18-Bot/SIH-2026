import asyncio
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.domain import Shipment, GroundReport
from backend.risk_model import apply_risk_scores, get_forecast_rainfall
from backend.optimizer import get_graph, optimize_route
import json
from datetime import datetime

from backend.arbitration import (
    calculate_priority_score,
    calculate_wait_pressure,
    resolve_conflict,
)

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

            await broadcast_callback({
                "event": "ai_log",
                "log": {
                    "title": "🧠 [AI Agent] Analyzing spatial risk matrices...",
                    "details": f"Ingesting weather telemetry. Current rainfall: {rain_now}mm, Future forecast: {rain_future}mm."
                }
            })
            
            G = get_graph()
            apply_risk_scores(G, rain_now, rain_future, reports)
            
            await broadcast_callback({
                "event": "ai_log",
                "log": {
                    "title": "🌍 [AI Agent] Cross-referencing GSI Bhukosh susceptibility...",
                    "details": f"Calculated baseline risk scores for {len(G.edges)} edges using cKDTree nearest-neighbor search."
                }
            })
            
            shipment_routes = {}
            current_time = datetime.utcnow()
            edge_usage = {}
            
            for shipment in active_shipments:
                wait_pressure = calculate_wait_pressure(
                    shipment.departure_window_end,
                    current_time
                )
                
                priority_score = calculate_priority_score(
                    shipment.cargo_type,
                    shipment.priority,
                    wait_pressure
                )
                
                opts = optimize_route(shipment.origin_lat, shipment.origin_lon, shipment.dest_lat, shipment.dest_lon)
                shipment_routes[shipment.id] = {
                    "shipment": shipment,
                    "opts": opts,
                    "priority_score": priority_score,
                    "wait_pressure": wait_pressure,
                }
  
                chosen_time = "now" if opts["now"]["max_risk"] < WAIT_THRESHOLD else "future"
                route = opts[chosen_time]["route"]
                
                if route and opts[chosen_time]["max_risk"] < WAIT_THRESHOLD:
                    for i in range(len(route) - 1):
                        edge = (route[i], route[i + 1])

                        if edge not in edge_usage:
                            edge_usage[edge] = []

                        if shipment.id not in edge_usage[edge]:
                            edge_usage[edge].append(shipment.id)
            
            delayed_by_arbitration = {}
            for n, sids in edge_usage.items():
                if len(sids) > 1:
                    # Allow shipments of the same priority to caravan together.
                    # Only halt a shipment if it has STRICTLY LESS priority than the most urgent truck on this edge.
                    priorities = [shipment_routes[sid]["priority_score"] for sid in sids]
                    max_prio = max(priorities)
                    
                    # Find the winner (first one with max priority)
                    winner = sids[priorities.index(max_prio)]
                    
                    has_losers = False
                    for sid in sids:
                        if shipment_routes[sid]["priority_score"] < max_prio:
                            has_losers = True
                            if sid not in delayed_by_arbitration:
                                delayed_by_arbitration[sid] = {
                                    "winner": winner,
                                    "conflict_edge": n,
                                    "decision": f"Yielding to higher priority shipment."
                                }
                                
                    # Only broadcast arbitration log if an actual conflict halted someone
                    if has_losers:
                        await broadcast_callback({
                            "event": "ai_log",
                            "log": {
                                "title": f"⚡ [AI Agent] Arbitration Triggered at Edge {n}",
                                "details": f"Capacity conflict detected between {len(sids)} shipments. Priority Matrix resolved: Shipment {winner} proceeds, lower priorities halted."
                            }
                        })
            
            for sid, data in shipment_routes.items():
                shipment = data["shipment"]
                opts = data["opts"]
                old_route = shipment.current_route_json
                old_status = shipment.status
                
                chosen_time = "now" if opts["now"]["max_risk"] < WAIT_THRESHOLD else "future"
                if sid in delayed_by_arbitration:
                    conflict = delayed_by_arbitration[sid]
                    winner_cargo = shipment_routes[conflict["winner"]]["shipment"].cargo_type
                    shipment.status = "DELAYED_ARBITRATION"
                    shipment.current_route_json = json.dumps(opts[chosen_time]["geometry"])
                    shipment.risk_breakdown = opts[chosen_time]["breakdown"]
                    shipment.confidence = opts[chosen_time]["confidence"]
                    
                    c_edge = conflict["conflict_edge"]
                    c_start, c_end = c_edge
                    c_lat = get_graph().nodes[c_start]["y"]
                    c_lon = get_graph().nodes[c_start]["x"]
                    shipment.arbitration_decision = json.dumps({
                        "decision": conflict["decision"],
                        "winner_shipment_id": conflict["winner"],
                        "loser_shipment_id": shipment.id,
                        "conflict_point": [c_lat, c_lon],
                    })

                    reason = json.dumps({
                        "msg": f"{winner_cargo} prioritized over {shipment.cargo_type}",
                        "conflict_point": [c_lat, c_lon]
                    })
                    
                elif opts["now"]["max_risk"] < WAIT_THRESHOLD:
                    shipment.status = "ACTIVE"
                    shipment.current_route_json = json.dumps(opts["now"]["geometry"])
                    shipment.risk_breakdown = opts["now"]["breakdown"]
                    shipment.confidence = opts["now"]["confidence"]
                    reason = f"Clear. {opts['now']['breakdown']} [confidence: {opts['now']['confidence']}]"
                elif opts["future"]["max_risk"] < WAIT_THRESHOLD:
                    shipment.status = "DELAYED"
                    shipment.current_route_json = json.dumps(opts["future"]["geometry"])
                    shipment.risk_breakdown = opts["future"]["breakdown"]
                    shipment.confidence = opts["future"]["confidence"]
                    reason = f"High risk now ({opts['now']['max_risk']:.2f}). Wait for next window."
                else:
                    shipment.status = "DELAYED"
                    shipment.current_route_json = json.dumps([])
                    shipment.risk_breakdown = None
                    shipment.confidence = "low"
                    reason = "ALL ROUTES UNSAFE. WAIT."

                shipment.reason = reason

                db.commit()

                if old_route != shipment.current_route_json or old_status != shipment.status:
                    await broadcast_callback({
                        "event": "shipment_updated",
                        "shipment_id": shipment.id,
                        "status": shipment.status,
                        "reason": reason,
                        "risk_breakdown": shipment.risk_breakdown,
                        "confidence": shipment.confidence,
                        "geometry": json.loads(shipment.current_route_json)
                    })
        except Exception as e:
            print(f"Monitoring loop error: {e}")
        finally:
            db.close()
