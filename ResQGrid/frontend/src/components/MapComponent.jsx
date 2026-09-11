import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, Marker, Popup, CircleMarker, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Basemaps definition
const BASEMAPS = {
    dark: {
        name: "Tactical Dark",
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    },
    satellite: {
        name: "Satellite Hybrid",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; Esri World Imagery'
    },
    osm: {
        name: "Standard Topo",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; OpenStreetMap contributors'
    }
};

// Custom vehicle icons using SVG divIcons
function createVehicleIcon(emoji, bgClass) {
    return L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
            <div class="relative flex items-center justify-center pointer-events-auto">
                <span class="absolute w-8 h-8 rounded-full ${bgClass} opacity-75 animate-ping"></span>
                <div class="relative w-8 h-8 rounded-full ${bgClass} border-2 border-white shadow-xl flex items-center justify-center text-sm">
                    ${emoji}
                </div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
}

const medicalIcon = createVehicleIcon('🚑', 'bg-cyan-500');
const cargoIcon = createVehicleIcon('🚚', 'bg-amber-500');
const heavyIcon = createVehicleIcon('🚛', 'bg-purple-600');

const conflictIcon = L.divIcon({
    className: 'custom-conflict-marker',
    html: `
        <div class="relative flex items-center justify-center pointer-events-auto">
            <span class="absolute w-7 h-7 rounded-full bg-red-600 opacity-80 animate-ping"></span>
            <div class="w-6 h-6 rounded-full bg-red-600 border border-white text-white text-xs font-bold flex items-center justify-center shadow-lg">
                ⚠️
            </div>
        </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const havenIcon = L.divIcon({
    className: 'custom-haven-marker',
    html: `
        <div class="relative flex items-center justify-center pointer-events-auto">
            <span class="absolute w-7 h-7 rounded-full bg-emerald-500 opacity-40 animate-pulse"></span>
            <div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-xl flex items-center justify-center text-xs text-white">
                🛡️
            </div>
        </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

// Map click listener component
function MapClickListener({ onMapClick }) {
    useMapEvents({
        click: (e) => {
            if (onMapClick) {
                onMapClick(e.latlng.lat.toFixed(4), e.latlng.lng.toFixed(4));
            }
        }
    });
    return null;
}

// Calculate interpolated position along route coordinates
function getInterpolatedPosition(coords, progress) {
    if (!coords || coords.length === 0) return null;
    if (coords.length === 1) return coords[0];

    const totalSegments = coords.length - 1;
    const scaledProgress = progress * totalSegments;
    const segIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1);
    const segFraction = scaledProgress - segIndex;

    const p1 = coords[segIndex];
    const p2 = coords[segIndex + 1];

    const lat = p1[0] + (p2[0] - p1[0]) * segFraction;
    const lon = p1[1] + (p2[1] - p1[1]) * segFraction;

    return [lat, lon];
}

export default function MapComponent({ shipments, hazardPoints = [], holdingHavens = [], onMapClick, simulatedRain = 0 }) {
    const [basemapKey, setBasemapKey] = useState('dark');
    const [progress, setProgress] = useState(0);

    // Continuous smooth animation loop for moving vehicles
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => (prev >= 1 ? 0 : prev + 0.0035));
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-1 h-full relative bg-slate-950 overflow-hidden">
            {/* Tactical Map Header Bar (Positioned without zoom collision) */}
            <div className="absolute top-3 left-3 z-[450] bg-slate-900/95 border border-slate-700 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl text-xs flex items-center space-x-3 text-slate-200">
                <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-mono font-bold tracking-wider text-cyan-400">GEO-TACTICAL RADAR</span>
                </div>
                <span className="text-slate-600">|</span>
                <span className="text-[11px] text-slate-400 font-mono">
                    Sector: <strong className="text-slate-200">Sikkim / NH-10 Corridor</strong>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-[11px] text-slate-400 font-mono">
                    Rainfall: <strong className={simulatedRain > 80 ? 'text-rose-400 font-bold' : simulatedRain > 30 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{simulatedRain} mm/hr</strong>
                </span>
            </div>

            {/* Basemap Switcher Controls */}
            <div className="absolute top-3 right-3 z-[450] bg-slate-900/95 border border-slate-700 backdrop-blur-md p-1 rounded-lg shadow-xl flex space-x-1 text-xs">
                {Object.entries(BASEMAPS).map(([key, bm]) => (
                    <button
                        key={key}
                        onClick={() => setBasemapKey(key)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                            basemapKey === key
                                ? 'bg-cyan-600 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                    >
                        {bm.name}
                    </button>
                ))}
            </div>

            {/* Hint overlay */}
            <div className="absolute bottom-3 left-3 z-[450] bg-slate-900/85 border border-slate-800 backdrop-blur px-2.5 py-1 rounded text-[10px] text-slate-400 font-mono pointer-events-none">
                💡 Click map to pin blockage coordinates
            </div>

            <MapContainer 
                center={[27.12, 88.52]} 
                zoom={11} 
                zoomControl={false}
                style={{ height: "100%", width: "100%", background: "#0b132b" }}
            >
                <ZoomControl position="bottomright" />
                <TileLayer 
                    url={BASEMAPS[basemapKey].url} 
                    attribution={BASEMAPS[basemapKey].attribution} 
                />
                
                <MapClickListener onMapClick={onMapClick} />

                {/* Render Certified Safe Holding Havens */}
                {Array.isArray(holdingHavens) && holdingHavens.map((h) => {
                    if (!h || typeof h.lat !== 'number' || typeof h.lon !== 'number') return null;
                    return (
                        <Marker 
                            key={h.id || `${h.lat}-${h.lon}`} 
                            position={[h.lat, h.lon]} 
                            icon={havenIcon}
                        >
                            <Popup>
                                <div className="text-xs font-mono">
                                    <div className="font-bold text-emerald-700 flex items-center space-x-1">
                                        <span>🛡️</span>
                                        <span>{h.name}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-700 mt-0.5">
                                        Capacity: <strong>{h.capacity_available} / {h.capacity_total} Rigs Available</strong>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1">
                                        Amenities: {h.amenities}
                                    </div>
                                    <div className="mt-1 text-[9px] bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded font-bold inline-block">
                                        CERTIFIED MOUNTAIN STAGING BAY
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Render Historical Landslide Vulnerability Hotspots (GSI Bhukosh) */}
                {Array.isArray(hazardPoints) && hazardPoints.map((pt) => {
                    if (!pt || typeof pt.latitude !== 'number' || typeof pt.longitude !== 'number') return null;
                    const isHighRain = simulatedRain > 50;
                    const radius = isHighRain ? 12 : 8;
                    const color = pt.susceptibility > 0.8 ? '#f43f5e' : pt.susceptibility > 0.5 ? '#f59e0b' : '#38bdf8';

                    return (
                        <CircleMarker
                            key={`hazard-${pt.id}`}
                            center={[pt.latitude, pt.longitude]}
                            radius={radius}
                            pathOptions={{
                                color: color,
                                fillColor: color,
                                fillOpacity: isHighRain ? 0.6 : 0.35,
                                weight: 1.5
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -5]}>
                                <div className="text-xs font-mono">
                                    <div className="font-bold text-rose-600">⚠️ GSI Landslide Hotspot #{pt.id}</div>
                                    <div>Susceptibility: <strong>{(pt.susceptibility * 100).toFixed(0)}%</strong></div>
                                    <div className="text-[10px] text-slate-500">Coord: [{pt.latitude.toFixed(3)}, {pt.longitude.toFixed(3)}]</div>
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    );
                })}

                {/* Render Active Shipments, Routes, and Animated Vehicles */}
                {Array.isArray(shipments) && shipments.map((s, idx) => {
                    if (!s) return null;
                    let route = [];
                    try {
                        route = s.current_route_json ? JSON.parse(s.current_route_json) : [];
                    } catch(e) {
                        route = [];
                    }
                    if (!Array.isArray(route) || route.length === 0) return null;

                    const statusStr = s.status || '';
                    const isDiverted = statusStr === 'DIVERTED_BYPASS';
                    const isDelayed = statusStr.includes('DELAYED');
                    
                    // Tactical Polyline Colors
                    let color = isDiverted ? '#10b981' : isDelayed ? '#f97316' : '#06b6d4';
                    let dashArray = isDiverted ? '4, 4' : isDelayed ? '10, 8' : null;
                    let opacity = isDelayed ? 0.75 : 0.95;
                    let weight = isDiverted ? 5 : 5;

                    // Extract arbitration info if delayed by arbitration
                    let conflictPoint = null;
                    let conflictMsg = null;
                    if (statusStr === 'DELAYED_ARBITRATION') {
                        try {
                            const parsed = JSON.parse(s.reason);
                            conflictMsg = parsed.msg;
                            if (Array.isArray(parsed.conflict_point) && parsed.conflict_point.length === 2 && !isNaN(parsed.conflict_point[0]) && !isNaN(parsed.conflict_point[1])) {
                                conflictPoint = parsed.conflict_point;
                            }
                            color = '#ef4444';
                        } catch(e) {}
                    }

                    // Compute current animated vehicle marker position (spaced out along route)
                    const offsetProgress = (progress + (idx * 0.35)) % 1;
                    const vehiclePos = getInterpolatedPosition(route, offsetProgress);
                    const vehicleIcon = s.cargo_type === 'Medical Supplies' ? medicalIcon : (s.cargo_type === 'Construction' ? heavyIcon : cargoIcon);

                    return (
                        <React.Fragment key={s.id}>
                            {/* Route Polyline */}
                            <Polyline 
                                positions={route} 
                                pathOptions={{ color, weight, dashArray, opacity }} 
                            >
                                <Tooltip sticky>
                                    <div className="font-bold text-xs font-mono">
                                        {isDiverted ? '🔄 LAVA-ALGARAH MOUNTAIN BYPASS' : `Convoy #${s.id} (${s.cargo_type})`}
                                    </div>
                                    <div className="text-[11px] text-slate-300">
                                        Corridor: <strong className="text-cyan-300">{s.corridor_name || 'NH-10'}</strong> | Status: <strong className={color}>{s.status}</strong>
                                    </div>
                                    {s.risk_breakdown && (
                                        <div className="text-[10px] text-slate-400">{s.risk_breakdown}</div>
                                    )}
                                    {s.assigned_holding_haven && (
                                        <div className="text-[10px] text-amber-400 font-bold mt-0.5">
                                            🛡️ Assigned Haven: {s.assigned_holding_haven}
                                        </div>
                                    )}
                                </Tooltip>
                            </Polyline>

                            {/* Animated Moving Vehicle Marker */}
                            {vehiclePos && !isNaN(vehiclePos[0]) && !isNaN(vehiclePos[1]) && (
                                <Marker position={vehiclePos} icon={vehicleIcon}>
                                    <Popup>
                                        <div className="text-xs font-mono">
                                            <div className="font-bold text-slate-900 flex items-center space-x-1">
                                                <span>{s.cargo_type === 'Medical Supplies' ? '🚑' : '🚚'}</span>
                                                <span>Convoy #{s.id} ({s.cargo_type})</span>
                                            </div>
                                            <div className="mt-1 text-slate-700">
                                                Corridor: <strong>{s.corridor_name || 'NH-10'}</strong>
                                            </div>
                                            <div>Status: <strong className="text-blue-600">{s.status}</strong></div>
                                            {s.assigned_holding_haven && (
                                                <div className="mt-1 p-1 bg-amber-50 rounded text-amber-800 text-[10px]">
                                                    🛡️ Staged at: <strong>{s.assigned_holding_haven}</strong>
                                                </div>
                                            )}
                                            {isDiverted && (
                                                <div className="mt-1 p-1 bg-emerald-50 rounded text-emerald-800 text-[10px]">
                                                    Active Bypass Detour (+34 km, +72 mins)<br/>
                                                    Saves 8+ hrs compared to road clearance
                                                </div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* Arbitration Bottleneck Marker */}
                            {conflictPoint && (
                                <Marker position={conflictPoint} icon={conflictIcon}>
                                    <Popup>
                                        <div className="text-xs font-mono">
                                            <strong className="text-red-600 font-bold">⚠️ ARBITRATION CHOKEPOINT</strong><br/>
                                            <span className="text-slate-700">{conflictMsg}</span>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}
                        </React.Fragment>
                    );
                })}
            </MapContainer>
        </div>
    );
}
