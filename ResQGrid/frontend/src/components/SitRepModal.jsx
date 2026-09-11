import React from 'react';

export default function SitRepModal({ isOpen, onClose, sitRep }) {
    if (!isOpen || !sitRep) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-amber-500/50 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden text-slate-100 flex flex-col my-auto">
                {/* Tactical Header */}
                <div className="p-4 bg-gradient-to-r from-amber-950 via-slate-950 to-slate-950 border-b border-amber-500/30 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🇮🇳</span>
                        <div>
                            <div className="text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase">
                                NDMA / BRO SWASTIK TACTICAL OPERATIONS
                            </div>
                            <h2 className="text-base font-bold text-white tracking-wide">
                                SITUATION REPORT (SITREP) - SIKKIM SECTOR
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={handlePrint}
                            className="bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs py-1 px-3 rounded shadow transition flex items-center space-x-1"
                        >
                            <span>🖨️</span>
                            <span>PRINT / EXPORT</span>
                        </button>
                        <button 
                            onClick={onClose}
                            className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Printable Content Body */}
                <div className="p-6 space-y-5 text-sm bg-slate-900" id="printable-sitrep">
                    {/* Document Meta Table */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded font-mono text-xs">
                        <div>
                            <span className="text-slate-500 block">SITREP IDENTIFIER</span>
                            <span className="font-bold text-cyan-400">{sitRep.sitrep_id}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">TIMESTAMP (UTC)</span>
                            <span className="font-bold text-slate-200">{sitRep.timestamp}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">OPERATIONAL CORRIDOR</span>
                            <span className="font-bold text-slate-200">{sitRep.corridor}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">ALERT THREAT LEVEL</span>
                            <span className={`font-bold inline-block px-2 py-0.5 rounded text-[11px] ${
                                sitRep.threat_level.includes('RED') ? 'bg-rose-950 text-rose-300 border border-rose-600' :
                                sitRep.threat_level.includes('ORANGE') ? 'bg-amber-950 text-amber-300 border border-amber-600' :
                                'bg-emerald-950 text-emerald-300 border border-emerald-600'
                            }`}>
                                {sitRep.threat_level}
                            </span>
                        </div>
                    </div>

                    {/* Operational Telemetry Summary */}
                    <div>
                        <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2 font-mono">
                            I. Lifeline Telemetry & Resource Status
                        </h4>
                        <div className="grid grid-cols-4 gap-3">
                            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-center">
                                <span className="text-slate-500 text-[10px] block">METEOROLOGY</span>
                                <span className="font-bold text-cyan-300 text-xs">{sitRep.meteorological_status}</span>
                            </div>
                            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-center">
                                <span className="text-slate-500 text-[10px] block">ACTIVE CONVOYS</span>
                                <span className="font-bold text-emerald-400 text-lg">{sitRep.active_convoys}</span>
                            </div>
                            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-center">
                                <span className="text-slate-500 text-[10px] block">DELAYED / YIELDING</span>
                                <span className="font-bold text-amber-400 text-lg">{sitRep.delayed_shipments}</span>
                            </div>
                            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-center">
                                <span className="text-slate-500 text-[10px] block">BYPASS DETOURS</span>
                                <span className="font-bold text-cyan-400 text-lg">{sitRep.diverted_convoys || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Strategic Directives */}
                    <div>
                        <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2 font-mono">
                            II. Executive Directives & Traffic Arbitration
                        </h4>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-2">
                            <div className="text-xs text-slate-300 font-mono">
                                <span className="text-amber-400 font-bold">ARBITRATION PROTOCOL:</span> {sitRep.arbitration_status}
                            </div>
                            <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-300">
                                {sitRep.key_directives.map((dir, idx) => (
                                    <li key={idx} className="leading-relaxed">
                                        <span className="text-cyan-300 font-medium">{dir}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Authentication Signoff */}
                    <div className="pt-3 border-t border-slate-800 flex justify-between items-end text-[11px] text-slate-400 font-mono">
                        <div>
                            <span className="block text-slate-500">DISPATCH AUTHORITY</span>
                            <span>Commandant, ResQGrid Regional Emergency Hub</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-emerald-400 font-bold">● DIGITALLY VERIFIED</span>
                            <span className="text-[10px] text-slate-500">SIH-2026 ResQGrid AI Autonomous Arbiter</span>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end space-x-2">
                    <button 
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-1.5 px-4 rounded transition"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}
