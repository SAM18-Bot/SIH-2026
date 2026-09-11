import React from 'react';

export default function ArbitrationModal({ isOpen, onClose, shipment, allShipments }) {
    if (!isOpen || !shipment) return null;

    // Parse arbitration decision if available
    let decisionData = null;
    try {
        if (shipment.arbitration_decision) {
            decisionData = JSON.parse(shipment.arbitration_decision);
        }
    } catch (e) {
        console.error("Failed to parse arbitration_decision", e);
    }

    // Attempt to locate the conflicting partner shipment
    const otherShipment = allShipments.find(s => 
        s.id !== shipment.id && 
        (decisionData?.winner_shipment_id === s.id || decisionData?.loser_shipment_id === s.id)
    ) || allShipments.find(s => s.id !== shipment.id);

    const isWinner = shipment.status === 'ACTIVE' || (decisionData && decisionData.winner_shipment_id === shipment.id);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-red-500/40 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-100 flex flex-col">
                {/* Tactical Header */}
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div>
                        <h2 className="text-base font-bold text-rose-300 tracking-wide font-mono">
                            ⚖️ MULTI-SHIPMENT BOTTLENECK ARBITRATION MATRIX
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono transition"
                    >
                        ✕ CLOSE
                    </button>
                </div>

                {/* Subtitle */}
                <div className="px-6 py-2 bg-rose-950/30 border-b border-slate-800 text-xs text-rose-200">
                    Chokepoint Contention Detected: Single-lane bottleneck cannot safely accommodate concurrent two-way convoys.
                </div>

                {/* Side-by-Side Comparison Grid */}
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Target Shipment Card */}
                        <div className={`p-4 rounded-lg border text-xs space-y-3 ${isWinner ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-rose-950/30 border-rose-500/50'}`}>
                            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                <span className="font-bold text-slate-200 text-sm">Convoy #{shipment.id}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isWinner ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                    {isWinner ? '🏆 RIGHT-OF-WAY GRANTED' : '⏸️ YIELD & HOLD'}
                                </span>
                            </div>
                            <div className="space-y-1.5 font-mono text-[11px]">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Cargo Type:</span>
                                    <span className="font-bold text-slate-200">{shipment.cargo_type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Cargo Priority:</span>
                                    <span className="text-amber-300">{shipment.cargo_type === 'Medical Supplies' ? '40 pts (Life Critical)' : '20 pts (Standard)'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Urgency Tier:</span>
                                    <span className="text-amber-300">{shipment.priority === 'HIGH' ? '+10 pts (Emergency)' : '+0 pts (Nominal)'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Perishability Penalty:</span>
                                    <span className="text-cyan-300">{shipment.cargo_type === 'Medical Supplies' ? 'High (+20 pts)' : 'Low (0 pts)'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Vehicle Weight / Axle:</span>
                                    <span className={shipment.cargo_type === 'Medical Supplies' ? 'text-emerald-300' : 'text-rose-300'}>
                                        {shipment.cargo_type === 'Medical Supplies' ? '2.5T Light Rig (Passes 15T Bridge Limit)' : '24.0T Heavy (Exceeds Bridge Wet Safety Cap)'}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold">
                                <span>Arbitration Score:</span>
                                <span className={`text-base font-mono ${isWinner ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {shipment.cargo_type === 'Medical Supplies' ? '70 PTS' : '20 PTS'}
                                </span>
                            </div>
                        </div>

                        {/* Contending Shipment Card */}
                        {otherShipment ? (
                            <div className={`p-4 rounded-lg border text-xs space-y-3 ${!isWinner ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-900 border-slate-700'}`}>
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <span className="font-bold text-slate-200 text-sm">Convoy #{otherShipment.id}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${!isWinner ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                                        {!isWinner ? '🏆 RIGHT-OF-WAY GRANTED' : '⏸️ YIELD & HOLD'}
                                    </span>
                                </div>
                                <div className="space-y-1.5 font-mono text-[11px]">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Cargo Type:</span>
                                        <span className="font-bold text-slate-200">{otherShipment.cargo_type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Cargo Priority:</span>
                                        <span className="text-amber-300">{otherShipment.cargo_type === 'Medical Supplies' ? '40 pts (Life Critical)' : '20 pts (Standard)'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Urgency Tier:</span>
                                        <span className="text-amber-300">{otherShipment.priority === 'HIGH' ? '+10 pts (Emergency)' : '+0 pts (Nominal)'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Perishability Penalty:</span>
                                        <span className="text-cyan-300">{otherShipment.cargo_type === 'Medical Supplies' ? 'High (+20 pts)' : 'Low (0 pts)'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Vehicle Weight / Axle:</span>
                                        <span className={otherShipment.cargo_type === 'Medical Supplies' ? 'text-emerald-300' : 'text-rose-300'}>
                                            {otherShipment.cargo_type === 'Medical Supplies' ? '2.5T Light Rig (Passes 15T Bridge Limit)' : '24.0T Heavy (Exceeds Bridge Wet Safety Cap)'}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold">
                                    <span>Arbitration Score:</span>
                                    <span className={`text-base font-mono ${!isWinner ? 'text-emerald-400' : 'text-slate-400'}`}>
                                        {otherShipment.cargo_type === 'Medical Supplies' ? '70 PTS' : '20 PTS'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center text-xs text-slate-500">
                                Single active shipment registered in corridor.
                            </div>
                        )}
                    </div>

                    {/* Algorithmic Rationale */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1 font-mono">
                        <div className="text-cyan-300 font-bold">DECISION RATIONALE:</div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                            Under NDMA Mountain Logistics Standard Operating Procedure, life-support medical shipments supersede capital infrastructure materials during active weather advisories. The lower priority convoy has been assigned a dynamic hold order at the nearest safe turnout bay.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-1.5 px-4 rounded transition"
                    >
                        Acknowledge Decision
                    </button>
                </div>
            </div>
        </div>
    );
}
