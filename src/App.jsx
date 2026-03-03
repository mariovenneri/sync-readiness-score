// App.jsx
import { useState } from "react";
import SearchInput from "./Components/SearchInput";
import Loading from "./Components/Loading";
import ScoreBreakdown from "./Components/ScoreBreakdown";
import Processing from "./Components/Processing";

function App() {
  const [currentScreen, setCurrentScreen] = useState("input");
  const [errorMessage, setErrorMessage] = useState(null)
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [musicAtlasRaw, setMusicAtlasRaw] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [dataReady, setDataReady] = useState(false);

  const handleTrackSelected = async (track) => {
    // console.log("=== TRACK SELECTED ===");
    // console.log("Track:", track);
    // console.log("Duration from Spotify (ms):", track.duration_ms);
    // console.log("Duration in minutes:", track.duration_ms / 60000);

    setSelectedTrack(track);

    // Check if this track has a pending job in localStorage (within last 10 minutes)
    const cachedJob = localStorage.getItem(`processing_${track.id}`);
    if (cachedJob) {
      try {
        const { jobId, timestamp } = JSON.parse(cachedJob);
        const age = Date.now() - timestamp;
        const tenMinutes = 10 * 60 * 1000;
        
        if (age < tenMinutes && jobId) {
          console.log("Resuming pending job:", jobId);
          setJobId(jobId);
          setCurrentScreen("processing");
          return;
        } else {
          // Job expired, clean it up
          localStorage.removeItem(`processing_${track.id}`);
        }
      } catch (e) {
        console.error("Error parsing cached job:", e);
        localStorage.removeItem(`processing_${track.id}`);
      }
    }

    setCurrentScreen("loading");

    try {
      const url = `/api/musicatlas-describe?artist=${encodeURIComponent(track.artist)}&title=${encodeURIComponent(track.title)}`;
      console.log("Fetching:", url);

      const response = await fetch(url);

      // Track was rejected by MusicAtlas (not available for analysis)
      if (response.status === 404) {
        console.log("Track not available for analysis");
        setErrorMessage("This track isn't available for analysis yet. Please try a different track.")
        setCurrentScreen("input");
        return;
      }

      // Track submitted but not yet processed — show processing screen with job_id
      if (response.status === 202) {
        const data = await response.json();
        console.log("Track is processing — job_id:", data.job_id);
        setJobId(data.job_id || null);
        setCurrentScreen("processing");
        return;
      }

      const data = await response.json();
      console.log("=== MUSICATLAS DATA ===");
      console.log(JSON.stringify(data, null, 2));

      setMusicAtlasRaw(data);

      // Generate AI feedback
      console.log("Generating AI feedback...");
      const feedbackResponse = await fetch('/api/generate-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: track,
          musicAtlasData: data
        })
      });

      if (feedbackResponse.ok) {
        const feedback = await feedbackResponse.json();
        console.log("AI Feedback:", feedback);
        setAiFeedback(feedback);
        setDataReady(true); // Signal that all data is ready
      } else {
        console.error("Failed to generate feedback");
        setAiFeedback(null);
        setDataReady(true); // Still ready even without AI feedback
      }

    } catch (error) {
      console.error("Error:", error);
      setCurrentScreen("input");
    }
  };

  // Called by Processing when get_progress returns "done"
  const handleProcessingComplete = async () => {
    if (!selectedTrack) return;
    setCurrentScreen("loading");

    try {
      const url = `/api/musicatlas-describe?artist=${encodeURIComponent(selectedTrack.artist)}&title=${encodeURIComponent(selectedTrack.title)}`;
      const response = await fetch(url);
      const data = await response.json();

      setMusicAtlasRaw(data);

      const feedbackResponse = await fetch('/api/generate-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: selectedTrack,
          musicAtlasData: data
        })
      });

      if (feedbackResponse.ok) {
        const feedback = await feedbackResponse.json();
        setAiFeedback(feedback);
        setDataReady(true);
      } else {
        setDataReady(true);
      }

    } catch (error) {
      console.error("Error fetching after processing:", error);
    }
  };

  const handleBack = () => {
    setCurrentScreen("input");
    setSelectedTrack(null);
    setMusicAtlasRaw(null);
    setAiFeedback(null);
    setJobId(null);
    setDataReady(false);
  };

  return (
    <div className="min-h-screen">
      
      {/* Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-red-500/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Track Unavailable</h3>
            </div>
            <p className="text-gray-300 mb-6">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300"
            >
              Try Another Track
            </button>
          </div>
        </div>
      )}

      {currentScreen === "input" && (
        <SearchInput onTrackSelected={handleTrackSelected} />
      )}

      {currentScreen === "loading" && selectedTrack && (
        <Loading
          track={selectedTrack}
          dataReady={dataReady}
          onComplete={() => setCurrentScreen("result")}
        />
      )}

      {currentScreen === "result" && selectedTrack && (
        <ScoreBreakdown
          track={selectedTrack}
          musicAtlasRaw={musicAtlasRaw}
          aiFeedback={aiFeedback}
          onBack={handleBack}
        />
      )}

      {currentScreen === "processing" && selectedTrack && (
        <Processing
          track={selectedTrack}
          jobId={jobId}
          onBack={handleBack}
          onComplete={handleProcessingComplete}
        />
      )}
    </div>
  );
}

export default App;