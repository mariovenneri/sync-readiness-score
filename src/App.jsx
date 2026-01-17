import { useState } from "react";
import SearchInput from "./Components/SearchInput";
import Loading from "./Components/Loading";
import ScoreBreakdown from "./Components/ScoreBreakdown";
import { getSimilarTracks } from "./library/lastFMapi";
import { generateSyncFeedback } from "./library/aiApi";

function App() {
  const [currentScreen, setCurrentScreen] = useState("input");
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [similarTracks, setSimilarTracks] = useState(null);
  const [audioFeatures, setAudioFeatures] = useState(null);
  const [aiFeedback, setAIFeedback] = useState(null);
  const [musicAtlasRaw, setMusicAtlasRaw] = useState(null);

  const handleTrackSelected = async (track) => {
    console.log("Analyzing:", track);
    setSelectedTrack(track);
    setCurrentScreen("loading");

    try {
      console.log("Calling MusicAtlas proxy for describe_track...");

      const params = new URLSearchParams();
      params.append("artist", track.artist);
      params.append("title", track.title);

      const musicAtlasData = await fetch(`/api/musicatlas?${params.toString()}`)
        .then(r => {
          if (!r.ok) {
            throw new Error(`Proxy failed: ${r.status}`);
          }
          return r.json();
        });

      console.log("Full MusicAtlas data:", musicAtlasData);

      if (!musicAtlasData || musicAtlasData.error) {
        throw new Error(musicAtlasData?.error || "No data from MusicAtlas");
      }

      // 2. Extract real features from MusicAtlas
      const audio = musicAtlasData.audio_characteristics || {};
      const realFeatures = {
        bpm: audio.bpm || 120,
        key: audio.key || 8,
        mode: audio.mode || 1,
        perceived_intensity: audio.perceived_intensity || 0.65,
        duration_ms: audio.duration_ms || 180000
      };

      // 3. Get similar tracks from Last.fm
      const similar = await getSimilarTracks(track.artist, track.title, 6);

      // 4. AI feedback with real MusicAtlas features
      const feedback = await generateSyncFeedback(track, realFeatures);

      // 5. Save everything
      setAudioFeatures(realFeatures);
      setSimilarTracks(similar);
      setAIFeedback(feedback);
      setMusicAtlasRaw(musicAtlasData);
      setCurrentScreen("result");
    } catch (error) {
      console.error("Error in handleTrackSelected:", error);
      setCurrentScreen("result");
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
          similarTracks={similarTracks}
          audioFeatures={audioFeatures}
          aiFeedback={aiFeedback}
          musicAtlasRaw={musicAtlasRaw}
          onBack={() => setCurrentScreen("input")}
        />
      )}
    </div>
  );
}

export default App;