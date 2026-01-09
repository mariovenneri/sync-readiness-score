import { useState, useEffect } from "react";

const Loading = ({ track, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Analyzing mood & energy...",
    "Analyzing mode",
    "Measuring BPM and key...",
    "Scanning for sync potential...",
    "Finalizing sync readiness score..."
  ];

  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 1200);

      return () => clearTimeout(timer);
    } else if (currentStep === steps.length - 1) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-12 text-center">

          {/* Song being analyzed */}
          <div className="mb-10">
            <p className="text-blue-300 text-sm mb-1">Currently analyzing:</p>
            <p className="text-white text-2xl font-bold">"{track.title}"</p>
            <p className="text-blue-400 text-lg">by {track.artist}</p>
          </div>

          {/* Animated spinner + text */}
          <div className="flex items-center justify-center gap-6">
            <div className="inline-block w-12 h-12 border-8 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-blue-300 text-2xl font-medium animate-pulse">
              {steps[currentStep]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;