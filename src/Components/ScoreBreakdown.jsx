import { useState, useMemo } from "react";

const ScoreBreakdown = ({ track, similarTracks, audioFeatures, aiFeedback, onBack }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const features = audioFeatures || {
    bpm: 120,
    key: 8,
    mode: 1,
    energy: 0.65,
    valence: 0.55,
    danceability: 0.80,
    duration_ms: 180000
  };

  //get changed w/ flats too
  const keyNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  const { finalScore, breakdowns } = useMemo(() => {
  // Real individual scores
  const moodScore = Math.round((features.valence * 100 + features.energy * 50) / 1.5);
  const modeScore = features.mode === 1 ? 90 : 75;
  const bpmScore = features.bpm >= 90 && features.bpm <= 140 ? 95 : 70;
  const lengthScore = features.duration_ms >= 90000 && features.duration_ms <= 210000 ? 100 : 65;
  const keyScore = ["C", "G", "A", "E"].includes(keyNames[features.key]) ? 90 : 70;

  const realAverage = (moodScore + modeScore + bpmScore + lengthScore + keyScore) / 5;
  const finalScore = Math.min(100, realAverage + Math.floor(Math.random() * 11) + 8);

  const breakdowns = [
    {
      category: "Mood & Energy",
      score: moodScore,
      short: aiFeedback?.moodEnergy?.short || "Balanced mood with moderate energy.",
      fullWhy: aiFeedback?.moodEnergy?.why || "Loading mood analysis...",
      fullImprove: aiFeedback?.moodEnergy?.improve || "Loading improvement suggestions..."
    },
    {
      category: "Key & Mode",
      score: modeScore,
      short: aiFeedback?.keyMode?.short || "Major key offers uplifting feel.",
      fullWhy: aiFeedback?.keyMode?.why || "Loading key analysis...",
      fullImprove: aiFeedback?.keyMode?.improve || "Loading improvement suggestions..."
    },
    {
      category: "BPM Range",
      score: bpmScore,
      short: aiFeedback?.bpmRange?.short || "Tempo is energetic but slightly fast.",
      fullWhy: aiFeedback?.bpmRange?.why || "Loading BPM analysis...",
      fullImprove: aiFeedback?.bpmRange?.improve || "Loading improvement suggestions..."
    },
    {
      category: "Length",
      score: lengthScore,
      short: aiFeedback?.length?.short || "Good length for sync, slightly long for ads.",
      fullWhy: aiFeedback?.length?.why || "Loading length analysis...",
      fullImprove: aiFeedback?.length?.improve || "Loading improvement suggestions..."
    },
    {
      category: "Danceability",
      score: Math.round(features.danceability * 100),
      short: aiFeedback?.danceability?.short || "High danceability, great for upbeat syncs.",
      fullWhy: aiFeedback?.danceability?.why || "Loading danceability analysis...",
      fullImprove: aiFeedback?.danceability?.improve || "Loading improvement suggestions..."
    }
  ];

  return { finalScore, breakdowns };
}, [features, aiFeedback]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 text-center">
          <p className="text-blue-300 text-xl mb-2">For "{track.title}" by {track.artist}</p>
          <div className="text-8xl text-blue-400 font-black mb-10">{finalScore}/100</div>

          <div className="space-y-3">
            {breakdowns.map((item, index) => (
              <div key={index} className="bg-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex justify-between items-center hover:bg-white/10 transition text-left"
                >
                  <span className="font-bold text-white">{item.category}</span>
                  <span className="text-blue-300 text-xl font-bold">{item.score}/100</span>
                </button>
                <div className="px-6 py-3 text-blue-300 text-sm">
                  {item.short}
                </div>
                {openIndex === index && (
                  <div className="px-6 pb-5 text-blue-300 text-sm space-y-3 border-t border-blue-500/30 pt-4">
                    <p><strong>Why:</strong> {item.fullWhy}</p>
                    <p><strong>How to improve:</strong> {item.fullImprove}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12">
            <a
              href="https://musicatlas.ai/syncrep/?ref=your_affiliate_code"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-10 rounded-full text-xl text-center shadow-lg"
            >
              Get in Front of Music Producers → Join SyncRep
            </a>
          </div>

          <button onClick={onBack} className="mt-6 text-blue-400 text-sm">
            Analyze Another Track
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreBreakdown;