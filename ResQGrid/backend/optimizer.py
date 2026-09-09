import networkx as nx
import osmnx as ox
from backend.graph_loader import get_graph

WAIT_THRESHOLD = 0.85

def compute_cost(u, v, data, time_window="now"):
    length = float(data.get('length', 1.0))
    risk = data.get(f'risk_{time_window}', 0.1)
    return length * (1.0 + (risk * 20))

def compute_route_metrics(G, route, time_window="now"):
    if not route:
        return {
            "max_risk": 1.0,
            "breakdown": "No route available",
            "confidence": "low",
            "total_length": 0.0,
        }

    max_risk = 0.0
    breakdown = ""
    confidence = "low"
    total_length = 0.0

    for i in range(len(route) - 1):
        edge_data = G.get_edge_data(route[i], route[i + 1])

        if not edge_data:
            continue

        # MultiDiGraph मध्ये पहिला available edge वापरतो
        edge = next(iter(edge_data.values()))

        risk = float(edge.get(f"risk_{time_window}", 0.1))
        length = float(edge.get("length", 0.0))

        total_length += length

        if risk > max_risk:
            max_risk = risk
            breakdown = edge.get(
                f"risk_breakdown_{time_window}",
                "Unknown"
            )
            confidence = edge.get("confidence", "low")

    return {
        "max_risk": max_risk,
        "breakdown": breakdown,
        "confidence": confidence,
        "total_length": total_length,
    }

def get_route_geometry(G, route):
    return [[float(G.nodes[n]['y']), float(G.nodes[n]['x'])] for n in route]

def optimize_route(orig_lat, orig_lon, dest_lat, dest_lon):
    G = get_graph()
    orig_node = ox.distance.nearest_nodes(G, orig_lon, orig_lat)
    dest_node = ox.distance.nearest_nodes(G, dest_lon, dest_lat)
    
    # Calculate costs for NOW
    for u, v, k, d in G.edges(keys=True, data=True):
        d['cost_now'] = compute_cost(u, v, d, "now")
        d['cost_future'] = compute_cost(u, v, d, "future")
        
    try:
        route_now = nx.shortest_path(G, orig_node, dest_node, weight='cost_now')
        metrics_now = compute_route_metrics(G, route_now, "now")
        
        risk_now = metrics_now["max_risk"]
        breakdown_now = metrics_now["breakdown"]
        confidence_now = metrics_now["confidence"]
    
    except nx.NetworkXNoPath:
        route_now, risk_now, breakdown_now, confidence_now = None, 1.0, "100% Unknown", "low"

    try:
        route_future = nx.shortest_path(G, orig_node, dest_node, weight='cost_future')
        metrics_future = compute_route_metrics(G, route_future, "future")
        
        risk_future = metrics_future["max_risk"]
        breakdown_future = metrics_future["breakdown"]
        confidence_future = metrics_future["confidence"]
    except nx.NetworkXNoPath:
        route_future, risk_future, breakdown_future, confidence_future = None, 1.0, "100% Unknown", "low"

    if risk_now < WAIT_THRESHOLD:
        recommendation = "GO_NOW"
    elif risk_future < WAIT_THRESHOLD:
        recommendation = "WAIT_FOR_FUTURE"
    else:
        recommendation = "UNSAFE"
        
    return {
        "now": {
            "route": route_now,
            "max_risk": risk_now,
            "breakdown": breakdown_now,
            "confidence": confidence_now,
            "geometry": get_route_geometry(G, route_now) if route_now else []
        },
        "future": {
            "route": route_future,
            "max_risk": risk_future,
            "breakdown": breakdown_future,
            "confidence": confidence_future,
            "geometry": get_route_geometry(G, route_future) if route_future else []
        },
        "recommendation": recommendation
    }

