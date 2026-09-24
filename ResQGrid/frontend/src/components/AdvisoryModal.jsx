import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

export default function AdvisoryModal({ isOpen, onClose, shipmentId }) {
    const [advisoryText, setAdvisoryText] = useState('Loading advisory...');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && shipmentId) {
            setAdvisoryText('Fetching advisory...');
            setCopied(false);
            fetch(`${API_BASE}/api/shipments/${shipmentId}/advisory`)
                .then(res => res.json())
                .then(data => {
                    setAdvisoryText(data.advisory_text);
                })
                .catch(err => {
                    setAdvisoryText('Error loading advisory.');
                    console.error(err);
                });
        }
    }, [isOpen, shipmentId]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(advisoryText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
            <div className="bg-slate-950 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-slate-200 font-bold tracking-widest text-sm flex items-center space-x-2">
                        <span>🖨️</span>
                        <span>OFFICIAL ADVISORY</span>
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition text-lg leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto max-h-[60vh]">
                    <pre className="text-emerald-400 text-[11px] leading-relaxed whitespace-pre-wrap font-mono">
                        {advisoryText}
                    </pre>
                </div>

                {/* Footer Action */}
                <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-xs text-slate-300 hover:text-white transition"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleCopy}
                        className={`px-4 py-1.5 rounded text-xs font-bold transition flex items-center space-x-2 ${
                            copied 
                                ? 'bg-emerald-600 text-black shadow-[0_0_10px_rgba(5,150,105,0.4)]' 
                                : 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_10px_rgba(8,145,178,0.3)]'
                        }`}
                    >
                        <span>{copied ? '✓ COPIED' : '📋 COPY TO CLIPBOARD'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
