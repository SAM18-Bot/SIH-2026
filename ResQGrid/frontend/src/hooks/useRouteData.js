import { useState, useEffect, useRef } from 'react';

export function useRouteData() {
    const [shipments, setShipments] = useState([]);
    const [logs, setLogs] = useState([]);
    const wsRef = useRef(null);

    const addLog = (title, details = null) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [{ time, title, details }, ...prev].slice(0, 50));
    };

    const fetchShipments = () => {
        fetch('http://127.0.0.1:8000/api/shipments/')
            .then(res => res.json())
            .then(data => setShipments(data))
            .catch(err => console.error("Error fetching shipments:", err));
    };

    useEffect(() => {
        fetchShipments();
        let reconnectTimer;
        
        const connect = () => {
            wsRef.current = new WebSocket('ws://127.0.0.1:8000/ws');
            
            wsRef.current.onopen = () => {
                console.log("WebSocket connected");
            };

            wsRef.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.event === 'shipment_updated') {
                    addLog(`Shipment #${data.shipment_id} updated: ${data.status}`, `Reason: ${data.reason}\nBreakdown: ${data.risk_breakdown || 'N/A'}`);
                    fetchShipments(); // refresh map
                } else if (data.event === 'ai_log') {
                    addLog(data.log.title, data.log.details);
                }
            };

            wsRef.current.onclose = () => {
                console.log("WebSocket disconnected, reconnecting in 3s...");
                reconnectTimer = setTimeout(connect, 3000);
            };
            
            wsRef.current.onerror = (err) => {
                console.error("WebSocket error:", err);
                wsRef.current.close();
            };
        };
        
        connect();

        return () => {
            clearTimeout(reconnectTimer);
            if (wsRef.current) {
                wsRef.current.onclose = null; // Prevent reconnect on unmount
                wsRef.current.close();
            }
        };
    }, []);

    const createShipment = (cargo_type, priority) => {
        const payload = {
            origin_lat: 26.8797,
            origin_lon: 88.4708,
            dest_lat: 27.3290,
            dest_lon: 88.6122,
            cargo_type: cargo_type,
            priority: priority,
            departure_window_start: new Date().toISOString(),
            departure_window_end: new Date(Date.now() + 8*3600*1000).toISOString()
        };
        fetch('http://127.0.0.1:8000/api/shipments/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(res => res.json()).then(data => {
            addLog(`Created Shipment Request #${data.id}`);
            fetchShipments();
        });
    };

    const triggerConflict = () => {
        // Specifically create two overlapping shipments to trigger arbitration
        createShipment("Medical Supplies", "HIGH");
        setTimeout(() => createShipment("Construction", "NORMAL"), 500);
    };

    const submitGroundReport = (lat, lon, description) => {
        fetch('http://127.0.0.1:8000/api/reports/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: parseFloat(lat), lon: parseFloat(lon), description })
        }).then(res => res.json()).then(data => {
            addLog(`Ground Report #${data.id} submitted`, `${description} at [${lat}, ${lon}]`);
        }).catch(err => console.error("Error submitting report:", err));
    };

    const [stormActive, setStormActive] = useState(false);

    const triggerDemo = () => {
        fetch('http://127.0.0.1:8000/api/demo/trigger', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                addLog("Demo Scenario Injected!", data.message);
                setStormActive(true);
            })
            .catch(err => console.error("Error triggering demo:", err));
    };

    const resetDemo = () => {
        fetch('http://127.0.0.1:8000/api/demo/reset', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                addLog("Weather Cleared", data.message);
                setStormActive(false);
            })
            .catch(err => console.error("Error resetting demo:", err));
    };

    const toggleDemoMode = (isDemo) => {
        fetch('http://127.0.0.1:8000/api/settings/mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ demo_mode: isDemo })
        }).then(res => res.json()).then(data => {
            addLog("System Configuration Changed", `Demo Mode is now ${data.demo_mode ? 'ON (Offline)' : 'OFF (Live Open-Meteo API)'}`);
        });
    };

    const completeShipment = (id) => {
        fetch(`http://127.0.0.1:8000/api/shipments/${id}/complete`, { method: 'POST' })
            .then(res => res.json())
            .then(() => {
                addLog(`Shipment #${id} Arrived`, "Successfully reached destination.");
                fetchShipments();
            })
            .catch(err => console.error("Error completing shipment:", err));
    };

    return { shipments, logs, createShipment, triggerConflict, submitGroundReport, triggerDemo, resetDemo, toggleDemoMode, stormActive, completeShipment };
}
