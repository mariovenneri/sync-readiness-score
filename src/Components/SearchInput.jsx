// Components/SearchInput.jsx - Spotify Search with Logging
import { useEffect, useState } from "react";

const SearchInput = ({ onTrackSelected }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addArtist, setAddArtist] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addMessage, setAddMessage] = useState("");

  const handleAddTrack = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddMessage("");

    try {
      const response = await fetch('/api/add-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist: addArtist,
          title: addTitle
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAddMessage("Track added! It will be processed soon. Try searching for it in a few minutes.");
        setAddArtist("");
        setAddTitle("");
      } else {
        setAddMessage("Error: " + (data.message || "Failed to add track"));
      }
    } catch (error) {
      setAddMessage("Error adding track");
    } finally {
      setAddLoading(false);
    }
  };

  useEffect(() => {
    console.log("Search query changed:", query);
    
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      console.log("=== SEARCHING SPOTIFY ===");
      console.log("Query:", query);
      
      setLoading(true);
      try {
        const url = `/api/spotify-search?q=${encodeURIComponent(query)}`;
        console.log("Fetching:", url);
        
        const response = await fetch(url);
        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        console.log("Search results:", data);
        console.log("Number of tracks:", data.tracks?.length || 0);

        setResults(data.tracks || []);

      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-8">
          <h1 className="text-6xl text-white font-bold text-center mb-1">
            Song Sync Score
          </h1>
          <p className="text-blue-300 text-center mb-10 text-xl">
            Data Testing Mode
          </p>

          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any song or artist..."
              className="w-full px-8 py-4 text-xl bg-white/10 border border-blue-500/50 rounded-full text-white placeholder-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
            />

            {/* Dropdown */}
            {(loading || results.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-black/90 rounded-2xl border border-blue-700/50 shadow-2xl overflow-hidden z-50">
                {loading && (
                  <div className="p-6 text-blue-400 text-center">
                    <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3">Searching Spotify...</span>
                  </div>
                )}

                {results.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      console.log("=== USER CLICKED TRACK ===");
                      console.log("Track:", track);
                      onTrackSelected(track);
                      setQuery(`${track.title} – ${track.artist}`);
                      setResults([]);
                    }}
                    className="w-full px-6 py-3 flex items-center gap-4 hover:bg-blue-900/40 transition text-left"
                  >
                    {track.artwork ? (
                      <img src={track.artwork} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-blue-900/50 rounded-lg" />
                    )}
                    <div>
                      <div className="font-semibold text-white">{track.title}</div>
                      <div className="text-blue-300 text-sm">{track.artist}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-gray-400 text-sm text-center mt-5">
            Open your browser console (F12) to see all the data
          </p>
        </div>
      </div>
    </div>
  );
};

export default SearchInput;