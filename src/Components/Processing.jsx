// Components/Processing.jsx
import { useState, useEffect, useRef } from "react";

const Processing = ({ track, jobId, onBack, onComplete }) => {
  const [status, setStatus] = useState("queued");
  const [percentComplete, setPercentComplete] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const response = await fetch(`/api/musicatlas-progress?job_id=${jobId}`);
        const data = await response.json();

        console.log("Progress:", data);

        setStatus(data.status);
        setPercentComplete(data.percent_complete ?? 0);
        setEtaSeconds(data.eta_seconds ?? null);

        if (data.status === "done") {
          clearInterval(intervalRef.current);
          setTimeout(() => onComplete(), 1500);
        }

        if (data.status === "error") {
          clearInterval(intervalRef.current);
          setErrorMessage(data.message || "Something went wrong analyzing this track.");
        }

      } catch (err) {
        console.error("Progress poll error:", err);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 3000);

    return () => clearInterval(intervalRef.current);
  }, [jobId]);

  const statusLabel = {
    queued: "Queued for analysis...",
    started: "Analyzing your track...",
    done: "Analysis complete!",
    error: "Something went wrong"
  }[status] ?? "Processing...";

  const displayPercent = Math.round(percentComplete ?? 0);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="bg-gray-800 rounded-3xl shadow-2xl overflow-hidden p-10 sm:p-14 text-center">
          
          <div className="relative z-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 text-yellow-400">
                {status === "done" ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : status === "error" ? (
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </span>
            </div>

            {/* Track info */}
            <p className="text-blue-300 text-sm mb-1">Currently being analyzed:</p>
            <div className="flex justify-center items-center flex-wrap gap-2 mb-6">
              <p className="text-white text-2xl sm:text-3xl tracking-tight leading-tight font-bold">"{track.title}"</p>
              <span className="text-blue-400 text-xl sm:text-2xl">by {track.artist}</span>
            </div>

            {/* Progress bar - only show if we have a jobId */}
            {jobId && status !== "error" && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2 px-1">
                  <p className="text-blue-300 text-sm font-medium">{statusLabel}</p>
                  <p className="text-white text-sm font-black">{displayPercent}%</p>
                </div>
                <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${displayPercent}%` }}
                  />
                </div>
                {etaSeconds > 0 && status !== "done" && (
                  <p className="text-gray-400 text-xs mt-2">
                    Estimated time remaining: ~{etaSeconds}s
                  </p>
                )}
              </div>
            )}

            {/* Message */}
            <div className="bg-white/10 border border-transparent rounded-xl p-6 mb-8">
              {status === "error" ? (
                <p className="text-red-300 text-base sm:text-lg leading-relaxed">
                  {errorMessage} Try searching another track or come back to this one later.
                </p>
              ) : status === "done" ? (
                <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                  <strong className="text-white">Analysis complete!</strong> Taking you to your results now...
                </p>
              ) : (
                <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                  We've submitted this track to our database and it's currently being analyzed.{" "}
                  <strong className="text-white">This usually takes a few minutes</strong> — try searching another song in the meantime and come back to this one shortly!
                </p>
              )}
            </div>

            {/* Back button - hidden when done */}
            {status !== "done" && (
              <button
                onClick={onBack}
                className="inline-block bg-blue-600 hover:bg-blue-500 hover:scale-105 text-white font-bold py-3 px-8 sm:py-4 sm:px-10 rounded-full text-base sm:text-lg shadow-2xl transition-all duration-300"
              >
                ← Search Another Track
              </button>
            )}

            <p className="text-gray-500 text-xs mt-6 italic">
              Powered by MusicAtlas.ai
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Processing;