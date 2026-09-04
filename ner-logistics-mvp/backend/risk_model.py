import os
import requests
import pandas as pd
from scipy.spatial import cKDTree
import numpy as np

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "gis-data", "data", "historical_landslides.csv")

def get_forecast_rainfall(lat=27.174, lon=88.530):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=precipitation&hourly=precipitation"
    try:
        resp = requests.get(url, timeout=5).json()
        current = resp.get('current', {}).get('precipitation', 0.0)
        # simplistic MVP forecasting: just grab first 3 hours average
        hourly = resp.get('hourly', {}).get('precipitation', [0,0,0])
        future_avg = sum(hourly[:3]) / 3.0 if len(hourly) >= 3 else current
        return current, future_avg
    except Exception as e:
        print(f"Failed to fetch forecast rainfall: {e}")
        raise

WEIGHT_SUSCEPTIBILITY = 0.6
WEIGHT_RAINFALL = 0.4

def apply_risk_scores(G, current_rain, future_rain, ground_reports=None):
    if ground_reports is None:
        ground_reports = []
        
    ls_df = pd.read_csv(CSV_PATH)
    points = np.column_stack((ls_df['latitude'], ls_df['longitude']))
    scores = ls_df['susceptibility'].values
    tree = cKDTree(points)
    
    if ground_reports:
        gr_points = np.column_stack(([r.lat for r in ground_reports], [r.lon for r in ground_reports]))
        gr_tree = cKDTree(gr_points)
    else:
        gr_tree = None

    norm_rain_now = min(current_rain / 20.0, 1.0)
    norm_rain_future = min(future_rain / 20.0, 1.0)
    
    for u, v, key, data in G.edges(keys=True, data=True):
        y_u, x_u = float(G.nodes[u]['y']), float(G.nodes[u]['x'])
        y_v, x_v = float(G.nodes[v]['y']), float(G.nodes[v]['x'])
        lat_c, lon_c = (y_u + y_v)/2, (x_u + x_v)/2
        
        dist, idx = tree.query([lat_c, lon_c])
        susc = scores[idx] if dist < 0.02 else 0.1
        
        # Ground report override (blockage)
        if gr_tree:
            gr_dist, _ = gr_tree.query([lat_c, lon_c])
            if gr_dist < 0.01:
                susc = 1.0 # Force high risk
        
        risk_now = (WEIGHT_SUSCEPTIBILITY * susc) + (WEIGHT_RAINFALL * norm_rain_now)
        risk_future = (WEIGHT_SUSCEPTIBILITY * susc) + (WEIGHT_RAINFALL * norm_rain_future)
        
        susc_pct_now = ((WEIGHT_SUSCEPTIBILITY * susc) / risk_now * 100) if risk_now > 0 else 0
        rain_pct_now = ((WEIGHT_RAINFALL * norm_rain_now) / risk_now * 100) if risk_now > 0 else 0
        susc_pct_future = ((WEIGHT_SUSCEPTIBILITY * susc) / risk_future * 100) if risk_future > 0 else 0
        rain_pct_future = ((WEIGHT_RAINFALL * norm_rain_future) / risk_future * 100) if risk_future > 0 else 0
        
        data['risk_now'] = risk_now
        data['risk_future'] = risk_future
        data['risk_breakdown_now'] = f"{int(rain_pct_now)}% Rainfall, {int(susc_pct_now)}% Terrain"
        data['risk_breakdown_future'] = f"{int(rain_pct_future)}% Rainfall, {int(susc_pct_future)}% Terrain"
