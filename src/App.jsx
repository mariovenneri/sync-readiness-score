// App.jsx - Simple Business Logic with Console Logging
import { useState } from "react";
import SearchInput from "./Components/SearchInput";
import Loading from "./Components/Loading";
import ScoreBreakdown from "./Components/ScoreBreakdown";

function App() {
  const [currentScreen, setCurrentScreen] = useState("input");
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [musicAtlasRaw, setMusicAtlasRaw] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);

  const handleTrackSelected = async (track) => {
    console.log("=== TRACK SELECTED ===");
    console.log("Track:", track);
    console.log("Duration from Spotify (ms):", track.duration_ms);
    console.log("Duration in minutes:", track.duration_ms / 60000);
    
    setSelectedTrack(track);
    setCurrentScreen("loading");

    try {
      // Get MusicAtlas data
      const url = `/api/musicatlas-describe?artist=${encodeURIComponent(track.artist)}&title=${encodeURIComponent(track.title)}`;
      console.log("Fetching:", url);
      
      const response = await fetch(url);
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

      setCurrentScreen("result");
    } catch (error) {
      console.error("Error:", error);
      setCurrentScreen("input");
    }
  };

  return (
    <div className='min-h-screen bg-white'>
      {currentScreen === "input" && (
        <SearchInput onTrackSelected={handleTrackSelected} />
      )}
      
      {currentScreen === "loading" && selectedTrack && (
        <Loading track={selectedTrack} />
      )}
     
      {currentScreen === "result" && selectedTrack && (
        <ScoreBreakdown 
          track={selectedTrack}
          musicAtlasRaw={musicAtlasRaw}
          aiFeedback={aiFeedback}
          onBack={() => setCurrentScreen("input")}
        />
      )}
    </div>
  );
}

export default App;