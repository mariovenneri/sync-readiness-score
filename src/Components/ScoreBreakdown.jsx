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
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl">
        {/* Main grid container */}
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr auto",
            gridTemplateAreas:
              '"main side1" ' +
              '"main side2" ' +
              '"main side3" ' +
              '"side4 side5"'
          }}
        >
          {/* Big main element */}
          <div className="grid-in-main row-span-3 bg-white rounded-xl shadow-xl p-10 flex flex-col">
            {/* Track info */}
            <p className="text-blue-600 text-lg mb-1 font-[Poppins] tracking-tight">Sync Readiness Score for</p>
            <h2 className="text-5xl font-bold text-gray-900 mb-1">
              "{track.title}"
            </h2>
            <p className="text-gray-600 text-lg mb-12">
              by {track.artist}
            </p>

            {/* Big score with half-circle range */}
            <div className="relative flex flex-col items-center justify-center">
              {/* Semi-circle background ring */}
              <div className="relative w-76 h-38 mb-10">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">

                  {/* Background semi-circle made of individual gray lines – flipped direction */}
                  {Array.from({ length: 50 }).map((_, i) => {
                    const angle = (i * 180) / 49; // Flip: start at 180° (3 o'clock) and go backward to 0° (9 o'clock)
                    const x1 = 100 + 80 * Math.cos((angle) * Math.PI / 180);
                    const y1 = 95 - 80 * Math.sin((angle) * Math.PI / 180);
                    const x2 = 100 + 90 * Math.cos((angle) * Math.PI / 180);
                    const y2 = 95 - 90 * Math.sin((angle) * Math.PI / 180);
                    return (
                      <line
                        key={`bg-${i}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#e5e7eb"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Colored progress lines – fill from right (3 o'clock) to left (9 o'clock) */}
                  {Array.from({ length: 50 }).map((_, i) => {
                    const progress = i / 49; // 0 to 1
                    if (progress > finalScore / 100) return null; // skip lines beyond score

                    const angle = 180 - (i * 180) / 49; // Flip angle direction
                    const x1 = 100 + 80 * Math.cos((angle) * Math.PI / 180);
                    const y1 = 95 - 80 * Math.sin((angle) * Math.PI / 180);
                    const x2 = 100 + 90 * Math.cos((angle) * Math.PI / 180);
                    const y2 = 95 - 90 * Math.sin((angle) * Math.PI / 180);

                    let color = "#ef4444"; // red
                    if (finalScore >= 90) color = "#22c55e"; // green
                    else if (finalScore >= 70) color = "#eab308"; // yellow
                    else if (finalScore >= 50) color = "#f97316"; // orange

                    return (
                      <line
                        key={`prog-${i}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={color}
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>

                {/* Central score number */}
                <div className="relative top-15 flex flex-col items-center justify-center">
                  <div className="text-6xl md:text-12xl font-black text-gray-900 drop-shadow-md">
                    {finalScore}
                  </div>
                  <div className="text-3xl font-bold text-gray-600">
                    / 100
                  </div>
                </div>
              </div>

              {/* Score label */}
              <p className="relative bottom-5 text-gray-600 text-lg font-medium">
                {finalScore >= 90 ? "Excellent" : finalScore >= 70 ? "Strong" : finalScore >= 50 ? "Good" : "Needs Work"}
              </p>
            </div>
          </div>

          {/* Side 1 */}
          <div className="grid-in-side1 bg-white rounded-xl shadow-md p-6 flex justify-between items-start gap-6 border border-gray-100 hover:border-green-300 transition-all duration-300">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{breakdowns[0].category}</h3>
              <span className="text-gray-600 text-sm mb-4 block">
                {finalScore >= 90 ? "Excellent" : finalScore >= 70 ? "Strong" : finalScore >= 50 ? "Good" : "Needs Work"}
              </span>
              <p className="text-gray-600 text-sm mb-4">{breakdowns[0].short}</p>
              <div className="flex justify-start">
                <a className="text-xs border border-gray-300 px-2 py-1 rounded transition">
                  High Impact
                </a>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-3xl font-black text-black">
                {breakdowns[0].score}/100
              </div>
              <div className="w-30 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${breakdowns[0].score}%` }}
                />
              </div>
              <div className="relative top-15 flex justify-end">
                <div className="w-8 h-8 flex items-center justify-center border-2 border-blue-500 rounded-full bg-white/10 text-blue-500 font-bold text-xl transition-all hover:border-blue-600 hover:scale-105">
                  →
                </div>
              </div>
            </div>
          </div>


          {/* Side 2 */}
          <div className="grid-in-side1 bg-white rounded-xl shadow-md p-6 flex justify-between items-start gap-6 border border-gray-100 hover:border-green-300 transition-all duration-300">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{breakdowns[1].category}</h3>
              <span className="text-gray-600 text-sm mb-4 block">
                {finalScore >= 90 ? "Excellent" : finalScore >= 70 ? "Strong" : finalScore >= 50 ? "Good" : "Needs Work"}
              </span>
              <p className="text-gray-600 text-sm">{breakdowns[1].short}</p>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-3xl font-black text-black">
                {breakdowns[1].score}/100
              </div>
              <div className="w-30 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${breakdowns[1].score}%` }}
                />
              </div>
              <div className="relative top-15 flex justify-end">
                <div className="w-8 h-8 flex items-center justify-center border-2 border-blue-500 rounded-full bg-white/10 text-blue-500 font-bold text-xl transition-all hover:border-blue-600 hover:scale-105">
                  →
                </div>
              </div>
            </div>
          </div>


          {/* Side 3 */}
          <div className="grid-in-side1 bg-white rounded-xl shadow-md p-6 flex justify-between items-start gap-6 border border-gray-100 hover:border-green-300 transition-all duration-300">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{breakdowns[2].category}</h3>
              <span className="text-gray-600 text-sm mb-4 block">
                {finalScore >= 90 ? "Excellent" : finalScore >= 70 ? "Strong" : finalScore >= 50 ? "Good" : "Needs Work"}
              </span>
              <p className="text-gray-600 text-sm">{breakdowns[2].short}</p>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-3xl font-black text-black">
                {breakdowns[2].score}/100
              </div>
              <div className="w-30 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${breakdowns[2].score}%` }}
                />
              </div>
              <div className="relative top-5 flex justify-end">
                <div className="w-8 h-8 flex items-center justify-center border-2 border-blue-500 rounded-full bg-white/10 text-blue-500 font-bold text-xl transition-all hover:border-blue-600 hover:scale-105">
                  →
                </div>
              </div>
            </div>
          </div>


          {/* Side 4 */}
          <div className="grid-in-side1 bg-white rounded-xl shadow-md p-6 flex justify-between items-start gap-6 border border-gray-100 hover:border-green-300 transition-all duration-300">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{breakdowns[3].category}</h3>
              <span className="text-gray-600 text-sm mb-4 block">
                {finalScore >= 90 ? "Excellent" : finalScore >= 70 ? "Strong" : finalScore >= 50 ? "Good" : "Needs Work"}
              </span>
              <p className="text-gray-600 text-sm">{breakdowns[3].short}</p>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-3xl font-black text-black">
                {breakdowns[3].score}/100
              </div>
              <div className="w-30 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${breakdowns[3].score}%` }}
                />
              </div>
              <div className="relative top-15 flex justify-end">
                <div className="w-8 h-8 flex items-center justify-center border-2 border-blue-500 rounded-full bg-white/10 text-blue-500 font-bold text-xl transition-all hover:border-blue-600 hover:scale-105">
                  →
                </div>
              </div>
            </div>
          </div>


          {/* Side 5 */}
          <div className="grid-in-side1 bg-white rounded-xl shadow-md p-6 flex justify-between items-start gap-6 border border-gray-100 hover:border-green-300 transition-all duration-300">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{breakdowns[4].category}</h3>
              <span className="text-gray-600 text-sm mb-4 block">
                {finalScore >= 90 ? "Excellent" : finalScore >= 70 ? "Strong" : finalScore >= 50 ? "Good" : "Needs Work"}
              </span>
              <p className="text-gray-600 text-sm mb-4">{breakdowns[4].short}</p>
              <div className="flex justify-start">
                <a className="text-xs border border-gray-300 px-3 py-1 rounded transition">
                  High Impact
                </a>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-3xl font-black text-black">
                {breakdowns[4].score}/100
              </div>
              <div className="w-30 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${breakdowns[4].score}%` }}
                />
              </div>
              <div className="relative top-15 flex justify-end">
                <div className="w-8 h-8 flex items-center justify-center border-2 border-blue-500 rounded-full bg-white/10 text-blue-500 font-bold text-xl transition-all hover:border-blue-600 hover:scale-105">
                  →
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button - floating style */}
        <div className="px-8 pt-12 pb-4 text-center">
          <a
            href="https://musicatlas.ai/syncrep/?ref=your_affiliate_code"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 px-12 rounded-full text-xl shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Get in Front of Music Producers → Join SyncRep
          </a>
        </div>

        {/* Back link  */}
        <div className="pb-8 text-center">
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