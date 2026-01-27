// Components/SearchInput.jsx - Spotify Search with Add Track
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

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/spotify-search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-8">
          <h1 className="text-6xl text-white font-bold text-center mb-1 tracking-tighter leading-tight">
            Song Sync Score
          </h1>
          <p className="text-blue-300 text-center mb-10 text-xl tracking-tight">
            Get Your Music into TV and Film
          </p>

          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any song or artist..."
              className="w-full px-8 py-4 text-xl bg-white/10 border border-blue-500/50 rounded-full text-white placeholder-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:border-blue-400 transition-all"
            />
            
            {/* Circular Send Button - inside the input */}
            <button
              onClick={() => {
                if (query.trim()) {
                  onTrackSelected({ title: query, artist: "Unknown" });
                }
              }}
              disabled={!query.trim()}
              className="absolute right-2 top-2 w-11 h-11 flex items-center justify-center border border-blue-500 rounded-full bg-blue-600 hover:bg-blue-500 hover:scale-110 hover:shadow-blue-500/50 text-white transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-400/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>

            {/* Dropdown */}
            {(loading || results.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-black/90 backdrop-blur-2xl rounded-2xl border border-blue-700/50 shadow-2xl overflow-hidden z-50">
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
            
            <div className="text-center mt-5">
              <div className="flex justify-center items-center gap-3 text-sm">
                <a 
                  href="https://musicatlas.ai/syncrep/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-900 opacity-95 border border-gray-900 hover:border-blue-900 hover:border hover:scale-105 text-white font-sm py-3 px-8 rounded-xl transition shadow-2xl"
                >
                  SyncRep
                </a>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-gray-900 opacity-95 border border-gray-900 hover:border-blue-900 hover:border hover:scale-105 text-white font-sm py-3 px-8 rounded-xl transition shadow-2xl"
                >
                  Can't find your song?
                </button>
              </div>
            </div>

            {/* Add Track Form */}
            {showAddForm && (
              <div className="mt-6 bg-blue-900/20 rounded-2xl p-6 border border-blue-500/30">
                <h3 className="text-white text-lg font-semibold mb-4">Add Your Track to MusicAtlas</h3>
                <form onSubmit={handleAddTrack} className="space-y-3">
                  <input
                    type="text"
                    value={addArtist}
                    onChange={(e) => setAddArtist(e.target.value)}
                    placeholder="Artist name"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-500/50 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="Track title"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-500/50 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                  >
                    {addLoading ? "Adding..." : "Add Track"}
                  </button>
                  {addMessage && (
                    <p className="text-blue-300 text-sm text-center">{addMessage}</p>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 text-center flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-400 relative left-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400 text-sm leading-relaxed max-w-md">
            Sync readiness shows how well your song fits TV, film, ads, and trailers — a high score means more placement chances.
          </p>
        </div>
        
        <a 
          href="https://musicatlas.ai"
          className="flex justify-center text-blue-400/60 text-sm mt-5 hover:text-blue-400/75 transition"
        >
          Powered by MusicAtlas.ai
        </a>
      </div>
    </div>
  );
};

export default SearchInput;