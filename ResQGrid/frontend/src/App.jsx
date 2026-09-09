import React from 'react';
import { useRouteData } from './hooks/useRouteData';
import MapComponent from './components/MapComponent';
import Panels from './components/Panels';

export default function App() {
  const { shipments, logs, createShipment, triggerConflict, submitGroundReport } = useRouteData();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Panels 
        shipments={shipments} 
        logs={logs} 
        createShipment={createShipment} 
        triggerConflict={triggerConflict}
        submitGroundReport={submitGroundReport}
      />
      <MapComponent shipments={shipments} />
    </div>
  );
}
