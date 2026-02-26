// Components/Loading.jsx
import { useState, useEffect } from "react";

const Loading = ({ track, dataReady = false, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasLooped, setHasLooped] = useState(false);

  const [shuffledFacts] = useState(() => {
    // Fisher-Yates shuffle algorithm
    const facts = [
      // Money facts from Rate Guide
      "Did you know? Network TV commercials pay $5,000-$30,000 per placement depending on market size and campaign scope.",
      "Did you know? Cable TV spots typically range from $2,000-$15,000, with premium networks paying higher rates.",
      "Did you know? Streaming platform placements (Netflix, Hulu, Amazon) can earn $1,500-$10,000 per episode use.",
      "Did you know? Feature film trailers often pay $15,000-$50,000+ for a single song placement.",
      "Did you know? Major brand campaigns can reach $50,000-$150,000 for exclusive music usage.",
      "Did you know? Video game placements range from $2,500-$25,000 depending on game budget and prominence.",
      "Did you know? Corporate/industrial videos pay $500-$5,000 per project for licensed music.",
      "Did you know? Independent films typically budget $500-$5,000 per song, while studio films can pay significantly more.",
      "Did you know? Reality TV shows use massive amounts of music and typically pay $1,000-$5,000 per placement.",
      "Did you know? Podcast and YouTube creators are increasingly licensing music, with rates from $100-$2,000 per use.",
      
      // Sync placement facts from main SyncRep page
      "Did you know? Music supervisors receive 100+ track submissions per day — strategic positioning is essential.",
      "Did you know? Having instrumental versions doubles your placement opportunities since they don't require vocal clearance.",
      "Did you know? Tracks between 2:30-3:00 are most versatile, working for both commercials and long-form content.",
      "Did you know? Clean stems (isolated vocals, drums, etc.) make your track easier to edit and more placeable.",
      "Did you know? Supervisors often search by mood and energy first, then filter by tempo and key.",
      "Did you know? Simple splits and available rights make tracks perform better in the placement process.",
      "Did you know? A single Netflix placement can lead to multiple opportunities as supervisors share discoveries.",
      "Did you know? Luxury brand commercials favor slower tempos (60-90 BPM) and sophisticated production.",
      "Did you know? Most sync deals include both a sync fee (one-time) and performance royalties (ongoing).",
      "Did you know? Music supervisors actively seek fresh, unique sounds through searchable databases like SyncRep."
    ];
    
    // Shuffle the array
    for (let i = facts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [facts[i], facts[j]] = [facts[j], facts[i]];
    }
    
    return facts;
  });

  const steps = [
    "Analyzing mood and energy...",
    "Detecting key and mode...",
    "Measuring BPM & rhythm...",
    "Evaluating length & structure...",
    "Generating supervisor insights..."
  ];

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (currentStep === steps.length) {
      // First fact shown after steps complete
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 4000);
      return () => clearTimeout(timer);
    } else if (currentStep < steps.length + shuffledFacts.length) {
      // Cycling through facts
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        
        // Check if we should transition after this fact
        const currentFactIndex = currentStep + 1 - steps.length;
        if (currentFactIndex >= 3 && dataReady) {
          onComplete();
        }
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      // All facts shown once — mark as looped
      if (!hasLooped) {
        setHasLooped(true);
      }
      // Keep showing the persistent message
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete, hasLooped, dataReady, steps.length, shuffledFacts.length]);

  const currentStepText = currentStep < steps.length 
    ? steps[currentStep]
    : null;

  const currentFact = currentStep >= steps.length && currentStep < steps.length + shuffledFacts.length
    ? shuffledFacts[currentStep - steps.length]
    : null;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      
      {/* Track Info Card */}
      <div className="relative z-10 w-full max-w-2xl text-center">
        <div className="bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-12 border border-blue-500/20">
          
          {/* Album Art */}
          {track.artwork && (
            <div className="mb-6 sm:mb-8 flex justify-center">
              <img 
                src={track.artwork} 
                alt={track.title}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl shadow-2xl"
              />
            </div>
          )}

          {/* Track Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
            "{track.title}"
          </h2>
          <p className="text-blue-300 text-base sm:text-lg mb-6 sm:mb-8 tracking-tight">
            by {track.artist}
          </p>

          {/* Loading Spinner */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-blue-500/30 rounded-full"></div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
          </div>

          {/* Current Step or Persistent Message */}
          {!hasLooped && currentStepText && (
            <p className="text-lg sm:text-2xl text-blue-200 font-medium mb-8 sm:mb-10 animate-pulse">
              {currentStepText}
            </p>
          )}

          {hasLooped && (
            <p className="text-lg sm:text-2xl text-blue-200 font-medium mb-8 sm:mb-10">
              Deep audio analysis in progress...
            </p>
          )}

          
              
                
          {/* "Did you know?" Fact - Only show if we have one and haven't looped */}
          {!hasLooped && currentFact && (
            <>
              {/* Blue overlay layer at bottom - only when showing facts */}
              <div 
                className="absolute inset-x-0 bottom-0 h-1/4 bg-blue-900/40 rounded-b-3xl -z-10"
              />
              
              <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-blue-500/30 flex gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 hover:bg-amber-600/40 shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </span>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  {currentFact}
                </p>
              </div>
            </>
          )}

          {/* Persistent message after loop */}
          {hasLooped && (
            <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-blue-500/30">
              <p className="text-gray-400 text-sm sm:text-base italic">
                MusicAtlas is conducting comprehensive audio analysis. This ensures your score reflects real sync placement potential.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-2.5 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;