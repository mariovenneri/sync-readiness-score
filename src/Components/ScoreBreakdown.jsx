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

    const genreMap = {
      "hip-hop":     ["hip-hop", "hip hop", "rap", "trap", "drill", "boom bap"],
      "rock":        ["rock", "alternative rock", "indie rock", "punk", "hard rock", "classic rock"],
      "folk":        ["folk rock", "folk", "singer-songwriter", "acoustic"],
      "indie":       ["indie", "indie pop", "indie folk", "lo-fi", "lo fi", "bedroom pop"],
      "pop":         ["pop", "synth-pop", "electropop", "dance pop", "teen pop"],
      "rnb":         ["r&b", "rnb", "soul", "neo-soul", "contemporary r&b"],
      "electronic":  ["electronic", "edm", "house", "techno", "ambient", "downtempo", "chillout"],
      "country":     ["country", "americana", "bluegrass"],
      "cinematic":   ["cinematic", "soundtrack", "orchestral", "score", "instrumental"],
    };

    let matchedGenre = null;
    const normalizedTags = genres.map(g => g.toLowerCase().trim());

    // Match using exact phrase matching to avoid "folk rock" matching "rock"
    outer:
    for (const [genre, keywords] of Object.entries(genreMap)) {
      for (const tag of normalizedTags) {
        // Check if tag exactly matches any keyword
        if (keywords.includes(tag)) {
          matchedGenre = genre;
          break outer;
        }
      }
    }

    const bpm = Math.round(music.bpm || 0);

    const bpmRanges = {
      "hip-hop":    [60, 75, 105, 140],
      "rock":       [95, 115, 150, 175],
      "folk":       [65, 80, 130, 150],
      "indie":      [70, 95, 130, 155],
      "pop":        [90, 105, 130, 145],
      "rnb":        [55, 70, 100, 120],
      "electronic": [90, 115, 140, 180],
      "country":    [70, 90, 130, 150],
      "cinematic":  [40, 60, 100, 130],
    };

    const defaultRange = [70, 90, 140, 160];
    const [rMin, sMin, sMax, rMax] = matchedGenre
      ? bpmRanges[matchedGenre]
      : defaultRange;

    let bpmScore;
    if (bpm >= sMin && bpm <= sMax) {
      const center = (sMin + sMax) / 2;
      const distFromCenter = Math.abs(bpm - center);
      const halfRange = (sMax - sMin) / 2;
      bpmScore = 99 - Math.round((distFromCenter / halfRange) * 10);
    } else if (bpm >= rMin && bpm <= rMax) {
      bpmScore = 78 - Math.round(
        (Math.min(Math.abs(bpm - sMin), Math.abs(bpm - sMax)) / (rMax - rMin)) * 15
      );
    } else {
      const distOutside = Math.min(Math.abs(bpm - rMin), Math.abs(bpm - rMax));
      bpmScore = Math.max(52, 65 - Math.round(distOutside * 0.8));
    }

    const mode = (music.mode || "").toLowerCase();
    const key = (music.key || "").trim();

    const minorDominantGenres = ["hip-hop", "rnb", "cinematic", "electronic"];
    const neutralModeGenres = ["rock", "indie", "folk"];
    const majorLeaningGenres = ["pop", "country"];

    let keyModeScore;

    if (mode === "minor") {
      if (minorDominantGenres.includes(matchedGenre)) keyModeScore = 90;
      else if (neutralModeGenres.includes(matchedGenre)) keyModeScore = 88;
      else if (majorLeaningGenres.includes(matchedGenre)) keyModeScore = 84;
      else keyModeScore = 86;
    }
    else if (mode === "major") {
      if (majorLeaningGenres.includes(matchedGenre)) keyModeScore = 88;
      else if (neutralModeGenres.includes(matchedGenre)) keyModeScore = 88;
      else if (minorDominantGenres.includes(matchedGenre)) keyModeScore = 84;
      else keyModeScore = 86;
    }
    else {
      keyModeScore = 80;
    }

    const commonKeys = {
      "hip-hop":    ["C", "F", "G", "Bb", "Eb"],
      "rock":       ["E", "A", "D", "G", "C"],
      "folk":       ["G", "C", "D", "A", "E"],
      "indie":      ["C", "G", "D", "A", "E"],
      "pop":        ["C", "G", "A", "F", "D"],
      "rnb":        ["F", "Bb", "Eb", "Ab", "C"],
      "electronic": ["A", "C", "F", "G", "D"],
      "country":    ["G", "C", "D", "A", "E"],
      "cinematic":  ["C", "D", "G", "A", "E"],
    };

    const relativeMinors = {
      "C":"A","G":"E","D":"B","A":"F#","E":"C#",
      "F":"D","Bb":"G","Eb":"C","Ab":"F","Db":"Bb","Gb":"Eb"
    };

    if (matchedGenre && commonKeys[matchedGenre] && key) {
      const rel = relativeMinors[key];
      const isCommon =
        commonKeys[matchedGenre].includes(key) ||
        (rel && commonKeys[matchedGenre].includes(rel));

      keyModeScore += isCommon ? 2 : -2;
    }

    const intensity = (audio.perceived_intensity || "medium").toLowerCase();

    const vibePreferences = {
      "hip-hop":    { "high": 95, "medium": 90, "low": 75, "very high": 85 },
      "rock":       { "high": 97, "very high": 92, "medium": 82, "low": 70 },
      "folk":       { "medium": 93, "low": 92, "high": 78, "very high": 68 },
      "indie":      { "medium": 95, "low": 90, "high": 80, "very high": 70 },
      "pop":        { "medium": 95, "high": 90, "low": 78, "very high": 82 },
      "rnb":        { "low": 92, "medium": 95, "high": 78, "very high": 68 },
      "electronic": { "high": 95, "very high": 92, "medium": 85, "low": 72 },
      "country":    { "medium": 93, "low": 88, "high": 80, "very high": 70 },
      "cinematic":  { "low": 95, "medium": 92, "high": 80, "very high": 72 },
    };

    const defaultVibe = { "medium": 88, "high": 85, "low": 78, "very high": 80 };

    const vibeLookup = matchedGenre ? vibePreferences[matchedGenre] : defaultVibe;
    const vibeScore = vibeLookup[intensity] ?? 78;

    const durationMs = track.duration_ms || 180000;
    const durationMin = durationMs / 60000;
    const durationSec = Math.floor((durationMs % 60000) / 1000);

    let lengthScore;
    if (durationMin >= 2.5 && durationMin <= 3.0) {
      lengthScore = 99;
    } else if (durationMin >= 2.0 && durationMin <= 3.5) {
      const distFromSweet = Math.min(
        Math.abs(durationMin - 2.5),
        Math.abs(durationMin - 3.0)
      );
      lengthScore = 99 - Math.round(distFromSweet * 16);
    } else if (durationMin >= 1.5 && durationMin <= 4.0) {
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

    const minorFriendlyGenres = minorDominantGenres.concat(neutralModeGenres);

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
        aiFeedbackKey: "bpmRange",
        color: "#0EA5E9" // Blue
      },
      {
        category: "Key & Mode",
        score: keyModeScore,
        displayScore: displayScore(keyModeScore),
        value: `${music.key || "Unknown"} ${music.mode || ""}`.trim(),
        explanation: keyExplanation,
        aiFeedbackKey: "keyMode",
        color: "#A855F7" // Purple
      },
      {
        category: "Vibe",
        score: vibeScore,
        displayScore: displayScore(vibeScore),
        value: intensity.charAt(0).toUpperCase() + intensity.slice(1),
        explanation: vibeExplanation,
        aiFeedbackKey: "vibe",
        color: "#F59E0B" // Orange
      },
      {
        category: "Length",
        score: lengthScore,
        displayScore: displayScore(lengthScore),
        value: `${Math.floor(durationMin)}:${durationSec.toString().padStart(2, '0')}`,
        explanation: lengthExplanation,
        aiFeedbackKey: "length",
        color: "#14B8A6" // teal
      }
    ];

    return { finalScore, breakdowns, matchedGenre };
  }, [musicAtlasRaw]);

  const primaryGenre = matchedGenre || musicAtlasRaw?.genres?.[0] || null;
  const popularity = track?.popularity ?? null;

  const popularityLabel = popularity !== null
    ? popularity >= 75 ? "highly popular"
    : popularity >= 50 ? "moderately popular"
    : popularity >= 25 ? "emerging"
    : "under-the-radar"
    : null;

  // DAMAGE CONTROL — hide genre/popularity sentence if data is harsh or nonsensical
  const shouldShowGenrePopularity = (() => {
    const invalidGenreTags = [
      "not sure", "female vocalists", "male vocalists", "unknown",
      "female vocalist", "male vocalist", "instrumental", "singer-songwriter"
    ];
    
    if (primaryGenre && invalidGenreTags.includes(primaryGenre.toLowerCase().trim())) {
      return false;
    }
    
    if (popularity !== null && popularity <= 5) {
      return false;
    }
    
    return (primaryGenre && !invalidGenreTags.includes(primaryGenre.toLowerCase().trim())) 
           || (popularity !== null && popularity > 5);
  })();

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
    <main className="min-h-screen bg-linear-to-tl from-gray-950 from-15% via-black via-50% to-gray-950 to-85% relative overflow-hidden">
      
      {/* Animated Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-2.5 opacity-25">
          {/* Green cluster - top right */}
          <div className="absolute w-96 h-96 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"
            style={{ top: '-13%', right: '12%' }}></div>

          {/* Blue cluster - top left */}
          <div className="absolute w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"
            style={{ top: '10%', left: '5%' }}></div>
          <div className="absolute w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-1000"
            style={{ top: '20%', left: '0%' }}></div>

          {/* Purple cluster - top/mid right */}
          <div className="absolute w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"
            style={{ top: '23%', right: '13%' }}></div>
          <div className="absolute w-80 h-80 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-3000"
            style={{ top: '50%', right: '10%' }}></div>

          {/* Orange/Teal cluster - bottom */}
          <div className="absolute w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"
            style={{ bottom: '25%', left: '33%' }}></div>
          <div className="absolute w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-5000"
            style={{ bottom: '10%', right: '0%' }}></div>

          {/* Accent blobs - scattered */}
          <div className="absolute w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-6000"
            style={{ bottom: '20%', left: '0%', transform: 'translate(-50%, -50%)' }}></div>
        </div>
      </div>

      {/* Score Header Section */}
      <section className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="bg-transparent rounded-3xl shadow-2xl p-8 sm:p-12 border border-gray-800">
            <p className="text-blue-300 text-sm sm:text-lg mb-1 font-semibold">SyncCheck for</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 tracking-tight leading-tight">
              "{track.title}"
            </h2>
            <p className="text-blue-300 text-base sm:text-lg mb-1">by {track.artist}</p>
            {aiFeedback && (
              <p className="text-xs sm:text-sm text-gray-400 italic">Analyzed by Music Supervisor AI</p>
            )}

            <div className="text-center mt-10 sm:mt-8">
              <div className="text-6xl sm:text-7xl lg:text-8xl font-black text-white">{finalScore}</div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-300">/ 100</div>
              <p className="text-blue-200 text-lg sm:text-xl font-medium mt-3 sm:mt-4">
                {finalScore >= 90 ? "Excellent" : finalScore >= 75 ? "Strong" : finalScore >= 60 ? "Good" : "Needs Work"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Breakdown Cards Section */}
      <section className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          
          {/* Mobile: Stacked */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {breakdowns.map((item, index) => {
              const feedback = aiFeedback?.[item.aiFeedbackKey];
              const isExpanded = expandedCard === index;

              return (
                <div 
                  key={index}
                  className="backdrop-blur-xl rounded-2xl shadow-xl border-2 hover:translate-x-0.5 hover:shadow-2xl transition"
                  style={{ 
                    borderColor: `${item.color}50`,
                    boxShadow: `0 0 30px ${item.color}20`
                  }}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white">{item.category}</h3>
                        <p className="text-sm font-medium" style={{ color: item.color }}>{item.value}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-white">{item.displayScore}</div>
                        <div className="text-sm text-gray-400">/100</div>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-gray-700/50 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${item.displayScore}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>

                    {feedback ? (
                      <div>
                        <p className="text-gray-300 text-sm font-medium mb-3">{feedback.short}</p>
                        {isExpanded && (
                          <div className="mt-4 space-y-3 animate-fadeIn">
                            <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-500/20">
                              <p className="text-xs font-semibold text-blue-400 mb-1">Scene Perspective:</p>
                              <p className="text-sm text-gray-300">{feedback.why}</p>
                            </div>
                            <div className="bg-green-900/30 rounded-xl p-4 border border-green-500/20">
                              <p className="text-xs font-semibold text-green-400 mb-1">Production Notes:</p>
                              <p className="text-sm text-gray-300">{feedback.improve}</p>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => setExpandedCard(isExpanded ? null : index)}
                          className="mt-3 font-medium text-sm flex items-center gap-1 transition-colors hover:cursor-pointer"
                          style={{ color: item.color }}
                        >
                          {isExpanded ? (
                            <>Show less <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></>
                          ) : (
                            <>Learn more <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-400 text-sm">{item.explanation}</p>
                        {!aiFeedback && <p className="text-gray-500 text-xs mt-2 italic">Loading AI insights...</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: 2x2 Grid */}
          <div className="hidden md:grid md:grid-cols-2 gap-5">
            {breakdowns.map((item, index) => {
              const feedback = aiFeedback?.[item.aiFeedbackKey];
              const isExpanded = expandedCard === index;

              return (
                <div 
                  key={index}
                  className="backdrop-blur-xl rounded-2xl shadow-xl border-2 hover:translate-x-0.5 hover:shadow-2xl transition"
                  style={{ 
                    borderColor: `${item.color}50`,
                    boxShadow: `0 0 30px ${item.color}20`
                  }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white">{item.category}</h3>
                        <p className="text-base font-medium mt-1" style={{ color: item.color }}>{item.value}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-white">{item.displayScore}</div>
                        <div className="text-sm text-gray-400">/100</div>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-gray-700/50 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${item.displayScore}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>

                    {feedback ? (
                      <div>
                        <p className="text-gray-300 text-sm font-medium mb-3">{feedback.short}</p>
                        {isExpanded && (
                          <div className="mt-4 space-y-3 animate-fadeIn">
                            <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-500/20">
                              <p className="text-xs font-semibold text-blue-400 mb-1">Scene Perspective:</p>
                              <p className="text-sm text-gray-300">{feedback.why}</p>
                            </div>
                            <div className="bg-green-900/30 rounded-xl p-4 border border-green-500/20">
                              <p className="text-xs font-semibold text-green-400 mb-1">Production Notes:</p>
                              <p className="text-sm text-gray-300">{feedback.improve}</p>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => setExpandedCard(isExpanded ? null : index)}
                          className="mt-3 font-medium text-sm flex items-center gap-1 transition-colors"
                          style={{ color: item.color }}
                        >
                          {isExpanded ? (
                            <>Show less <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></>
                          ) : (
                            <>Learn more <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-400 text-sm">{item.explanation}</p>
                        {!aiFeedback && <p className="text-gray-500 text-xs mt-2 italic">Loading AI insights...</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-950 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-gray-800">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
              How to Generate More Revenue from Your Songs?
            </h3>

            <div className="prose prose-blue max-w-none mb-6 sm:mb-8">
              {shouldShowGenrePopularity && (
                <p className="text-blue-200 text-base leading-relaxed mb-4 pb-4 border-b border-blue-500/20">
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
                <strong className="text-white">Sync licensing</strong> is how your music gets placed in TV shows, films, commercials, trailers, and video games—earning you upfront fees ranging from <strong className="text-blue-300">$500 for indie productions to $150,000+ for major campaigns</strong>. Unlike streaming pennies, a single sync placement can generate serious income while exposing your music to millions of viewers. <strong className="text-white">SyncRep</strong> puts your tracks directly in front of music supervisors through a searchable platform built specifically for sync discovery, positioning you where the money is: in the catalogs supervisors browse every day.
              </p>
            </div>

            <div className="my-6 sm:my-8 flex items-center">
              <div className="grow border-t border-blue-400/30"></div>
              <span className="px-4 text-blue-300 font-semibold text-sm whitespace-nowrap">READY TO GET DISCOVERED?</span>
              <div className="grow border-t border-blue-400/30"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 md:gap-4 mb-8">
              <div className="text-center p-4 sm:p-5 bg-black/40 rounded-xl shadow-lg border border-blue-500/20">
                <h2 className="text-2xl md:text-2xl font-extrabold text-blue-400">No</h2>
                <p className="text-xs text-gray-400 mt-1">Monthly Fees</p>
              </div>
              <div className="text-center p-4 sm:p-5 bg-black/40 rounded-xl shadow-lg border border-blue-500/20">
                <h2 className="text-2xl md:text-3xl font-extrabold text-blue-400">$500-$150K</h2>
                <p className="text-xs text-gray-400 mt-1">Per Placement</p>
              </div>
              <div className="text-center p-4 sm:p-5 bg-black/40 rounded-xl shadow-lg border border-blue-500/20">
                <h2 className="text-2xl md:text-3xl font-extrabold text-blue-400">0%</h2>
                <p className="text-xs text-gray-400 mt-1">Commission Taken</p>
              </div>
            </div>

            <div className="text-center my-4">
              <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-4">
                Indie artists are getting their music placed every day
              </p>
              
              <a
                href="https://musicatlas.ai/syncrep?utm_source=synccheck&utm_medium=partner&utm_campaign=syncrep"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 hover:bg-blue-500 hover:scale-105 text-white font-bold py-4 px-10 rounded-full text-base sm:text-lg shadow-2xl transition-all duration-300"
              >
                Get in Front of Music Supervisors → Join SyncRep
              </a>
            </div>

            <div className="text-center mb-6">
              <p className="text-sm sm:text-base text-gray-400">
                Use code <span className="font-mono font-bold text-blue-400 bg-blue-950/50 px-2 py-1 rounded">SYNCCHECK</span> for $5 off
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={onBack}
                className="text-blue-300 hover:text-blue-200 text-base sm:text-lg font-medium transition-colors hover:cursor-pointer"
              >
                ← Analyze Another Track
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ScoreBreakdown;