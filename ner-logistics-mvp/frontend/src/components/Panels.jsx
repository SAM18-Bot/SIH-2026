import React from 'react';

export default function Panels({ shipments, logs, createShipment, triggerConflict }) {
    return (
        <div className="w-1/3 bg-white shadow-xl z-10 flex flex-col h-full">
            <div className="p-6 bg-blue-900 text-white">
                <h1 className="text-2xl font-bold">Dispatcher Terminal</h1>
                <p className="text-sm opacity-80 mt-1">SIH26002 - NER Logistics Platform</p>
            </div>
            
            <div className="p-4 border-b space-y-3 bg-gray-50">
                <button 
                    onClick={() => createShipment("Medical Supplies", "HIGH")}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow transition">
                    + New Medical Shipment
                </button>
                <button 
                    onClick={triggerConflict}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow transition">
                    ⚠️ Trigger Arbitration Conflict
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 border-b">
                <h3 className="font-bold text-gray-700 mb-2 uppercase text-sm tracking-wider">Active Shipments</h3>
                {shipments.length === 0 && <p className="text-sm text-gray-500">No active shipments in system.</p>}
                <div className="space-y-3">
                    {shipments.map(s => (
                        <div key={s.id} className="p-3 bg-white rounded border border-gray-200 shadow-sm text-sm">
                            <div className="flex justify-between font-bold text-gray-800">
                                <span>#{s.id} - {s.cargo_type}</span>
                                <span className={`px-2 py-1 text-xs rounded ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : s.status.includes('DELAYED') ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {s.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-1/3 overflow-y-auto p-4 bg-gray-900 text-green-400 border-t">
                <h3 className="font-bold text-white mb-2 uppercase text-sm tracking-wider">System Event Log</h3>
                <div className="space-y-1 font-mono text-xs">
                    {logs.map((log, i) => (
                        <div key={i} className="break-words py-1 border-b border-gray-800">{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}
