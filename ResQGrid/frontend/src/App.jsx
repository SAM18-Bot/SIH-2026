import React, { useState } from 'react';
import { useRouteData } from './hooks/useRouteData';
import MapComponent from './components/MapComponent';
import Panels from './components/Panels';
import SitRepModal from './components/SitRepModal';
import ElevationProfile from './components/ElevationProfile';
import ArbitrationModal from './components/ArbitrationModal';
import PresenterMode from './components/PresenterMode';

export default function App() {
    const { 
        shipments, 
        logs, 
        hazardPoints,
        holdingHavens,
        simulatedRain,
        createShipment, 
        triggerConflict, 
        submitGroundReport, 
        triggerDemo,
        resetDemo,
        setRainfall,
        triggerPreset,
        divertBypass,
        clearShipments,
        fetchSitRep
    } = useRouteData();

    // Presenter Mode state
    const [isPresenterMode, setIsPresenterMode] = useState(false);

    const [reportLat, setReportLat] = useState('27.0500');
    const [reportLon, setReportLon] = useState('88.4600');
    
    // Modal states
    const [isSitRepOpen, setIsSitRepOpen] = useState(false);
    const [sitRepData, setSitRepData] = useState(null);
    const [isElevationOpen, setIsElevationOpen] = useState(false);
    const [arbitrationShipment, setArbitrationShipment] = useState(null);

    const handleOpenSitRep = async () => {
        const data = await fetchSitRep();
        if (data) {
            setSitRepData(data);
            setIsSitRepOpen(true);
        }
    };

    const handleMapClick = (lat, lon) => {
        setReportLat(lat);
        setReportLon(lon);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-950 font-sans select-none relative">
            {/* Left Tactical Command Panel */}
            <Panels 
                shipments={shipments} 
                logs={logs} 
                simulatedRain={simulatedRain}
                setRainfall={setRainfall}
                triggerPreset={triggerPreset}
                createShipment={createShipment} 
                triggerConflict={triggerConflict}
                submitGroundReport={submitGroundReport}
                divertBypass={divertBypass}
                clearShipments={clearShipments}
                onOpenSitRep={handleOpenSitRep}
                onOpenElevation={() => setIsElevationOpen(true)}
                onOpenArbitration={(s) => setArbitrationShipment(s)}
                reportLat={reportLat}
                setReportLat={setReportLat}
                reportLon={reportLon}
                setReportLon={setReportLon}
            />

            {/* Right Geo-Tactical Map View */}
            <MapComponent 
                shipments={shipments} 
                hazardPoints={hazardPoints}
                holdingHavens={holdingHavens}
                onMapClick={handleMapClick}
                simulatedRain={simulatedRain}
            />

            {/* NDMA Tactical Situation Report Modal */}
            <SitRepModal 
                isOpen={isSitRepOpen} 
                onClose={() => setIsSitRepOpen(false)} 
                sitRep={sitRepData} 
            />

            {/* 3D Terrain & Slope Cross-Section Profile Modal */}
            <ElevationProfile 
                isOpen={isElevationOpen} 
                onClose={() => setIsElevationOpen(false)} 
            />

            {/* Multi-Shipment Arbitration Explainability Matrix */}
            <ArbitrationModal 
                isOpen={!!arbitrationShipment} 
                onClose={() => setArbitrationShipment(null)} 
                shipment={arbitrationShipment}
                allShipments={shipments}
            />

            {/* Presenter Mode Toggle Button (offset below the map's basemap switcher so it doesn't overlap) */}
            {!isPresenterMode && (
                <button 
                    onClick={() => setIsPresenterMode(true)}
                    className="absolute top-14 right-3 z-[500] bg-black hover:bg-gray-800 text-yellow-400 font-bold py-1.5 px-3 rounded shadow-lg border border-yellow-500 transition text-xs font-mono"
                >
                    🎤 Start Presenter Mode
                </button>
            )}

            {/* Presenter Mode Overlay */}
            {isPresenterMode && (
                <PresenterMode 
                    triggerDemo={triggerDemo}
                    triggerConflict={triggerConflict}
                    resetDemo={resetDemo}
                    onClose={() => setIsPresenterMode(false)}
                />
            )}
        </div>
    );
}
