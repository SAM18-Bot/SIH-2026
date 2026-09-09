import os
import osmnx as ox
import networkx as nx
from shapely.geometry import LineString

def pull_corridor(places, buffer_deg, output_name):
    print(f"Generalization Test: Pulling corridor for {output_name}...")
    points = []
    for place in places:
        try:
            pt = ox.geocode(place)
            points.append(pt)
            print(f"  [+] {place}: {pt}")
        except Exception as e:
            print(f"  [!] Error geocoding {place}: {e}")
            return
            
    lon_lat_points = [(pt[1], pt[0]) for pt in points]
    route_line = LineString(lon_lat_points)
    aoi_polygon = route_line.buffer(buffer_deg)
    
    print("  [+] Downloading network (this takes a moment)...")
    G = ox.graph_from_polygon(aoi_polygon, network_type='drive', simplify=True)
    G = ox.truncate.largest_component(G, strongly=True)
    
    # Check baseline properties
    print("  [+] Simulating base risk scores (generalization)...")
    for u, v, k, data in G.edges(keys=True, data=True):
        # Stubbing the risk calculation for the generalization test
        # In a real run, this would call risk_model.py
        data['risk_now'] = 0.5
        
    num_nodes = len(G.nodes)
    num_edges = len(G.edges)
    
    print(f"  [+] Successfully generated generalized graph: {num_nodes} nodes, {num_edges} edges.")
    
    output_path = os.path.join(os.path.dirname(__file__), "..", "data", f"{output_name}.graphml")
    ox.save_graphml(G, filepath=output_path)
    print(f"  [+] Saved to {output_path}")

if __name__ == "__main__":
    # Test on a completely different NER corridor: Guwahati to Shillong
    places = ["Guwahati, Assam, India", "Nongpoh, Meghalaya, India", "Shillong, Meghalaya, India"]
    pull_corridor(places, 0.05, "guwahati_shillong_graph")
