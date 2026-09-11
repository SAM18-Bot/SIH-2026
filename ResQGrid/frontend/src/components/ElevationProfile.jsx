import React from 'react';

export default function ElevationProfile({ isOpen, onClose }) {
    if (!isOpen) return null;

    const points = [
        { km: 0, name: "Siliguri Junction", elevation: 122, slope: "1.2°", risk: "LOW", hazard: "Valley Floor Base" },
        { km: 18, name: "Sevoke (Coronation Br.)", elevation: 210, slope: "14.5°", risk: "HIGH", hazard: "Single-Lane Chokepoint & Rockfall" },
        { km: 32, name: "Kalijhora Gorge", elevation: 290, slope: "18.2°", risk: "CRITICAL", hazard: "Debris Flow & River Erosion" },
        { km: 45, name: "Teesta Bazar Confluence", elevation: 220, slope: "8.0°", risk: "CRITICAL", hazard: "Flash Flood Submergence Zone" },
        { km: 60, name: "Melli Checkpost", elevation: 310, slope: "11.4°", risk: "MEDIUM", hazard: "Inter-State Border Staging Area" },
        { km: 78, name: "Rangpo Border Gate", elevation: 380, slope: "7.5°", risk: "LOW", hazard: "Sikkim Entry Checkpoint" },
        { km: 92, name: "Singtam Bridge", elevation: 410, slope: "9.2°", risk: "MEDIUM", hazard: "Silt Deposit Chokepoint" },
        { km: 105, name: "Ranipool Hairpins", elevation: 920, slope: "22.0°", risk: "HIGH", hazard: "Severe Hairpin Incline" },
        { km: 114, name: "Gangtok Ridge Terminal", elevation: 1650, slope: "12.0°", risk: "LOW", hazard: "High-Altitude Supply Staging" },
    ];

    const maxElev = 1800;
    const minElev = 100;
    const svgWidth = 720;
    const svgHeight = 220;
    const padding = { top: 25, bottom: 40, left: 55, right: 35 };

    const getX = (km) => padding.left + (km / 114) * (svgWidth - padding.left - padding.right);
    const getY = (elev) => padding.top + (1 - (elev - minElev) / (maxElev - minElev)) * (svgHeight - padding.top - padding.bottom);

    // Build SVG path
    const pathD = points.reduce((acc, pt, idx) => {
        const x = getX(pt.km);
        const y = getY(pt.elevation);
        return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, "");

    const areaD = `${pathD} L ${getX(114)} ${svgHeight - padding.bottom} L ${getX(0)} ${svgHeight - padding.bottom} Z`;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-cyan-500/40 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
                        <h2 className="text-lg font-bold tracking-wide text-cyan-300">
                            🏔️ 3D Terrain & Elevation Hazard Profile (NH-10 Arterial Corridor)
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sm font-mono transition"
                    >
                        ✕ CLOSE
                    </button>
                </div>

                {/* Subtitle & Stats */}
                <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 grid grid-cols-4 gap-4 text-xs">
                    <div>
                        <span className="text-slate-400 block">Total Elevation Gain</span>
                        <span className="font-bold text-emerald-400 text-sm">▲ +1,528 m</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block">Max Slope Incline</span>
                        <span className="font-bold text-amber-400 text-sm">22.0° (Ranipool)</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block">Active Hazard Chokepoints</span>
                        <span className="font-bold text-rose-400 text-sm">3 Critical Zones</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block">Corridor Length</span>
                        <span className="font-bold text-cyan-400 text-sm">114 km (Siliguri - Gangtok)</span>
                    </div>
                </div>

                {/* Chart Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 relative">
                        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
                            <defs>
                                <linearGradient id="terrainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>

                            {/* Grid lines */}
                            {[400, 800, 1200, 1600].map(elev => {
                                const y = getY(elev);
                                return (
                                    <g key={elev}>
                                        <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />
                                        <text x={padding.left - 10} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                                            {elev}m
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Base Area & Line */}
                            <path d={areaD} fill="url(#terrainGrad)" />
                            <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="3" />

                            {/* Points & Labels */}
                            {points.map((pt) => {
                                const cx = getX(pt.km);
                                const cy = getY(pt.elevation);
                                const isCritical = pt.risk === 'CRITICAL' || pt.risk === 'HIGH';
                                const color = pt.risk === 'CRITICAL' ? '#f43f5e' : pt.risk === 'HIGH' ? '#f59e0b' : '#10b981';

                                return (
                                    <g key={pt.km} className="cursor-pointer group">
                                        {isCritical && (
                                            <circle cx={cx} cy={cy} r="10" fill={color} opacity="0.2" className="animate-ping" />
                                        )}
                                        <circle cx={cx} cy={cy} r="5" fill={color} stroke="#0f172a" strokeWidth="2" />
                                        <text 
                                            x={cx} 
                                            y={cy - 12} 
                                            fill="#e2e8f0" 
                                            fontSize="9" 
                                            fontWeight="bold" 
                                            textAnchor="middle"
                                        >
                                            {pt.elevation}m
                                        </text>
                                        <text 
                                            x={cx} 
                                            y={svgHeight - padding.bottom + 18} 
                                            fill="#94a3b8" 
                                            fontSize="9" 
                                            textAnchor="middle"
                                        >
                                            {pt.km}km
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                        <div className="text-right text-[10px] text-slate-500 font-mono mt-1">
                            X-Axis: Distance from Siliguri (km) | Y-Axis: Altitude above sea level (m)
                        </div>
                    </div>

                    {/* Chokepoint Cards */}
                    <div>
                        <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
                            Identified Geomorphic Vulnerability Segments
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            {points.filter(p => p.risk !== 'LOW').map((pt, i) => (
                                <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-200">{pt.name}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pt.risk === 'CRITICAL' ? 'bg-rose-950 border border-rose-600 text-rose-300' : 'bg-amber-950 border border-amber-600 text-amber-300'}`}>
                                            {pt.risk}
                                        </span>
                                    </div>
                                    <div className="text-slate-400 text-[11px]">{pt.hazard}</div>
                                    <div className="flex justify-between text-[10px] text-slate-500 pt-1 font-mono">
                                        <span>Alt: {pt.elevation}m</span>
                                        <span>Slope: {pt.slope}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span>Source: GSI Bhukosh DEM & SRTM Elevation Inversion</span>
                    <button 
                        onClick={onClose}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1.5 px-4 rounded transition"
                    >
                        Acknowledge & Return to Command
                    </button>
                </div>
            </div>
        </div>
    );
}
