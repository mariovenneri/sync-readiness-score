import { useState, useMemo } from "react";

const ScoreBreakdown = ({ track, musicAtlasRaw, onBack }) => {
  console.log("=== SCOREBREAKDOWN RECEIVED ===");
  console.log("Track:", track);
  console.log("MusicAtlas Raw:", musicAtlasRaw);

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
    const bpm = music.bpm || 0;
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

    // 3. Perceived Intensity Score (0-1 scale, medium range = most versatile)
    const intensityMap = {
      "low": 75,      // 0.1-0.3 - Good for dialogue/underscore
      "medium": 95,   // 0.4-0.6 - Most versatile
      "high": 85,     // 0.7-0.9 - Good for action/sports
      "very high": 70 // 0.85+ - Limited use (trailers only)
    };
    const intensity = audio.perceived_intensity || "medium";
    const intensityScore = intensityMap[intensity.toLowerCase()] || 75;

    // 4. Length Score (ideal: 2-3.5 minutes for sync)
    const durationMs = audio.duration_ms || 180000;
    const durationMin = durationMs / 60000;
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

    // 5. Genre Versatility Score (more genres = more opportunities)
    const totalGenreTags = genres.length + influences.length;
    let genreScore = 0;
    if (totalGenreTags >= 5) {
      genreScore = 97;
    } else if (totalGenreTags >= 3) {
      genreScore = 85;
    } else if (totalGenreTags >= 1) {
      genreScore = 70;
    } else {
      genreScore = 55;
    }

    // Calculate final score (equal weights) and cap at 99
    const rawFinalScore = Math.round(
      (bpmScore + keyScore + intensityScore + lengthScore + genreScore) / 5
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
          : "Tempo may limit certain placement types"
      },
      {
        category: "Key & Mode",
        score: keyScore,
        displayScore: displayScore(keyScore),
        value: `${music.key || "Unknown"} ${mode}`,
        explanation: mode.toLowerCase() === "major"
          ? "Major keys work well across genres"
          : "Minor keys great for dramatic scenes"
      },
      {
        category: "Perceived Intensity",
        score: intensityScore,
        displayScore: displayScore(intensityScore),
        value: intensity.charAt(0).toUpperCase() + intensity.slice(1),
        explanation: intensity.toLowerCase() === "medium"
          ? "Versatile energy level for various scenes"
          : `${intensity.charAt(0).toUpperCase() + intensity.slice(1)} intensity works best for specific scene types`
      },
      {
        category: "Length",
        score: lengthScore,
        displayScore: displayScore(lengthScore),
        value: `${durationMin.toFixed(1)} min`,
        explanation: durationMin >= 2 && durationMin <= 3.5
          ? "Perfect length for sync licensing"
          : durationMin < 2 
            ? "May be too short for some placements"
            : "May need editing for most placements"
      },
      {
        category: "Genre Versatility",
        score: genreScore,
        displayScore: displayScore(genreScore),
        value: `${totalGenreTags} tags`,
        explanation: totalGenreTags >= 3
          ? "Strong cross-genre appeal"
          : "Consider expanding sound palette"
      }
    ];

    return { finalScore, breakdowns };
  }, [musicAtlasRaw]);

  if (!musicAtlasRaw) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center">
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl">
        {/* Main Score Card */}
        <div className="bg-white rounded-xl shadow-xl p-10 mb-6">
          <p className="text-blue-600 text-lg mb-1 font-semibold">Sync Readiness Score for</p>
          <h2 className="text-5xl font-bold text-gray-900 mb-1">"{track.title}"</h2>
          <p className="text-gray-600 text-lg mb-8">by {track.artist}</p>

          {/* Big Score Display */}
          <div className="text-center mb-8">
            <div className="text-8xl font-black text-gray-900">{finalScore}</div>
            <div className="text-3xl font-bold text-gray-600">/ 100</div>
            <p className="text-gray-600 text-xl font-medium mt-4">
              {finalScore >= 90 ? "Excellent" : finalScore >= 75 ? "Strong" : finalScore >= 60 ? "Good" : "Needs Work"}
            </p>
          </div>
        </div>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {breakdowns.map((item, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.category}</h3>
                  <p className="text-blue-600 text-sm font-medium">{item.value}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-gray-900">{item.displayScore}</div>
                  <div className="text-sm text-gray-500">/100</div>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${item.displayScore}%` }}
                />
              </div>
              <p className="text-gray-600 text-sm">{item.explanation}</p>
            </div>
          ))}
        </div>

        {/* Debug Data (temporary) */}
        <div className="bg-gray-100 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2">MusicAtlas Data (Debug):</h3>
          <pre className="bg-white p-4 rounded text-xs overflow-auto max-h-64">
            {JSON.stringify(musicAtlasRaw, null, 2)}
          </pre>
        </div>

        {/* CTA */}
        <div className="text-center mb-4">
          <a
            href="https://musicatlas.ai/syncrep/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg transition"
          >
            Get in Front of Music Supervisors → Join SyncRep
          </a>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 text-lg font-medium transition"
          >
            ← Analyze Another Track
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreBreakdown;