import os
import osmnx as ox
import networkx as nx
import geopandas as gpd
import pandas as pd
from shapely.geometry import LineString
import matplotlib.pyplot as plt

# Configuration for NH-10 Corridor (Sevoke - Rangpo - Gangtok)
PLACES = [
    "Sevoke, West Bengal, India",
    "Rangpo, Sikkim, India",
    "Gangtok, Sikkim, India"
]
BUFFER_DEG = 0.05  # roughly a 5-5.5 km buffer radius around the trajectory

def main():
    print("Geocoding corridor waypoints...")
    points = []
    for place in PLACES:
        try:
            # ox.geocode returns (lat, lon)
            pt = ox.geocode(place)
            points.append(pt)
            print(f"  [+] {place}: {pt}")
        except Exception as e:
            print(f"  [!] Error geocoding {place}: {e}")
            return
    
    # Create a LineString and buffer it to capture the corridor Area of Interest (AOI)
    # Note: Shapely expects (lon, lat) order
    lon_lat_points = [(pt[1], pt[0]) for pt in points]
    route_line = LineString(lon_lat_points)
    aoi_polygon = route_line.buffer(BUFFER_DEG)

    print("\nDownloading drivable road network for the corridor from OpenStreetMap...")
    print("This might take a moment depending on network size...")
    # Download network
    G = ox.graph_from_polygon(aoi_polygon, network_type='drive', simplify=True)
    
    print("\nCleaning graph (retaining strongly connected component)...")
    # Ensure graph is a single strongly connected component to avoid routing errors later
    G = ox.truncate.largest_component(G, strongly=True)
    
    # Calculate stats
    num_nodes = len(G.nodes)
    num_edges = len(G.edges)
    total_length_m = sum(d.get('length', 0) for u, v, d in G.edges(data=True))
    
    print("-" * 40)
    print("GRAPH SUMMARY")
    print(f"Nodes: {num_nodes}")
    print(f"Edges: {num_edges}")
    print(f"Total Road Length: {total_length_m/1000:.2f} km")
    print(f"Strongly Connected: {nx.is_strongly_connected(G)}")
    print("-" * 40)

    print("\nTesting end-to-end routing (Sevoke to Gangtok)...")
    # ox.distance.nearest_nodes takes (G, X, Y) -> (G, lon, lat)
    orig_node = ox.distance.nearest_nodes(G, points[0][1], points[0][0])
    dest_node = ox.distance.nearest_nodes(G, points[-1][1], points[-1][0])
    
    try:
        route = nx.shortest_path(G, orig_node, dest_node, weight='length')
        
        # Calculate the route length
        route_length = 0
        for i in range(len(route)-1):
            u, v = route[i], route[i+1]
            # Handle MultiGraph by getting the shortest edge between nodes u and v
            edge_data = min(G.get_edge_data(u, v).values(), key=lambda x: x.get('length', 1))
            route_length += edge_data.get('length', 0)
            
        print(f"  [+] Route successfully found! Path length: {route_length/1000:.2f} km")
    except nx.NetworkXNoPath:
        print("  [!] WARNING: No valid path found between Sevoke and Gangtok.")
        
    print("\nExporting GraphML for backend NetworkX integration...")
    ox.save_graphml(G, filepath='corridor_graph.graphml')
    
    print("Exporting GeoJSON for frontend Leaflet rendering...")
    nodes, edges = ox.graph_to_gdfs(G)
    # GeoJSON doesn't support list types in attributes. We must convert lists to strings.
    for col in edges.columns:
        if edges[col].apply(lambda x: isinstance(x, list)).any():
            edges[col] = edges[col].astype(str)
    edges.to_file('corridor_edges.geojson', driver='GeoJSON')
    
    print("Saving network sanity-check plot...")
    # Plot the route on top of the graph if we found one
    if 'route' in locals():
        fig, ax = ox.plot_graph_route(G, route, show=False, close=False, route_linewidth=2, node_size=0, edge_color='#999999')
    else:
        fig, ax = ox.plot_graph(G, show=False, close=False, node_size=0, edge_color='#999999')
    fig.savefig('corridor_graph.png', dpi=300, bbox_inches='tight')
    
    # ---------------------------------------------------------
    # STRETCH GOAL: Plot historical landslides if data exists
    # ---------------------------------------------------------
    csv_path = os.path.join('data', 'historical_landslides.csv')
    if os.path.exists(csv_path):
        print(f"\nFound landslide dataset at '{csv_path}', generating risk overlay map...")
        try:
            df = pd.read_csv(csv_path)
            # Auto-detect lat/lon columns to be resilient against standard names
            lat_col = next((c for c in df.columns if c.lower() in ['lat', 'latitude', 'y']), None)
            lon_col = next((c for c in df.columns if c.lower() in ['lon', 'longitude', 'x']), None)
            
            if lat_col and lon_col:
                gdf_ls = gpd.GeoDataFrame(df, geometry=gpd.points_from_xy(df[lon_col], df[lat_col]), crs="EPSG:4326")
                
                # Plot edges as base layer
                fig, ax = plt.subplots(figsize=(10, 10))
                edges.plot(ax=ax, linewidth=0.5, color='grey', alpha=0.7)
                
                # Plot landslides on top
                gdf_ls.plot(ax=ax, color='red', markersize=20, alpha=0.8, label='Historical Landslides', zorder=5)
                
                plt.title("NH-10 Route with Historical Landslides (GSI Bhukosh)")
                plt.legend()
                plt.axis('off')
                fig.savefig('corridor_with_landslides.png', dpi=300, bbox_inches='tight')
                print("  [+] Exported corridor_with_landslides.png")
            else:
                print("  [!] Could not auto-detect latitude/longitude columns in the CSV. Make sure they are named 'lat' and 'lon'.")
        except Exception as e:
            print(f"  [!] Error processing landslide data: {e}")
    else:
        print(f"\n[Stretch Task] Drop a GSI Bhukosh CSV at '{csv_path}' and re-run to plot landslides on the graph.")
        
    print("\nAll done! Outputs have been saved to the 'gis-data' directory.")

if __name__ == '__main__':
    main()
