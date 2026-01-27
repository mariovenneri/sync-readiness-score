// App.jsx - Simple Business Logic with Console Logging
import { useState } from "react";
import SearchInput from "./Components/SearchInput";
import Loading from "./Components/Loading";
import ScoreBreakdown from "./Components/ScoreBreakdown";

function App() {
  const [currentScreen, setCurrentScreen] = useState("input");
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [musicAtlasRaw, setMusicAtlasRaw] = useState(null);

  const handleTrackSelected = async (track) => {
    console.log("=== TRACK SELECTED ===");
    console.log("Track:", track);
    
    setSelectedTrack(track);
    setCurrentScreen("loading");

    try {
      const url = `/api/musicatlas-describe?artist=${encodeURIComponent(track.artist)}&title=${encodeURIComponent(track.title)}`;
      console.log("Fetching:", url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log("=== MUSICATLAS DATA ===");
      console.log(JSON.stringify(data, null, 2));
      
      console.log("Track info:", data.track);
      console.log("Music characteristics:", data.music_characteristics);
      console.log("Audio characteristics:", data.audio_characteristics);
      console.log("Genres:", data.genres);
      console.log("Possible influences:", data.possible_influences);

      setMusicAtlasRaw(data);
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
          // similarTracks={similarTracks}
          // audioFeatures={audioFeatures}
          // aiFeedback={aiFeedback}
          musicAtlasRaw={musicAtlasRaw}
          onBack={() => setCurrentScreen("input")}
        />
      )}
    </div>
  );
}

export default App;