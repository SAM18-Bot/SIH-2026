import { useState, useEffect, useRef } from 'react';

export function useRouteData() {
    const [shipments, setShipments] = useState([]);
    const [logs, setLogs] = useState([]);
    const wsRef = useRef(null);

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    };

    const fetchShipments = () => {
        fetch('http://127.0.0.1:8000/api/shipments/')
            .then(res => res.json())
            .then(data => setShipments(data))
            .catch(err => console.error("Error fetching shipments:", err));
    };

    useEffect(() => {
        fetchShipments();
        wsRef.current = new WebSocket('ws://127.0.0.1:8000/ws');
        
        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.event === 'shipment_updated') {
                addLog(`Shipment #${data.shipment_id} Update: ${data.reason}`);
                fetchShipments(); // refresh map
            }
        };

        return () => {
            if (wsRef.current) wsRef.current.close();
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

    return { shipments, logs, createShipment, triggerConflict };
}
