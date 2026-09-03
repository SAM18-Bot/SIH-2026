import React from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapComponent({ shipments }) {
    return (
        <div className="w-2/3 h-full">
            <MapContainer center={[27.1, 88.5]} zoom={11} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {shipments.map(s => {
                    const route = s.current_route_json ? JSON.parse(s.current_route_json) : [];
                    if(route.length === 0) return null;
                    
                    const isDelayed = s.status.includes('DELAYED');
                    let color = isDelayed ? '#f97316' : '#3b82f6';
                    let dashArray = isDelayed ? '10, 10' : null;
                    let opacity = isDelayed ? 0.7 : 1.0;
                    
                    // Extract arbitration info if delayed by arbitration
                    let conflictPoint = null;
                    let conflictMsg = null;
                    if (s.status === 'DELAYED_ARBITRATION') {
                        // In MVP, backend returns reason as a JSON string for arbitration
                        try {
                            const parsed = JSON.parse(s.reason);
                            conflictMsg = parsed.msg;
                            conflictPoint = parsed.conflict_point;
                            color = '#ef4444'; // Red for conflict
                        } catch(e) {}
                    }

                    return (
                        <React.Fragment key={s.id}>
                            <Polyline 
                                positions={route} 
                                pathOptions={{ color, weight: 6, dashArray, opacity }} 
                            >
                                <Tooltip sticky>
                                    <div className="font-bold text-sm">Shipment #{s.id} ({s.cargo_type})</div>
                                    <div className="text-xs">{s.status === 'DELAYED_ARBITRATION' ? 'Yielding route' : s.reason}</div>
                                </Tooltip>
                            </Polyline>

                            {conflictPoint && (
                                <Marker position={conflictPoint}>
                                    <Popup>
                                        <strong className="text-red-600">Arbitration Conflict</strong><br/>
                                        {conflictMsg}
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
