import os
import networkx as nx
import pandas as pd
import requests
from scipy.spatial import cKDTree
import numpy as np

GRAPH_PATH = os.path.join(os.path.dirname(__file__), "..", "gis-data", "corridor_graph.graphml")
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "gis-data", "data", "historical_landslides.csv")

def fetch_rainfall():
    """Fetches live rainfall for the NH-10 corridor (centered on Rangpo) from Open-Meteo."""
    url = "https://api.open-meteo.com/v1/forecast?latitude=27.174&longitude=88.530&current=precipitation"
    try:
        resp = requests.get(url, timeout=5).json()
        return resp.get('current', {}).get('precipitation', 0.0)
    except Exception as e:
        print(f"Error fetching Open-Meteo: {e}")
        return 0.0

def load_graph():
    return nx.read_graphml(GRAPH_PATH)

def load_landslides():
    return pd.read_csv(CSV_PATH)

def calculate_edge_risks(G, ls_df, global_rainfall_mm, edge_rainfall_overrides=None):
    """
    Computes risk score for each edge.
    Risk = 0.6 * landslide_susceptibility + 0.4 * normalized_rainfall
    """
    if edge_rainfall_overrides is None:
        edge_rainfall_overrides = {}
        
    points = np.column_stack((ls_df['latitude'], ls_df['longitude']))
    scores = ls_df['susceptibility'].values
    tree = cKDTree(points)
    
    # Normalize rainfall. Assume 20mm/hr is extreme (1.0 risk multiplier)
    base_norm_rain = min(global_rainfall_mm / 20.0, 1.0)
    
    risks = {}
    for u, v, key, data in G.edges(keys=True, data=True):
        y_u, x_u = float(G.nodes[u]['y']), float(G.nodes[u]['x'])
        y_v, x_v = float(G.nodes[v]['y']), float(G.nodes[v]['x'])
        lat_c, lon_c = (y_u + y_v)/2, (x_u + x_v)/2
        
        # Get nearest landslide susceptibility point
        dist, idx = tree.query([lat_c, lon_c])
        # If the nearest historical landslide zone is within ~2km (approx 0.02 deg), apply its score
        # otherwise baseline susceptibility is low.
        susc = scores[idx] if dist < 0.02 else 0.1
        
        norm_rain = base_norm_rain
        if (u, v, key) in edge_rainfall_overrides:
            norm_rain = edge_rainfall_overrides[(u, v, key)]
            
        risk = (0.6 * susc) + (0.4 * norm_rain)
        
        # update graph inline and return dict
        data['risk'] = risk
        risks[(u, v, key)] = risk
        
    return risks

def verify_module():
    print("--- MODULE 2 VERIFICATION ---")
    G = load_graph()
    ls_df = load_landslides()
    print("Graph and Susceptibility CSV loaded successfully.")
    
    rain = fetch_rainfall()
    print(f"Live API Rainfall: {rain} mm")
    
    print("\nCalculating baseline risks...")
    calculate_edge_risks(G, ls_df, rain)
    
    edges_sorted = sorted(G.edges(keys=True, data=True), key=lambda x: x[3]['risk'], reverse=True)
    print("\nTop 5 highest risk edges (Normal State):")
    for e in edges_sorted[:5]:
        print(f"  Edge {e[0]}-{e[1]}: Risk = {e[3]['risk']:.3f}")
        
    # Grab an edge slightly lower down the list to spike
    target = edges_sorted[10]
    t_u, t_v, t_k = target[0], target[1], target[2]
    old_risk = target[3]['risk']
    
    print(f"\n[Spike] Forcing extreme localized rainfall on Edge {t_u}-{t_v}...")
    overrides = {(t_u, t_v, t_k): 1.0} # 100% normalized rainfall (extreme)
    calculate_edge_risks(G, ls_df, rain, edge_rainfall_overrides=overrides)
    
    new_risk = G.edges[t_u, t_v, t_k]['risk']
    print(f"Edge {t_u}-{t_v} risk score changed: {old_risk:.3f} -> {new_risk:.3f}")
    
    edges_sorted_new = sorted(G.edges(keys=True, data=True), key=lambda x: x[3]['risk'], reverse=True)
    print("\nNew Top 5 highest risk edges (After Spike):")
    for e in edges_sorted_new[:5]:
        if e[0] == t_u and e[1] == t_v:
            print(f"  > Edge {e[0]}-{e[1]}: Risk = {e[3]['risk']:.3f} <--- OUR SPIKED EDGE")
        else:
            print(f"  Edge {e[0]}-{e[1]}: Risk = {e[3]['risk']:.3f}")

if __name__ == '__main__':
    verify_module()
