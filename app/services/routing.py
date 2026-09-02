import networkx as nx
import osmnx as ox
import os

GRAPH_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "corridor_graph.graphml")

# Global Graph Singleton
_G = None

def get_graph():
    global _G
    if _G is None:
        _G = nx.read_graphml(GRAPH_PATH)
        for n, data in _G.nodes(data=True):
            data['x'] = float(data['x'])
            data['y'] = float(data['y'])
        for u, v, k, data in _G.edges(keys=True, data=True):
            if 'length' in data:
                data['length'] = float(data['length'])
    return _G

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
        risk_now = max([G.get_edge_data(route_now[i], route_now[i+1])[0].get('risk_now', 0) for i in range(len(route_now)-1)])
    except nx.NetworkXNoPath:
        route_now, risk_now = None, 1.0
        
    try:
        route_future = nx.shortest_path(G, orig_node, dest_node, weight='cost_future')
        risk_future = max([G.get_edge_data(route_future[i], route_future[i+1])[0].get('risk_future', 0) for i in range(len(route_future)-1)])
    except nx.NetworkXNoPath:
        route_future, risk_future = None, 1.0
        
    return {
        "now": {"route": route_now, "max_risk": risk_now, "geometry": get_route_geometry(G, route_now) if route_now else []},
        "future": {"route": route_future, "max_risk": risk_future, "geometry": get_route_geometry(G, route_future) if route_future else []}
    }
