import os
import requests
import pandas as pd
from scipy.spatial import cKDTree
import numpy as np

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "gis-data", "data", "historical_landslides.csv")

import json

LAST_RAINFALL = (0.0, 0.0)
DEMO_MODE = os.environ.get("DEMO_MODE", "false").lower() == "true"
SCENARIO_TRIGGERED = False

def trigger_demo_scenario():
    global SCENARIO_TRIGGERED
    SCENARIO_TRIGGERED = True

def reset_demo_scenario():
    global SCENARIO_TRIGGERED
    SCENARIO_TRIGGERED = False

def get_forecast_rainfall(lat=27.174, lon=88.530):
    global LAST_RAINFALL
    
    # 1. MANUAL OVERRIDE (Works in both live and offline modes)
    if SCENARIO_TRIGGERED:
        scenario_path = os.path.join(os.path.dirname(__file__), "..", "demo_data", "scenario_1.json")
        if os.path.exists(scenario_path):
            with open(scenario_path, "r") as f:
                data = json.load(f)
            rain = data.get("trigger", {}).get("rainfall_mm", 120.0)
            # Cap the normalization roughly, but 120mm will easily hit 1.0 (max risk)
            return rain, rain

    # 2. OFFLINE DEMO MODE (Bypasses internet completely for speed/reliability)
    if DEMO_MODE:
        return 0.0, 0.0

    # 3. LIVE DATA MODE (Fetches real weather from Open-Meteo)
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=precipitation&hourly=precipitation"
    try:
        resp = requests.get(url, timeout=5).json()
        current = resp.get('current', {}).get('precipitation', 0.0)
        # simplistic MVP forecasting: just grab first 3 hours average
        hourly = resp.get('hourly', {}).get('precipitation', [0, 0, 0])
        future_avg = sum(hourly[:3]) / 3.0 if len(hourly) >= 3 else current
        LAST_RAINFALL = (current, future_avg)
        return current, future_avg
    except Exception as e:
        print(f"[WARNING] Failed to fetch forecast rainfall: {e}. Using cached fallback {LAST_RAINFALL}.")
        return LAST_RAINFALL

WEIGHT_SUSCEPTIBILITY = 0.6
WEIGHT_RAINFALL = 0.4

# Radius (degrees) within which historical points are counted for confidence scoring.
# ~0.05° ≈ 5.5 km at Sikkim latitudes — wide enough to cover sparse NE India data.
CONFIDENCE_RADIUS = 0.05

def _point_density_to_confidence(count: int) -> str:
    """Map nearby historical landslide point count to a confidence label."""
    if count == 0:
        return "low"
    elif count <= 3:
        return "medium"
    else:
        return "high"

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
        lat_c, lon_c = (y_u + y_v) / 2, (x_u + x_v) / 2

        dist, idx = tree.query([lat_c, lon_c])
        susc = scores[idx] if dist < 0.02 else 0.1

        # Confidence: count historical landslide points within CONFIDENCE_RADIUS of edge midpoint
        nearby_count = len(tree.query_ball_point([lat_c, lon_c], CONFIDENCE_RADIUS))
        confidence = _point_density_to_confidence(nearby_count)

        # Ground report override (blockage)
        if gr_tree:
            gr_dist, _ = gr_tree.query([lat_c, lon_c])
            if gr_dist < 0.01:
                susc = 1.0  # Force high risk

        risk_now = (WEIGHT_SUSCEPTIBILITY * susc) + (WEIGHT_RAINFALL * norm_rain_now)
        risk_future = (WEIGHT_SUSCEPTIBILITY * susc) + (WEIGHT_RAINFALL * norm_rain_future)

        susc_pct_now    = ((WEIGHT_SUSCEPTIBILITY * susc)        / risk_now    * 100) if risk_now    > 0 else 0
        rain_pct_now    = ((WEIGHT_RAINFALL * norm_rain_now)     / risk_now    * 100) if risk_now    > 0 else 0
        susc_pct_future = ((WEIGHT_SUSCEPTIBILITY * susc)        / risk_future * 100) if risk_future > 0 else 0
        rain_pct_future = ((WEIGHT_RAINFALL * norm_rain_future)  / risk_future * 100) if risk_future > 0 else 0

        data['risk_now']              = risk_now
        data['risk_future']           = risk_future
        data['risk_breakdown_now']    = f"{int(rain_pct_now)}% Rainfall, {int(susc_pct_now)}% Terrain"
        data['risk_breakdown_future'] = f"{int(rain_pct_future)}% Rainfall, {int(susc_pct_future)}% Terrain"
        data['confidence']            = confidence      # "low" | "medium" | "high"
        data['nearby_point_count']    = nearby_count   # raw count, shown in API for transparency
