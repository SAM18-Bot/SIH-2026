import React, { useState, useEffect } from 'react';

export default function Panels({ shipments, logs, createShipment, triggerConflict, submitGroundReport, triggerDemo, resetDemo }) {
    const [reportLat, setReportLat] = useState('27.0500');
    const [reportLon, setReportLon] = useState('88.4600');
    const [reportDesc, setReportDesc] = useState('Landslide blocked road');
    const [expandedLogs, setExpandedLogs] = useState({});
    const [valStats, setValStats] = useState(null);
    const [isDemoMode, setIsDemoMode] = useState(false);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/validation')
            .then(res => res.json())
            .then(data => setValStats(data))
            .catch(err => console.error('Failed to fetch validation stats:', err));
            
        fetch('http://127.0.0.1:8000/')
            .then(res => res.json())
            .then(data => setIsDemoMode(data.demo_mode))
            .catch(err => console.error('Failed to fetch health check:', err));
    }, []);

    const handleReportSubmit = (e) => {
        e.preventDefault();
        submitGroundReport(reportLat, reportLon, reportDesc);
    };

    const toggleLog = (idx) => {
        setExpandedLogs(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <div className="w-1/3 bg-white shadow-xl z-10 flex flex-col h-full">
            <div className="p-6 bg-blue-900 text-white flex justify-between items-center relative">
                <div>
                    <h1 className="text-2xl font-bold">Dispatcher Terminal</h1>
                    <p className="text-sm opacity-80 mt-1">SIH26002 - ResQGrid Platform</p>
                </div>
                {valStats && valStats.total > 0 && (
                    <div className="bg-blue-800 px-3 py-1 rounded border border-blue-700 text-xs text-center">
                        <span className="block font-bold">Model Validated</span>
                        <span className="text-green-300">{valStats.hits}/{valStats.total} incidents flagged</span>
                    </div>
                )}
                {isDemoMode && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl shadow-sm">
                        DEMO MODE ACTIVE
                    </div>
                )}
            </div>
            
            <div className="p-4 border-b space-y-3 bg-gray-50 flex-shrink-0">
                <div className="flex space-x-2">
                    <button 
                        onClick={() => createShipment("Medical Supplies", "HIGH")}
                        className="w-1/2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow transition text-sm">
                        + New Medical Shipment
                    </button>
                    <button 
                        onClick={triggerConflict}
                        className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow transition text-sm">
                        ⚠️ Trigger Arbitration
                    </button>
                </div>
                
                <div className="flex space-x-2">
                    <button 
                        onClick={triggerDemo}
                        className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-4 rounded shadow transition text-xs">
                        🌧️ Inject Rain Scenario
                    </button>
                    <button 
                        onClick={resetDemo}
                        className="w-1/2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-4 rounded shadow transition text-xs">
                        ☀️ Clear Weather
                    </button>
                </div>
                
                <form onSubmit={handleReportSubmit} className="mt-4 p-3 bg-white rounded shadow-sm border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Submit Ground Report</h4>
                    <div className="flex space-x-2 mb-2">
                        <input 
                            type="number" step="0.0001" placeholder="Lat" required
                            value={reportLat} onChange={e => setReportLat(e.target.value)}
                            className="w-1/2 p-1 border rounded text-xs"
                        />
                        <input 
                            type="number" step="0.0001" placeholder="Lon" required
                            value={reportLon} onChange={e => setReportLon(e.target.value)}
                            className="w-1/2 p-1 border rounded text-xs"
                        />
                    </div>
                    <input 
                        type="text" placeholder="Description" required
                        value={reportDesc} onChange={e => setReportDesc(e.target.value)}
                        className="w-full p-1 border rounded text-xs mb-2"
                    />
                    <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-4 rounded text-xs shadow transition">
                        Submit Blockage
                    </button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto p-4 border-b">
                <h3 className="font-bold text-gray-700 mb-2 uppercase text-sm tracking-wider">Active Shipments</h3>
                {shipments.length === 0 && <p className="text-sm text-gray-500">No active shipments in system.</p>}
                <div className="space-y-3">
                    {shipments.map(s => (
                        <div key={s.id} className="p-3 bg-white rounded border border-gray-200 shadow-sm text-sm">
                            <div className="flex justify-between font-bold text-gray-800 mb-1">
                                <span>#{s.id} - {s.cargo_type}</span>
                                <span className={`px-2 py-1 text-xs rounded ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : s.status.includes('DELAYED') ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {s.status}
                                </span>
                            </div>
                            {s.risk_breakdown && (
                                <div className="text-xs text-gray-600 mb-1">
                                    <span className="font-semibold">Risk:</span> {s.risk_breakdown}
                                </div>
                            )}
                            {s.confidence && (
                                <div className="text-xs text-gray-600">
                                    <span className="font-semibold">AI Confidence:</span> 
                                    <span className={`ml-1 px-1 rounded ${s.confidence === 'high' ? 'bg-blue-100 text-blue-700' : s.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {s.confidence.toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-1/3 overflow-y-auto p-4 bg-gray-900 text-green-400 border-t flex-shrink-0">
                <h3 className="font-bold text-white mb-2 uppercase text-sm tracking-wider">System Event Log</h3>
                <div className="space-y-1 font-mono text-xs">
                    {logs.map((log, i) => (
                        <div key={i} className="border-b border-gray-800 pb-1">
                            <div 
                                className="py-1 cursor-pointer hover:bg-gray-800 px-1 rounded flex justify-between"
                                onClick={() => toggleLog(i)}
                            >
                                <span><span className="text-gray-500">[{log.time}]</span> {log.title}</span>
                                {log.details && <span>{expandedLogs[i] ? '▼' : '▶'}</span>}
                            </div>
                            {expandedLogs[i] && log.details && (
                                <div className="pl-4 py-1 text-green-200 whitespace-pre-wrap">
                                    {log.details}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
