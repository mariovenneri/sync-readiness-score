import { useState, useMemo } from "react";

const ScoreBreakdown = ({ track, musicAtlasRaw, aiFeedback, onBack }) => {
  console.log("=== SCOREBREAKDOWN RECEIVED ===");
  console.log("Track:", track);
  console.log("MusicAtlas Raw:", musicAtlasRaw);
  console.log("AI Feedback:", aiFeedback);

  const [expandedCard, setExpandedCard] = useState(null);

  // Calculate scores from real MusicAtlas data
  const { finalScore, breakdowns } = useMemo(() => {
    if (!musicAtlasRaw) {
      return { finalScore: 0, breakdowns: [] };
    }

    const music = musicAtlasRaw.music_characteristics || {};
    const audio = musicAtlasRaw.audio_characteristics || {};
    const genres = musicAtlasRaw.genres || [];
    const influences = musicAtlasRaw.possible_influences || [];

    // 1. BPM Score (ideal: 90-140 BPM)
    const bpm = Math.round(music.bpm || 0);
    let bpmScore = 0;
    if (bpm >= 90 && bpm <= 140) {
      bpmScore = 99;
    } else if (bpm >= 80 && bpm <= 150) {
      bpmScore = 85;
    } else if (bpm >= 70 && bpm <= 160) {
      bpmScore = 70;
    } else {
      bpmScore = 55;
    }

    // 2. Key & Mode Score (Major = more versatile)
    const mode = music.mode || "";
    const keyScore = mode.toLowerCase() === "major" ? 90 : 75;

    // 3. Vibe Score (using perceived_intensity)
    const intensityMap = {
      "low": 70,      // Subtle vibe
      "medium": 85,   // Moderate vibe
      "high": 95,     // Strong vibe
      "very high": 90 // Intense vibe
    };
    const intensity = audio.perceived_intensity || "medium";
    const vibeScore = intensityMap[intensity.toLowerCase()] || 75;

    // 4. Length Score (ideal: 2-3.5 minutes for sync) - Use Spotify duration
    const durationMs = track.duration_ms || 180000;
    const durationMin = durationMs / 60000;
    const durationSec = Math.floor((durationMs % 60000) / 1000);
    let lengthScore = 0;
    if (durationMin >= 2 && durationMin <= 3.5) {
      lengthScore = 98;
    } else if (durationMin >= 1.5 && durationMin <= 4) {
      lengthScore = 85;
    } else if (durationMin >= 1 && durationMin <= 5) {
      lengthScore = 70;
    } else {
      lengthScore = 55;
    }

    // 5. Genre Versatility Score - REMOVED (only using music & audio characteristics)

    // Calculate final score (equal weights) with only 4 categories and cap at 99
    const rawFinalScore = Math.round(
      (bpmScore + keyScore + vibeScore + lengthScore) / 4
    );
    const finalScore = Math.min(99, Math.max(51, rawFinalScore));

    // Helper function to display scores (round 100 down, 50 up)
    const displayScore = (score) => {
      if (score >= 100) return 99;
      if (score <= 50) return 51;
      return score;
    };

    const breakdowns = [
      {
        category: "BPM Range",
        score: bpmScore,
        displayScore: displayScore(bpmScore),
        value: `${bpm} BPM`,
        explanation: bpm >= 90 && bpm <= 140 
          ? "Ideal tempo for most sync placements"
          : "Tempo may limit certain placement types",
        aiFeedbackKey: "bpmRange"
      },
      {
        category: "Key & Mode",
        score: keyScore,
        displayScore: displayScore(keyScore),
        value: `${music.key || "Unknown"} ${mode}`,
        explanation: mode.toLowerCase() === "major"
          ? "Major keys work well across genres"
          : "Minor keys great for dramatic scenes",
        aiFeedbackKey: "keyMode"
      },
      {
        category: "Vibe",
        score: vibeScore,
        displayScore: displayScore(vibeScore),
        value: intensity.charAt(0).toUpperCase() + intensity.slice(1),
        explanation: intensity.toLowerCase() === "high"
          ? "High energy, great for upbeat scenes"
          : intensity.toLowerCase() === "medium"
            ? "Moderate energy, versatile for various moods"
            : "Lower energy, works well for ambient scenes",
        aiFeedbackKey: "vibe"
      },
      {
        category: "Length",
        score: lengthScore,
        displayScore: displayScore(lengthScore),
        value: `${Math.floor(durationMin)}:${durationSec.toString().padStart(2, '0')}`,
        explanation: durationMin >= 2 && durationMin <= 3.5
          ? "Perfect length for sync licensing"
          : durationMin < 2 
            ? "May be too short for some placements"
            : "May need editing for most placements",
        aiFeedbackKey: "length"
      }
    ];

    return { finalScore, breakdowns };
  }, [musicAtlasRaw]);

  if (!musicAtlasRaw) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-blue-300 text-lg">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl">
        {/* Main Score Card */}
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-10 mb-6 relative overflow-hidden">
          {/* Bottom angled color layer - matching Loading component */}
          <div 
            className="absolute inset-x-0 bottom-0 h-1/3 bg-blue-900/40"
            style={{ clipPath: "polygon(0 0%, 100% 0%, 100% 100%, 0% 100%)" }}
          />
          
          <div className="relative z-10">
          <div className="relative z-10">
          <p className="text-blue-300 text-lg mb-1 font-semibold">Sync Readiness Score for</p>
          <h2 className="text-5xl font-bold text-white mb-1 tracking-tight leading-tight">"{track.title}"</h2>
          <p className="text-blue-300 text-lg mb-2">by {track.artist}</p>
          {aiFeedback && (
            <p className="text-sm text-gray-400 italic">Analyzed by music supervisor AI</p>
          )}

          {/* Big Score Display */}
          <div className="text-center mb-8 mt-6">
            <div className="text-8xl font-black text-white">{finalScore}</div>
            <div className="text-3xl font-bold text-blue-300">/ 100</div>
            <p className="text-blue-200 text-xl font-medium mt-4">
              {finalScore >= 90 ? "Excellent" : finalScore >= 75 ? "Strong" : finalScore >= 60 ? "Good" : "Needs Work"}
            </p>
          </div>
          </div>
        </div>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {breakdowns.map((item, index) => {
            const feedback = aiFeedback?.[item.aiFeedbackKey];
            const isExpanded = expandedCard === index;
            
            return (
              <div key={index} className="bg-black/70 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-700/30 overflow-hidden hover:border-blue-500/50 transition-all">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.category}</h3>
                      <p className="text-blue-400 text-sm font-medium">{item.value}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-white">{item.displayScore}</div>
                      <div className="text-sm text-blue-300">/100</div>
                    </div>
                  </div>
                  
                  <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${item.displayScore}%` }}
                    />
                  </div>

                  {/* AI Feedback or Default Explanation */}
                  {feedback ? (
                    <div>
                      <p className="text-gray-300 text-sm font-medium mb-2">
                        {feedback.short}
                      </p>
                      
                      {isExpanded && (
                        <div className="mt-4 space-y-3 animate-fadeIn">
                          <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/20">
                            <p className="text-xs font-semibold text-blue-400 mb-1">Scene Perspective:</p>
                            <p className="text-sm text-gray-300">{feedback.why}</p>
                          </div>
                          <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/20">
                            <p className="text-xs font-semibold text-green-400 mb-1">Production Notes:</p>
                            <p className="text-sm text-gray-300">{feedback.improve}</p>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedCard(isExpanded ? null : index)}
                        className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition"
                      >
                        {isExpanded ? (
                          <>
                            Show less
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            Learn more
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-400 text-sm">{item.explanation}</p>
                      {!aiFeedback && (
                        <p className="text-gray-500 text-xs mt-2 italic">Loading AI insights...</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Steps Section */}
        <div className="bg-linear-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-6 border border-blue-500/30">
          <h3 className="text-2xl font-bold text-white mb-4">
            💰 How to Generate More Revenue from Your Songs
          </h3>
          
          <div className="prose prose-blue max-w-none mb-6">
            <p className="text-gray-200 text-lg leading-relaxed">
              <strong className="text-white">Sync licensing</strong> is how your music gets placed in TV shows, films, commercials, trailers, and video games—earning you upfront fees ranging from <strong className="text-blue-300">$500 for indie productions to $150,000+ for major campaigns</strong>. Unlike streaming pennies, a single sync placement can generate serious income while exposing your music to millions of viewers. <strong className="text-white">SyncRep</strong> puts your tracks directly in front of music supervisors through a searchable platform built specifically for sync discovery, positioning you where the money is: in the catalogs supervisors browse every single day.
            </p>
          </div>

          {/* Visual separator */}
          <div className="my-6 flex items-center">
            <div className="grow border-t border-blue-400/30"></div>
            <span className="px-4 text-blue-300 font-semibold text-sm">READY TO GET DISCOVERED?</span>
            <div className="grow border-t border-blue-400/30"></div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-black/40 rounded-xl shadow-lg border border-blue-500/20">
              <div className="text-2xl font-black text-blue-400">$500-$150K</div>
              <div className="text-xs text-gray-400 mt-1">Per Placement</div>
            </div>
            <div className="text-center p-4 bg-black/40 rounded-xl shadow-lg border border-blue-500/20">
              <div className="text-2xl font-black text-blue-400">1000s</div>
              <div className="text-xs text-gray-400 mt-1">Active Supervisors</div>
            </div>
            <div className="text-center p-4 bg-black/40 rounded-xl shadow-lg border border-blue-500/20">
              <div className="text-2xl font-black text-blue-400">24/7</div>
              <div className="text-xs text-gray-400 mt-1">Searchable Catalog</div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mb-4">
            <a
              href="https://musicatlas.ai/syncrep/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 hover:bg-blue-500 hover:scale-105 text-white font-bold py-4 px-10 rounded-full text-lg shadow-2xl transition-all duration-300"
            >
              Get in Front of Music Supervisors → Join SyncRep
            </a>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={onBack}
              className="text-blue-300 hover:text-blue-200 text-lg font-medium transition"
            >
              ← Analyze Another Track
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ScoreBreakdown;