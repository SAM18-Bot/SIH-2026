import networkx as nx
import osmnx as ox
from backend.graph_loader import get_graph

def compute_cost(u, v, data, time_window="now"):
    length = float(data.get('length', 1.0))
    risk = data.get(f'risk_{time_window}', 0.1)
    return length * (1.0 + (risk * 20))

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
        risk_now = 0
        breakdown_now = ""
        for i in range(len(route_now)-1):
            e = G.get_edge_data(route_now[i], route_now[i+1])[0]
            if e.get('risk_now', 0) > risk_now:
                risk_now = e.get('risk_now', 0)
                breakdown_now = e.get('risk_breakdown_now', "")
    except nx.NetworkXNoPath:
        route_now, risk_now, breakdown_now = None, 1.0, "100% Unknown"
        
    try:
        route_future = nx.shortest_path(G, orig_node, dest_node, weight='cost_future')
        risk_future = 0
        breakdown_future = ""
        for i in range(len(route_future)-1):
            e = G.get_edge_data(route_future[i], route_future[i+1])[0]
            if e.get('risk_future', 0) > risk_future:
                risk_future = e.get('risk_future', 0)
                breakdown_future = e.get('risk_breakdown_future', "")
    except nx.NetworkXNoPath:
        route_future, risk_future, breakdown_future = None, 1.0, "100% Unknown"
        
    return {
        "now": {"route": route_now, "max_risk": risk_now, "breakdown": breakdown_now, "geometry": get_route_geometry(G, route_now) if route_now else []},
        "future": {"route": route_future, "max_risk": risk_future, "breakdown": breakdown_future, "geometry": get_route_geometry(G, route_future) if route_future else []}
    }
