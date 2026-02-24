// App.jsx
import { useState } from "react";
import SearchInput from "./Components/SearchInput";
import Loading from "./Components/Loading";
import ScoreBreakdown from "./Components/ScoreBreakdown";
import Processing from "./Components/Processing";

function App() {
  const [currentScreen, setCurrentScreen] = useState("input");
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [musicAtlasRaw, setMusicAtlasRaw] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [jobId, setJobId] = useState(null);

  const handleTrackSelected = async (track) => {
    console.log("=== TRACK SELECTED ===");
    console.log("Track:", track);
    console.log("Duration from Spotify (ms):", track.duration_ms);
    console.log("Duration in minutes:", track.duration_ms / 60000);

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
        alert("This track isn't available for analysis yet. It may not be released or publicly available on streaming platforms.");
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
      } else {
        console.error("Failed to generate feedback");
        setAiFeedback(null);
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
  };

  return (
    <div className="min-h-screen bg-white">
      {currentScreen === "input" && (
        <SearchInput onTrackSelected={handleTrackSelected} />
      )}

      {currentScreen === "loading" && selectedTrack && (
        <Loading
          track={selectedTrack}
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