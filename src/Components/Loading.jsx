import { useState, useEffect } from "react";

const Loading = ({ track, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [didYouKnowIndex, setDidYouKnowIndex] = useState(0);

  const steps = [
    "Analyzing mood & energy...",
    "Analyzing key & mode...",
    "Measuring BPM and rhythm...",
    "Evaluating length & structure...",
    "Finalizing sync readiness score..."
  ];

  // 7 engaging facts (5 original + 2 new money-focused ones from Rate Guide)
  const didYouKnowFacts = [
    "Did you know? Tracks with clear, dynamic builds are 3x more likely to get placed in trailers.",
    "Did you know? A single sync placement in a national TV ad can earn you $5,000–$15,000+ in upfront fees.",
    "Did you know? Supervisors prioritize songs that don't overpower dialogue — low perceived intensity is key for underscore.",
    "Did you know? Songs around 90–140 BPM dominate action and sports syncs because they match natural scene energy.",
    "Did you know? Shorter edits (90–180 seconds) get placed 4x more often than full-length tracks.",
    "Did you know? Successful trailer placements often bring $10,000–$50,000 in sync royalties — the more placements, the more you earn!",
    "Did you know? High valence (positive mood) tracks are the #1 choice for uplifting commercials and promos."
  ];

  useEffect(() => {
    // Step progression
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Final step: rotate facts + complete after 10 seconds
    if (currentStep === steps.length - 1) {
      const factTimer = setInterval(() => {
        setDidYouKnowIndex((prev) => (prev + 1) % didYouKnowFacts.length);
      }, 7000); // change fact every 7 seconds

      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 28000); // allow 3–4 facts to show, then complete

      return () => {
        clearInterval(factTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [currentStep, onComplete]);

return (
  <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
    <div className="w-full max-w-2xl">
      <div className="relative bg-gray-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-12 text-center">

        {/* Bottom angled color layer - ONLY when "Did you know?" is visible */}
        {currentStep === steps.length - 1 && (
          <div 
            className="absolute inset-x-0 bottom-0 max-h-[25vh] h-3/7 bg-blue-900/40"
            style={{ clipPath: "polygon(0 0%, 100% 0%, 100% 100%, 0% 100%)" }}
          />
        )}

        <div className="relative z-10">
          {/* Song being analyzed */}
          <div className="mb-8 sm:mb-10">
            <p className="text-blue-300 text-sm mb-1">Currently analyzing:</p>
            <div className="flex justify-center items-center flex-wrap gap-2 px-2">
              <p className="text-white text-xl sm:text-2xl tracking-tight leading-tight font-bold">"{track.title}"</p>
              <span className="text-blue-400 text-xl sm:text-2xl">by {track.artist}</span>
            </div>
          </div>

          {/* Animated spinner + current step */}
          <div className="flex flex-col items-center gap-6 sm:gap-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 border-6 sm:border-8 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-blue-300 text-lg sm:text-2xl font-medium animate-pulse px-4">
              {steps[currentStep]}
            </p>
          </div>

          {/* "Did you know?" section */}
          {currentStep === steps.length - 1 && (
            <div className="mt-10 sm:mt-12 max-w-xl mx-auto animate-fadeIn font-[Poppins] px-4">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <span className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 hover:bg-amber-600/40 shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </span>
                <p className="text-blue-200 text-base sm:text-lg font-medium">Did you know?</p>
              </div>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                {didYouKnowFacts[didYouKnowIndex]}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default Loading;