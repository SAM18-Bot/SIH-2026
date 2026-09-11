import React, { useState, useEffect } from 'react';

export default function Panels({ 
    shipments, 
    logs, 
    simulatedRain,
    setRainfall,
    triggerPreset,
    createShipment, 
    triggerConflict, 
    submitGroundReport, 
    divertBypass,
    clearShipments,
    onOpenSitRep,
    onOpenElevation,
    onOpenArbitration,
    reportLat,
    setReportLat,
    reportLon,
    setReportLon
}) {
    const [activeTab, setActiveTab] = useState('convoys'); // 'convoys' | 'simulator' | 'logs'
    const [reportDesc, setReportDesc] = useState('Active Landslide Blockage');
    const [expandedLogs, setExpandedLogs] = useState({});
    const [valStats, setValStats] = useState(null);
    const [localRain, setLocalRain] = useState(simulatedRain || 0);

    useEffect(() => {
        setLocalRain(simulatedRain || 0);
    }, [simulatedRain]);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/validation')
            .then(res => res.json())
            .then(data => setValStats(data))
            .catch(err => console.error('Failed to fetch validation stats:', err));
    }, []);

    const handleReportSubmit = (e) => {
        e.preventDefault();
        submitGroundReport(reportLat, reportLon, reportDesc);
    };

    const toggleLog = (idx) => {
        setExpandedLogs(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const handleSliderChange = (e) => {
        const val = parseFloat(e.target.value);
        setLocalRain(val);
        setRainfall(val);
    };

    // Quick stats
    const safeShipments = Array.isArray(shipments) ? shipments : [];
    const activeCount = safeShipments.filter(s => s && (s.status === 'ACTIVE' || s.status === 'DIVERTED_BYPASS')).length;
    const delayedCount = safeShipments.filter(s => s && s.status && s.status.includes('DELAYED')).length;
    const divertedCount = safeShipments.filter(s => s && s.status === 'DIVERTED_BYPASS').length;

    return (
        <div className="w-[420px] min-w-[390px] flex-shrink-0 bg-slate-950 border-r border-slate-800 shadow-2xl z-10 flex flex-col h-full text-slate-100 overflow-hidden font-sans">
            {/* Header */}
            <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 flex-shrink-0 space-y-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        <div>
                            <h1 className="text-base font-black tracking-wider text-cyan-300 font-mono">
                                🏔️ RESQGRID TACTICAL
                            </h1>
                            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                                SIH26002 • Resilience Grid
                            </p>
                        </div>
                    </div>

                    <div className="flex space-x-1.5">
                        <button
                            onClick={onOpenSitRep}
                            className="bg-amber-600/90 hover:bg-amber-500 text-black font-mono font-bold text-[11px] px-2.5 py-1 rounded shadow transition flex items-center space-x-1"
                            title="Official NDMA Situation Report"
                        >
                            <span>📋</span>
                            <span>SITREP</span>
                        </button>
                        <button
                            onClick={onOpenElevation}
                            className="bg-cyan-600/90 hover:bg-cyan-500 text-black font-mono font-bold text-[11px] px-2.5 py-1 rounded shadow transition flex items-center space-x-1"
                            title="3D Terrain & Slope Cross-Section Profile"
                        >
                            <span>🏔️</span>
                            <span>TERRAIN</span>
                        </button>
                    </div>
                </div>

                {/* KPI summary cards */}
                <div className="grid grid-cols-3 gap-2 font-mono text-center">
                    <div className="p-1.5 bg-slate-900/90 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-400 block uppercase">Active</span>
                        <span className="text-emerald-400 font-bold text-xs">{activeCount} Convoys</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/90 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-400 block uppercase">Staged</span>
                        <span className="text-amber-400 font-bold text-xs">{delayedCount} Held</span>
                    </div>
                    <div className="p-1.5 bg-slate-900/90 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-400 block uppercase">Bypass</span>
                        <span className="text-cyan-400 font-bold text-xs">{divertedCount} Detours</span>
                    </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button 
                        onClick={() => createShipment("Medical Supplies", "HIGH")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-1.5 px-2 rounded shadow transition text-xs font-mono flex items-center justify-center space-x-1"
                    >
                        <span>🚑</span>
                        <span>+ Medical (High)</span>
                    </button>
                    <button 
                        onClick={triggerConflict}
                        className="bg-rose-700 hover:bg-rose-600 text-white font-bold py-1.5 px-2 rounded shadow transition text-xs font-mono flex items-center justify-center space-x-1"
                        title="Dispatch concurrent shipments to test arbitration"
                    >
                        <span>⚠️</span>
                        <span>Trigger Bottleneck</span>
                    </button>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex border-b border-slate-800 bg-slate-900/80 font-mono text-xs flex-shrink-0">
                <button
                    onClick={() => setActiveTab('convoys')}
                    className={`flex-1 py-2 text-center font-bold transition border-b-2 flex items-center justify-center space-x-1 ${
                        activeTab === 'convoys'
                            ? 'border-cyan-400 text-cyan-300 bg-slate-900'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                >
                    <span>🚚</span>
                    <span>Fleet ({shipments.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('simulator')}
                    className={`flex-1 py-2 text-center font-bold transition border-b-2 flex items-center justify-center space-x-1 ${
                        activeTab === 'simulator'
                            ? 'border-amber-400 text-amber-300 bg-slate-900'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                >
                    <span>⛈️</span>
                    <span>Simulator</span>
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex-1 py-2 text-center font-bold transition border-b-2 flex items-center justify-center space-x-1 ${
                        activeTab === 'logs'
                            ? 'border-emerald-400 text-emerald-300 bg-slate-900'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                >
                    <span>📟</span>
                    <span>Logs ({logs.length})</span>
                </button>
            </div>

            {/* Tab 1: Convoys List */}
            {activeTab === 'convoys' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                        <span>LIFELINE CONVOYS ({shipments.length})</span>
                        {shipments.length > 0 && (
                            <button
                                onClick={clearShipments}
                                className="text-slate-500 hover:text-rose-400 transition text-[11px]"
                            >
                                [Clear All]
                            </button>
                        )}
                    </div>

                    {shipments.length === 0 && (
                        <div className="text-center py-12 text-slate-500 text-xs font-mono space-y-2">
                            <p>No active convoys in sector.</p>
                            <p className="text-[11px] text-slate-600">
                                Click <strong className="text-emerald-400">+ Medical</strong> to dispatch emergency transport, or <strong className="text-rose-400">Trigger Bottleneck</strong> to simulate arbitration.
                            </p>
                        </div>
                    )}

                    {safeShipments.map(s => {
                        if (!s) return null;
                        const statusStr = s.status || '';
                        const isDiverted = statusStr === 'DIVERTED_BYPASS';
                        const isBlocked = statusStr.includes('DELAYED') || statusStr === 'UNSAFE';
                        const isArbitration = statusStr === 'DELAYED_ARBITRATION';

                        return (
                            <div 
                                key={s.id} 
                                className={`p-3 rounded-lg border text-xs font-mono space-y-2 transition ${
                                    isDiverted ? 'bg-emerald-950/25 border-emerald-500/50 shadow-emerald-950/20' :
                                    isArbitration ? 'bg-rose-950/25 border-rose-500/50 shadow-rose-950/20' :
                                    isBlocked ? 'bg-amber-950/25 border-amber-500/50 shadow-amber-950/20' :
                                    'bg-slate-900/80 border-slate-800'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                                        <span className="text-sm">{s.cargo_type === 'Medical Supplies' ? '🚑' : '🚚'}</span>
                                        <span>Convoy #{s.id} ({s.cargo_type})</span>
                                    </span>
                                    <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                                        isDiverted ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' :
                                        s.status === 'ACTIVE' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600' :
                                        isArbitration ? 'bg-rose-950 text-rose-300 border border-rose-600' :
                                        'bg-amber-950 text-amber-300 border border-amber-600'
                                    }`}>
                                        {s.status}
                                    </span>
                                </div>

                                <div className="text-[11px] text-slate-400">
                                    <span className="text-slate-500">Corridor:</span> <strong className="text-slate-300">{s.corridor_name || 'NH-10 Arterial'}</strong>
                                </div>

                                {s.assigned_holding_haven && (
                                    <div className="text-[11px] p-1.5 bg-amber-950/40 border border-amber-600/30 rounded text-amber-200">
                                        🛡️ Staged At: <strong>{s.assigned_holding_haven}</strong>
                                    </div>
                                )}

                                {s.risk_breakdown && (
                                    <div className="text-[11px] text-slate-400">
                                        <span className="text-slate-500">XAI Risk Split:</span> {s.risk_breakdown}
                                    </div>
                                )}

                                {s.confidence && (
                                    <div className="text-[11px] flex justify-between items-center">
                                        <span className="text-slate-500">Model Confidence:</span>
                                        <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                                            s.confidence === 'high' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                                            s.confidence === 'medium' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                                            'bg-rose-950 text-rose-300 border border-rose-700'
                                        }`}>
                                            {s.confidence.toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {/* Realistic Mountain Bypass Reroute Action */}
                                {isBlocked && !isDiverted && (
                                    <div className="pt-2 border-t border-slate-800/80">
                                        <button
                                            onClick={() => divertBypass(s.id)}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-1.5 px-3 rounded shadow transition text-xs flex items-center justify-center space-x-2"
                                            title="Reroute via official Lava-Algarah-Rhenock bypass to avoid Teesta gorge landslide zone"
                                        >
                                            <span>🔄</span>
                                            <span>Divert via Lava-Algarah Bypass (+34 km)</span>
                                        </button>
                                    </div>
                                )}

                                {/* View Arbitration Battle Card Button */}
                                {isArbitration && (
                                    <div className="pt-1.5 border-t border-slate-800/80">
                                        <button
                                            onClick={() => onOpenArbitration(s)}
                                            className="w-full bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 font-bold py-1 px-2 rounded text-[11px] transition flex items-center justify-center space-x-1"
                                        >
                                            <span>⚖️</span>
                                            <span>Inspect Arbitration Battle Card</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Tab 2: Disaster Simulation & Roadblock Sandbox */}
            {activeTab === 'simulator' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                    {/* Live Rain Slider */}
                    <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-200">🌧️ Rainfall Rate:</span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                localRain >= 120 ? 'bg-rose-950 text-rose-300 border border-rose-600' :
                                localRain >= 50 ? 'bg-amber-950 text-amber-300 border border-amber-600' :
                                'bg-emerald-950 text-emerald-300 border border-emerald-600'
                            }`}>
                                {localRain.toFixed(0)} mm/hr
                            </span>
                        </div>

                        <input 
                            type="range" 
                            min="0" 
                            max="200" 
                            step="5"
                            value={localRain} 
                            onChange={handleSliderChange}
                            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                        />

                        <div className="flex justify-between text-[10px] text-slate-500">
                            <span>0 mm (Clear)</span>
                            <span>100 mm (Heavy)</span>
                            <span>200 mm (Cloudburst)</span>
                        </div>

                        {/* Presets */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                            <button
                                onClick={() => triggerPreset('monsoon_spike')}
                                className="bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/40 text-amber-200 text-[10px] py-1.5 rounded transition font-bold"
                            >
                                ⛈️ 120mm Spike
                            </button>
                            <button
                                onClick={() => triggerPreset('teesta_flood')}
                                className="bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/40 text-rose-200 text-[10px] py-1.5 rounded transition font-bold"
                            >
                                🌊 Teesta Flood
                            </button>
                            <button
                                onClick={() => triggerPreset('clear')}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] py-1.5 rounded transition font-bold"
                            >
                                ☀️ Clear Skies
                            </button>
                        </div>
                    </div>

                    {/* Manual Roadblock Dispatch Form */}
                    <form onSubmit={handleReportSubmit} className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-200 uppercase">🚨 Dispatch Ground Roadblock</span>
                            <span className="text-[10px] text-slate-500">or click on map</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Latitude</label>
                                <input 
                                    type="number" step="0.0001" required
                                    value={reportLat} onChange={e => setReportLat(e.target.value)}
                                    className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Longitude</label>
                                <input 
                                    type="number" step="0.0001" required
                                    value={reportLon} onChange={e => setReportLon(e.target.value)}
                                    className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Incident Description</label>
                            <input 
                                type="text" required
                                value={reportDesc} onChange={e => setReportDesc(e.target.value)}
                                className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs"
                            />
                        </div>
                        <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold py-1.5 rounded text-xs transition">
                            Submit Ground Blockage
                        </button>
                    </form>

                    {/* GSI Backtest Info */}
                    {valStats && (
                        <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
                            <div className="font-bold text-slate-300">GSI Bhukosh Validation:</div>
                            <p>
                                Successfully pre-flagged <span className="text-emerald-400 font-bold">{valStats.hits}/{valStats.total}</span> known historical landslide events prior to live rainfall input.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 3: Tactical Telemetry Event Logs */}
            {activeTab === 'logs' && (
                <div className="flex-1 overflow-y-auto p-3 bg-black/90 text-emerald-400 font-mono text-[11px] space-y-1.5">
                    <div className="flex justify-between items-center pb-1 mb-2 border-b border-slate-900 text-slate-500 text-[10px]">
                        <span>REAL-TIME SYSTEM AUDIT STREAM</span>
                        <span className="text-emerald-500">● LIVE</span>
                    </div>

                    {logs.length === 0 && (
                        <div className="text-slate-600 text-center py-8">
                            Awaiting telemetry triggers...
                        </div>
                    )}

                    {logs.map((log, i) => (
                        <div key={i} className="border-b border-slate-900 pb-1.5">
                            <div 
                                className="py-1 cursor-pointer hover:bg-slate-900 px-1 rounded flex justify-between items-center"
                                onClick={() => toggleLog(i)}
                            >
                                <span className="truncate pr-2">
                                    <span className="text-slate-600">[{log.time}]</span> {log.title}
                                </span>
                                {log.details && <span className="text-slate-500 text-[10px]">{expandedLogs[i] ? '▼' : '▶'}</span>}
                            </div>
                            {expandedLogs[i] && log.details && (
                                <div className="pl-3 py-1.5 text-cyan-200 text-[10px] whitespace-pre-wrap bg-slate-950/80 rounded mt-1 border-l-2 border-cyan-500">
                                    {log.details}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
