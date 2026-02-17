import { useState, useMemo } from "react";

const ScoreBreakdown = ({ track, musicAtlasRaw, aiFeedback, onBack }) => {
  console.log("=== SCOREBREAKDOWN RECEIVED ===");
  console.log("Track:", track);
  console.log("MusicAtlas Raw:", musicAtlasRaw);
  console.log("AI Feedback:", aiFeedback);

  const [expandedCard, setExpandedCard] = useState(null);

  const { finalScore, breakdowns, matchedGenre } = useMemo(() => {
    if (!musicAtlasRaw) return { finalScore: 0, breakdowns: [], matchedGenre: null };

    const music = musicAtlasRaw.music_characteristics || {};
    const audio = musicAtlasRaw.audio_characteristics || {};
    const genres = musicAtlasRaw.genres || [];

    // ─────────────────────────────────────────
    // GENRE MATCHING
    // Scan all MusicAtlas genre tags and match
    // against known sync-relevant genres.
    // If nothing matches, a small penalty applies.
    // ─────────────────────────────────────────
    const genreMap = {
      "hip-hop":     ["hip-hop", "hip hop", "rap", "trap", "drill", "boom bap"],
      "rock":        ["rock", "alternative rock", "indie rock", "punk", "hard rock", "classic rock"],
      "indie":       ["indie", "indie pop", "indie folk", "lo-fi", "lo fi", "bedroom pop"],
      "pop":         ["pop", "synth-pop", "electropop", "dance pop", "teen pop"],
      "rnb":         ["r&b", "rnb", "soul", "neo-soul", "contemporary r&b"],
      "electronic":  ["electronic", "edm", "house", "techno", "ambient", "downtempo", "chillout"],
      "country":     ["country", "americana", "folk", "bluegrass"],
      "cinematic":   ["cinematic", "soundtrack", "orchestral", "score", "instrumental"],
    };

    let matchedGenre = null;
    const normalizedTags = genres.map(g => g.toLowerCase().trim());

    outer:
    for (const [genre, keywords] of Object.entries(genreMap)) {
      for (const tag of normalizedTags) {
        if (keywords.some(k => tag.includes(k))) {
          matchedGenre = genre;
          break outer;
        }
      }
    }

    // ─────────────────────────────────────────
    // 1. BPM SCORE
    // Curve-based scoring with genre-specific
    // ideal ranges. Closer to the genre sweet
    // spot = higher score. No hard brackets.
    // ─────────────────────────────────────────
    const bpm = Math.round(music.bpm || 0);

    // Ideal BPM ranges per genre [min, sweet-min, sweet-max, max]
    const bpmRanges = {
      "hip-hop":    [60,  80,  100, 115],
      "rock":       [100, 120, 150, 170],
      "indie":      [80,  100, 130, 150],
      "pop":        [90,  105, 130, 145],
      "rnb":        [55,  70,  100, 115],
      "electronic": [110, 120, 140, 160],
      "country":    [70,  90,  130, 150],
      "cinematic":  [40,  60,  100, 130],
    };

    // Default range when no genre matched
    const defaultRange = [70, 90, 140, 160];
    const [rMin, sMin, sMax, rMax] = matchedGenre
      ? bpmRanges[matchedGenre]
      : defaultRange;

    let bpmScore;
    if (bpm >= sMin && bpm <= sMax) {
      // In the sweet spot — score based on how centered it is
      const center = (sMin + sMax) / 2;
      const distFromCenter = Math.abs(bpm - center);
      const halfRange = (sMax - sMin) / 2;
      bpmScore = 99 - Math.round((distFromCenter / halfRange) * 10);
    } else if (bpm >= rMin && bpm <= rMax) {
      // Outside sweet spot but still acceptable
      bpmScore = 78 - Math.round(
        (Math.min(Math.abs(bpm - sMin), Math.abs(bpm - sMax)) / (rMax - rMin)) * 15
      );
    } else {
      // Outside acceptable range entirely
      const distOutside = Math.min(Math.abs(bpm - rMin), Math.abs(bpm - rMax));
      bpmScore = Math.max(52, 65 - Math.round(distOutside * 0.8));
    }

    // ─────────────────────────────────────────
    // 2. KEY & MODE SCORE
    // Mode matters more than key.
    // Key only adjusts score by ±2 points max.
    // Genre context determines whether minor
    // is penalized or celebrated.
    // ─────────────────────────────────────────
    const mode = (music.mode || "").toLowerCase();
    const key = (music.key || "").trim();

    // Which genres treat minor as equally valid or preferred
    const minorFriendlyGenres = ["hip-hop", "rnb", "rock", "indie", "cinematic", "electronic"];

    // Which genres lean strongly major
    const majorLeaningGenres = ["pop", "country"];

    let keyModeScore;

    if (mode === "major") {
      // Major is universally versatile — strong base score
      keyModeScore = 88;
    } else if (mode === "minor") {
      if (minorFriendlyGenres.includes(matchedGenre)) {
        // Minor is completely normal here — no penalty
        keyModeScore = 88;
      } else if (majorLeaningGenres.includes(matchedGenre)) {
        // Minor is less common but still valid — small contextual penalty
        keyModeScore = 82;
      } else {
        // No genre match — neutral treatment
        keyModeScore = 85;
      }
    } else {
      // Unknown mode — neutral
      keyModeScore = 80;
    }

    // Key commonality adjustment — ±2 points max
    // Common keys per genre (just the most frequently used in sync)
    const commonKeys = {
      "hip-hop":    ["C", "F", "G", "Bb", "Eb"],
      "rock":       ["E", "A", "D", "G", "C"],
      "indie":      ["C", "G", "D", "A", "E"],
      "pop":        ["C", "G", "A", "F", "D"],
      "rnb":        ["F", "Bb", "Eb", "Ab", "C"],
      "electronic": ["A", "C", "F", "G", "D"],
      "country":    ["G", "C", "D", "A", "E"],
      "cinematic":  ["C", "D", "G", "A", "E"],
    };

    if (matchedGenre && commonKeys[matchedGenre]) {
      const isCommonKey = commonKeys[matchedGenre].includes(key);
      keyModeScore += isCommonKey ? 2 : -2;
    }

    // ─────────────────────────────────────────
    // 3. VIBE SCORE
    // Intensity weighted against what's most
    // placeable in the matched genre.
    // No intensity is inherently better —
    // just more or less suited per genre.
    // ─────────────────────────────────────────
    const intensity = (audio.perceived_intensity || "medium").toLowerCase();

    // Ideal intensities per genre (in order of preference)
    const vibePreferences = {
      "hip-hop":    { "high": 95, "medium": 90, "low": 75, "very high": 85 },
      "rock":       { "high": 97, "very high": 92, "medium": 82, "low": 70 },
      "indie":      { "medium": 95, "low": 90, "high": 80, "very high": 70 },
      "pop":        { "medium": 95, "high": 90, "low": 78, "very high": 82 },
      "rnb":        { "low": 92, "medium": 95, "high": 78, "very high": 68 },
      "electronic": { "high": 95, "very high": 92, "medium": 85, "low": 72 },
      "country":    { "medium": 93, "low": 88, "high": 80, "very high": 70 },
      "cinematic":  { "low": 95, "medium": 92, "high": 80, "very high": 72 },
    };

    // Default when no genre matched
    const defaultVibe = { "medium": 88, "high": 85, "low": 78, "very high": 80 };

    const vibeLookup = matchedGenre ? vibePreferences[matchedGenre] : defaultVibe;
    const vibeScore = vibeLookup[intensity] ?? 78;

    // ─────────────────────────────────────────
    // 4. LENGTH SCORE
    // Curve toward the 2:30-3:00 sweet spot.
    // Scores taper off smoothly outside it.
    // ─────────────────────────────────────────
    const durationMs = track.duration_ms || 180000;
    const durationMin = durationMs / 60000;
    const durationSec = Math.floor((durationMs % 60000) / 1000);

    let lengthScore;
    if (durationMin >= 2.5 && durationMin <= 3.0) {
      // Perfect sweet spot
      lengthScore = 99;
    } else if (durationMin >= 2.0 && durationMin <= 3.5) {
      // Very good — taper from sweet spot edges
      const distFromSweet = Math.min(
        Math.abs(durationMin - 2.5),
        Math.abs(durationMin - 3.0)
      );
      lengthScore = 99 - Math.round(distFromSweet * 16);
    } else if (durationMin >= 1.5 && durationMin <= 4.0) {
      // Acceptable — steeper taper
      const distFromGood = Math.min(
        Math.abs(durationMin - 2.0),
        Math.abs(durationMin - 3.5)
      );
      lengthScore = 88 - Math.round(distFromGood * 20);
    } else if (durationMin >= 1.0 && durationMin <= 5.0) {
      lengthScore = 70;
    } else {
      lengthScore = 55;
    }

    // ─────────────────────────────────────────
    // FINAL SCORE
    // Equal weight across all 4 categories.
    // 3 point penalty if no genre was matched.
    // Capped between 51-99.
    // ─────────────────────────────────────────
    const genrePenalty = matchedGenre ? 0 : 3;
    const rawFinalScore = Math.round(
      (bpmScore + keyModeScore + vibeScore + lengthScore) / 4
    ) - genrePenalty;

    const finalScore = Math.min(99, Math.max(51, rawFinalScore));

    const displayScore = (score) => {
      if (score >= 100) return 99;
      if (score <= 50) return 51;
      return Math.min(99, Math.max(51, score));
    };

    // ─────────────────────────────────────────
    // BREAKDOWN EXPLANATIONS
    // Genre-aware, mode-respectful, educational
    // ─────────────────────────────────────────
    const bpmExplanation = (() => {
      if (bpm >= sMin && bpm <= sMax) {
        return matchedGenre
          ? `Sits in the ideal ${matchedGenre} tempo range for sync`
          : "Sits in a versatile tempo range for sync placements";
      } else if (bpm >= rMin && bpm <= rMax) {
        return "Slightly outside the typical sweet spot but still placeable";
      }
      return "Tempo may limit placement opportunities in this genre";
    })();

    const keyExplanation = (() => {
      const modeLabel = mode === "major" ? "Major" : mode === "minor" ? "Minor" : mode;
      if (mode === "minor" && minorFriendlyGenres.includes(matchedGenre)) {
        return `${modeLabel} tonality adds depth — common and valued in ${matchedGenre}`;
      } else if (mode === "minor" && majorLeaningGenres.includes(matchedGenre)) {
        return `${modeLabel} tonality brings emotional depth and uniqueness to this ${matchedGenre} track`;
      } else if (mode === "major") {
        return `${modeLabel} tonality offers broad versatility across placement types`;
      }
      return `${modeLabel} key — unique tonal quality for sync placements`;
    })();

    const vibeExplanation = (() => {
      const vibeMap = {
        "low":       "Subtle energy — dialogue-safe and ideal for underscore",
        "medium":    "Balanced energy — versatile across most placement types",
        "high":      "Strong energy — drives momentum and high-impact scenes",
        "very high": "Maximum energy — built for trailers and climactic moments",
      };
      return vibeMap[intensity] || "Versatile energy level for sync placements";
    })();

    const lengthExplanation = (() => {
      if (durationMin >= 2.5 && durationMin <= 3.0) return "Perfect length — minimal editing needed for most placements";
      if (durationMin >= 2.0 && durationMin <= 3.5) return "Strong length for sync — works across most placement types";
      if (durationMin < 2.0) return "Short run time — great for promos and quick cuts";
      if (durationMin > 3.5 && durationMin <= 4.0) return "Slightly long — an edit could open up commercial placements";
      return "Extended length — best suited for film and long-form content";
    })();

    const breakdowns = [
      {
        category: "BPM Range",
        score: bpmScore,
        displayScore: displayScore(bpmScore),
        value: `${bpm} BPM`,
        explanation: bpmExplanation,
        aiFeedbackKey: "bpmRange"
      },
      {
        category: "Key & Mode",
        score: keyModeScore,
        displayScore: displayScore(keyModeScore),
        value: `${music.key || "Unknown"} ${music.mode || ""}`.trim(),
        explanation: keyExplanation,
        aiFeedbackKey: "keyMode"
      },
      {
        category: "Vibe",
        score: vibeScore,
        displayScore: displayScore(vibeScore),
        value: intensity.charAt(0).toUpperCase() + intensity.slice(1),
        explanation: vibeExplanation,
        aiFeedbackKey: "vibe"
      },
      {
        category: "Length",
        score: lengthScore,
        displayScore: displayScore(lengthScore),
        value: `${Math.floor(durationMin)}:${durationSec.toString().padStart(2, '0')}`,
        explanation: lengthExplanation,
        aiFeedbackKey: "length"
      }
    ];

    return { finalScore, breakdowns, matchedGenre };
  }, [musicAtlasRaw]);

  // Pull genre + popularity for dynamic paragraph
  const primaryGenre = matchedGenre || musicAtlasRaw?.genres?.[0] || null;
  const popularity = track?.popularity ?? null;

  const popularityLabel = popularity !== null
    ? popularity >= 75 ? "highly popular"
    : popularity >= 50 ? "moderately popular"
    : popularity >= 25 ? "emerging"
    : "under-the-radar"
    : null;

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
    <div className="min-h-screen bg-white flex items-center justify-center px-2 py-6 sm:py-8">
      <div className="">
      <div className="w-full max-w-5xl">
        {/* Main Score Card */}
        <div className="bg-gray-800/95 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 mb-4 sm:mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-300 text-sm sm:text-lg mb-1 font-semibold">Sync Readiness Score for</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 tracking-tight leading-tight">"{track.title}"</h2>
            <p className="text-blue-300 text-base sm:text-lg mb-2">by {track.artist}</p>
            {aiFeedback && (
              <p className="text-xs sm:text-sm text-gray-400 italic">Analyzed by music supervisor AI</p>
            )}

            {/* Big Score Display */}
            <div className="text-center mb-6 sm:mb-8 mt-4 sm:mt-6">
              <div className="text-6xl sm:text-7xl lg:text-8xl font-black text-white">{finalScore}</div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-300">/ 100</div>
              <p className="text-blue-200 text-lg sm:text-xl font-medium mt-3 sm:mt-4">
                {finalScore >= 90 ? "Excellent" : finalScore >= 75 ? "Strong" : finalScore >= 60 ? "Good" : "Needs Work"}
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown Cards */}
        <div className="mb-4 sm:mb-6">

          {/* Mobile/Tablet: Stacked */}
          <div className="md:hidden grid grid-cols-1 gap-3 sm:gap-4">
            {breakdowns.map((item, index) => {
              const feedback = aiFeedback?.[item.aiFeedbackKey];
              const isExpanded = expandedCard === index;

              return (
                <div key={index} className="bg-gray-800/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-blue-700/30 overflow-hidden hover:border-blue-500/50 transition-all">
                  <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">{item.category}</h3>
                        <p className="text-blue-400 text-xs sm:text-sm font-medium">{item.value}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl sm:text-3xl font-black text-white">{item.displayScore}</div>
                        <div className="text-xs sm:text-sm text-blue-300">/100</div>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${item.displayScore}%` }}
                      />
                    </div>

                    {feedback ? (
                      <div>
                        <p className="text-gray-300 text-xs sm:text-sm font-medium mb-2">{feedback.short}</p>
                        {isExpanded && (
                          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 animate-fadeIn">
                            <div className="bg-blue-900/30 rounded-lg p-3 sm:p-4 border border-blue-500/20">
                              <p className="text-xs font-semibold text-blue-400 mb-1">Scene Perspective:</p>
                              <p className="text-xs sm:text-sm text-gray-300">{feedback.why}</p>
                            </div>
                            <div className="bg-green-900/30 rounded-lg p-3 sm:p-4 border border-green-500/20">
                              <p className="text-xs font-semibold text-green-400 mb-1">Production Notes:</p>
                              <p className="text-xs sm:text-sm text-gray-300">{feedback.improve}</p>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => setExpandedCard(isExpanded ? null : index)}
                          className="mt-2 sm:mt-3 text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium flex items-center gap-1 transition"
                        >
                          {isExpanded ? (
                            <>Show less <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></>
                          ) : (
                            <>Learn more <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-400 text-xs sm:text-sm">{item.explanation}</p>
                        {!aiFeedback && <p className="text-gray-500 text-xs mt-2 italic">Loading AI insights...</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Horizontal Scroller */}
          <div className="hidden md:block overflow-x-scroll snap-x snap-mandatory scrollbar-hide">
            <div className="flex gap-4 pb-2">
              {breakdowns.map((item, index) => {
                const feedback = aiFeedback?.[item.aiFeedbackKey];
                const isExpanded = expandedCard === index;

                return (
                  <div key={index} className="snap-center shrink-0 w-[45%] bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-sm border border-blue-700/30 overflow-hidden hover:border-blue-500/50 transition-all self-start">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-20">
                        <div>
                          <h3 className="text-2xl font-semibold text-white">{item.category}</h3>
                          <p className="text-blue-400 text-xs sm:text-sm font-medium">{item.value}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl sm:text-3xl font-black text-white">{item.displayScore}</div>
                          <div className="text-xs sm:text-sm text-blue-300">/100</div>
                        </div>
                      </div>

                      <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${item.displayScore}%` }}
                        />
                      </div>

                      {feedback ? (
                        <div>
                          <p className="text-gray-300 text-xs sm:text-sm font-medium mb-2">{feedback.short}</p>
                          {isExpanded && (
                            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 animate-fadeIn">
                              <div className="bg-blue-900/30 rounded-lg p-3 sm:p-4 border border-blue-500/20">
                                <p className="text-xs font-semibold text-blue-400 mb-1">Scene Perspective:</p>
                                <p className="text-xs sm:text-sm text-gray-300">{feedback.why}</p>
                              </div>
                              <div className="bg-green-900/30 rounded-lg p-3 sm:p-4 border border-green-500/20">
                                <p className="text-xs font-semibold text-green-400 mb-1">Production Notes:</p>
                                <p className="text-xs sm:text-sm text-gray-300">{feedback.improve}</p>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => setExpandedCard(isExpanded ? null : index)}
                            className="mt-2 sm:mt-3 text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium flex items-center gap-1 transition"
                          >
                            {isExpanded ? (
                              <>Show less <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></>
                            ) : (
                              <>Learn more <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-400 text-xs sm:text-sm">{item.explanation}</p>
                          {!aiFeedback && <p className="text-gray-500 text-xs mt-2 italic">Loading AI insights...</p>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Next Steps Section */}
        <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 mb-4 sm:mb-6 border border-blue-500/30">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            How to Generate More Revenue from Your Songs?
          </h3>

          <div className="prose prose-blue max-w-none mb-4 sm:mb-6">
            {(primaryGenre || popularity !== null) && (
              <p className="text-blue-200 text-sm sm:text-base leading-relaxed mb-3 pb-3 border-b border-blue-500/20">
                {primaryGenre && popularity !== null ? (
                  <>Your track is a <strong className="text-white">{primaryGenre}</strong> song with a Spotify popularity score of <strong className="text-blue-300">{popularity}/100</strong> — a <strong className="text-white">{popularityLabel}</strong> track in a genre that supervisors are actively searching for.</>
                ) : primaryGenre ? (
                  <>Your track sits in the <strong className="text-white">{primaryGenre}</strong> space — a genre that sync supervisors are actively searching for.</>
                ) : (
                  <>Your track has a Spotify popularity score of <strong className="text-blue-300">{popularity}/100</strong>, marking it as a <strong className="text-white">{popularityLabel}</strong> track with real sync potential.</>
                )}
              </p>
            )}

            <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
              <strong className="text-white">Sync licensing</strong> is how your music gets placed in TV shows, films, commercials, trailers, and video games—earning you upfront fees ranging from <strong className="text-blue-300">$500 for indie productions to $150,000+ for major campaigns</strong>. Unlike streaming pennies, a single sync placement can generate serious income while exposing your music to millions of viewers. <strong className="text-white">SyncRep</strong> puts your tracks directly in front of music supervisors through a searchable platform built specifically for sync discovery, positioning you where the money is: in the catalogs supervisors browse every single day.
            </p>
          </div>

          <div className="my-4 sm:my-6 flex items-center">
            <div className="grow border-t border-blue-400/30"></div>
            <span className="px-3 sm:px-4 text-blue-300 font-semibold text-xs sm:text-sm whitespace-nowrap">READY TO GET DISCOVERED?</span>
            <div className="grow border-t border-blue-400/30"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-center p-3 sm:p-4 bg-black/40 rounded-xl shadow-lg border border-blue-500/20 w-2/3 sm:w-full relative left-1/6 sm:left-0">
              <h2 className="text-xl sm:text-2xl font-black text-blue-400">$500-$150K</h2>
              <p className="text-xs text-gray-400 mt-1">Per Placement</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-black/40 rounded-xl shadow-lg border border-blue-500/20 w-2/3 sm:w-full relative left-1/6 sm:left-0">
              <h2 className="text-xl sm:text-2xl font-black text-blue-400">1000s</h2>
              <p className="text-xs text-gray-400 mt-1">Active Supervisors</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-black/40 rounded-xl shadow-lg border border-blue-500/20 w-2/3 sm:w-full relative left-1/6 sm:left-0">
              <h2 className="text-xl sm:text-2xl font-black text-blue-400">24/7</h2>
              <p className="text-xs text-gray-400 mt-1">Searchable Catalog</p>
            </div>
          </div>

          <div className="text-center mb-3 sm:mb-4">
            <a
              href="https://musicatlas.ai/syncrep/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 hover:bg-blue-500 hover:scale-105 text-white font-bold py-3 px-6 sm:py-4 sm:px-10 rounded-full text-sm sm:text-base lg:text-lg shadow-2xl transition-all duration-300"
            >
              Get in Front of Music Supervisors → Join SyncRep
            </a>
          </div>

          <div className="text-center">
            <button
              onClick={onBack}
              className="text-blue-300 hover:text-blue-200 text-base sm:text-lg font-medium transition"
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