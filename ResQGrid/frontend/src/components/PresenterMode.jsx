import React, { useState, useEffect } from 'react';

export default function PresenterMode({ triggerDemo, triggerConflict, resetDemo, onClose }) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        { 
            text: "Normal conditions — corridor open, no risk flagged.", 
            action: resetDemo 
        },
        { 
            text: "Injecting a real rainfall event near NH-10 — watch the risk score change live.", 
            action: triggerDemo 
        },
        { 
            text: "The system just recalculated the route in response — this isn't scripted, it's the same risk model recomputing in real time.", 
            action: null 
        },
        { 
            text: "Two shipments now need the same constrained segment — watch which one gets priority, and why.", 
            action: triggerConflict 
        },
        { 
            text: "This model was backtested against real GSI landslide records before we ever touched live weather — here's the actual result.", 
            action: null 
        },
        { 
            text: "Resetting for the next run.", 
            action: resetDemo 
        }
    ];

    // Trigger action whenever we arrive at a step that has one
    useEffect(() => {
        if (steps[currentStep] && steps[currentStep].action) {
            steps[currentStep].action();
        }
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    return (
        <div className="absolute bottom-10 left-[420px] right-4 mx-auto w-2/3 max-w-4xl bg-black/90 text-white rounded-xl shadow-2xl z-[500] overflow-hidden border-2 border-yellow-500">
            <div className="bg-yellow-500 text-black px-4 py-2 font-bold flex justify-between items-center text-sm">
                <span>🎤 PRESENTER MODE</span>
                <button onClick={onClose} className="hover:text-red-800">Close ✖</button>
            </div>
            
            <div className="p-6 text-center">
                <p className="text-2xl font-semibold leading-relaxed">
                    {steps[currentStep].text}
                </p>
            </div>

            <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
                <button 
                    onClick={handleBack} 
                    disabled={currentStep === 0}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded font-bold transition"
                >
                    ◀ Back
                </button>
                
                <span className="text-gray-400 font-mono">
                    Step {currentStep + 1} of {steps.length}
                </span>

                <button 
                    onClick={handleNext} 
                    disabled={currentStep === steps.length - 1}
                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black disabled:opacity-50 rounded font-bold transition"
                >
                    Next ▶
                </button>
            </div>
        </div>
    );
}
