import React, { useState } from 'react';
import { useRouteData } from './hooks/useRouteData';
import MapComponent from './components/MapComponent';
import Panels from './components/Panels';
import PresenterMode from './components/PresenterMode';

export default function App() {
  const { shipments, logs, createShipment, triggerConflict, submitGroundReport, triggerDemo, resetDemo, toggleDemoMode, stormActive, completeShipment } = useRouteData();
  const [isPresenterMode, setIsPresenterMode] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 relative">
      <Panels 
        shipments={shipments} 
        logs={logs} 
        createShipment={createShipment} 
        triggerConflict={triggerConflict}
        submitGroundReport={submitGroundReport}
        triggerDemo={triggerDemo}
        resetDemo={resetDemo}
        toggleDemoMode={toggleDemoMode}
      />
      <MapComponent shipments={shipments} stormActive={stormActive} completeShipment={completeShipment} />
      
      {/* Presenter Mode Toggle Button */}
      {!isPresenterMode && (
        <button 
          onClick={() => setIsPresenterMode(true)}
          className="absolute top-4 right-4 z-[9999] bg-black hover:bg-gray-800 text-yellow-400 font-bold py-2 px-4 rounded shadow-lg border border-yellow-500 transition"
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
